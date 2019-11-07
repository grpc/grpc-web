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

var grpc = require('grpc');
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
  server.bind('0.0.0.0:9090', grpc.ServerCredentials.createInsecure());
  server.start();
}

exports.getServer = getServer;
```

## Configure the Proxy

Next up, we need to configure the Envoy proxy to forward the browser's gRPC-Web
requests to the backend. Put this in an `envoy.yaml` file. Here we configure
Envoy to listen at port `:8080`, and forward any gRPC-Web requests to a
cluster at port `:9090`.

```yaml
admin:
  access_log_path: /tmp/admin_access.log
  address:
    socket_address: { address: 0.0.0.0, port_value: 9901 }

static_resources:
  listeners:
  - name: listener_0
    address:
      socket_address: { address: 0.0.0.0, port_value: 8080 }
    filter_chains:
    - filters:
      - name: envoy.http_connection_manager
        config:
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
                  max_grpc_timeout: 0s
              cors:
                allow_origin:
                - "*"
                allow_methods: GET, PUT, DELETE, POST, OPTIONS
                allow_headers: keep-alive,user-agent,cache-control,content-type,content-transfer-encoding,custom-header-1,x-accept-content-transfer-encoding,x-accept-response-streaming,x-user-agent,x-grpc-web,grpc-timeout
                max_age: "1728000"
                expose_headers: custom-header-1,grpc-status,grpc-message
          http_filters:
          - name: envoy.grpc_web
          - name: envoy.cors
          - name: envoy.router
  clusters:
  - name: greeter_service
    connect_timeout: 0.25s
    type: logical_dns
    http2_protocol_options: {}
    lb_policy: round_robin
    hosts: [{ socket_address: { address: localhost, port_value: 9090 }}]
```

NOTE: As per [this issue](https://github.com/grpc/grpc-web/issues/436): if
you are running Docker on Mac/Windows, change the last line to

```yaml
    ...
    hosts: [{ socket_address: { address: host.docker.internal, port_value: 9090 }}]
```

or if your version of Docker on Mac older then v18.03.0, change it to:

```yaml
    ...
    hosts: [{ socket_address: { address: docker.for.mac.localhost, port_value: 9090 }}]
```

To run Envoy (for later), you will need a simple Dockerfile. Put this in a
`envoy.Dockerfile`.

```dockerfile
FROM envoyproxy/envoy:latest
COPY ./envoy.yaml /etc/envoy/envoy.yaml
CMD /usr/local/bin/envoy -c /etc/envoy/envoy.yaml
```

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
  "devDependencies": {
    "@grpc/proto-loader": "^0.3.0",
    "google-protobuf": "^3.6.1",
    "grpc": "^1.15.0",
    "grpc-web": "^1.0.0",
    "webpack": "^4.16.5",
    "webpack-cli": "^3.1.0"
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
</body>
</html>
```

The `./dist/main.js` file will be generated by `webpack` (which will be covered
in the next section).


And that's it! We have all the code ready. Let's run the example!

## Generate Protobuf Messages and Client Service Stub

To generate the protobuf messages and client service stub class from your
`.proto` definitions, we need the `protoc` binary and the
`protoc-gen-grpc-web` plugin.

You can download the `protoc-gen-grpc-web` protoc plugin from our
[release](https://github.com/grpc/grpc-web/releases) page:

If you don't already have `protoc` installed, you will have to download it
first from [here](https://github.com/protocolbuffers/protobuf/releases).

Make sure they are both executable and are discoverable from your PATH.

For example, in MacOS, you can do:

```
$ sudo mv ~/Downloads/protoc-gen-grpc-web-1.0.7-darwin-x86_64 \
  /usr/local/bin/protoc-gen-grpc-web
$ chmod +x /usr/local/bin/protoc-gen-grpc-web
```

When you have both `protoc` and `protoc-gen-grpc-web` installed, you can now
run this command:

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
$ npx webpack client.js
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
 $ docker build -t helloworld/envoy -f ./envoy.Dockerfile .
 $ docker run -d -p 8080:8080 -p 9901:9901 --network=host helloworld/envoy
 ```

NOTE: As per [this issue](https://github.com/grpc/grpc-web/issues/436):
if you are running Docker on Mac/Windows, remove the `--network=host` option:

 ```sh
 ...
 $ docker run -d -p 8080:8080 helloworld/envoy
 ```

 3. Run the simple Web Server. This hosts the static file `index.html` and
 `dist/main.js` we generated earlier.

 ```sh
 $ python2 -m SimpleHTTPServer 8081 &
 ```

 or for Python 3.x

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

You can also browse to the envoy admin via
```
localhost:9901
```
