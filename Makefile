CC := g++
ROOT_DIR := net/grpc/gateway
PROTOS_DIR := $(ROOT_DIR)/protos

protos:
        protoc $(PROTOS_DIR)/pair.proto --cpp_out=.
        protoc $(PROTOS_DIR)/status.proto --cpp_out=.

NGINX_DIR := third_party/nginx

nginx_config:
	$(NGINX_DIR)/src/auto/configure --with-http_ssl_module \
	--with-cc-opt="\
	-I /usr/local/include \
	-I $(ROOT_DIR) \
	-I $(ROOT_DIR)/backend \
	-I $(ROOT_DIR)/codec \
	-I $(ROOT_DIR)/frontend \
	-I $(ROOT_DIR)/runtime \
	" \
	--with-ld-opt="-L /usr/local/lib -lgrpc++ -lgrpc -lprotobuf -lpthread -ldl" \
	--add-module=$(ROOT_DIR)/nginx

NGINX_H_FILES := $(wildcard $(NGINX_DIR)/src/src/**/*.h) $(wildcard $(NGINX_DIR)/src/objs/**/*.h)
NGINX_C_FILES := $(wildcard $(NGINX_DIR)/src/src/**/*.c)

GRPC_GATEWAY_CC_FILES := $(wildcard net/grpc/gateway/*.cc) \
	$(wildcard net/grpc/gateway/backend/*.cc) \
	$(wildcard net/grpc/gateway/codec/*.cc) \
	$(wildcard net/grpc/gateway/frontend/*.cc) \
	$(wildcard net/grpc/gateway/runtime/*.cc)

GRPC_GATEWAY_H_FILES := $(wildcard net/grpc/gateway/backend/*.h) \
        $(wildcard net/grpc/gateway/codec/*.h) \
        $(wildcard net/grpc/gateway/frontend/*.h) \
        $(wildcard net/grpc/gateway/runtime/*.h) \
        $(wildcard net/grpc/gateway/*.h)

GRPC_GATEWAY_OBJ_FILES := $(addprefix objs/,$(patsubst $(ROOT_DIR)/%.cc,%.o,$(GRPC_GATEWAY_CC_FILES)))

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

nginx: nginx_config

grpc_gateway: $(GRPC_GATEWAY_OBJ_FILES)

objs/%.o: $(ROOT_DIR)/%.cc
	mkdir -p $(dir $@)
	$(CC) -c $(CC_FLAGS) -o $@ $<
