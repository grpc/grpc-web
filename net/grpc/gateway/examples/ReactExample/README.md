# gRPC-Web React Guide


This guide is intended to help you get started with gRPC-Web with a simple
Hello World example. For more information about the gRPC-Web project as a
whole, please visit the [main repo](https://github.com/grpc/grpc-web).

All the code for this example can be found in this current directory.

```sh
$ cd net/grpc/gateway/examples/ReactExample
```

## Define the Service

First, let's define a gRPC service using
[protocol buffers](https://developers.google.com/protocol-buffers/). Put this
in the `todo.proto` file. Here we define a request message, a response
message, and a service with one RPC method: `Todo`.In HelloRequest we have `Todo ID` and `Todo`
In HelloReply we are returning `Todo Id` and `Todo` in React Client.

```protobuf
syntax = "proto3";

package todoPackage;

service Greeter {
  rpc Todo (HelloRequest) returns (HelloReply);
}

message HelloRequest {
  int32 id = 1;
  string todo = 2;
}

message HelloReply {
  int32 id = 1;
  string todo = 2;
}
```

## Implement the Service

Then, we need to implement the gRPC Service. In this example, we will use
NodeJS. Put this in a `server.js` file. Here, we receive the client request,
 Then we construct
a nice response and send it back to the client via `callback(null, {id: call.request.id,todo:call.request.todo})`.

```js
var PROTO_PATH = __dirname + '/todo.proto';

var grpc = require('grpc');
var _ = require('lodash');
var async = require('async');
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
var todoPackage = protoDescriptor.todoPackage;

function addTodo(call, callback) {
  // call.request.id and call.request.todo are coming from React-Client
  callback(null, {id: call.request.id,todo:call.request.todo});
  console.log('Request',call.request)
}

function getServer() {
  var server = new grpc.Server();
  server.addProtoService(todoPackage.Greeter.service, {
    Todo: addTodo,
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
                enabled: true
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

To run Envoy (for later), you will need a simple Dockerfile. Put this in a
`envoy.Dockerfile`.

```dockerfile
FROM envoyproxy/envoy:latest
COPY ./envoy.yaml /etc/envoy/envoy.yaml
CMD /usr/local/bin/envoy -c /etc/envoy/envoy.yaml
```
## React Client 
you can find gRPC client in Todo.jsx file in js folder
```onSubmit(){
     var client = new GreeterClient('http://' + window.location.hostname + ':8080',null, null);
     // simple unary call
     var request = new HelloRequest();
    //  Genrating Random Number for Single Todo
     var randomNumber = Math.floor(Math.random()*1000);
     request.setId(randomNumber);
     var todo =  this.state.todo
     request.setTodo(todo)
     client.todo(request, {}, (err, response) => {
    // In order to show List in dom I am creating Array of object getId() is my id which i have defined in todo.proto file
    console.log("Response",response) 
    var todoList = []
     var todoObj = {
         id : response.getId(),
         todo : response.getTodo()
     }
     this.setState({
         todoList:this.state.todoList.concat(todoObj)
     })
     });
    }
```
My simple `Index.html` file

```<html>
  <head>
    <meta charset="utf-8">
    <!-- Latest compiled and minified bootstrap CSS -->
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/latest/css/bootstrap.min.css">
    <title>Todo App</title>
  </head>
  <body>
    <div id="content" />
    <script src="dist/bundle.js" type="text/javascript"></script>
  </body>
</html>
```
The `./dist/main.js` file will be generated by `webpack.config.js`


And that's it! We have all the code ready. Let's run the example!

## Generate Protobuf Messages and Client Service Stub

To generate the protobuf messages and client service stub class from your
`.proto` definitions, we need the `protoc` binary and the
`protoc-gen-grpc-web` plugin. In the meantime, you will need to compile the
latter yourself. We hope to improve and streamline the process in the near
future.

```sh
$ git clone https://github.com/grpc/grpc-web
$ cd grpc-web
$ sudo make install-plugin
```

If you do not already have `protoc` installed, you may have to do this first:

```sh
$ ./scripts/init_submodules.sh
$ cd third_party/grpc/third_party/protobuf
$ ./autogen.sh && ./configure && make -j8
$ sudo make install
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

 - `todo_pb.js`: this contains the `HelloRequest` and `HelloReply`
   classes
 - `todo_grpc_web_pb.js`: this contains the `GreeterClient` class
 
 ## Compile the Client Javascript Code

Next, we need to compile the client side Javascript code into something that
can be consumed by the browser.

```sh
$ npm install
$ npm run dev-build
```

Here we use `webpack` and give it an entry point `js/index.jsx`. You can also use
`browserify` or other similar tools. This will resolve all the `require()`
statements and produce a `./dist/main.js` file that can be embedded in our
`index.html` file.

## Run the Example!

We are ready to run the React example. The following set of commands will
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
 $ docker run -d -p 8080:8080 --network=host helloworld/envoy
 ```
 
 3. Run the simple Web Server. This hosts the static file `index.html` and
 `dist/main.js` we generated earlier.
 
 ```sh
 $ python -m SimpleHTTPServer 8081 &
 ```
 
When these are all ready, you can open a browser tab and navigate to

```
localhost:8081
```

 

