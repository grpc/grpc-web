#ifndef NET_GRPC_GATEWAY_RUNTIME_CONSTANTS_H_
#define NET_GRPC_GATEWAY_RUNTIME_CONSTANTS_H_

#include <stddef.h>

namespace grpc {
namespace gateway {

// The content type of protocol buffers based wire format for GRPC web.
const char kContentTypeProto[] = "application/x-protobuf";
const size_t kContentTypeProtoLength = sizeof(kContentTypeProto) - 1;

// The content type of protocol buffers based wire format with stream body
// envelope.
const char kContentTypeStreamBody[] =
    "application/x-protobuf.google.rpc.streambody";
const size_t kContentTypeStreamBodyLength = sizeof(kContentTypeStreamBody) - 1;

// The content type of JSON based wire format for GRPC web.
const char kContentTypeJson[] = "application/json";
const size_t kContentTypeJsonLength = sizeof(kContentTypeJson) - 1;

// The content type of GRPC.
const char kContentTypeGrpc[] = "application/grpc";
const size_t kContentTypeGrpcLength = sizeof(kContentTypeGrpc) - 1;

// The content type of GRPC Web.
const char kContentTypeGrpcWeb[] = "application/grpc-web";
const size_t kContentTypeGrpcWebLength = sizeof(kContentTypeGrpcWeb) - 1;

// The content type of GRPC Web with proto as payload.
const char kContentTypeGrpcWebProto[] = "application/grpc-web+proto";
const size_t kContentTypeGrpcWebProtoLength =
    sizeof(kContentTypeGrpcWebProto) - 1;

// The content type of GRPC Web Text.
const char kContentTypeGrpcWebText[] = "application/grpc-web-text";
const size_t kContentTypeGrpcWebTextLength =
    sizeof(kContentTypeGrpcWebText) - 1;

// The content type of GRPC Web Text with proto as payload.
const char kContentTypeGrpcWebTextProto[] = "application/grpc-web-text+proto";
const size_t kContentTypeGrpcWebTextProtoLength =
    sizeof(kContentTypeGrpcWebTextProto) - 1;

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
const size_t kGrpcEncoding_Identity_Length = sizeof(kGrpcEncoding_Identity) - 1;

// The metadata value of grpc-encoding for gzip.
const char kGrpcEncoding_Gzip[] = "gzip";
const size_t kGrpcEncoding_Gzip_Length = sizeof(kGrpcEncoding_Gzip) - 1;

// The metadata name of grpc-accept-encoding.
const char kGrpcAcceptEncoding[] = "grpc-accept-encoding";

// The metadata value of grpc-accept-encoding to accept all supported formats.
const char kGrpcAcceptEncoding_AcceptAll[] = "identity,deflate,gzip";

// The metadata name of content-type.
const char kContentType[] = "content-type";

// The metadata name of content-length.
const char kContentLength[] = "content-length";

// The metadata name of content-transfer-encoding.
const char kContentTransferEncoding[] = "content-transfer-encoding";

// The metadata name of accept.
const char kAccept[] = "accept";

// The metadata value of content-transfer-encoding for base64.
const char kContentTransferEncoding_Base64[] = "base64";
const size_t kContentTransferEncoding_Base64_Length =
    sizeof(kContentTransferEncoding_Base64) - 1;

const char kXAcceptContentTransferEncoding[] =
    "x-accept-content-transfer-encoding";
const size_t kXAcceptContentTransferEncodingLength =
    sizeof(kXAcceptContentTransferEncoding) - 1;
const char kXAcceptContentTransferEncoding_Base64[] = "base64";
const size_t kXAcceptContentTransferEncoding_Base64_Length =
    sizeof(kXAcceptContentTransferEncoding_Base64) - 1;

const char kXAcceptResponseStreaming[] = "x-accept-response-streaming";
const size_t kXAcceptResponseStreamingLength =
    sizeof(kXAcceptResponseStreaming) - 1;
const char kXAcceptResponseStreaming_True[] = "true";
const size_t kXAcceptResponseStreaming_True_Length =
    sizeof(kXAcceptResponseStreaming_True) - 1;

// The frontend protocols supported by GRPC-Web gateway.
enum Protocol {
  UNKNOWN = 0,
  GRPC,
  GRPC_WEB,
  GRPC_WEB_TEXT,
  JSON_STREAM_BODY,
  PROTO_STREAM_BODY,
  B64_PROTO_STREAM_BODY,
  PROTO,
  B64_PROTO,
};
}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_RUNTIME_CONSTANTS_H_
