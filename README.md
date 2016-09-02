## Overview

Provided as a Javascript client library, gRPC Web allows a browser/HTML client
to use the same API as a Node client to access a grpc service. While grpc-web
speaks a different protocol than the native grpc (over http/2) protocol, the
end-to-end semantics is identicial to what a native grpc client (e.g. a Node
client) experiences.

This gRPC Web library supports server streaming and simple unary calls across
all major browsers. The client library has proto3 support and uses the
protobuf binary format. It also provides a generated code surface for your
service stub via a protoc plugin.

The gRPC Nginx gateway will do the gRPC protocol translation to the backend.
It can serve as a reverse proxy for both your HTTP and gRPC traffic.

## Key features

* JS library with code generation with Node API and proto3 support
* Server streaming and unary calls across all major browsers
* Client works over any HTTP versions
* Closure-based JS library compilation is supported
* Nginx based reverse proxy for both HTTP and gRPC traffic
* Cross-origin (CORS) support (without preflight)

## Status

Alpha

## Pre-requisites

* Protobuf v3.0.0+
* gRPC v1.0.0+
* Docker (dev dependency)

## Build the Nginx gateway

```sh
$ ./build.sh
```

## Example

Please go to the [examples][] directory to see how you can run a demo service.

## Known gaps / issues

* Limited platform/OS support, for the Nginx gateway
* No performance or load testing
* No client-streaming or bidi-streaming support
* Limited documentation
* CORS preflight bypass to be added

[examples]:https://github.com/grpc/grpc-web/tree/master/net/grpc/gateway/examples/echo
