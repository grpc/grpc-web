CC := g++
PROTOS_DIR := net/grpc/gateway/protos

protos:
        protoc $(PROTOS_DIR)/pair.proto --cpp_out=.
        protoc $(PROTOS_DIR)/status.proto --cpp_out=.

NGINX_DIR := third_party/nginx

nginx_config:
	$(NGINX_DIR)/src/auto/configure --with-http_ssl_module

NGINX_H_FILES := $(wildcard $(NGINX_DIR)/src/src/**/*.h) $(wildcard $(NGINX_DIR)/src/objs/**/*.h)
NGINX_C_FILES := $(wildcard $(NGINX_DIR)/src/src/**/*.c)

GRPC_GATEWAY_CC_FILES := $(wildcard net/grpc/gateway/backend/*.cc) \
	$(wildcard net/grpc/gateway/codec/*.cc) \
	$(wildcard net/grpc/gateway/frontend/*.cc) \
	$(wildcard net/grpc/gateway/runtime/*.cc) \
	$(wildcard net/grpc/gateway/*.cc)

GRPC_GATEWAY_H_FILES := $(wildcard net/grpc/gateway/backend/*.h) \
        $(wildcard net/grpc/gateway/codec/*.h) \
        $(wildcard net/grpc/gateway/frontend/*.h) \
        $(wildcard net/grpc/gateway/runtime/*.h) \
        $(wildcard net/grpc/gateway/*.h)

GRPC_GATEWAY_OBJ_FILES := $(addprefix objs/,$(notdir $(GRPC_GATEWAY_CC_FILES:.cc=.o)))

LD_FLAGS :=
CC_FLAGS := -std=c++11 -I. \
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

#main: $(GRPC_GATEWAY_OBJ_FILES)
#   $(CC) $(LD_FLAGS) -o $@ $^

grpc_gateway.o: protos
	$(CC) $(CC_FLAGS) $(GRPC_GATEWAY_CC_FILES) $(GRPC_GATEWAY_H_FILES) -o $@

