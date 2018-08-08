# gRPC-Web

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
provided version uses [Envoy](https://github.com/envoyproxy/envoy), in which
gRPC-Web support is built-in. Envoy will become the default gateway for
gRPC-Web by GA.

In the future, we expect gRPC-Web to be supported in
language-specific Web frameworks, such as Python, Java, and Node. See the
[roadmap](https://github.com/grpc/grpc-web/blob/master/ROADMAP.md) doc.

## Quick start

This example is using the `echo.proto` file from the [Echo Example](https://github.com/grpc/grpc-web/tree/master/net/grpc/gateway/examples/echo).

1. Add `grpc-web` as a dependency using `npm` or `yarn`.

    ```shell
    npm i grpc-web
    ```

    ```shell
    yarn add grpc-web
    ```

2. Generate your client with `protoc` and the `protoc-gen-grpc-web` plugin. To install the plugin, clone the `grpc/grpc-web` repository` and run `make plugin`. Make sure you set the import_style for both `js_out` and `grpc-web_out` to **commonjs**. It is also important that both your js and grpc-web output to the same directory.

    ```shell
    protoc echo.proto --js_out=import_style=commonjs:generated --grpc-web_out=import_style=commonjs,mode=grpcwebtext,out=echo_grpc_pb.js:generated --plugin=protoc-gen-grpc-web=PATH_TO_grpc-web_REPOSITORY/javascript/net/grpc/web/protoc-gen-grpc-web
    ```

3. Start using your generated client!

    ```js
    const {EchoRequest} = require('./generated/echo_pb.js');
    const {EchoServiceClient} = require('./generated/echo_grpc_pb.js');

    const client = new EchoServiceClient('localhost:9090');

    const request = new EchoRequest();
    request.setMessage('Hello World!');

    client.echo(request, {}, (err, response) => {
      // ...
    });
    ```
