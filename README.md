## Overview

Provided as a Javascript client library, gRPC Web allows a browser/HTML client
to use the same API as a Node client to access a grpc service. While grpc-web
speaks a different protocol than the native grpc (over http/2) protocol, the
end-to-end semantics is identicial to what a native grpc client (e.g. a Node
client) experiences.

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
