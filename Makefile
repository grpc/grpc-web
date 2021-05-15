ROOT_DIR := $(shell pwd)

all: clean

plugin:
	cd "$(ROOT_DIR)"/javascript/net/grpc/web && make

install-plugin:
	cd "$(ROOT_DIR)"/javascript/net/grpc/web && make install

client:
	cd "$(ROOT_DIR)"/net/grpc/gateway/examples/echo && make client

install-example:
	cd "$(ROOT_DIR)"/net/grpc/gateway/examples/echo && make install

clean:
	cd "$(ROOT_DIR)"/net/grpc/gateway/examples/echo && make clean
	cd "$(ROOT_DIR)"/javascript/net/grpc/web && make clean
	cd "$(ROOT_DIR)"
