## Build and Run an Echo example

This page will show you how to quickly build and run an end-to-end Echo
example. The example has 3 key components:

 - Front-end JS client
 - Nginx gateway
 - gRPC backend server (written in C++)


## Before you start

You need the following 3 things before you start:

 1. Protobuf
 2. gRPC
 3. Closure compiler
 
Click [here](#pre-requisites) or scroll down to see some details on how to
install those.
 
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


## Pre-requisites

* Ubuntu

```sh
$ sudo apt-get install autoconf automake build-essential curl git \
  default-jdk default-jre libtool libpcre3 libpcre3-dev libssl-dev \
  make wget zip
```

* MacOS

```sh
$ brew install autoconf automake libtool pcre
```

## Clone the repo

```sh
$ git clone git@github.com:grpc/grpc-web.git
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

From the repo root directory:

```sh
$ cd third_party/grpc
$ EMBED_OPENSSL=false make
$ sudo EMBED_OPENSSL=false make install

# On MacOS Sierra or above, you might need to run these 2 commands instead
# EMBED_OPENSSL=false CPPFLAGS=-DOSATOMIC_USE_INLINED=1 make
# sudo EMBED_OPENSSL=false CPPFLAGS=-DOSATOMIC_USE_INLINED=1 make install
```

## 3. Download the Closure compiler

From the repo root directory:

```sh
$ wget http://dl.google.com/closure-compiler/compiler-latest.zip -O compiler-latest.zip
$ unzip -p -qq -o compiler-latest.zip *.jar > closure-compiler.jar
```

Make sure `closure-compiler.jar` is put in the repo root directory after the
above steps.



## What's next?

For more details about how you can run your own gRPC service from the browser,
please see this [tutorial](tutorial.md)
