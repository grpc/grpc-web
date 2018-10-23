# gRPC-Web features for browser (HTML) clients

Due to browser limitation, gRPC-Web supports a different transport
than the [HTTP/2 based gRPC protocol](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md).
The difference between the gRPC-Web
protocol and the HTTP/2 based gRPC protocol is specified in the core gRPC repo as [PROTOCOL-WEB](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md). 

In addition to the wire-transport spec, gRPC-Web also supports features that are unique to browser (HTML) clients.
This document is the official spec for those features. As the Web platform evolves,
we expect some of those features will evolve too or become deprecated.

# CORS support

* Should follow the [CORS spec](https://developer.mozilla.org/en-US/docs/Web/HTTP/Server-Side_Access_Control)
  * Access-Control-Allow-Credentials to allow Authorization headers
  * Access-Control-Allow-Methods to allow POST and (preflight) OPTIONS only
  * Access-Control-Allow-Headers to whatever the preflight request carries
* The client library is expected to support header overwrites to avoid preflight
  * https://github.com/whatwg/fetch/issues/210
* CSP support to be specified

# HTTP status code mapping

A grpc-web gateway is recommended to overwrite the default 200 status code and map any gateway-generated or server-generated error status to standard HTTP status codes (such as 503) when it is possible. This will help with debugging and may also improve security protection for web apps.

# Security

* XSRF, XSS policy to be published 

# Compression

* Full-body compression is supported and expected for all unary
requests/responses. The compression/decompression will be done
by browsers, using standard Content-Encoding headers
  * “grpc-encoding” header is not used
  * SDCH, Brotli will be supported
* Message-level compression for streamed requests/responses is not supported
because manual compression/decompression is prohibitively expensive using JS
