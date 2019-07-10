## Overview

gRPC-Web provides a Javascript library that lets browser clients access a gRPC
service. You can find out much more about gRPC in its own
[website](https://grpc.io).

gRPC-Web is now Generally Available, and considered stable enough for production
use.

gRPC-Web clients connect to gRPC services via a special gateway proxy: the
current version of the library uses [Envoy](https://www.envoyproxy.io/) by
default, in which gRPC-Web support is built-in.

In the future, we expect gRPC-Web to be supported in language-specific Web
frameworks, such as Python, Java, and Node. See the
[roadmap](https://github.com/grpc/grpc-web/blob/master/ROADMAP.md) doc.


## Quick Start Guide: Hello World

You can follow the [Hello World Guide][] to get started with gRPC-Web quickly.

From the guide, you will learn how to
 - Define your service using protocol buffers
 - Implement a simple gRPC Service using NodeJS
 - Configure the Envoy proxy
 - Generate protobuf message classes and client service stub for the client
 - Compile all the JS dependencies into a static library that can be consumed
   by the browser easily

## Advanced Demo: Browser Echo App

You can also try to run a more advanced Echo app from the browser with a
streaming example.

From the repo root directory:

```sh
$ docker-compose pull
$ docker-compose up
```

Open a browser tab, and go to:

```
http://localhost:8081/echotest.html
```

To shutdown: `docker-compose down`.

## Runtime Library

The gRPC-Web runtime library is available at `npm`:

```sh
$ npm i grpc-web
```


## Code Generator Plugin

You can download the `protoc-gen-grpc-web` protoc plugin from our
[release](https://github.com/grpc/grpc-web/releases) page:

If you don't already have `protoc` installed, you will have to download it
first from [here](https://github.com/protocolbuffers/protobuf/releases).

Make sure they are both executable and are discoverable from your PATH.

For example, in MacOS, you can do:

```
$ sudo mv ~/Downloads/protoc-gen-grpc-web-1.0.5-darwin-x86_64 \
  /usr/local/bin/protoc-gen-grpc-web
$ chmod +x /usr/local/bin/protoc-gen-grpc-web
```


## Client Configuration Options

Typically, you will run the following command to generate the proto messages
and the service client stub from your `.proto` definitions:

```sh
$ protoc -I=$DIR echo.proto \
--js_out=import_style=commonjs:$OUT_DIR \
--grpc-web_out=import_style=commonjs,mode=grpcwebtext:$OUT_DIR
```

You can then use Browserify, Webpack, Closure Compiler, etc. to resolve imports
at compile time.


### Import Style

`import_style=closure`: The default generated code has
[Closure](https://developers.google.com/closure/library/) `goog.require()`
import style.

`import_style=commonjs`: The
[CommonJS](https://requirejs.org/docs/commonjs.html) style `require()` is
also supported.

`import_style=commonjs+dts`: (Experimental) In addition to above, a `.d.ts`
typings file will also be generated for the protobuf messages and service stub.

`import_style=typescript`: (Experimental) The service stub will be generated
in TypeScript.

**Note: `commonjs+dts` and `typescript` only works with `--grpc-web_out=`
import style.**

### Wire Format Mode

For more information about the gRPC-Web wire format, please see the
[specification](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md#protocol-differences-vs-grpc-over-http2)
here.

`mode=grpcwebtext`: The default generated code sends the payload in the
`grpc-web-text` format.

  - `Content-type: application/grpc-web-text`
  - Payload are base64-encoded.
  - Both unary and server streaming calls are supported.

`mode=grpcweb`: A binary protobuf format is also supported.

  - `Content-type: application/grpc-web+proto`
  - Payload are in the binary protobuf format.
  - Only unary calls are supported for now.


## How It Works

Let's take a look at how gRPC-Web works with a simple example. You can find out
how to build, run and explore the example yourself in
[Build and Run the Echo Example](net/grpc/gateway/examples/echo).


### 1. Define your service

The first step when creating any gRPC service is to define it. Like all gRPC
services, gRPC-Web uses
[protocol buffers](https://developers.google.com/protocol-buffers/) to define
its RPC service methods and their message request and response types.

```protobuf
message EchoRequest {
  string message = 1;
}

...

service EchoService {
  rpc Echo(EchoRequest) returns (EchoResponse);

  rpc ServerStreamingEcho(ServerStreamingEchoRequest)
      returns (stream ServerStreamingEchoResponse);
}
```

### 2. Run the server and proxy

Next you need to have a gRPC server that implements the service interface and a
gateway proxy that allows the client to connect to the server. Our example
builds a simple Node gRPC backend server and the Envoy proxy.

For the Echo service: see the
[service implementations](https://github.com/grpc/grpc-web/blob/master/net/grpc/gateway/examples/echo/node-server/server.js).

For the Envoy proxy: see the
[config yaml file](https://github.com/grpc/grpc-web/blob/master/net/grpc/gateway/examples/echo/envoy.yaml).


### 3. Write your JS client

Once the server and gateway are up and running, you can start making gRPC calls
from the browser!

Create your client

```js
var echoService = new proto.mypackage.EchoServiceClient(
  'http://localhost:8080');
```

Make a unary RPC call

```js
var request = new proto.mypackage.EchoRequest();
request.setMessage(msg);
var metadata = {'custom-header-1': 'value1'};
var call = echoService.echo(request, metadata, function(err, response) {
  if (err) {
    console.log(err.code);
    console.log(err.message);
  } else {
    console.log(response.getMessage());
  }
});
call.on('status', function(status) {
  console.log(status.code);
  console.log(status.details);
  console.log(status.metadata);
});
```

Server-side streaming is supported!

```js
var stream = echoService.serverStreamingEcho(streamRequest, metadata);
stream.on('data', function(response) {
  console.log(response.getMessage());
});
stream.on('status', function(status) {
  console.log(status.code);
  console.log(status.details);
  console.log(status.metadata);
});
stream.on('end', function(end) {
  // stream end signal
});
```

You can find a more in-depth tutorial from
[this page](https://github.com/grpc/grpc-web/blob/master/net/grpc/gateway/examples/echo/tutorial.md).

## Setting Deadline

You can set a deadline for your RPC by setting a `deadline` header. The value
should be a Unix timestamp, in milliseconds.

```js
var deadline = new Date();
deadline.setSeconds(deadline.getSeconds() + 1);

client.sayHelloAfterDelay(request, {deadline: deadline.getTime()},
  (err, response) => {
    // err will be populated if the RPC exceeds the deadline
    ...
  });
```

## TypeScript Support

The `grpc-web` module can now be imported as a TypeScript module. This is
currently an experimental feature. Any feedback welcome!

When using the `protoc-gen-grpc-web` protoc plugin, mentioned above, pass in
either:

 - `import_style=commonjs+dts`: existing CommonJS style stub + `.d.ts` typings
 - `import_style=typescript`: full TypeScript output

```ts
import * as grpcWeb from 'grpc-web';
import {EchoServiceClient} from './echo_grpc_web_pb';
import {EchoRequest, EchoResponse} from './echo_pb';

const echoService = new EchoServiceClient('http://localhost:8080', null, null);

const request = new EchoRequest();
request.setMessage('Hello World!');

const call = echoService.echo(request, {'custom-header-1': 'value1'},
  (err: grpcWeb.Error, response: EchoResponse) => {
    console.log(response.getMessage());
  });
call.on('status', (status: grpcWeb.Status) => {
  // ...
});
```

See a full TypeScript example
[here](https://github.com/grpc/grpc-web/blob/master/net/grpc/gateway/examples/echo/ts-example/client.ts).

## Proxy Interoperability

Multiple proxies supports the gRPC-Web protocol. Currently, the default proxy
is [Envoy](https://www.envoyproxy.io), which supports gRPC-Web out of the box.

```sh
$ docker-compose up -d node-server envoy commonjs-client
```

An alternative is to build Nginx that comes with this repository.

```sh
$ docker-compose -f advanced.yml up -d echo-server nginx closure-client
```

You can also try this
[gRPC-Web Go Proxy](https://github.com/improbable-eng/grpc-web/tree/master/go/grpcwebproxy).

```sh
$ docker-compose -f advanced.yml up -d node-server grpcwebproxy binary-client
```

## Acknowledgement

Big thanks to the following contributors for making significant contributions to
this project!

* [zaucy](https://github.com/zaucy): NPM package, CommonJS
* [yannic](https://github.com/yannic): Bazel
* [mitar](https://github.com/mitar): Codegen enhancements
* [juanjoDiaz](https://github.com/juanjoDiaz): Codegen enhancements
* [pumano](https://github.com/pumano): Doc fixes
* [henriiik](https://github.com/henriiik): TypeScript
* [rybbchao](https://github.com/rybbchao): Codgen bugfix
* [mjduijn](https://github.com/mjduijn): Timeout example
* [at-ishikawa](https://github.com/at-ishikawa): Codegen enhancements
* [weilip](https://github.com/weilip): Codegen bugfix
* [mitchdraft](https://github.com/mitchdraft): Update Node example
* [factuno-db](https://github.com/factuno-db): Bazel, Closure
* [shaxbee](https://github.com/shaxbee): Codegen enhancements and bugfixes


[Hello World Guide]:https://github.com/grpc/grpc-web/blob/master/net/grpc/gateway/examples/helloworld/
