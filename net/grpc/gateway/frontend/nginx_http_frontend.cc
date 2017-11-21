#include "net/grpc/gateway/frontend/nginx_http_frontend.h"

#include <algorithm>

#include "net/grpc/gateway/frontend/nginx_bridge.h"
#include "net/grpc/gateway/log.h"
#include "net/grpc/gateway/nginx_utils.h"
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
  auto *frontend =
      static_cast<grpc::gateway::NginxHttpFrontend *>(context->frontend.get());
  frontend->StopClientLivenessDetection();
  frontend->set_http_request(nullptr);
  context->frontend.reset();
}

ngx_int_t grpc_gateway_handler(ngx_http_request_t *r) {
  if (r->headers_in.content_type &&
      strncasecmp(
          grpc::gateway::kContentTypeGrpc,
          reinterpret_cast<char *>(r->headers_in.content_type->value.data),
          r->headers_in.content_type->value.len) != 0 &&
      r->method != NGX_HTTP_POST) {
    // Only POST method is allowed for GRPC-Web.
    return NGX_HTTP_NOT_ALLOWED;
  }
  ngx_grpc_gateway_loc_conf_t *mlcf =
      static_cast<ngx_grpc_gateway_loc_conf_t *>(
          ngx_http_get_module_loc_conf(r, grpc_gateway_module));
  std::string backend_address(reinterpret_cast<char *>(mlcf->grpc_pass.data),
                              mlcf->grpc_pass.len);
  std::string backend_host(reinterpret_cast<char *>(r->host_start),
                           r->host_end - r->host_start);
  std::string backend_method(reinterpret_cast<char *>(r->uri.data), r->uri.len);

  // Initiate nginx request context.
  grpc_gateway_request_context *context =
      static_cast<grpc_gateway_request_context *>(
          ngx_pcalloc(r->pool, sizeof(grpc_gateway_request_context)));
  if (context == nullptr) {
    return NGX_HTTP_INTERNAL_SERVER_ERROR;
  }
  context->frontend = grpc::gateway::Runtime::Get().CreateNginxFrontend(
      r, backend_address, backend_host, backend_method,
      mlcf->grpc_channel_reuse, mlcf->grpc_client_liveness_detection_interval);
  ngx_http_set_ctx(r, context, grpc_gateway_module);
  ngx_pool_cleanup_t *http_cleanup =
      ngx_pool_cleanup_add(r->pool, sizeof(grpc_gateway_request_context));
  http_cleanup->data = context;
  http_cleanup->handler = grpc_gateway_request_cleanup_handler;
  context->frontend->Start();
  return NGX_DONE;
}

void continue_read_request_body(ngx_http_request_t *r) {
  static_cast<grpc::gateway::NginxHttpFrontend *>(get_frontend(r))
      ->ContinueReadRequestBody();
}

void continue_write_response(ngx_http_request_t *r) {
  if (ngx_http_output_filter(r, nullptr) == NGX_AGAIN) {
    r->write_event_handler = continue_write_response;
  } else {
    r->write_event_handler = ngx_http_request_empty_handler;
  }
  if (ngx_handle_write_event(r->connection->write, 0) != NGX_OK) {
    ngx_http_finalize_request(r, NGX_HTTP_INTERNAL_SERVER_ERROR);
  }
}

void client_liveness_detection_handler(ngx_event_t *event) {
  static_cast<::grpc::gateway::NginxHttpFrontend *>(
      static_cast<ngx_connection_t *>(event->data)->data)
      ->OnClientLivenessDetectionEvent(event);
}

#ifdef __cplusplus
}
#endif

namespace grpc {
namespace gateway {

NginxHttpFrontend::NginxHttpFrontend(std::unique_ptr<Backend> backend)
    : Frontend(std::move(backend)),
      http_request_(nullptr),
      request_protocol_(UNKNOWN),
      response_protocol_(UNKNOWN),
      is_request_half_closed_(false),
      is_request_half_closed_sent_(false),
      is_request_init_metadata_sent_(false),
      is_response_http_headers_sent_(false),
      is_response_status_sent_(false),
      client_liveness_detection_timer_(nullptr),
      client_liveness_detection_interval_(0),
      client_liveness_detection_timer_connection_(nullptr) {}

NginxHttpFrontend::~NginxHttpFrontend() { StopClientLivenessDetection(); }

void NginxHttpFrontend::Start() {
  if (!encoder_ || !decoder_) {
    DEBUG("Bad request received.");
    ngx_http_finalize_request(http_request_, NGX_HTTP_BAD_REQUEST);
    return;
  }

  backend()->Start();
  // Enable request streaming.
  if (request_protocol_ == Protocol::B64_PROTO ||
      request_protocol_ == Protocol::PROTO) {
    http_request_->request_body_no_buffering = false;
  } else {
    http_request_->request_body_no_buffering = true;
  }

  if (client_liveness_detection_interval_ > 0) {
    // Initialize the dummy connection of client liveness detection timer.
    client_liveness_detection_timer_connection_ =
        static_cast<ngx_connection_t *>(
            ngx_pcalloc(http_request_->pool, sizeof(ngx_connection_t)));
    client_liveness_detection_timer_connection_->fd =
        static_cast<ngx_socket_t>(-1);
    client_liveness_detection_timer_connection_->data = this;

    // Initialize the client liveness detection timer.
    client_liveness_detection_timer_ = static_cast<ngx_event_t *>(
        ngx_pcalloc(http_request_->pool, sizeof(ngx_event_t)));
    client_liveness_detection_timer_->log = http_request_->connection->log;
    client_liveness_detection_timer_->handler =
        client_liveness_detection_handler;
    client_liveness_detection_timer_->data =
        client_liveness_detection_timer_connection_;
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
    ngx_http_finalize_request(http_request_, NGX_DONE);
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
      if (ngx_http_output_filter(http_request_, output) == NGX_AGAIN) {
        http_request_->write_event_handler = continue_write_response;
      }
      if (ngx_handle_write_event(http_request_->connection->write, 0) !=
          NGX_OK) {
        ngx_http_finalize_request(http_request_,
                                  NGX_HTTP_INTERNAL_SERVER_ERROR);
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

  StopClientLivenessDetection();

  std::vector<Slice> trancoded_status;
  if (request_protocol_ == Protocol::GRPC) {
    SendResponseTrailersToClient(response);
  } else {
    encoder_->EncodeStatus(*response->status(), response->trailers(),
                           &trancoded_status);
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
        grpc_slice slice =
            grpc_slice_malloc(buffer->file_last - buffer->file_pos);
        ssize_t size = ngx_read_file(buffer->file, GRPC_SLICE_START_PTR(slice),
                                     GRPC_SLICE_LENGTH(slice), 0);
        GPR_ASSERT(size >= 0 &&
                   static_cast<size_t>(size) == GRPC_SLICE_LENGTH(slice));
        decoder_->Append(Slice(slice, Slice::STEAL_REF));
        buffer->file_pos = buffer->file_last;
      } else {
        if (buffer->pos >= buffer->last) {
          buffers = buffers->next;
          continue;
        }
        decoder_->Append(Slice(
            grpc_slice_from_copied_buffer(reinterpret_cast<char *>(buffer->pos),
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
  switch (response_protocol_) {
    case GRPC:
      AddHTTPHeader(http_request_, kGrpcEncoding, kGrpcEncoding_Identity);
      AddHTTPHeader(http_request_, kContentType, kContentTypeGrpc);
      AddHTTPHeader(http_request_, kGrpcAcceptEncoding,
                    kGrpcAcceptEncoding_AcceptAll);
      break;
    case GRPC_WEB:
      AddHTTPHeader(http_request_, kContentType, kContentTypeGrpcWeb);
      break;
    case GRPC_WEB_TEXT:
      AddHTTPHeader(http_request_, kContentType, kContentTypeGrpcWebText);
      break;
    case JSON_STREAM_BODY:
      AddHTTPHeader(http_request_, kContentType, kContentTypeJson);
      break;
    case PROTO:
      AddHTTPHeader(http_request_, kContentType, kContentTypeProto);
      break;
    case PROTO_STREAM_BODY:
      AddHTTPHeader(http_request_, kContentType, kContentTypeStreamBody);
      break;
    case B64_PROTO:
      AddHTTPHeader(http_request_, kContentType, kContentTypeProto);
      AddHTTPHeader(http_request_, kContentTransferEncoding,
                    kContentTransferEncoding_Base64);
      break;
    case B64_PROTO_STREAM_BODY:
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
    ERROR("Failed to send HTTP response headers via nginx, rc = %" PRIdPTR ".",
          rc);
  }

  // Enable keepalive timer.
  if ((response_protocol_ == Protocol::B64_PROTO_STREAM_BODY ||
       response_protocol_ == Protocol::PROTO_STREAM_BODY) &&
      client_liveness_detection_interval_ > 0) {
    ngx_event_add_timer(client_liveness_detection_timer_,
                        client_liveness_detection_interval_);
  }
}

void NginxHttpFrontend::SendResponseTrailersToClient(Response *response) {
  http_request_->headers_out.status = NGX_HTTP_OK;
  http_request_->expect_trailers = 1;
  if (response != nullptr) {
    AddHTTPTrailer(
        http_request_, kGrpcStatus,
        string_ref(std::to_string(response->status()->error_code())));
    if (!response->status()->error_message().empty()) {
      AddHTTPTrailer(http_request_, kGrpcMessage,
                     response->status()->error_message());
    }
    if (response->trailers()) {
      for (auto &trailer : *response->trailers()) {
        AddHTTPTrailer(http_request_, trailer.first, trailer.second);
      }
    }
  }
}

void NginxHttpFrontend::SendErrorToClient(const grpc::Status &status) {
  backend()->Cancel(status);
}

void NginxHttpFrontend::WriteToNginxResponse(uint8_t *data, size_t size) {
  ngx_chain_t *output = ngx_alloc_chain_link(http_request_->pool);
  if (output == nullptr) {
    ERROR("Failed to allocate response buffer for keep alive message.");
  }
  output->buf = nullptr;
  output->next = nullptr;
  ngx_buf_t *buffer =
      reinterpret_cast<ngx_buf_t *>(ngx_calloc_buf(http_request_->pool));
  buffer->start = data;
  buffer->pos = buffer->start;
  buffer->end = data + size;
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
  ngx_chain_seek_to_last(output)->buf->flush = 1;
  if (ngx_http_output_filter(http_request_, output) == NGX_AGAIN) {
    http_request_->write_event_handler = continue_write_response;
  }
  if (ngx_handle_write_event(http_request_->connection->write, 0) != NGX_OK) {
    ngx_http_finalize_request(http_request_, NGX_HTTP_INTERNAL_SERVER_ERROR);
  }
}  // namespace gateway

void NginxHttpFrontend::OnClientLivenessDetectionEvent(ngx_event_t *event) {
  if (http_request_ == nullptr) {
    // The HTTP request has been finalized.
    return;
  }

  if (response_protocol_ == Protocol::PROTO_STREAM_BODY) {
    uint8_t *data =
        reinterpret_cast<uint8_t *>(ngx_palloc(http_request_->pool, 2));
    *data = 0b01111010;
    *(data + 1) = 0;
    WriteToNginxResponse(data, 2);
  } else if (request_protocol_ == Protocol::B64_PROTO_STREAM_BODY) {
    uint8_t *data =
        reinterpret_cast<uint8_t *>(ngx_palloc(http_request_->pool, 4));
    *data = 'e';
    *(data + 1) = 'g';
    *(data + 2) = 'E';
    *(data + 3) = 'A';
    WriteToNginxResponse(data, 4);
  }

  if (client_liveness_detection_interval_ > 0) {
    ngx_event_add_timer(client_liveness_detection_timer_,
                        client_liveness_detection_interval_);
  }
}

void NginxHttpFrontend::StopClientLivenessDetection() {
  if (client_liveness_detection_timer_ != nullptr) {
    if (client_liveness_detection_timer_->timer_set) {
      ngx_event_del_timer(client_liveness_detection_timer_);
    }
    client_liveness_detection_timer_ = nullptr;
  }
}
}  // namespace gateway
}  // namespace grpc
