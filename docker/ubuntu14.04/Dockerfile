FROM ubuntu:14.04
RUN apt-get update && apt-get install -y \
	autoconf \
	automake \
	build-essential \
	curl \
	git \
	libpcre3 \
	libpcre3-dev \
	libssl-dev \
	libtool \
	make \
	python-software-properties \
	software-properties-common \
	unzip \
	vim \
	zip
COPY .. /github/grpc-web
RUN cd /github/grpc-web/third_party/protobuf && ./autogen.sh && ./configure && make && make install && ldconfig
RUN cd /github/grpc-web/third_party/grpc &&  export EMBED_OPENSSL=false && git submodule update --init && make && make install
