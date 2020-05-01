OS := $(shell uname)
CC := g++
ROOT_DIR := $(shell pwd)
GRPC_GATEWAY_PROTOS := $(ROOT_DIR)/net/grpc/gateway/protos
PROTO_INC := $(ROOT_DIR)/third_party/grpc/third_party/protobuf/include
PROTO_SRC := $(ROOT_DIR)/third_party/grpc/third_party/protobuf/src
PROTO_LIB := $(PROTO_SRC)/.libs
PROTOC := $(PROTO_SRC)/protoc
GRPC_INC := $(ROOT_DIR)/third_party/grpc/include
GRPC_SRC := $(ROOT_DIR)/third_party/grpc
GRPC_LIB := $(ROOT_DIR)/third_party/grpc/libs/opt
ABSL_SRC := $(ROOT_DIR)/third_party/grpc/third_party/abseil-cpp

all: clean package_static

protos:
	cd "$(ROOT_DIR)" && LD_LIBRARY_PATH="$(PROTO_LIB):$(GRPC_LIB)" "$(PROTOC)" \
--proto_path="$(GRPC_GATEWAY_PROTOS)" \
--proto_path="$(PROTO_SRC)" "$(GRPC_GATEWAY_PROTOS)/pair.proto" \
--cpp_out="$(GRPC_GATEWAY_PROTOS)"
	cd "$(ROOT_DIR)" && LD_LIBRARY_PATH="$(PROTO_LIB):$(GRPC_LIB)" "$(PROTOC)" \
--proto_path="$(GRPC_GATEWAY_PROTOS)" \
--proto_path="$(ROOT_DIR)/third_party/grpc/src/proto/grpc/status" \
--proto_path="$(PROTO_SRC)" "status.proto" \
--cpp_out="$(GRPC_GATEWAY_PROTOS)"
	mkdir -p "$(ROOT_DIR)"/google/rpc
	cd "$(ROOT_DIR)" && LD_LIBRARY_PATH="$(PROTO_LIB):$(GRPC_LIB)" "$(PROTOC)" \
--proto_path="$(GRPC_GATEWAY_PROTOS)" \
--proto_path="$(ROOT_DIR)/third_party/grpc/src/proto/grpc/status" \
--proto_path="$(PROTO_SRC)" "status.proto" \
--cpp_out="$(ROOT_DIR)/google/rpc"

NGINX_DIR := third_party/nginx
NGINX_LD_OPT := -L"$(PROTO_LIB)" -L"$(GRPC_LIB)" \
-lgrpc++ -lgrpc -lprotobuf \
-labsl_str_format_internal -labsl_int128 \
-lpthread -ldl -lrt -lstdc++ -lm
ifeq ($(OS), Darwin)
NGINX_LD_OPT := -L"$(PROTO_LIB)" -L"$(GRPC_LIB)" -lgrpc++ \
-lgrpc -lprotobuf -lpthread -lstdc++ -lm
endif

NGINX_STATIC_LD_OPT := -L"$(PROTO_LIB)" -L"$(GRPC_LIB)" \
-l:libgrpc++.a -l:libgrpc.a -l:libprotobuf.a \
-labsl_str_format_internal -labsl_int128 \
-lpthread -ldl -lrt -lstdc++ -lm
ifeq ($(OS), Darwin)
NGINX_STATIC_LD_OPT := $(NGINX_LD_OPT)
endif

nginx_config:
	cd "$(NGINX_DIR)/src" && LD_LIBRARY_PATH="$(PROTO_LIB):$(GRPC_LIB)" \
	auto/configure \
	--with-http_ssl_module \
	--with-http_v2_module \
	--with-cc-opt="-I /usr/local/include -I $(ROOT_DIR) -I $(PROTO_INC) -I $(PROTO_SRC) \
-I $(GRPC_INC) -I $(GRPC_SRC) -I $(ABSL_SRC)" \
	--with-ld-opt="$(NGINX_LD_OPT)" \
	--with-openssl="$(ROOT_DIR)/third_party/openssl" \
	--add-module="$(ROOT_DIR)/net/grpc/gateway/nginx"

nginx_config_static:
	cd "$(NGINX_DIR)/src" &&  LD_LIBRARY_PATH="$(PROTO_LIB):$(GRPC_LIB)" \
	auto/configure \
	--with-http_ssl_module \
	--with-http_v2_module \
	--with-cc-opt="-I /usr/local/include -I $(ROOT_DIR) -I $(PROTO_INC) -I $(PROTO_SRC) \
-I $(GRPC_INC) -I $(GRPC_SRC) -I $(ABSL_SRC)" \
	--with-ld-opt="$(NGINX_STATIC_LD_OPT)" \
	--add-module="$(ROOT_DIR)/net/grpc/gateway/nginx"

nginx: protos nginx_config
	cd "$(NGINX_DIR)/src" && make

nginx_static: protos nginx_config_static
	cd "$(NGINX_DIR)/src" && make

package: nginx
	mkdir -p "$(ROOT_DIR)"/gConnector/conf
	cp "$(ROOT_DIR)"/third_party/nginx/src/conf/* "$(ROOT_DIR)"/gConnector/conf
	cp "$(ROOT_DIR)"/net/grpc/gateway/nginx/package/nginx.conf \
		"$(ROOT_DIR)"/gConnector/conf
	cp "$(ROOT_DIR)"/net/grpc/gateway/nginx/package/nginx.sh \
		"$(ROOT_DIR)"/gConnector
	cp "$(ROOT_DIR)"/third_party/nginx/src/objs/nginx \
		"$(ROOT_DIR)"/gConnector
	cd "$(ROOT_DIR)" && zip -r gConnector.zip gConnector/*

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
	cd "$(ROOT_DIR)" && zip -r gConnector_static.zip gConnector_static/*

plugin:
	cd "$(ROOT_DIR)"/javascript/net/grpc/web && make

install-plugin:
	cd "$(ROOT_DIR)"/javascript/net/grpc/web && make install

example: plugin
	cd "$(ROOT_DIR)"/net/grpc/gateway/examples/echo && make

standalone-proxy: package_static
	cd "$(ROOT_DIR)"/net/grpc/gateway/examples/echo && make standalone-proxy

echo_server:
	cd "$(ROOT_DIR)"/net/grpc/gateway/examples/echo && make echo_server

client:
	cd "$(ROOT_DIR)"/net/grpc/gateway/examples/echo && make client

install-example:
	cd "$(ROOT_DIR)"/net/grpc/gateway/examples/echo && make install

clean:
	cd "$(ROOT_DIR)" && rm -rf objs gConnector gConnector_static \
third_party/nginx/src/objs third_party/openssl/.openssl
	cd "$(ROOT_DIR)" && rm -f gConnector.zip gConnector_static.zip \
"$(GRPC_GATEWAY_PROTOS)"/*.pb.cc "$(GRPC_GATEWAY_PROTOS)"/*.pb.h \
third_party/nginx/src/Makefile
	cd "$(ROOT_DIR)"/net/grpc/gateway/examples/echo && make clean
	cd "$(ROOT_DIR)"/javascript/net/grpc/web && make clean
	cd "$(ROOT_DIR)"
