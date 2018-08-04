## Build and Run an Echo example

This page will show you how to quickly build and run an end-to-end Echo
example. The example has 3 key components:

 - Front-end JS client
 - Envoy proxy
 - gRPC backend server (written in C++)


## Before you start

Before you start, ensure that you have the following installed exactly as per
our [pre-requisites](../../../../../INSTALL.md):

 1. Protocol buffers
 2. gRPC
 3. Closure compiler


From the repo root directory:

## Build pre-requisites

This step compiles gRPC and Protobuf, and serves as the base docker image for
the subsequent docker images.

```sh
$ docker build -t grpc-web:prereqs \
  -f net/grpc/gateway/docker/prereqs/Dockerfile .
```

## Run the gRPC Backend server

This compiles the gRPC backend server, written in C++, and listens on port
9090.

```sh
$ docker build -t grpc-web:echo-server \
  -f net/grpc/gateway/docker/echo_server/Dockerfile .
$ docker run -d -p 9090:9090 --name echo-server grpc-web:echo-server
```

## Run the Envoy proxy

This step runs the Envoy proxy, and listens on port 8080. Any gRPC-Web browser
requests will be forwarded to port 9090.

```sh
$ docker build -t grpc-web:envoy \
  -f net/grpc/gateway/docker/envoy/Dockerfile .
$ docker run -d -p 8080:8080 --link echo-server:echo-server grpc-web:envoy
```

## Serve static JS/HTML contents

This steps compiles the front-end gRPC-Web client into a static .JS file, and
we use a simple server to serve up the JS/HTML static contents.

```sh
$ docker build -t grpc-web:closure-client \
  -f net/grpc/gateway/docker/closure-client/Dockerfile .
$ docker run -d -p 80:80 grpc-web:closure-client
```

## Run the example from your browser

Finally, open a browser tab, and inspect

```
http://localhost/net/grpc/gateway/examples/echo/echotest.html
```

## What's next?

For more details about how you can run your own gRPC service and access it
from the browser, please see this [tutorial](tutorial.md)
