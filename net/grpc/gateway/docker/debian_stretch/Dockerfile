FROM debian:stretch
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
  software-properties-common \
  zip
COPY . /github/grpc-web
RUN cd /github/grpc-web/third_party/grpc && \
  make
RUN cd /github/grpc-web && \
  make
