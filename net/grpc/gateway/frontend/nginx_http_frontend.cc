#include "net/grpc/gateway/frontend/nginx_http_frontend.h"

#include <ngx_http.h>

#include <algorithm>

#include "net/grpc/gateway/frontend/nginx_bridge.h"
#include "net/grpc/gateway/log.h"
#include "net/grpc/gateway/runtime/constants.h"
#include "net/grpc/gateway/runtime/request.h"
#include "net/grpc/gateway/runtime/runtime.h"
#include "net/grpc/gateway/runtime/tag.h"
#include "third_party/grpc/include/grpc/support/log.h"

#ifdef __cplusplus
extern "C" {
#endif

static ngx_chain_t *ngx_chain_seek_to_last(ngx_chain_t *chain) {
  while (chain->next) {
    chain = chain->next;
  }
  return chain;
}

// TODO(fengli): Defines the interface between C and C++.
ngx_int_t grpc_gateway_init_process(ngx_cycle_t *cycle) {
  grpc::gateway::Runtime::Get().Init();
  return NGX_OK;
}

void grpc_gateway_exit_process(ngx_cycle_t *cycle) {
  grpc::gateway::Runtime::Get().Shutdown();
}

extern ngx_module_t grpc_gateway_module;
grpc::gateway::Frontend *get_frontend(ngx_http_request_t *r) {
  grpc_gateway_request_context *context =
      static_cast<grpc_gateway_request_context *>(
          ngx_http_get_module_ctx(r, grpc_gateway_module));
  return context->frontend.get();
}

void grpc_gateway_request_cleanup_handler(void *data) {
  grpc_gateway_request_context *context =
      static_cast<grpc_gateway_request_context *>(data);
  static_cast<grpc::gateway::NginxHttpFrontend *>(context->frontend.get())
      ->set_http_request(nullptr);
  context->frontend.reset();
}

ngx_int_t grpc_gateway_handler(ngx_http_request_t *r) {
  ngx_grpc_gateway_loc_conf_t *mlcf =
      static_cast<ngx_grpc_gateway_loc_conf_t *>(
          ngx_http_get_module_loc_conf(r, grpc_gateway_module));
  std::string backend_address(reinterpret_cast<char *>(mlcf->grpc_pass.data),
                              mlcf->grpc_pass.len);
  std::string backend_host(reinterpret_cast<char *>(r->host_start),
                           r->host_end - r->host_start);
  std::string backend_method(reinterpret_cast<char *>(r->uri.data), r->uri.len);
  std::string channel_reuse(
      reinterpret_cast<char *>(mlcf->grpc_channel_reuse.data),
      mlcf->grpc_channel_reuse.len);

  // Initiate nginx request context.
  grpc_gateway_request_context *context =
      static_cast<grpc_gateway_request_context *>(
          ngx_pcalloc(r->pool, sizeof(grpc_gateway_request_context)));
  if (context == nullptr) {
    return NGX_HTTP_INTERNAL_SERVER_ERROR;
  }
  context->frontend = grpc::gateway::Runtime::Get().CreateNginxFrontend(
      r, backend_address, backend_host, backend_method, channel_reuse);
  ngx_http_set_ctx(r, context, grpc_gateway_module);
  ngx_pool_cleanup_t *http_cleanup =
      ngx_pool_cleanup_add(r->pool, sizeof(grpc_gateway_request_context));
  http_cleanup->data = context;
  http_cleanup->handler = grpc_gateway_request_cleanup_handler;
  context->frontend->Start();
  return NGX_AGAIN;
}

void continue_read_request_body(ngx_http_request_t *r) {
  static_cast<grpc::gateway::NginxHttpFrontend *>(get_frontend(r))
      ->ContinueReadRequestBody();
}

void continue_write_response(ngx_http_request_t *r) {
  if (r->stream != nullptr) {
    if (ngx_http_output_filter(r, nullptr) == NGX_AGAIN) {
      r->write_event_handler = continue_write_response;
    } else {
      r->write_event_handler = ngx_http_request_empty_handler;
    }
  }
}

#ifdef __cplusplus
}
#endif

namespace grpc {
namespace gateway {
namespace {
void AddElementToNginxElementTable(ngx_pool_t *pool, ngx_list_t *table,
                                   const string &name, const string_ref &value);

void AddHTTPHeader(ngx_http_request_t *http_request, const string &name,
                   const string_ref &value);

void AddHTTPTrailer(ngx_http_request_t *http_request, const string &name,
                    const string_ref &value);
}  // namespace

NginxHttpFrontend::NginxHttpFrontend(std::unique_ptr<Backend> backend)
    : Frontend(std::move(backend)),
      http_request_(nullptr),
      protocol_(UNKNOWN),
      is_request_half_closed_(false),
      is_request_half_closed_sent_(false),
      is_request_init_metadata_sent_(false),
      is_response_http_headers_sent_(false),
      is_response_status_sent_(false) {}

NginxHttpFrontend::~NginxHttpFrontend() {}

void NginxHttpFrontend::Start() {
  if (!encoder_ || !decoder_) {
    DEBUG("Bad request received.");
    ngx_http_finalize_request(http_request_, NGX_HTTP_BAD_REQUEST);
    return;
  }

  backend()->Start();
  // Enable request streaming.
  if (protocol_ == Protocol::B64_PROTO || protocol_ == Protocol::PROTO) {
    http_request_->request_body_no_buffering = false;
  } else {
    http_request_->request_body_no_buffering = true;
  }
  ngx_int_t rc = ngx_http_read_client_request_body(http_request_,
                                                   continue_read_request_body);
  if (rc >= NGX_HTTP_BAD_REQUEST) {
    DEBUG("ngx_http_read_client_request_body failed, rc = %" PRIdPTR ".", rc);
    SendErrorToClient(grpc::Status(grpc::StatusCode::INTERNAL,
                                   "Failed to read request body."));
    return;
  }
}

void NginxHttpFrontend::ContinueReadRequestBody() {
  if (http_request_ == nullptr) {
    return;
  }
  http_request_->read_event_handler = continue_read_request_body;
  if (http_request_->stream == nullptr &&
      (http_request_->connection->read->pending_eof ||
       http_request_->connection->read->eof)) {
    // FIN or RST from client received.
    DEBUG("receive FIN from peer, close the HTTP connection.");
    backend()->Cancel(grpc::Status::CANCELLED);
    ngx_http_close_connection(http_request_->connection);
    return;
  }

  if (!http_request_->reading_body) {
    if (!is_request_half_closed_) {
      is_request_half_closed_ = true;
      DEBUG("http_request has been finished, send request half close.");
      SendRequestToBackend();
    }
    return;
  }

  while (true) {
    ngx_int_t rc = ngx_http_read_unbuffered_request_body(http_request_);
    DEBUG("ngx_http_read_unbuffered_request_body = %" PRIdPTR ".", rc);
    if (http_request_->request_body->bufs == nullptr) {
      return;
    }
    if (rc == NGX_AGAIN) {
      DEBUG("request has not been finished yet, request_length = %lli.",
            static_cast<long long>(http_request_->request_length));
      bool sent = SendRequestToBackend();
      if (is_response_status_sent_) {
        return;
      }
      if (!sent) {
        DEBUG("no enough data to decode, continue when more data comes.");
        http_request_->read_event_handler = continue_read_request_body;
        continue;
      }
      DEBUG("message sent to backend, continue when finish sending.");
      http_request_->read_event_handler = ngx_http_request_empty_handler;
      return;
    }
    if (rc == NGX_OK) {
      if (!is_request_half_closed_) {
        is_request_half_closed_ = true;
        DEBUG(
            "ngx_http_read_unbuffered_request_body returns NGX_OK, send "
            "request "
            "half close.");
        SendRequestToBackend();
        if (is_response_status_sent_) {
          return;
        }
      }
      http_request_->request_body->bufs = nullptr;
      return;
    }
  }
}

void NginxHttpFrontend::SendResponseMessageToClient(Response *response) {
  if (response->message() != nullptr) {
    std::vector<Slice> transcoded_message;
    ByteBuffer buffer(response->message()->data(), response->message()->size());
    DEBUG("Sends response message, size: %" PRIdPTR ".", buffer.Length());
    encoder_->Encode(&buffer, &transcoded_message);
    if (!transcoded_message.empty()) {
      ngx_chain_t *output = ngx_alloc_chain_link(http_request_->pool);
      if (output == nullptr) {
        ERROR("Failed to allocate response buffer for GRPC response message.");
      }
      output->buf = nullptr;
      output->next = nullptr;
      for (Slice &slice : transcoded_message) {
        ngx_buf_t *buffer =
            reinterpret_cast<ngx_buf_t *>(ngx_calloc_buf(http_request_->pool));
        uint8_t *data = reinterpret_cast<uint8_t *>(
            ngx_palloc(http_request_->pool, slice.size()));
        memcpy(data, slice.begin(), slice.size());
        buffer->start = data;
        buffer->pos = buffer->start;
        buffer->end = data + slice.size();
        buffer->last = buffer->end;
        buffer->temporary = 1;
        ngx_chain_t *last_chain = ngx_chain_seek_to_last(output);
        if (last_chain->buf == nullptr) {
          last_chain->buf = buffer;
          last_chain->next = nullptr;
        } else {
          last_chain->next = ngx_alloc_chain_link(http_request_->pool);
          last_chain->next->buf = buffer;
          last_chain->next->next = nullptr;
        }
      }
      ngx_chain_seek_to_last(output)->buf->flush = 1;
      if (ngx_http_output_filter(http_request_, output) == NGX_AGAIN &&
          http_request_->stream != nullptr) {
        http_request_->write_event_handler = continue_write_response;
      }
    }
  }
}

void NginxHttpFrontend::SendResponseStatusToClient(Response *response) {
  if (response->status() == nullptr) {
    return;
  }
  if (is_response_status_sent_) {
    return;
  }
  is_response_status_sent_ = true;

  std::vector<Slice> trancoded_status;
  encoder_->EncodeStatus(*response->status(), response->trailers(),
                         &trancoded_status);
  if (trancoded_status.empty()) {
    SendResponseTrailersToClient(response);
  }
  ngx_chain_t *output = ngx_alloc_chain_link(http_request_->pool);
  if (output == nullptr) {
    ERROR("Failed to allocate response buffer for GRPC response message.");
    ngx_abort();
  }
  output->buf = nullptr;
  output->next = nullptr;
  for (Slice &slice : trancoded_status) {
    ngx_buf_t *buffer =
        reinterpret_cast<ngx_buf_t *>(ngx_calloc_buf(http_request_->pool));
    uint8_t *data = reinterpret_cast<uint8_t *>(
        ngx_palloc(http_request_->pool, slice.size()));
    memcpy(data, slice.begin(), slice.size());
    buffer->start = data;
    buffer->pos = buffer->start;
    buffer->end = data + slice.size();
    buffer->last = buffer->end;
    buffer->temporary = 1;
    ngx_chain_t *last_chain = ngx_chain_seek_to_last(output);
    if (last_chain->buf == nullptr) {
      last_chain->buf = buffer;
      last_chain->next = nullptr;
    } else {
      last_chain->next = ngx_alloc_chain_link(http_request_->pool);
      last_chain->next->buf = buffer;
      last_chain->next->next = nullptr;
    }
  }

  if (output->buf != nullptr) {
    ngx_chain_t *last = ngx_chain_seek_to_last(output);
    if (last->buf == nullptr) {
      last->buf =
          reinterpret_cast<ngx_buf_t *>(ngx_calloc_buf(http_request_->pool));
    }
    last->buf->flush = 1;
    last->buf->last_buf = 1;
    ngx_http_output_filter(http_request_, output);
  } else {
    ngx_http_send_special(http_request_, NGX_HTTP_LAST);
  }
  ngx_http_finalize_request(http_request_, NGX_OK);
}

void NginxHttpFrontend::Send(std::unique_ptr<Response> response) {
  if (http_request_ == nullptr || http_request_->connection == nullptr ||
      http_request_->connection->destroyed) {
    // The HTTP request/connection has been terminated, do nothing.
    return;
  }
  SendResponseHeadersToClient(response.get());
  SendResponseMessageToClient(response.get());
  SendResponseStatusToClient(response.get());
}

void NginxHttpFrontend::AddRequestInitialMetadataOnce(
    const std::unique_ptr<Request> &request) {
  if (!is_request_init_metadata_sent_) {
    is_request_init_metadata_sent_ = true;
    request->set_headers(std::unique_ptr<Headers>(new Headers()));
    ngx_list_part_t *part;
    ngx_table_elt_t *h;
    part = &http_request_->headers_in.headers.part;
    while (part != nullptr) {
      h = static_cast<ngx_table_elt_t *>(part->elts);
      for (ngx_uint_t i = 0; i < part->nelts; i++) {
        request->headers()->push_back(Header(
            std::string(reinterpret_cast<char *>(h[i].key.data), h[i].key.len),
            string_ref(reinterpret_cast<char *>(h[i].value.data),
                       h[i].value.len)));
      }
      part = part->next;
    }
  }
}

Status NginxHttpFrontend::DecodeRequestBody() {
  ngx_http_request_body_t *request_body = http_request_->request_body;
  ngx_chain_t *buffers = request_body->bufs;
  if (buffers != nullptr) {
    while (buffers) {
      ngx_buf_t *buffer = buffers->buf;
      if (buffer->in_file) {
        if (buffer->file_pos >= buffer->file_last) {
          buffers = buffers->next;
          continue;
        }
        gpr_slice slice =
            gpr_slice_malloc(buffer->file_last - buffer->file_pos);
        ssize_t size = ngx_read_file(buffer->file, GPR_SLICE_START_PTR(slice),
                                     GPR_SLICE_LENGTH(slice), 0);
        GPR_ASSERT(size >= 0 &&
                   static_cast<size_t>(size) == GPR_SLICE_LENGTH(slice));
        decoder_->Append(Slice(slice, Slice::STEAL_REF));
        buffer->file_pos = buffer->file_last;
      } else {
        if (buffer->pos >= buffer->last) {
          buffers = buffers->next;
          continue;
        }
        decoder_->Append(Slice(
            gpr_slice_from_copied_buffer(reinterpret_cast<char *>(buffer->pos),
                                         buffer->last - buffer->pos),
            Slice::STEAL_REF));
        buffer->pos = buffer->last;
      }
    }
    request_body->bufs = nullptr;
    request_body->busy = nullptr;
  }
  return decoder_->Decode();
}

void NginxHttpFrontend::AddRequestMessage(
    const std::unique_ptr<Request> &request) {
  std::unique_ptr<ByteBuffer> message = std::move(decoder_->results()->front());
  decoder_->results()->pop_front();
  std::vector<Slice> slices;
  message->Dump(&slices);
  request->set_message(std::unique_ptr<Message>(new Message()));
  for (auto &slice : slices) {
    request->message()->push_back(slice);
  }
}

bool NginxHttpFrontend::SendRequestToBackend() {
  std::unique_ptr<Request> request(new Request());
  AddRequestInitialMetadataOnce(request);
  Status status = DecodeRequestBody();
  if (!status.ok()) {
    // Terminate backend.

    // Send back response.
    SendErrorToClient(status);
    return false;
  }

  if (!decoder_->results()->empty()) {
    AddRequestMessage(request);
  }

  if (decoder_->results()->empty() && is_request_half_closed_) {
    request->set_final(is_request_half_closed_);
    is_request_half_closed_sent_ = true;
  }

  if (request->empty()) {
    return false;
  }

  backend()->Send(
      std::move(request),
      BindTo(this, this, &NginxHttpFrontend::SendRequestToBackendDone));
  return true;
}

void NginxHttpFrontend::SendRequestToBackendDone(bool result) {
  if (http_request_ == nullptr) {
    // Nginx HTTP request has been terminated, do nothing.
    return;
  }

  if (!result) {
    // GRPC failed, the status will come later, return here.
    return;
  }

  if (!decoder_->results()->empty()) {
    // Have pending request messages.
    SendRequestToBackend();
    return;
  }

  if (!is_request_half_closed_) {
    ContinueReadRequestBody();
    return;
  }
}

void NginxHttpFrontend::SendResponseHeadersToClient(Response *response) {
  if (is_response_http_headers_sent_) {
    return;
  }
  is_response_http_headers_sent_ = true;

  http_request_->headers_out.status = NGX_HTTP_OK;
  if (response != nullptr && response->headers() != nullptr) {
    for (auto &header : *response->headers()) {
      if (header.first == kContentLength || header.first == kContentType ||
          header.first == kContentTransferEncoding) {
        continue;
      }
      AddHTTPHeader(http_request_, header.first, header.second);
    }
  }
  switch (protocol_) {
    case GRPC:
      AddHTTPHeader(http_request_, kGrpcEncoding, kGrpcEncoding_Identity);
      AddHTTPHeader(http_request_, kContentType, kContentTypeGrpc);
      AddHTTPHeader(http_request_, kGrpcAcceptEncoding,
                    kGrpcAcceptEncoding_AcceptAll);
      break;
    case JSON_STREAM_BODY:
      AddHTTPHeader(http_request_, kContentType, kContentTypeJson);
      break;
    case PROTO:
    case PROTO_STREAM_BODY:
      AddHTTPHeader(http_request_, kContentType, kContentTypeStreamBody);
      break;
    case B64_PROTO:
    case B64_STREAM_BODY:
      AddHTTPHeader(http_request_, kContentType, kContentTypeStreamBody);
      AddHTTPHeader(http_request_, kContentTransferEncoding,
                    kContentTransferEncoding_Base64);
      break;
    default: {
      // Intended to skip.
    }
  }
  ngx_int_t rc = ngx_http_send_header(http_request_);
  if (rc != NGX_OK) {
    ERROR("Failed to send HTTP response headers via nginx, rc = %ld.", rc);
  }
}

void NginxHttpFrontend::SendResponseTrailersToClient(Response *response) {
  http_request_->headers_out.status = NGX_HTTP_OK;
  if (response != nullptr && response->trailers() != nullptr) {
    AddHTTPTrailer(
        http_request_, kGrpcStatus,
        string_ref(std::to_string(response->status()->error_code())));
    if (!response->status()->error_message().empty()) {
      AddHTTPTrailer(http_request_, kGrpcMessage,
                     response->status()->error_message());
    }
    for (auto &trailer : *response->trailers()) {
      AddHTTPTrailer(http_request_, trailer.first, trailer.second);
    }
  }
}

void NginxHttpFrontend::SendErrorToClient(const grpc::Status &status) {
  backend()->Cancel(status);
}

namespace {
void AddElementToNginxElementTable(ngx_pool_t *pool, ngx_list_t *table,
                                   const string &name,
                                   const string_ref &value) {
  ngx_table_elt_t *ngx_key_value =
      reinterpret_cast<ngx_table_elt_t *>(ngx_list_push(table));
  if (ngx_key_value == nullptr) {
    ERROR("Failed to allocate response initial metadata for nginx.");
  }
  ngx_key_value->key.len = name.size();
  ngx_key_value->key.data =
      reinterpret_cast<u_char *>(ngx_palloc(pool, name.size()));
  ngx_copy(ngx_key_value->key.data, name.c_str(), name.size());
  ngx_key_value->value.len = value.size();
  ngx_key_value->value.data =
      reinterpret_cast<u_char *>(ngx_palloc(pool, value.size()));
  ngx_copy(ngx_key_value->value.data, value.data(), value.size());
  ngx_key_value->lowcase_key =
      reinterpret_cast<u_char *>(ngx_pnalloc(pool, ngx_key_value->key.len));
  ngx_strlow(ngx_key_value->lowcase_key, ngx_key_value->key.data,
             ngx_key_value->key.len);
  ngx_key_value->hash =
      ngx_hash_key_lc(ngx_key_value->key.data, ngx_key_value->key.len);
}

void AddHTTPHeader(ngx_http_request_t *http_request, const string &name,
                   const string_ref &value) {
  AddElementToNginxElementTable(
      http_request->pool, &http_request->headers_out.headers, name, value);
}

void AddHTTPTrailer(ngx_http_request_t *http_request, const string &name,
                    const string_ref &value) {
  AddElementToNginxElementTable(
      http_request->pool, &http_request->headers_out.trailers, name, value);
}
}  // namespace
}  // namespace gateway
}  // namespace grpc
