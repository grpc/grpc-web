## Build and Run an Echo example

This page will show you how to quickly build and run an end-to-end Echo
example. The example has 3 key components:

 - Front-end JS client
 - Nginx gateway
 - gRPC backend server (written in C++)


## Before you start

Before you start, ensure that you have the following installed exactly as per
our [pre-requisites](../../../../../INSTALL.md):

 1. Protocol buffers
 2. gRPC
 3. Closure compiler
 
 
## Build the example

From the repo root directory:

```sh
$ make                          # build nginx
# on MacOS, you might have to do this instead
# KERNEL_BITS=64 make

$ make example                  # build end-to-end example
$ sudo make install-example
```

## Run the example

1. Run the gRPC backend server (written in C++)

```sh
$ cd net/grpc/gateway/examples/echo && ./echo_server &
```

2. Run the gRPC Nginx Gateway

```sh
$ cd gConnector && ./nginx.sh &
```

3. Open a browser tab, and Inspect
```
http://<hostname>:8080/net/grpc/gateway/examples/echo/echotest.html
```


## What's next?

For more details about how you can run your own gRPC service and access it
from the browser, please see this [tutorial](tutorial.md)
