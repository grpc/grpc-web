# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

ROOT_DIR = ../../../../..
CXX = g++
CPPFLAGS += -I/usr/local/include -I$(ROOT_DIR) -pthread
CXXFLAGS += -std=c++11
LDFLAGS += -L/usr/local/lib -lgrpc++ -lgrpc -lgrpc++_reflection \
           -lprotobuf -lpthread -ldl
PROTOC = protoc
PROTOS_PATH = ../..
EXAMPLES_PATH = net/grpc/gateway/examples/echo
HTML_DIR = /var/www/html
JS_IMPORT_STYLE = import_style=closure,binary
JS_PATH = javascript/net/grpc/web
OUT_DIR = ./out
PROTOBUF_PATH = third_party/grpc/third_party/protobuf
GRPC_CPP_PLUGIN = grpc_cpp_plugin
GRPC_CPP_PLUGIN_PATH ?= `which $(GRPC_CPP_PLUGIN)`
GRPC_WEB_PLUGIN_PATH = /usr/local/bin/protoc-gen-grpc-web

all: echo_server client package

package:
	mkdir -p $(ROOT_DIR)/gConnector/$(EXAMPLES_PATH)
	cp nginx.conf $(ROOT_DIR)/gConnector/conf
	cp echo_server $(ROOT_DIR)/gConnector
	cp echotest.html $(ROOT_DIR)/gConnector/$(EXAMPLES_PATH)
	cp compiled.js $(ROOT_DIR)/gConnector
	zip -r $(ROOT_DIR)/gConnector.zip $(ROOT_DIR)/gConnector/*

standalone-proxy:
	mkdir -p $(ROOT_DIR)/gConnector_static/$(EXAMPLES_PATH)
	cp nginx.conf $(ROOT_DIR)/gConnector_static/conf
	zip -r $(ROOT_DIR)/gConnector_static.zip $(ROOT_DIR)/gConnector_static/*

echo_server: echo.pb.o echo.grpc.pb.o echo_server.o echo_service_impl.o
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
	rm $(ROOT_DIR)/$(PROTOBUF_PATH)/js/commonjs/*_test.js || true
	rm $(ROOT_DIR)/$(PROTOBUF_PATH)/js/compatibility_tests/v3.0.0/*_test.js || true
	rm $(ROOT_DIR)/$(PROTOBUF_PATH)/js/compatibility_tests/v3.0.0/binary/*_test.js || true
	rm $(ROOT_DIR)/$(PROTOBUF_PATH)/js/compatibility_tests/v3.0.0/commonjs/*_test.js || true
	rm $(ROOT_DIR)/$(PROTOBUF_PATH)/js/compatibility_tests/v3.1.0/*_test.js || true
	rm $(ROOT_DIR)/$(PROTOBUF_PATH)/js/compatibility_tests/v3.1.0/binary/*_test.js || true
	java \
  -jar $(ROOT_DIR)/closure-compiler.jar \
  --js $(ROOT_DIR)/javascript \
  --js $(ROOT_DIR)/net \
  --js $(ROOT_DIR)/third_party/closure-library \
  --js $(ROOT_DIR)/$(PROTOBUF_PATH)/js \
  --entry_point=goog:proto.grpc.gateway.testing.EchoServiceClient \
  --dependency_mode=PRUNE \
  --js_output_file compiled.js
	cd $(ROOT_DIR)/$(PROTOBUF_PATH) && git checkout .

proto-js:
	mkdir -p $(OUT_DIR)
	$(PROTOC) -I=$(ROOT_DIR)/$(PROTOBUF_PATH)/src/google/protobuf \
  --js_out=$(JS_IMPORT_STYLE):$(OUT_DIR) \
  $(ROOT_DIR)/$(PROTOBUF_PATH)/src/google/protobuf/any.proto
	$(PROTOC) -I=. --js_out=$(JS_IMPORT_STYLE):$(OUT_DIR) ./echo.proto
	$(PROTOC) -I=. --plugin=protoc-gen-grpc-web=$(GRPC_WEB_PLUGIN_PATH) \
  --grpc-web_out=import_style=closure,mode=grpcwebtext:. ./echo.proto

install:
	mkdir -p $(HTML_DIR)
	cp ./echotest.html $(HTML_DIR)
	cp ./echoapp.js $(HTML_DIR)
	cp ./compiled.js $(HTML_DIR)/echo_js_bin_dev.js

clean:
	rm -f *.grpc.pb.cc *.grpc.pb.h *.grpc.pb.o *.pb.cc *.pb.h *.pb.o \
  echo_server echo_server.o echo_service_impl.o compiled.js
	rm -rf $(OUT_DIR)
