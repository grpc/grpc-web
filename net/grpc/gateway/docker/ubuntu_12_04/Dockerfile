FROM ubuntu:12.04
RUN apt-get update && apt-get install -y \
  autoconf \
  automake \
  build-essential \
  curl \
  git \
  libtool \
  make \
  python-software-properties \
  software-properties-common \
  zip
RUN add-apt-repository ppa:ubuntu-toolchain-r/test
RUN apt-get update && apt-get install -y \
  g++-4.7 \
  gcc-4.7 \
  libpcre3 \
  libpcre3-dev \
  libssl-dev
RUN update-alternatives \
  --remove gcc /usr/bin/gcc-4.6
RUN update-alternatives \
  --install /usr/bin/gcc gcc /usr/bin/gcc-4.7 60 \
  --slave /usr/bin/g++ g++ /usr/bin/g++-4.7
RUN update-alternatives \
  --install /usr/bin/gcc gcc /usr/bin/gcc-4.6 40 \
  --slave /usr/bin/g++ g++ /usr/bin/g++-4.6
COPY . /github/grpc-web
RUN cd /github/grpc-web/third_party/grpc && \
  make -j
RUN cd /github/grpc-web && \
  make
