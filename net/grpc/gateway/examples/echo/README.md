## Build and Run an Echo example

This page will show you how to quickly build and run an end-to-end Echo
example. The example has 3 key components:

 - Front-end JS client
 - Envoy proxy
 - gRPC backend server (written in Node)


From the repo root directory:

## With docker-compose

```sh
$ docker-compose up --build
```

Then open a browser tab, and inspect:
````
http://localhost:8081
```

## Run the gRPC Backend server

This compiles the gRPC backend server, written in Node, and listens on port
9090.

```sh
$ docker build -t grpcweb/node-server --target=node-server .
$ docker run -d -p 9090:9090 --name node-server grpcweb/node-server
```

## Run the Envoy proxy

This step runs the Envoy proxy, and listens on port 8080. Any gRPC-Web browser
requests will be forwarded to port 9090.

```sh
$ docker build -t grpcweb/envoy --target=envoy .
$ docker run -d -p 8080:8080 --link node-server:node-server grpcweb/envoy
```

## Serve static JS/HTML contents

This steps compiles the front-end gRPC-Web client into a static .JS file, and
we use a simple server to serve up the JS/HTML static contents.

```sh
$ docker build -t grpcweb/commonjs-client --target=commonjs-client .
$ docker run -d -p 8081:8081 grpcweb/commonjs-client
```

## Run the example from your browser

Finally, open a browser tab, and inspect

```
http://localhost:8081
```

## What's next?

For more details about how you can run your own gRPC service and access it
from the browser, please see this [tutorial](tutorial.md)
