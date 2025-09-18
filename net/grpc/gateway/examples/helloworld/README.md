# gRPC-Web Hello World Guide

This guide is intended to help you get started with gRPC-Web with a simple
Hello World example. For more information about the gRPC-Web project as a
whole, please visit the [main repo](https://github.com/grpc/grpc-web).

All the code for this example can be found in this current directory.

```sh
$ cd net/grpc/gateway/examples/helloworld
```

## Define the Service

First, let's define a gRPC service using
[protocol buffers](https://developers.google.com/protocol-buffers/). Put this
in the `helloworld.proto` file. Here we define a request message, a response
message, and a service with one RPC method: `SayHello`.

```protobuf
syntax = "proto3";

package helloworld;

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
}

message HelloRequest {
  string name = 1;
}

message HelloReply {
  string message = 1;
}
```

## Implement the Service

Then, we need to implement the gRPC Service. In this example, we will use
NodeJS. Put this in a `server.js` file. Here, we receive the client request,
and we can access the message field via `call.request.name`. Then we construct
a nice response and send it back to the client via `callback(null, response)`.

```js
var PROTO_PATH = __dirname + '/helloworld.proto';

var assert = require('assert');
var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
var protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
var helloworld = protoDescriptor.helloworld;

function doSayHello(call, callback) {
  callback(null, {
    message: 'Hello! ' + call.request.name
  });
}

function getServer() {
  var server = new grpc.Server();
  server.addService(helloworld.Greeter.service, {
    sayHello: doSayHello,
  });
  return server;
}

if (require.main === module) {
  var server = getServer();
  server.bindAsync(
    '0.0.0.0:9090', grpc.ServerCredentials.createInsecure(), (err, port) => {
      assert.ifError(err);
      server.start();
  });
}

exports.getServer = getServer;
```

## Configure the Proxy

Next up, we need to configure the Envoy proxy to forward the browser's gRPC-Web
requests to the backend. Put this in an `envoy.yaml` file. Here we configure
Envoy to listen at port `:8080`, and forward any gRPC-Web requests to a
cluster at port `:9090`.

```yaml
static_resources:
  listeners:
    - name: listener_0
      address:
        socket_address: { address: 0.0.0.0, port_value: 8080 }
      filter_chains:
        - filters:
          - name: envoy.filters.network.http_connection_manager
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
              codec_type: auto
              stat_prefix: ingress_http
              route_config:
                name: local_route
                virtual_hosts:
                  - name: local_service
                    domains: ["*"]
                    routes:
                      - match: { prefix: "/" }
                        route:
                          cluster: greeter_service
                          max_stream_duration:
                            grpc_timeout_header_max: 0s
                    cors:
                      allow_origin_string_match:
                        - prefix: "*"
                      allow_methods: GET, PUT, DELETE, POST, OPTIONS
                      allow_headers: keep-alive,user-agent,cache-control,content-type,content-transfer-encoding,custom-header-1,x-accept-content-transfer-encoding,x-accept-response-streaming,x-user-agent,x-grpc-web,grpc-timeout
                      max_age: "1728000"
                      expose_headers: custom-header-1,grpc-status,grpc-message
              http_filters:
                - name: envoy.filters.http.grpc_web
                  typed_config:
                    "@type": type.googleapis.com/envoy.extensions.filters.http.grpc_web.v3.GrpcWeb
                - name: envoy.filters.http.cors
                  typed_config:
                    "@type": type.googleapis.com/envoy.extensions.filters.http.cors.v3.Cors
                - name: envoy.filters.http.router
                  typed_config:
                    "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
  clusters:
    - name: greeter_service
      connect_timeout: 0.25s
      type: logical_dns
      # HTTP/2 support
      typed_extension_protocol_options:
        envoy.extensions.upstreams.http.v3.HttpProtocolOptions:
          "@type": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions
          explicit_http_config:
            http2_protocol_options: {}
      lb_policy: round_robin
      load_assignment:
        cluster_name: cluster_0
        endpoints:
          - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: 0.0.0.0
                    port_value: 9090
```

> NOTE: As per [this issue](https://github.com/grpc/grpc-web/issues/436): if
> you are running Docker on Mac/Windows, change the last `address: 0.0.0.0` to
>
> ```yaml
>     ...
>     socket_address:
>         address: host.docker.internal
> ```
>
> or if your version of Docker on Mac is older than v18.03.0, change it to:
>
> ```yaml
>     ...
>     socket_address:
>         address: docker.for.mac.localhost
> ```

> NOTE: As per
> [Envoy - Envoy Networking](ttps://www.envoyproxy.io/docs/envoy/latest/start/quick-start/run-envoy#envoy-networking),
> if your environment does not enable IPv6, enable only IPv4 in the cluster
> by adding the `dns_lookup_family: V4_ONLY` field:
>
> ```yaml
>     ...
>     clusters:
>       - name: greeter_service
>       dns_lookup_family: V4_ONLY
> ```

## Write Client Code

Now, we are ready to write some client code! Put this in a `client.js` file.

```js
const {HelloRequest, HelloReply} = require('./helloworld_pb.js');
const {GreeterClient} = require('./helloworld_grpc_web_pb.js');

var client = new GreeterClient('http://localhost:8080');

var request = new HelloRequest();
request.setName('World');

client.sayHello(request, {}, (err, response) => {
  console.log(response.getMessage());
});
```

The classes `HelloRequest`, `HelloReply` and `GreeterClient` we import here are
generated for you by the `protoc` generator utility (which we will cover in the
next section) from the `helloworld.proto` file we defined earlier.

Then we instantiate a `GreeterClient` instance, set the field in the
`HelloRequest` protobuf object, and we can make a gRPC call via
`client.sayHello()`, just like how we defined in the `helloworld.proto` file.


You will need a `package.json` file. This is needed for both the `server.js` and
the `client.js` files.

```json
{
  "name": "grpc-web-simple-example",
  "version": "0.1.0",
  "description": "gRPC-Web simple example",
  "main": "server.js",
  "devDependencies": {
    "@grpc/grpc-js": "~1.0.5",
    "@grpc/proto-loader": "~0.5.4",
    "async": "~1.5.2",
    "google-protobuf": "~3.21.4",
    "grpc-web": "~2.0.2",
    "lodash": "~4.17.0",
    "webpack": "~5.82.1",
    "webpack-cli": "~5.1.1"
  }
}
```

And finally a simple `index.html` file.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>gRPC-Web Example</title>
<script src="./dist/main.js"></script>
</head>
<body>
  <p>Open up the developer console and see the logs for the output.</p>
</body>
</html>
```

The `./dist/main.js` file will be generated by `webpack` (which will be covered
in the next section).


And that's it! We have all the code ready. Let's run the example!

## Generate Protobuf Messages and Client Service Stub

### Install Plugins

To generate the protobuf messages and client service stub class from your
`.proto` definitions, we need:
 - the `protoc` binary, _and_
 - the `protoc-gen-js` binary, _and_
 - the `protoc-gen-grpc-web` plugin.

Follow the instructions [here](https://github.com/grpc/grpc-web?tab=readme-ov-file#code-generator-plugins)
if you don't have them installed already.

### Generating stubs

When you have both `protoc`, `protoc-gen-js`, and `protoc-gen-grpc-web`
installed, you can now run this command:

```sh
$ protoc -I=. helloworld.proto \
  --js_out=import_style=commonjs:. \
  --grpc-web_out=import_style=commonjs,mode=grpcwebtext:.
```

After the command runs successfully, you should now see two new files generated
in the current directory:

 - `helloworld_pb.js`: this contains the `HelloRequest` and `HelloReply`
   classes
 - `helloworld_grpc_web_pb.js`: this contains the `GreeterClient` class

These are also the 2 files that our `client.js` file imported earlier in the
example.

## Compile the Client JavaScript Code

Next, we need to compile the client side JavaScript code into something that
can be consumed by the browser.

```sh
$ npm install
$ npx webpack ./client.js
```

Here we use `webpack` and give it an entry point `client.js`. You can also use
`browserify` or other similar tools. This will resolve all the `require()`
statements and produce a `./dist/main.js` file that can be embedded in our
`index.html` file.

## Run the Example!

We are ready to run the Hello World example. The following set of commands will
run the 3 processes all in the background.

 1. Run the NodeJS gRPC Service. This listens at port `:9090`.

 ```sh
 $ node server.js &
 ```

 2. Run the Envoy proxy. The `envoy.yaml` file configures Envoy to listen to
 browser requests at port `:8080`, and forward them to port `:9090` (see
 above).

 ```sh
 $ docker run -d -v "$(pwd)"/envoy.yaml:/etc/envoy/envoy.yaml:ro \
     --network=host envoyproxy/envoy:v1.22.0
 ```

> NOTE: As per [this issue](https://github.com/grpc/grpc-web/issues/436):
> if you are running Docker on Mac/Windows, remove the `--network=host` option:
>
> ```sh
> $ docker run -d -v "$(pwd)"/envoy.yaml:/etc/envoy/envoy.yaml:ro \
>     -p 8080:8080 -p 9901:9901 envoyproxy/envoy:v1.22.0
>  ```

 3. Run the simple Web Server. This hosts the static file `index.html` and
 `dist/main.js` we generated earlier.

 ```sh
 $ python3 -m http.server 8081 &
 ```

When these are all ready, you can open a browser tab and navigate to

```
localhost:8081
```

Open up the developer console and you should see the following printed out:

```
Hello! World
```
