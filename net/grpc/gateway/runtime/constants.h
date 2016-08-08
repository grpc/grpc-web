#ifndef NET_GRPC_GATEWAY_RUNTIME_CONSTANTS_H_
#define NET_GRPC_GATEWAY_RUNTIME_CONSTANTS_H_

#include <stddef.h>

namespace grpc {
namespace gateway {

// The content type of protocol buffers based wire format for GRPC web.
const char kContentTypeProto[] = "application/x-protobuf";
const size_t kContentTypeProtoLength = sizeof(kContentTypeProto) - 1;

// The content type of JSON based wire format for GRPC web.
const char kContentTypeJson[] = "application/json";
const size_t kContentTypeJsonLength = sizeof(kContentTypeJson) - 1;

// The content type of GRPC.
const char kContentTypeGrpc[] = "application/grpc";
const size_t kContentTypeGrpcLength = sizeof(kContentTypeGrpc) - 1;

// The type url of google.rpc.Pair.
const char kTypeUrlPair[] = "type.googleapis.com/google.rpc.Pair";

// The metadata name of grpc-status.
const char kGrpcStatus[] = "grpc-status";

// The metadata name of grpc-message.
const char kGrpcMessage[] = "grpc-message";

// The metadata name of grpc-encoding.
const char kGrpcEncoding[] = "grpc-encoding";

// The metadata value of grpc-encoding for identity.
const char kGrpcEncoding_Identity[] = "identity";

// The metadata value of grpc-encoding for gzip.
const char kGrpcEncoding_Gzip[] = "gzip";

// The metadata name of grpc-accept-encoding.
const char kGrpcAcceptEncoding[] = "grpc-accept-encoding";

// The metadata value of grpc-accept-encoding to accept all supported formats.
const char kGrpcAcceptEncoding_AcceptAll[] = "identity,deflate,gzip";

// The metadata name of content-type.
const char kContentType[] = "content-type";

// The metadata name of content-length.
const char kContentLength[] = "content-length";

// The frontend protocols supported by GRPC-Web gateway.
enum Protocol {
  UNKNOWN = 0,
  GRPC,
  JSON_STREAM_BODY,
  PROTO_STREAM_BODY,
};
}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_RUNTIME_CONSTANTS_H_
