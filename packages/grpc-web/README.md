# gRPC-Web Client Runtime Library

gRPC-Web provides a Javascript library that lets browser clients access a gRPC
service. You can find out much more about gRPC in its own
[website](https://grpc.io).

The current release is a Beta release, and we expect to announce
General-Availability by Oct. 2018.

gRPC-Web clients connect to gRPC services via a special gateway proxy: the
current version of the library uses [Envoy](https://www.envoyproxy.io/) by
default, in which gRPC-Web support is built-in. 

In the future, we expect gRPC-Web to be supported in language-specific Web
frameworks, such as Python, Java, and Node. See the
[roadmap](https://github.com/grpc/grpc-web/blob/master/ROADMAP.md) doc.


## Quick Start

This example is using the `echo.proto` file from the
[Echo Example](https://github.com/grpc/grpc-web/tree/master/net/grpc/gateway/examples/echo).

1. Add `grpc-web` as a dependency using `npm`.

```sh
$ npm i grpc-web
```

2. Compile the `protoc-gen-grpc-web` protoc plugin.

```sh
$ git clone https://github.com/grpc/grpc-web
$ cd grpc-web && sudo make install-plugin
```

3. Generate your proto messages and the service client stub classes with
`protoc` and the `protoc-gen-grpc-web` plugin. You can set the `import_style`
option for both `--js_out` and `--grpc-web_out` to `commonjs`.

```sh
$ protoc -I=$DIR echo.proto \
--js_out=import_style=commonjs:generated \
--grpc-web_out=import_style=commonjs,mode=grpcwebtext:generated
```

4. Start using your generated client!

```js
const {EchoServiceClient} = require('./generated/echo_grpc_pb.js');
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
$ docker-compose up echo-server envoy commonjs-client
```

Open a browser tab, and go to:

```
http://localhost:8081/echotest.html
```


## Run Tests

Pre-requisites:
 - `protoc`
 - `protoc-gen-grpc-web` plugin


```sh
$ npm test
```
