ROOT_DIR := $(shell pwd)

all: clean

plugin:
	cd "$(ROOT_DIR)"/javascript/net/grpc/web && make

install-plugin:
	cd "$(ROOT_DIR)"/javascript/net/grpc/web && make install

clean:
	cd "$(ROOT_DIR)"/javascript/net/grpc/web && make clean
	cd "$(ROOT_DIR)"
