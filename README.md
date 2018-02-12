## Overview

gRPC-Web provides a Javascript client library that enables browser clients to
access a gRPC server.

The current release is an Alpha release, mainly for early adopters to provide
feedback on the JS API (both gRPC and Protobuf). The JS client library has been
used by Google (and Alphabet) projects with [Closure compiler](https://github.com/google/closure-compiler)
and its TypeScript generator (not yet open-sourced).

The gateway that connects the client to the server uses Nginx. However, Nginx
still doesn't support HTTP/2 (to backends) as of Q3/2017, and therefore the
gateway can't be used as a reverse proxy (for load balancing). We have also
added the gRPC-Web support to [Envoy](https://github.com/lyft/envoy). In future,
we expect gRPC-Web to be supported in language-specific Web frameworks too, such
as Go, Java, Node, which will eliminate the need to deploy a gateway.

## It's easy to get started!

The following section provides a quick introduction on how to get started on
using gRPC-Web.


### 1. Define your service

gRPC-Web uses [protocol buffers](https://developers.google.com/protocol-buffers/)
to define message types and service definition.

```
service EchoService {
  rpc Echo(EchoRequest) returns (EchoResponse);

  rpc ServerStreamingEcho(ServerStreamingEchoRequest)
      returns (stream ServerStreamingEchoResponse);
}
```


### 2. Build an example client

The following builds and runs an end-to-end example. For more details, please
see [this page](net/grpc/gateway/examples/echo). This example will build a
simple C++ gRPC backend server and the Nginx gateway.

```sh
$ make                       # build nginx gateway
$ make example               # build end-to-end example
$ sudo make install-example
```


### 3. Write your JS client

You can start making gRPC calls from the browser!

Create your client
```js
var echoService = new proto.grpc.gateway.testing.EchoServiceClient(
  'http://localhost:9091');
```
  
Make a unary RPC call
```js
var unaryRequest = new proto.grpc.gateway.testing.EchoRequest();
unaryRequest.setMessage(msg);
echoService.echo(unaryRequest, {},
  function(err, response) {
    console.log(response.getMessage());
  });
```

Server-side streaming is supported!
```js
var stream = echoService.serverStreamingEcho(streamRequest, {});
stream.on('data', function(response) {
  console.log(response.getMessage());
});
```
