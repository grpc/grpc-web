./init_submodules.sh
make clean
docker build -t debian_stretch -f net/grpc/gateway/docker/debian_stretch/Dockerfile .
CONTAINER_ID=$(docker create debian_stretch)
docker cp "$CONTAINER_ID:/github/grpc-web/gConnector.zip" net/grpc/gateway/docker/debian_stretch
docker cp "$CONTAINER_ID:/github/grpc-web/gConnector_static.zip" net/grpc/gateway/docker/debian_stretch
docker rm "$CONTAINER_ID"
