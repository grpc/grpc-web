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
NPM_DIR = ./node_modules
PROTOC = protoc
PROTOS_PATH = ../..
HTML_DIR = /var/www/html
JS_IMPORT_STYLE = import_style=closure,binary
JS_PATH = javascript/net/grpc/web
OUT_DIR = ./out
PROTOBUF_PATH = third_party/protobuf
GRPC_WEB_PLUGIN_PATH = /usr/local/bin/protoc-gen-grpc-web

all: client

client: proto-js compiled-js

compiled-js:
	./node_modules/.bin/google-closure-compiler \
  --js=*.js \
  --js=$(OUT_DIR)/*.js \
  --js=$(ROOT_DIR)/javascript \
  --js=$(ROOT_DIR)/$(PROTOBUF_PATH)/js \
  --js='!$(ROOT_DIR)/$(PROTOBUF_PATH)/js/**/*_test.js' \
  --js=$(NPM_DIR)/google-closure-library \
  --entry_point=goog:proto.grpc.gateway.testing.EchoServiceClient \
  --dependency_mode=PRUNE \
  --js_output_file compiled.js

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
	rm -f compiled.js
	rm -f *_pb.js
	rm -rf $(OUT_DIR)
