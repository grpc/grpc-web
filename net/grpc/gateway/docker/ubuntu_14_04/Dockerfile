FROM ubuntu:14.04
RUN apt-get update && apt-get install -y \
  autoconf \
  automake \
  build-essential \
  curl \
  git \  
  libtool \
  libpcre3 \
  libpcre3-dev \
  libssl-dev \
  make \
  python-software-properties \
  software-properties-common \
  zip
COPY . /github/grpc-web
RUN cd /github/grpc-web && git submodule update --init
RUN cd /github/grpc-web/third_party/openssl && git checkout tags/OpenSSL_1_0_2h -f
RUN cd /github/grpc-web/third_party/protobuf && ./autogen.sh && ./configure && make && make install && ldconfig
RUN cd /github/grpc-web/third_party/grpc &&  export EMBED_OPENSSL=false && git submodule update --init && make && make install
RUN cd /github/grpc-web && make
