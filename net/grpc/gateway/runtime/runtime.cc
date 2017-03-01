#include "net/grpc/gateway/runtime/runtime.h"

#include <algorithm>
#include <cstdlib>
#include <cstring>

#include "net/grpc/gateway/backend/grpc_backend.h"
#include "net/grpc/gateway/codec/b64_proto_decoder.h"
#include "net/grpc/gateway/codec/b64_stream_body_decoder.h"
#include "net/grpc/gateway/codec/b64_stream_body_encoder.h"
#include "net/grpc/gateway/codec/grpc_decoder.h"
#include "net/grpc/gateway/codec/grpc_encoder.h"
#include "net/grpc/gateway/codec/grpc_web_decoder.h"
#include "net/grpc/gateway/codec/grpc_web_encoder.h"
#include "net/grpc/gateway/codec/json_decoder.h"
#include "net/grpc/gateway/codec/json_encoder.h"
#include "net/grpc/gateway/codec/proto_decoder.h"
#include "net/grpc/gateway/codec/stream_body_decoder.h"
#include "net/grpc/gateway/codec/stream_body_encoder.h"
#include "net/grpc/gateway/frontend/nginx_http_frontend.h"
#include "net/grpc/gateway/runtime/constants.h"
#include "third_party/grpc/include/grpc++/support/config.h"
#include "third_party/grpc/include/grpc/grpc.h"

namespace grpc {
namespace gateway {
namespace {
const string_ref GetHTTPHeader(ngx_list_part_t* part, const string& name) {
  ngx_table_elt_t* header = reinterpret_cast<ngx_table_elt_t*>(part->elts);
  for (ngx_uint_t i = 0; i < part->nelts; i++) {
    if (strncasecmp(name.c_str(),
                    reinterpret_cast<const char*>(header[i].key.data),
                    name.size()) == 0) {
      return string_ref(reinterpret_cast<char*>(header[i].value.data),
                        header[i].value.len);
    }
  }
  return string_ref();
}
}  // namespace

Runtime::Runtime() {
  grpc_init();
  grpc_event_queue_.reset(new GrpcEventQueue());
}

Runtime::~Runtime() {}

void Runtime::Init() { grpc_event_queue_->Start(); }

void Runtime::Shutdown() {
  grpc_event_queue_->Stop();
  for (auto& entry : grpc_backend_channels_) {
    grpc_channel_destroy(entry.second);
  }
  grpc_backend_channels_.clear();
}

std::shared_ptr<Frontend> Runtime::CreateNginxFrontend(
    ngx_http_request_t* http_request, const string& backend_address,
    const string& backend_host, const string& backend_method,
    const string& channel_reuse) {
  std::unique_ptr<GrpcBackend> backend(new GrpcBackend());
  backend->set_address(backend_address);
  backend->set_host(backend_host);
  backend->set_method(backend_method);
  if (channel_reuse == "on") {
    backend->set_use_shared_channel_pool(true);
  }
  NginxHttpFrontend* frontend = new NginxHttpFrontend(std::move(backend));
  frontend->set_http_request(http_request);
  frontend->set_encoder(CreateEncoder(http_request));
  frontend->set_decoder(CreateDecoder(http_request));
  frontend->set_protocol(DetectFrontendProtocol(http_request));
  return std::shared_ptr<Frontend>(frontend);
}

std::unique_ptr<Encoder> Runtime::CreateEncoder(
    ngx_http_request_t* http_request) {
  if (http_request == nullptr ||
      http_request->headers_in.content_type == nullptr) {
    return nullptr;
  }
  const char* content_type = reinterpret_cast<const char*>(
      http_request->headers_in.content_type->value.data);
  size_t content_type_length = http_request->headers_in.content_type->value.len;
  if (content_type_length == kContentTypeGrpcWebLength &&
      strncasecmp(kContentTypeGrpcWeb, content_type, kContentTypeGrpcLength) ==
          0) {
    return std::unique_ptr<Encoder>(new GrpcWebEncoder());
  }
  if (content_type_length == kContentTypeStreamBodyLength &&
      strncasecmp(kContentTypeStreamBody, content_type,
                  kContentTypeStreamBodyLength) == 0) {
    string_ref value = GetHTTPHeader(&http_request->headers_in.headers.part,
                                     kContentTransferEncoding);
    if (kContentTransferEncoding_Base64_Length == value.size() &&
        strncasecmp(kContentTransferEncoding_Base64, value.data(),
                    value.size()) == 0) {
      return std::unique_ptr<Encoder>(new B64StreamBodyEncoder());
    }
    return std::unique_ptr<Encoder>(new StreamBodyEncoder());
  }
  if (content_type_length == kContentTypeProtoLength &&
      strncasecmp(kContentTypeProto, content_type, kContentTypeProtoLength) ==
          0) {
    string_ref value = GetHTTPHeader(&http_request->headers_in.headers.part,
                                     kContentTransferEncoding);
    if (kContentTransferEncoding_Base64_Length == value.size() &&
        strncasecmp(kContentTransferEncoding_Base64, value.data(),
                    value.size()) == 0) {
      return std::unique_ptr<Encoder>(new B64StreamBodyEncoder());
    }
    return std::unique_ptr<Encoder>(new StreamBodyEncoder());
  }
  if (content_type_length == kContentTypeJsonLength &&
      strncasecmp(kContentTypeJson, content_type, kContentTypeJsonLength) ==
          0) {
    return std::unique_ptr<Encoder>(new JsonEncoder());
  }
  if (content_type_length == kContentTypeGrpcLength &&
      strncasecmp(kContentTypeGrpc, content_type, kContentTypeGrpcLength) ==
          0) {
    return std::unique_ptr<Encoder>(new GrpcEncoder());
  }
  return nullptr;
}

std::unique_ptr<Decoder> Runtime::CreateDecoder(
    ngx_http_request_t* http_request) {
  if (http_request == nullptr ||
      http_request->headers_in.content_type == nullptr) {
    return nullptr;
  }
  const char* content_type = reinterpret_cast<const char*>(
      http_request->headers_in.content_type->value.data);
  size_t content_type_length = http_request->headers_in.content_type->value.len;
  if (content_type_length == kContentTypeGrpcWebLength &&
      strncasecmp(kContentTypeGrpcWeb, content_type, kContentTypeGrpcLength) ==
          0) {
    return std::unique_ptr<Decoder>(new GrpcWebDecoder());
  }
  if (content_type_length == kContentTypeProtoLength &&
      strncasecmp(kContentTypeProto, content_type, kContentTypeProtoLength) ==
          0) {
    string_ref value = GetHTTPHeader(&http_request->headers_in.headers.part,
                                     kContentTransferEncoding);
    if (kContentTransferEncoding_Base64_Length == value.size() &&
        strncasecmp(kContentTransferEncoding_Base64, value.data(),
                    value.size()) == 0) {
      return std::unique_ptr<Decoder>(new B64ProtoDecoder());
    }
    return std::unique_ptr<Decoder>(new ProtoDecoder());
  }
  if (content_type_length == kContentTypeStreamBodyLength &&
      strncasecmp(kContentTypeStreamBody, content_type,
                  kContentTypeStreamBodyLength) == 0) {
    string_ref value = GetHTTPHeader(&http_request->headers_in.headers.part,
                                     kContentTransferEncoding);
    if (kContentTransferEncoding_Base64_Length == value.size() &&
        strncasecmp(kContentTransferEncoding_Base64, value.data(),
                    value.size()) == 0) {
      return std::unique_ptr<Decoder>(new B64StreamBodyDecoder());
    }
    return std::unique_ptr<Decoder>(new StreamBodyDecoder());
  }
  if (content_type_length == kContentTypeJsonLength &&
      strncasecmp(kContentTypeJson, content_type, kContentTypeJsonLength) ==
          0) {
    return std::unique_ptr<Decoder>(new JsonDecoder());
  }
  if (content_type_length == kContentTypeGrpcLength &&
      strncasecmp(kContentTypeGrpc, content_type, kContentTypeGrpcLength) ==
          0) {
    GrpcDecoder* decoder = new GrpcDecoder();
    string_ref value =
        GetHTTPHeader(&http_request->headers_in.headers.part, kGrpcEncoding);
    if (kGrpcEncoding_Identity_Length == value.size() &&
        strncasecmp(kGrpcEncoding_Identity, value.data(), value.size()) == 0) {
      decoder->set_compression_algorithm(GrpcDecoder::kIdentity);
    } else if (kGrpcEncoding_Gzip_Length == value.size() &&
               strncasecmp(kGrpcEncoding_Gzip, value.data(), value.size()) ==
                   0) {
      decoder->set_compression_algorithm(GrpcDecoder::kGzip);
    }
    return std::unique_ptr<Decoder>(decoder);
  }
  return nullptr;
}

Protocol Runtime::DetectFrontendProtocol(ngx_http_request_t* http_request) {
  if (http_request == nullptr ||
      http_request->headers_in.content_type == nullptr) {
    return UNKNOWN;
  }
  const char* content_type = reinterpret_cast<const char*>(
      http_request->headers_in.content_type->value.data);
  size_t content_type_length = http_request->headers_in.content_type->value.len;
  if (content_type_length == kContentTypeProtoLength &&
      strncasecmp(kContentTypeProto, content_type, kContentTypeProtoLength) ==
          0) {
    string_ref value = GetHTTPHeader(&http_request->headers_in.headers.part,
                                     kContentTransferEncoding);
    if (kContentTransferEncoding_Base64_Length == value.size() &&
        strncasecmp(kContentTransferEncoding_Base64, value.data(),
                    value.size()) == 0) {
      return B64_PROTO;
    }
    return PROTO;
  }
  if (content_type_length == kContentTypeStreamBodyLength &&
      strncasecmp(kContentTypeStreamBody, content_type,
                  kContentTypeStreamBodyLength) == 0) {
    string_ref value = GetHTTPHeader(&http_request->headers_in.headers.part,
                                     kContentTransferEncoding);
    if (kContentTransferEncoding_Base64_Length == value.size() &&
        strncasecmp(kContentTransferEncoding_Base64, value.data(),
                    value.size()) == 0) {
      return B64_STREAM_BODY;
    }
    return PROTO_STREAM_BODY;
  }
  if (content_type_length == kContentTypeJsonLength &&
      strncasecmp(kContentTypeJson, content_type, kContentTypeJsonLength) ==
          0) {
    return JSON_STREAM_BODY;
  }
  if (content_type_length == kContentTypeGrpcLength &&
      strncasecmp(kContentTypeGrpc, content_type, kContentTypeGrpcLength) ==
          0) {
    return GRPC;
  }
  if (content_type_length == kContentTypeGrpcWebLength &&
      strncasecmp(kContentTypeGrpcWeb, content_type,
                  kContentTypeGrpcWebLength) == 0) {
    return GRPC_WEB;
  }
  return UNKNOWN;
}

grpc_channel* Runtime::GetBackendChannel(const std::string& backend_address,
                                         bool use_shared_channel_pool) {
  if (use_shared_channel_pool) {
    auto result = grpc_backend_channels_.find(backend_address);
    if (result != grpc_backend_channels_.end()) {
      return result->second;
    }
  }
  grpc_channel_args args;
  grpc_arg arg;
  arg.type = GRPC_ARG_INTEGER;
  arg.key = const_cast<char*>(GRPC_ARG_MAX_MESSAGE_LENGTH);
  arg.value.integer = 100 * 1024 * 1024;
  args.num_args = 1;
  args.args = &arg;
  grpc_channel* channel =
      grpc_insecure_channel_create(backend_address.c_str(), &args, nullptr);
  if (use_shared_channel_pool) {
    grpc_backend_channels_.insert(
        std::pair<string, grpc_channel*>(backend_address, channel));
  }
  return channel;
}
}  // namespace gateway
}  // namespace grpc
