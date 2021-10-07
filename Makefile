ROOT_DIR := $(shell pwd)

all: clean

plugin:
	cd "$(ROOT_DIR)"/javascript/net/grpc/web/generator && make

install-plugin:
	cd "$(ROOT_DIR)"/javascript/net/grpc/web/generator && make install

clean:
	cd "$(ROOT_DIR)"/javascript/net/grpc/web/generator && make clean
	cd "$(ROOT_DIR)"
