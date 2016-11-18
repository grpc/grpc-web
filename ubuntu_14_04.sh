./init_submodules.sh
make clean
docker build -t ubuntu_14_04 -f net/grpc/gateway/docker/ubuntu_14_04/Dockerfile .
CONTAINER_ID=$(docker create ubuntu_14_04)
docker cp "$CONTAINER_ID:/github/grpc-web/gConnector.zip" net/grpc/gateway/docker/ubuntu_14_04
docker cp "$CONTAINER_ID:/github/grpc-web/gConnector_static.zip" net/grpc/gateway/docker/ubuntu_14_04
docker rm "$CONTAINER_ID"
