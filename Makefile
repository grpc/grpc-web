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
	--with-ld-opt="-L /usr/local/lib -lgrpc++ -lgrpc -lprotobuf -lpthread -ldl -lrt" \
	--with-openssl=$(ROOT_DIR)/third_party/openssl \
	--add-module=$(ROOT_DIR)/net/grpc/gateway/nginx

nginx_config_with_gateway:
	cd $(NGINX_DIR)/src && auto/configure --with-http_ssl_module \
	--with-http_v2_module \
	--with-cc-opt="-I /usr/local/include -I $(ROOT_DIR)" \
	--with-ld-opt="-L $(ROOT_DIR)/objs -lgateway -L /usr/local/lib -lgrpc++ -lgrpc -lprotobuf -lpthread -ldl -lrt" \
	--with-openssl=$(ROOT_DIR)/third_party/openssl \
	--add-module=$(ROOT_DIR)/net/grpc/gateway/nginx

NGINX_H_FILES := $(wildcard $(NGINX_DIR)/src/src/**/*.h) $(wildcard $(NGINX_DIR)/src/objs/**/*.h)
NGINX_C_FILES := $(wildcard $(NGINX_DIR)/src/src/**/*.c)

GRPC_GATEWAY_CC_FILES := $(wildcard net/grpc/gateway/*.cc) \
	$(wildcard net/grpc/gateway/backend/*.cc) \
	$(wildcard net/grpc/gateway/codec/*.cc) \
	$(wildcard net/grpc/gateway/frontend/*.cc) \
	$(wildcard net/grpc/gateway/runtime/*.cc) \
	net/grpc/gateway/protos/pair.pb.cc \
	net/grpc/gateway/protos/status.pb.cc

GRPC_GATEWAY_H_FILES := $(wildcard net/grpc/gateway/backend/*.h) \
        $(wildcard net/grpc/gateway/codec/*.h) \
        $(wildcard net/grpc/gateway/frontend/*.h) \
        $(wildcard net/grpc/gateway/runtime/*.h) \
        $(wildcard net/grpc/gateway/*.h) \
	net/grpc/gateway/protos/pair.pb.h \
	net/grpc/gateway/protos/status.pb.h

GRPC_GATEWAY_OBJ_FILES := $(addprefix objs/,$(patsubst net/grpc/gateway/%.cc,%.o,$(GRPC_GATEWAY_CC_FILES)))

LD_FLAGS := -L/usr/local/lib -lgrpc++ -lgrpc -lprotobuf -lpthread -ldl
CC_FLAGS := -pthread -std=c++11 -I. \
	-I /usr/local/include \
	-I $(NGINX_DIR)/src/src/os/unix \
	-I $(NGINX_DIR)/src/objs \
	-I $(NGINX_DIR)/src/src \
	-I $(NGINX_DIR)/src/src/core \
	-I $(NGINX_DIR)/src/src/event \
	-I $(NGINX_DIR)/src/src/http \
	-I $(NGINX_DIR)/src/src/http/modules \
	-I $(NGINX_DIR)/src/src/http/v2 \
	-I $(NGINX_DIR)/src/src/mail \
	-I $(NGINX_DIR)/src/src/misc \
	-I $(NGINX_DIR)/src/src/stream

nginx: nginx_config protos grpc_gateway nginx_config_with_gateway
	cd $(NGINX_DIR)/src && make

grpc_gateway: $(GRPC_GATEWAY_OBJ_FILES)
	ar crf $(ROOT_DIR)/objs/libgateway.a $(GRPC_GATEWAY_OBJ_FILES)

objs/%.o: $(ROOT_DIR)/net/grpc/gateway/%.cc
	mkdir -p $(dir $@)
	$(CC) -c $(CC_FLAGS) -o $@ $<

package: nginx
	mkdir -p $(ROOT_DIR)/gConnector/conf
	cp $(ROOT_DIR)/third_party/nginx/src/conf/* $(ROOT_DIR)/gConnector/conf
	cp $(ROOT_DIR)/net/grpc/gateway/nginx/package/nginx.conf $(ROOT_DIR)/gConnector/conf
	cp $(ROOT_DIR)/net/grpc/gateway/nginx/package/nginx.sh $(ROOT_DIR)/gConnector
	cp $(ROOT_DIR)/third_party/nginx/src/objs/nginx $(ROOT_DIR)/gConnector
	zip gConnector.zip gConnector
	
