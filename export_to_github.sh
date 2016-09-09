#!/bin/bash
# Exports the GRPC-Web source code from google3 to github.
# Run it in your cloned GRPC-Web git repo.
# $1 is the path of GRPC-Web's root path.

GOOGLE3=$(g4 g4d "$1")
GIT=$(git rev-parse --show-toplevel)
echo "g4 client: $1"
echo "g4 client path: $GOOGLE3"
echo "git client: $GIT"
cd $GIT
rm -rf net && mkdir -p net/grpc/gateway
cp "$GOOGLE3"/net/grpc/gateway/Makefile .
cp "$GOOGLE3"/net/grpc/gateway/README.md .
cp "$GOOGLE3"/net/grpc/gateway/*.sh .
cp "$GOOGLE3"/net/grpc/gateway/*.h net/grpc/gateway
cp "$GOOGLE3"/net/grpc/gateway/*.cc net/grpc/gateway
mkdir -p net/grpc/gateway/backend
cp -r "$GOOGLE3"/net/grpc/gateway/backend net/grpc/gateway
mkdir -p net/grpc/gateway/docker
cp -r "$GOOGLE3"/net/grpc/gateway/docker net/grpc/gateway
mkdir -p net/grpc/gateway/codec
cp -r "$GOOGLE3"/net/grpc/gateway/codec net/grpc/gateway
rm -rf net/grpc/gateway/codec/*test*
mkdir -p net/grpc/gateway/nginx
cp -r "$GOOGLE3"/net/grpc/gateway/nginx net/grpc/gateway
rm -f net/grpc/gateway/nginx/BUILD
mkdir -p net/grpc/gateway/protos
cp -r "$GOOGLE3"/net/grpc/gateway/protos net/grpc/gateway
mkdir -p net/grpc/gateway/frontend
cp -r "$GOOGLE3"/net/grpc/gateway/frontend net/grpc/gateway
mkdir -p net/grpc/gateway/runtime
cp -r "$GOOGLE3"/net/grpc/gateway/runtime net/grpc/gateway
mkdir -p net/grpc/gateway/examples
cp -r "$GOOGLE3"/net/grpc/gateway/examples net/grpc/gateway
rm -f net/grpc/gateway/examples/echo/BUILD
rm -rf net/grpc/gateway/examples/streaming_server
rm -rf javascript && mkdir -p javascript/net/grpc/web
cp "$GOOGLE3"/javascript/net/grpc/web/*.js javascript/net/grpc/web
cp "$GOOGLE3"/javascript/net/grpc/web/*.cc javascript/net/grpc/web
cp "$GOOGLE3"/javascript/net/grpc/web/Makefile javascript/net/grpc/web
