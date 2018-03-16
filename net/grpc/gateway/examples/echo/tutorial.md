This tutorial provides a detailed guide on how to run a gRPC service and access
it in the browser.


## Define the Service

The first step when creating a gRPC service is to define the service methods
and their request and response message types using protocol buffers. In this
example, we define our `EchoService` in a file called
[`echo.proto`](echo.proto). For more information about protocol buffers and
proto3 syntax, please see the [protobuf documentation][].


## Implement gRPC Backend Server

Next, we implement our EchoService interface using C++ in the backend gRPC
`EchoServer`. This will handle requests from clients. See the file
[`echo_server.cc`](echo_server.cc) for details.

You can implement the server in any language supported by gRPC. Please see
the [gRPC website][] for more details.



## Configure the gRPC Nginx Gateway

In this example, we will use the gRPC Nginx gateway to both serve static
content and forward the gRPC request to the backend server. You can see the
complete config file in [nginx.conf](./nginx.conf)

To serve static content, we just need a simple block like this:

```
  server {
    listen 8080;
    server_name localhost;
    location ~ \.(html|js)$ {
      root /var/www/html;
    }
  }
```

To forward the gRPC requests to the backend server, we need a block like
this:

```
  server {
    listen 8080;
    server_name localhost;
    location / {
      grpc_pass localhost:9090;
    }
  }
```

We also add some CORS setup to make sure the browser can request cross-origin
content.


In this simple example, the HTML and JS assets are served from port `:8080`.
The HTML makes gRPC requests to same port `:8080`. Nginx forwards the request
to the backend gRPC server listening on port `:9090`.



## Generate JS messages and client stub


To generate JS message classes from our `echo.proto`, run the following
command:

```sh
$ protoc -I=. --js_out=import_style=closure,binary:. ./echo.proto
```

The `import_style` option passed to the `--js_out` flag makes sure the
generated files will have closure style `goog.require` statements as well
as serialize/deserialize methods for the binary protobuf format.

For dependencies that we will need later, you also need to generate
message JS files for the following protos using the same syntax:
```
third_party/protobuf/src/google/protobuf/any.proto
net/grpc/gateway/protos/stream_body.proto
net/grpc/gateway/protos/pair.proto
```


To generate the client stub, first you need the gRPC Web protoc plugin.
To compile the plugin `protoc-gen-grpc-web`, run this command:

```sh
$ cd ~/grpc-web
$ cd javascript/net/grpc/web
$ make
```

To generate the client stub JS file, now run this command:

```sh
$ protoc -I=. --plugin=protoc-gen-grpc-web=<path to plugin> \
  --grpc-web_out=out=echo.grpc.pb.js,mode=grpcweb:. ./echo.proto
```

The format for the `--grpc-web_out` param is

```sh
--grpc-web_out=out=<filename>,mode=grpcweb:<output dir>
```

Our command generates the client stub in the file `echo.grpc.pb.js`.


## Compile the JS library


Finally, we can compile all the relevant JS files into one single JS library
that can be used in the browser, using the [Closure compiler][]

```sh
$ cd ~/grpc-web
$ java \
  -jar ./closure-compiler.jar \
  --js ./javascript \
  --js ./net \
  --js ./third_party/closure-library \
  --js ./third_party/protobuf/js \
  --entry_point=goog:proto.grpc.gateway.testing.EchoServiceClient \
  --dependency_mode=STRICT \
  --js_output_file compiled.js
```

You can add as many `--root` parameters as you like so that the Closure
compiler can find all the source .js files. Or you can have an additional steps
to move all the relevant .js file into one directory first.

In the end, you will have one single `compiled.js` file that can be sourced
from your HTML file.


## Write client JS code


Connecting everything together, here's how to call your gRPC
service from Javascript from the browser. You can see the entire example in the
sample [echotest.html](./echotest.html) file.

First, load the compiled JS library

```
<script type="text/javascript" src="compiled.js">
```

Then create the service client.

```js
    var service = new proto.grpc.gateway.testing.EchoServiceClient(
        'http://localhost:8080');
```


Here's how you can call a simple unary RPC method:

```js
    var unary_request = new proto.grpc.gateway.testing.EchoRequest();
    unary_request.setMessage('foo_unary');

    service.Echo(unary_request, {}, function(err, response) {
      console.log('Unary echo response: ' + response.getMessage());
    });
```

Here's how you can call a server streaming RPC method:

```js
    var stream_request =
      new proto.grpc.gateway.testing.ServerStreamingEchoRequest();
    stream_request.setMessage('foo_stream');
    stream_request.setMessageCount(5);
    stream_request.setMessageInterval(200);

    var stream = service.ServerStreamingEcho(stream_request,
                                             {'Custom-Header-1':'initial'});
    var i = 0;
    stream.on('data', function(response) {
      console.log('Server streaming response: '+response.getMessage()+
                  ' '+(i++));
    });
```


[protobuf documentation]:https://developers.google.com/protocol-buffers/
[gRPC website]:http://grpc.io
[Closure compiler]:https://developers.google.com/closure/compiler/
