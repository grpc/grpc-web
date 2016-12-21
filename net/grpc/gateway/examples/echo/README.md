## Overview

Provided as a Javascript client library, gRPC Web allows a browser/HTML client
to use the same API as a Node client to access a grpc service. While grpc-web
speaks a different protocol than the native grpc (over http/2) protocol, the
end-to-end semantics is identicial to what a native grpc client (e.g. a Node
client) experiences.

## Status

Alpha

## Pre-requisites

* Ubuntu 14.04

```sh
$ sudo apt-get install autoconf automake build-essential curl git \
  default-jdk default-jre libtool libpcre3 libpcre3-dev libssl-dev \
  make wget zip
```

* Clone the repo

```sh
$ git clone git@github.com:grpc/grpc-web.git
$ cd grpc-web && git submodule update --init
```

* Install gRPC

```sh
$ cd third_party/grpc && git submodule update --init && EMBED_OPENSSL=false make
$ cd third_party/protobuf
$ sudo make install                       # install protobuf
$ cd ../..
$ sudo EMBED_OPENSSL=false make install   # install gRPC
```

* Download the Closure compiler

```sh
$ cd grpc-web
$ wget http://dl.google.com/closure-compiler/compiler-latest.zip -O compiler-latest.zip
$ unzip -p -qq -o compiler-latest.zip *.jar > closure-compiler.jar
```

## Build the example

```sh
$ cd grpc-web && make example
$ sudo make install-example
```

## Run the example

* Run the gRPC backend server (written in C++)

```sh
$ cd grpc-web/net/grpc/gateway/examples/echo && ./echo_server &
```

* Run the gRPC Nginx Gateway

```sh
$ cd grpc-web/gConnector && ./nginx.sh &
```

* Open a browser tab, and Inspect
```
http://<hostname>:8080/net/grpc/gateway/examples/echo/echotest.html
```


## What's next?

For more details about how you can run your own gRPC service from the browser,
please see this [tutorial](tutorial.md)
