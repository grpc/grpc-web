# gRPC-Web for browser (HTML) clients

Due to browser limitation, gRPC-Web supports a different transport
than the [HTTP/2 based gRPC protocol](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md).
The difference between the gRPC-Web
protocol and the HTTP/2 based gRPC protocol is specified in the [gRPC repo](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md). 

In addition to the wire-transport spec, gRPC-Web also supports features that are unique to browser (HTML) clients.
This document is the official spec for those features. As the Web platform evolves,
we expect some of those features will evolve too or become deprecated.

# CORS support

* Should follow the [CORS spec](https://developer.mozilla.org/en-US/docs/Web/HTTP/Server-Side_Access_Control)
  * Access-Control-Allow-Credentials to allow Authorization headers
  * Access-Control-Allow-Methods to allow POST and (preflight) OPTIONS only
  * Access-Control-Allow-Headers to whatever the preflight request carries
* The client library may support header overwrites to avoid preflight
  * https://github.com/whatwg/fetch/issues/210
* CSP support to be specified

# More to be added
