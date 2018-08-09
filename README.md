## Overview

gRPC-Web provides a Javascript client library that lets browser clients
access a gRPC server. You can find out much more about gRPC in its own
[website](https://grpc.io).

The current release is a Beta release, and we expect to announce
General-Available by Oct. 2018.

The JS client library has been used for some time by Google and Alphabet
projects with the
[Closure compiler](https://github.com/google/closure-compiler)
and its TypeScript generator (which has not yet been open-sourced).

gRPC-Web clients connect to gRPC servers via a special gateway proxy: our
provided version uses [Envoy](https://www.envoyproxy.io/), in which
gRPC-Web support is built-in. Envoy will become the default gateway for
gRPC-Web by GA.

In the future, we expect gRPC-Web to be supported in
language-specific Web frameworks, such as Python, Java, and Node. See the
[roadmap](https://github.com/grpc/grpc-web/blob/master/ROADMAP.md) doc.

## Quick start

Try gRPC-Web and run a quick Echo example from the browser!

From the repo root directory:

```sh
$ docker-compose up echo-server envoy commonjs-client
```

Open a browser tab, and inspect

```
http://localhost:8081/echotest.html
```

## How it works

Let's take a look at how gRPC-Web works with a simple example. You can find out
how to build, run and explore the example yourself in
[Build and Run the Echo Example](net/grpc/gateway/examples/echo).

### 1. Define your service

The first step when creating any gRPC service is to define it. Like all gRPC
services, gRPC-Web uses [protocol buffers](https://developers.google.com/protocol-buffers/)
to define its RPC service methods and their message request and response types.

```
service EchoService {
  rpc Echo(EchoRequest) returns (EchoResponse);

  rpc ServerStreamingEcho(ServerStreamingEchoRequest)
      returns (stream ServerStreamingEchoResponse);
}
```


### 2. Build the server

Next you need to have a gRPC server that implements the service interface and a
gateway that allows the client to connect to the server. Our example builds a
simple C++ gRPC backend server and the Envoy proxy. You can find out more in
the [Echo Example](net/grpc/gateway/examples/echo).



### 3. Write your JS client

Once the server and gateway are up and running, you can start making gRPC calls
from the browser!

Create your client

```js
var echoService = new proto.grpc.gateway.testing.EchoServiceClient(
  'http://localhost:8080');
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

## Proxy interoperability

Multiple proxies supports the gRPC-Web protocol. Currently, the default proxy
is [Envoy](https://www.envoyproxy.io), which supports gRPC-Web out of the box.

```
$ docker-compose up echo-server envoy commonjs-client
```

An alternative is to build Nginx that comes with this repository.

```
$ docker-compose up echo-server nginx commonjs-client
```

Finally, you can also try this [gRPC-Web Go Proxy](https://github.com/improbable-eng/grpc-web/tree/master/go/grpcwebproxy).

```
$ docker-compose up echo-server grpcwebproxy binary-client
```


## Client configuration options

Typically, you will run the following command to generate the client stub
from your proto definitions:

```
$ protoc -I=$DIR echo.proto \
--plugin=protoc-gen-grpc-web=/path-to/protoc-gen-grpc-web \
--js_out=import_style=commonjs:$OUT_DIR \
--grpc-web_out=import_style=commonjs,mode=grpcwebtext,out=echo_grpc_pb.js:$OUT_DIR
```


### Import style

The default generated code has [Closure](https://developers.google.com/closure/library/)
`goog.require()` import style. Pass in `import_style=closure`.

The [CommonJS](https://requirejs.org/docs/commonjs.html) style `require()` is
also supported. Pass in `import_style=commonjs`.


Note: ES6 style `import` is not supported yet.


### Wire format mode

For more information about the gRPC-Web wire format, please see the
[spec](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md#protocol-differences-vs-grpc-over-http2)
here.

The default generated code sends the payload in the `grpc-web-text` format.
Pass in `mode=grpcwebtext`.

  - `Content-type: application/grpc-web-text`
  - Payload are base64-encoded.
  - Both unary and server streaming calls are supported.

A binary protobuf format is also supported. Pass in `mode=grpcweb`.

  - `Content-type: application/grpc-web+proto`
  - Payload are in the binary protobuf format.
  - Only unary calls are supported for now.
