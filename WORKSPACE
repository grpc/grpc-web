workspace(name = "com_github_grpc_grpc_web")

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "bazel_skylib",
    sha256 = "97e70364e9249702246c0e9444bccdc4b847bed1eb03c5a3ece4f83dfe6abc44",
    urls = [
        "https://mirror.bazel.build/github.com/bazelbuild/bazel-skylib/releases/download/1.0.2/bazel-skylib-1.0.2.tar.gz",
        "https://github.com/bazelbuild/bazel-skylib/releases/download/1.0.2/bazel-skylib-1.0.2.tar.gz",
    ],
)

http_archive(
    name = "com_google_protobuf",
    sha256 = "6fbe2e6f703bcd3a246529c2cab586ca12a98c4e641f5f71d51fde09eb48e9e7",
    strip_prefix = "protobuf-27.1",
    urls = [
        "https://github.com/protocolbuffers/protobuf/releases/download/v27.1/protobuf-27.1.tar.gz",
    ],
)

http_archive(
    name = "com_github_grpc_grpc",
    sha256 = "8579095a31e280d0c5fcc81ea0a2a0efb2900dbfbac0eb018a961a5be22e076e",
    strip_prefix = "grpc-1.64.2",
    urls = [
        "https://github.com/grpc/grpc/archive/v1.64.2.zip",
    ],
)

load("@com_github_grpc_grpc//bazel:grpc_deps.bzl", "grpc_deps")

grpc_deps()

load("@com_github_grpc_grpc//bazel:grpc_extra_deps.bzl", "grpc_extra_deps")

grpc_extra_deps()
