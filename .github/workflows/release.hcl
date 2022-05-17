group "release" {
    targets = ["prereqs", "protoc-plugin"]
}

target "prereqs" {
    dockerfile = "./net/grpc/gateway/docker/prereqs/Dockerfile"
}

target "protoc-plugin" {
    dockerfile = "./net/grpc/gateway/docker/protoc_plugin/Dockerfile"
    tags = ["docker.io/grpcweb/protoc-plugin"]
    contexts = {
        "grpcweb/prereqs" = "target:prereqs"
    }
}
