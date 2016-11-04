## Overview

gRPC-Web provides a Javascript client library that enables browser clients to
access a gRPC server.

The current release is an alpha release, mainly for early adopters to provide
feedback on the JS API (both gRPC and Protobuf). The JS client library
and the gateway that connects the client to the server are subject to change
and will be upgraded frequently.

We expect to ship a beta version in Q1/2017, which will implement an
official protocol spec for supporting Web clients. Stay tuned!

For questions, please file an issue or contact varuntalwar@google.com.

## Build

gRPC-Web supports build on following platforms:

1. Ubuntu 12.04
  1. Install docker.
  2. run ./ubuntu\_12\_04.sh
  3. build result is available in net/grpc/gateway/docker/ubuntu\_12\_04 folder
 as gConnector.zip and gConnector_static.zip.
2. Ubuntu 14.04
  1. Install docker.
  2. run ./ubuntu\_14\_04.sh
  3. build result is available in net/grpc/gateway/docker/ubuntu\_14\_04 folder
 as gConnector.zip and gConnector_static.zip.
3. Mac OS X
  1. Install brew.
  2. brew install autoconf automake libtool pcre
  3. run ./darwin\_x86\_64.sh
  4. build result is available in the root folder as gConnector.zip and
 gConnector_static.zip.
