# Protocol Specification

## Background (grpc-web)

Provided as a JS client library, grpc-web allows a browser/HTML client to use the same API as a Node client to access a grpc service.
While grpc-web speaks a different protocol than the native grpc (over http/2) protocol, the end-to-end semantics is identicial to 
what a native grpc client (e.g. a Node client) experiences.

## Overview (protobuf-rpc)

Protobuf-RPC is a simple RPC protocol that sends/receives Protocol Buffers (protobuf) over HTTP (of any version).

This protocol is officially named as “Protobuf-RPC” following the convention of well-known RPC protocols, such as JSON-RPC, XML-RPC. 
It uses a fixed URL mapping for the RPC methods, and uses the Content-Type “application/x-protobuf” (MIME type) 
for the request and response messages.

## Specification

### URL
    /$rpc/google.pubsub.v1.Topics/CreateTopic

### HTTP Methods

By default, POST is used. Other methods are allowed, following standard HTTP semantics.
* GET (HEAD) may be issued for cacheable responses. 
* PUT may be used for issuing idempotent requests.

### HTTP Body

Content-type is always "application/x-protobuf", which represents the protobuf message that the RPC end-point generates or consumes.

When the request or response is a streamed request or response, a protobuf "array" is defined as following for the entire body.

```
syntax = "proto3";
package google.rpc;
import "google/rpc/status.proto";

// StreamBody represents the request or response of a streamed RPC method
// when the RPC method is invoked over a byte-stream L7 protocol such as HTTP.
message StreamBody {
  // Each message is a byte array which contains a serialized protobuf message.
  repeated bytes messages = 1;

  // An optional status which is sent when a stream is closed.
  google.rpc.Status status = 2;

  // Opaque binary data not to be consumed or produced by the application.
  // Noop messages may be generated as base64 padding (for browsers) or
  // as a way to keep the connection alive. Its tag-id is reserved as the
  // maximum value allowed for a single-byte tag-id
  repeated bytes noop = 15;
}
```

When streaming is involved, "Content-Transfer-Encoding: base64" has to be set for the base64-encoded response body. 
Otherwise, base64 encoding of the request or response body is optional.

### Response Status

200 for success responses. 

To be published: canonical mapping of google.rpc.Status code to HTTP status code.

### CORS

CORS needs be supported. 

It is also possible to bypass CORS preflight (to be published: we have a proposal under discussion with whatwg folks).

### HTTP Caching

Encode request body as $req URL parameter to enable caching with a GET request.
