CC := g++
ROOT_DIR := /github/grpc-web
PROTOS_DIR := $(ROOT_DIR)/net/grpc/gateway/protos

all: package

protos:
	protoc --proto_path=$(PROTOS_DIR) $(PROTOS_DIR)/pair.proto --cpp_out=$(PROTOS_DIR)
	protoc --proto_path=$(PROTOS_DIR) $(PROTOS_DIR)/status.proto --cpp_out=$(PROTOS_DIR)

NGINX_DIR := third_party/nginx

nginx_config:
	cd $(NGINX_DIR)/src && auto/configure --with-http_ssl_module \
	--with-http_v2_module \
	--with-cc-opt="-I /usr/local/include -I $(ROOT_DIR)" \
	--with-ld-opt="-L /usr/local/lib -lgrpc++ -lgrpc -lprotobuf -lpthread -ldl -lrt -lstdc++ -lm" \
	--with-openssl=$(ROOT_DIR)/third_party/openssl \
	--add-module=$(ROOT_DIR)/net/grpc/gateway/nginx

nginx: protos nginx_config
	cd $(NGINX_DIR)/src && make

package: nginx
	mkdir -p $(ROOT_DIR)/gConnector/conf
	cp $(ROOT_DIR)/third_party/nginx/src/conf/* $(ROOT_DIR)/gConnector/conf
	cp $(ROOT_DIR)/net/grpc/gateway/nginx/package/nginx.conf $(ROOT_DIR)/gConnector/conf
	cp $(ROOT_DIR)/net/grpc/gateway/nginx/package/nginx.sh $(ROOT_DIR)/gConnector
	cp $(ROOT_DIR)/third_party/nginx/src/objs/nginx $(ROOT_DIR)/gConnector
	zip -r gConnector.zip gConnector/*
