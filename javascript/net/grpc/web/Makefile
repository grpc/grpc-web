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

CXX ?= g++
CPPFLAGS += -I/usr/local/include -pthread
CXXFLAGS += -std=c++11
LDFLAGS += -L/usr/local/lib -lprotoc -lprotobuf -lpthread -ldl

all: protoc-gen-grpc-web

protoc-gen-grpc-web: grpc_generator.o
	$(CXX) $^ $(LDFLAGS) -o $@

install: protoc-gen-grpc-web
	install protoc-gen-grpc-web /usr/local/bin/protoc-gen-grpc-web

clean:
	rm -f *.o protoc-gen-grpc-web
