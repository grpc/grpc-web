# gRPC-Web Client Runtime Library

gRPC-Web provides a Javascript library that lets browser clients access a gRPC
service. You can find out much more about gRPC in its own
[website](https://grpc.io).

gRPC-Web is now Generally Available, and considered stable enough for production use.

gRPC-Web clients connect to gRPC services via a special gateway proxy: the
current version of the library uses [Envoy](https://www.envoyproxy.io/) by
default, in which gRPC-Web support is built-in.

In the future, we expect gRPC-Web to be supported in language-specific Web
frameworks, such as Python, Java, and Node. See the
[roadmap](https://github.com/grpc/grpc-web/blob/master/doc/roadmap.md) doc.


## Quick Start

This example is using the `echo.proto` file from the
[Echo Example](https://github.com/grpc/grpc-web/tree/master/net/grpc/gateway/examples/echo).

 1. Add `grpc-web` as a dependency using `npm`.

```sh
$ npm i grpc-web
```

 2. Download `protoc` and the `protoc-gen-grpc-web` protoc plugin.

You can download the `protoc` binary from the official
[protocolbuffers](https://github.com/protocolbuffers/protobuf/releases)
release page.

You can download the `protoc-gen-grpc-web` protoc plugin from our Github
[release](https://github.com/grpc/grpc-web/releases) page.


Make sure they are both executable and are discoverable from your PATH.


 3. Generate your proto messages and the service client stub classes with
`protoc` and the `protoc-gen-grpc-web` plugin. You can set the
`import_style=commonjs` option for both `--js_out` and `--grpc-web_out`.

```sh
$ protoc -I=$DIR echo.proto \
--js_out=import_style=commonjs:generated \
--grpc-web_out=import_style=commonjs,mode=grpcwebtext:generated
```

 4. Start using your generated client!

```js
const {EchoServiceClient} = require('./generated/echo_grpc_web_pb.js');
const {EchoRequest} = require('./generated/echo_pb.js');

const client = new EchoServiceClient('localhost:8080');

const request = new EchoRequest();
request.setMessage('Hello World!');

const metadata = {'custom-header-1': 'value1'};

client.echo(request, metadata, (err, response) => {
  // ...
});
```


## What's Next

To complete the example, you need to run a proxy that understands the
[gRPC-Web protocol](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md#protocol-differences-vs-grpc-over-http2)
between your browser client and your gRPC service. The default proxy currently
is [Envoy](https://www.envoyproxy.io/). Please visit our
[Github repo](https://github.com/grpc/grpc-web) for more information.

Here's a quick way to get started!

```sh
$ git clone https://github.com/grpc/grpc-web
$ cd grpc-web
$ docker-compose up node-server envoy commonjs-client
```

Open a browser tab, and go to:

```
http://localhost:8081/echotest.html
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
  (err: grpcWeb.RpcError, response: EchoResponse) => {
    console.log(response.getMessage());
  });
call.on('status', (status: grpcWeb.Status) => {
  // ...
});
```

See a full TypeScript example
[here](https://github.com/grpc/grpc-web/blob/master/net/grpc/gateway/examples/echo/ts-example/client.ts).


## Run Tests

Pre-requisites:
 - `protoc`
 - `protoc-gen-grpc-web` plugin


```sh
$ npm test
```
