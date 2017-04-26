This guide will go into more details on how to run and access a gRPC service in
the browser. We will try to define an `EchoService` as seen from this
directory.


## Define the Service

Here we will define our `EchoService` in a file called
[`echo.proto`](echo.proto). For more information about protocol buffers and
proto3 syntax, please see the [protobuf documentation][].



## Implement gRPC Backend Server

For this example, we implement the backend gRPC `EchoServer` to handle client
requests using C++. See the file [`echo_server.cc`](echo_server.cc) for
details.

You can implement the server in any language supported by gRPC. Please see
the [gRPC website][] for more details.



## Configure the gRPC Nginx Gateway

For this example, we will use the gRPC Nginx gateway to both serve static
content and forward the gRPC request to the backend server.

To serve static content, we just need a simple block like this:

```
  server {
    listen 8080;
    root /var/www/html;
    location / {
    }
  }
```

To forward the gRPC requests to the backend server, we need a block like
this:

```
  server {
    listen 9091;
    server_name localhost;
    location / {
      grpc_pass localhost:9090;
    }
  }
```

You can see the file [`nginx.conf`](nginx.conf) to see the complete config.
We also added some CORS setup to make sure the browser can request
cross-origin content.


In this simple example, the HTML and JS assets will be served from port
`:8080`. The HTML will make a gRPC request to port `:9091`. Nginx will
forward the request to the backend gRPC server listening on port `:9090`.



## Generate JS messages and client stub


To generate JS message classes from our `echo.proto`, you can run this:

```sh
$ protoc -I=. --js_out=import_style=closure,binary:. ./echo.proto
```

The `import_style` option passed to the `--js_out` flag makes sure the
generated files will have closure style `goog.require` statements as well
as serialize/deserialize methods for the binary protobuf format.

For dependencies that we will need later, you will also need to generate
message JS files for the following protos:
```
third_party/protobuf/src/google/protobuf/any.proto
net/grpc/gateway/protos/stream_body.proto
net/grpc/gateway/protos/pair.proto
```


To generate the client stub, you will first need the gRPC Web protoc plugin.
To compile the plugin `protoc-gen-grpc-web`, you can run this:

```sh
$ cd ~/grpc-web
$ cd javascript/net/grpc/web
$ make
```

To generate the client stub JS file, you can now run this command:

```sh
$ protoc -I=. --plugin=protoc-gen-grpc-web=<path to plugin> \
  --grpc-web_out=out=echo.grpc.pb.js,mode=base64:. ./echo.proto
```

Specifically, the format for the `--grpc-web_out` param is

```sh
--grpc-web_out=out=<filename>,mode=base64:<output dir>
```

This will generate the client stub in the file `echo.grpc.pb.js`.


## Compile the JS library


Finally, we can compile all the relevant JS files into one single JS library
that can be used in the browser, using the [Closure compiler][]

```sh
$ cd ~/grpc-web
$ ./third_party/closure-library/closure/bin/build/closurebuilder.py \
  --root=./javascript \
  --root=./net \
  --root=./third_party/closure-library \
  --root=./third_party/protobuf/js \
  --namespace="proto.grpc.gateway.testing.EchoServiceClient" \
  --output_mode=compiled \
  --compiler_jar=./closure-compiler.jar > compiled.js
```

You can add as many `--root` parameters as you like so that the Closure
compiler can find all the source .js files. Or you can have an additional steps
to move all the relevant .js file into one directory first.

In the end, you will have one single `compiled.js` file that can be sourced
from your HTML file.


## Write client JS code


Connecting everything above together, here is how you can call your gRPC
service from javascript from the browser.

First, load the compiled JS library

```
<script type="text/javascript" src="compiled.js">
```

Then, you can create the service client.

```js
    var service = new proto.grpc.gateway.testing.EchoServiceClient(
        'http://localhost:9091');
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

You can see the entire example in the sample [`echotest.html`](echotest.html)
file.


[protobuf documentation]:https://developers.google.com/protocol-buffers/
[gRPC website]:http://grpc.io
[Closure compiler]:https://developers.google.com/closure/compiler/
