## Overview

Provided as a Javascript client library, gRPC Web allows a browser/HTML client
to use the same API as a Node client to access a grpc service. While grpc-web
speaks a different protocol than the native grpc (over http/2) protocol, the
end-to-end semantics is identicial to what a native grpc client (e.g. a Node
client) experiences.

## Pre-requisites

Use the [build scripts](https://github.com/grpc/grpc-web/blob/master/README.md)
or follow the step-by-step instruction.

* Ubuntu 14.04

```sh
$ sudo apt-get install autoconf automake build-essential curl git \
  default-jdk default-jre libtool libpcre3 libpcre3-dev libssl-dev \
  make wget zip
```

* MacOS

```sh
$ brew install autoconf automake libtool pcre
```

* Clone the repo

```sh
$ git clone git@github.com:grpc/grpc-web.git
$ cd grpc-web && git submodule update --init
```

* Install gRPC and Protobuf

```sh
$ cd third_party/grpc
$ git submodule update --init
$ cd third_party/protobuf
$ ./autogen.sh && ./configure && make
$ sudo make install                       # install protobuf
$ cd ../..
$ EMBED_OPENSSL=false make
$ sudo EMBED_OPENSSL=false make install   # install gRPC
```

On MacOS Sierra, when running `make` from the `third_party/grpc` directory,
you might have to add one more environment variable.

```sh
$ cd third_party/grpc
$ git submodule update --init
$ cd third_party/protobuf
$ ./autogen.sh && ./configure && make
$ sudo make install                       # install protobuf
$ cd ../..
$ EMBED_OPENSSL=false CPPFLAGS=-DOSATOMIC_USE_INLINED=1 make
$ sudo EMBED_OPENSSL=false CPPFLAGS=-DOSATOMIC_USE_INLINED=1 make install  # install gRPC
```

* Download the Closure compiler

From the repo root directory:

```sh
$ wget http://dl.google.com/closure-compiler/compiler-latest.zip -O compiler-latest.zip
$ unzip -p -qq -o compiler-latest.zip *.jar > closure-compiler.jar
```

If you don't have `wget` installed, you can try

```sh
$ curl http://dl.google.com/closure-compiler/compiler-latest.zip -o compiler-latest.zip
```

Make sure `closure-compiler.jar` is put in the repo root directory after the
above steps.

## Build the example

From the repo root directory:

```sh
$ make example
$ sudo make install-example
```

On MacOS, you might have to do

```sh
$ KERNEL_BITS=64 make example
$ sudo make install-example
```

## Run the example

* Run the gRPC backend server (written in C++)

```sh
$ cd net/grpc/gateway/examples/echo && ./echo_server &
```

* Run the gRPC Nginx Gateway

```sh
$ cd gConnector && ./nginx.sh &
```

* Open a browser tab, and Inspect
```
http://<hostname>:8080/net/grpc/gateway/examples/echo/echotest.html
```


## What's next?

For more details about how you can run your own gRPC service from the browser,
please see this [tutorial](tutorial.md)
