This document shows you how to install gRPC-Web and the necessary
pre-requisites.

## Pre-requisites

* Ubuntu

```sh
$ sudo apt-get install autoconf automake build-essential curl git \
  default-jdk default-jre libtool libpcre3-dev libssl-dev make wget zip
```

* MacOS

```sh
$ brew install autoconf automake libtool pcre
```

## Clone the repo

```sh
$ git clone https://github.com/grpc/grpc-web
$ cd grpc-web && git submodule update --init

$ cd third_party/grpc
$ git submodule update --init
```

## 1. Install Protobuf

From the repo root directory:

```sh
$ cd third_party/grpc/third_party/protobuf
$ ./autogen.sh && ./configure && make
$ sudo make install
```


## 2. Install gRPC

Note: Since gRPC-Web is still in Beta, the version of gRPC required is
sensitive to upstream changes. You most likely will need to build from
the `master` branch.

From the repo root directory:

```sh
$ cd third_party/grpc
$ make
$ sudo make install

# On MacOS Sierra or above, you might need to run this command first
# export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:<path-to-repo>/third_party/grpc/libs/opt
```

## 3. Download the Closure compiler

From the repo root directory:

```sh
$ wget http://dl.google.com/closure-compiler/compiler-latest.zip -O compiler-latest.zip
$ unzip -p -qq -o compiler-latest.zip *.jar > closure-compiler.jar
```

Make sure `closure-compiler.jar` is put in the repo root directory after the
above steps.


## Build!

From the repo root directory:

```sh
$ make         # build the nginx gateway

# On MacOS Sierra or above, you might need to run this instead
# KERNEL_BITS=64 make
```


For more example on how to build the client and an end-to-end example, please
see [this page](net/grpc/gateway/examples/echo).
