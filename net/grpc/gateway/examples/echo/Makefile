#
# Copyright 2016, Google Inc.
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are
# met:
#
#     * Redistributions of source code must retain the above copyright
# notice, this list of conditions and the following disclaimer.
#     * Redistributions in binary form must reproduce the above
# copyright notice, this list of conditions and the following disclaimer
# in the documentation and/or other materials provided with the
# distribution.
#     * Neither the name of Google Inc. nor the names of its
# contributors may be used to endorse or promote products derived from
# this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
# A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
# OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
# SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
# LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
# DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
# THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#

ROOT_DIR = ../../../../..
CXX = g++
CPPFLAGS += -I/usr/local/include -I$(ROOT_DIR) -pthread
CXXFLAGS += -std=c++11
LDFLAGS += -L/usr/local/lib -lgrpc++ -lgrpc -lgrpc++_reflection \
           -lprotobuf -lpthread -ldl
PROTOC = protoc
PROTOS_PATH = ../..
CLOSUREBUILDER = closure/bin/build/closurebuilder.py
EXAMPLES_PATH = net/grpc/gateway/examples/echo
HTML_DIR = /var/www/html
JS_IMPORT_STYLE = import_style=closure,binary
JS_PATH = javascript/net/grpc/web
OUT_DIR = ./out
PROTOBUF_PATH = third_party/grpc/third_party/protobuf
GRPC_CPP_PLUGIN = grpc_cpp_plugin
GRPC_CPP_PLUGIN_PATH ?= `which $(GRPC_CPP_PLUGIN)`
GRPC_WEB_PLUGIN_PATH = $(ROOT_DIR)/$(JS_PATH)/protoc-gen-grpc-web

all: echo_server client package

package:
	mkdir -p $(ROOT_DIR)/gConnector/conf
	mkdir -p $(ROOT_DIR)/gConnector/$(EXAMPLES_PATH)
	cp $(ROOT_DIR)/net/grpc/gateway/nginx/package/nginx.sh $(ROOT_DIR)/gConnector
	cp $(ROOT_DIR)/third_party/nginx/src/objs/nginx $(ROOT_DIR)/gConnector
	cp $(ROOT_DIR)/third_party/nginx/src/conf/* $(ROOT_DIR)/gConnector/conf
	cp nginx.conf $(ROOT_DIR)/gConnector/conf
	cp echo_server $(ROOT_DIR)/gConnector
	cp echotest.html $(ROOT_DIR)/gConnector/$(EXAMPLES_PATH)
	cp compiled.js $(ROOT_DIR)/gConnector
	zip -r $(ROOT_DIR)/gConnector.zip $(ROOT_DIR)/gConnector/*

echo_server: echo.pb.o echo.grpc.pb.o echo_server.o
	$(CXX) $^ $(LDFLAGS) -o $@

echo.grpc.pb.cc: echo.proto
	$(PROTOC) -I . --grpc_out=. \
  --plugin=protoc-gen-grpc=$(GRPC_CPP_PLUGIN_PATH) $<

echo.pb.cc: echo.proto
	$(PROTOC) -I . --cpp_out=. $<

client: proto-js compiled-js

compiled-js:
	rm $(ROOT_DIR)/$(PROTOBUF_PATH)/js/*_test.js || true
	rm $(ROOT_DIR)/$(PROTOBUF_PATH)/js/binary/*_test.js || true
	$(ROOT_DIR)/third_party/closure-library/$(CLOSUREBUILDER) \
  --root=$(ROOT_DIR)/javascript \
  --root=$(ROOT_DIR)/net \
  --root=$(ROOT_DIR)/third_party/closure-library \
  --root=$(ROOT_DIR)/$(PROTOBUF_PATH)/js \
  --namespace="proto.grpc.gateway.testing.EchoServiceClient" \
  --output_mode=compiled \
  --compiler_jar=$(ROOT_DIR)/closure-compiler.jar > compiled.js
	cd $(ROOT_DIR)/$(PROTOBUF_PATH) && git checkout .

proto-js:
	mkdir -p $(OUT_DIR)
	$(PROTOC) -I=$(ROOT_DIR)/$(PROTOBUF_PATH)/src/google/protobuf \
  --js_out=$(JS_IMPORT_STYLE):$(OUT_DIR) \
  $(ROOT_DIR)/$(PROTOBUF_PATH)/src/google/protobuf/any.proto
	$(PROTOC) -I=$(PROTOS_PATH)/protos \
  --js_out=$(JS_IMPORT_STYLE):$(OUT_DIR) \
  $(PROTOS_PATH)/protos/status.proto
	$(PROTOC) -I=$(PROTOS_PATH)/protos \
  --js_out=$(JS_IMPORT_STYLE):$(OUT_DIR) \
  $(PROTOS_PATH)/protos/pair.proto
	$(PROTOC) -I=. --js_out=$(JS_IMPORT_STYLE):$(OUT_DIR) ./echo.proto
	$(PROTOC) -I=. --plugin=protoc-gen-grpc-web=$(GRPC_WEB_PLUGIN_PATH) \
  --grpc-web_out=out=$(OUT_DIR)/echo.grpc.pb.js,mode=base64:. ./echo.proto

install:
	mkdir -p $(HTML_DIR)/$(EXAMPLES_PATH)
	cp ./echotest.html $(HTML_DIR)/$(EXAMPLES_PATH)/
	cp compiled.js $(HTML_DIR)/echo_js_bin_dev.js

clean:
	rm -f *.grpc.pb.cc *.grpc.pb.h *.grpc.pb.o *.pb.cc *.pb.h *.pb.o \
  echo_server echo_server.o compiled.js
	rm -rf $(OUT_DIR)
