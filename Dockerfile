
# BUILD:
#   docker build -t grpc-web .
#
# RUN:
#   start the container:
#      docker run -itdp 8080:8080 -p 9091:9091 --name grpc-web grpc-web /bin/bash
#
#   start nginx:
#      docker exec -itp 8080:8080 -p 9091:9091 grpc-web /grpc-web/gConnector/nginx.sh
#
#   start the grpc server:
#      docker exec -it grpc-web /grpc-web/net/grpc/gateway/examples/echo/echo_server
FROM ubuntu:latest as install

COPY ./ /grpc-web

RUN apt-get update && apt-get install -y \
  autoconf \
  automake \
  build-essential \
  curl \
  git \
  default-jdk \
  default-jre \
  libtool \
  libpcre3 \
  libpcre3-dev \
  libssl-dev \
  make \
  python-software-properties \
  software-properties-common \
  zip

# Stage 2 init git submodules
RUN cd /grpc-web && \
  ./init_submodules.sh

# Stage 3 build the libraries
RUN cd /grpc-web/third_party/grpc/third_party/protobuf && \
  ./autogen.sh && ./configure && make && make install

RUN cd /grpc-web/third_party/grpc && \
  ldconfig && \
  EMBED_OPENSSL=false make && \
  EMBED_OPENSSL=false make install

# Stage 4: closure compiler and build example
RUN cd /grpc-web && \
  curl http://dl.google.com/closure-compiler/compiler-latest.zip -o compiler-latest.zip && \
  unzip -p -qq -o compiler-latest.zip *.jar > closure-compiler.jar && \
  make example && \
  make install-example
