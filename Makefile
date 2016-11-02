OS := $(shell uname)
CC := g++
ROOT_DIR := $(shell pwd)
PROTOS_DIR := $(ROOT_DIR)/net/grpc/gateway/protos

all: package package_static

protos:
	protoc --proto_path="$(PROTOS_DIR)" "$(PROTOS_DIR)/pair.proto" \
		--cpp_out="$(PROTOS_DIR)"
	protoc --proto_path="$(PROTOS_DIR)" "$(PROTOS_DIR)/status.proto" \
		--cpp_out="$(PROTOS_DIR)"

NGINX_DIR := third_party/nginx
NGINX_LD_OPT := -L /usr/local/lib -lgrpc++ -lgrpc -lprotobuf -lpthread \
	-ldl -lrt -lstdc++ -lm
ifeq ($(OS), Darwin)
NGINX_LD_OPT := -L /usr/local/lib -lgrpc++ -lgrpc -lprotobuf -lpthread \
	-lstdc++ -lm
endif

NGINX_STATIC_LD_OPT := -L /usr/local/lib -l:libgrpc++.a -l:libgrpc.a \
	-l:libprotobuf.a -lpthread -ldl -lrt -lstdc++ -lm
ifeq ($(OS), Darwin)
NGINX_STATIC_LD_OPT := $(NGINX_LD_OPT)
endif

nginx_config:
	cd "$(NGINX_DIR)/src" && auto/configure --with-http_ssl_module \
	--with-http_v2_module \
	--with-cc-opt="-I /usr/local/include -I $(ROOT_DIR)" \
	--with-ld-opt="$(NGINX_LD_OPT)" \
	--with-openssl="$(ROOT_DIR)/third_party/openssl" \
	--add-module="$(ROOT_DIR)/net/grpc/gateway/nginx"

nginx_config_static:
	cd "$(NGINX_DIR)/src" && auto/configure --with-http_ssl_module \
	--with-http_v2_module \
	--with-cc-opt="-I /usr/local/include -I $(ROOT_DIR)" \
	--with-ld-opt="$(NGINX_STATIC_LD_OPT)" \
	--with-openssl="$(ROOT_DIR)/third_party/openssl" \
	--add-module="$(ROOT_DIR)/net/grpc/gateway/nginx"

nginx: protos nginx_config
	cd "$(NGINX_DIR)/src" && make

nginx_static: protos nginx_config_static
	cd "$(NGINX_DIR)/src" && make

package: nginx
	mkdir -p $(ROOT_DIR)/gConnector/conf
	cp "$(ROOT_DIR)"/third_party/nginx/src/conf/* "$(ROOT_DIR)"/gConnector/conf
	cp "$(ROOT_DIR)"/net/grpc/gateway/nginx/package/nginx.conf \
		"$(ROOT_DIR)"/gConnector/conf
	cp "$(ROOT_DIR)"/net/grpc/gateway/nginx/package/nginx.sh \
		"$(ROOT_DIR)"/gConnector
	cp "$(ROOT_DIR)"/third_party/nginx/src/objs/nginx \
		"$(ROOT_DIR)"/gConnector
	zip -r gConnector.zip gConnector/*

package_static: nginx_static
	mkdir -p "$(ROOT_DIR)"/gConnector_static/conf
	cp "$(ROOT_DIR)"/third_party/nginx/src/conf/* \
		"$(ROOT_DIR)"/gConnector_static/conf
	cp "$(ROOT_DIR)"/net/grpc/gateway/nginx/package/nginx.conf \
		"$(ROOT_DIR)"/gConnector_static/conf
	cp "$(ROOT_DIR)"/net/grpc/gateway/nginx/package/nginx.sh \
		"$(ROOT_DIR)"/gConnector_static
	cp "$(ROOT_DIR)"/third_party/nginx/src/objs/nginx \
		"$(ROOT_DIR)"/gConnector_static
	zip -r gConnector_static.zip gConnector_static/*

plugin:
	cd "$(ROOT_DIR)"/javascript/net/grpc/web && make

example: nginx plugin
	cd "$(ROOT_DIR)"/net/grpc/gateway/examples/echo && make

install-example:
	cd "$(ROOT_DIR)"/net/grpc/gateway/examples/echo && make install

clean:
	rm -rf objs gConnector gConnector_static third_party/nginx/src/objs \
		third_party/openssl/.openssl
	rm -f gConnector.zip gConnector_static.zip "$(PROTOS_DIR)"/*.pb.cc \
		"$(PROTOS_DIR)"/*.pb.h third_party/nginx/src/Makefile
	cd "$(ROOT_DIR)"/net/grpc/gateway/examples/echo && make clean
	cd "$(ROOT_DIR)"/javascript/net/grpc/web && make clean
