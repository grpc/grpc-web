workspace(name = "com_github_grpc_grpc_web")

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "io_bazel_rules_closure",
    sha256 = "d7a04263cf5b7af90f52d759da1e50c3cfe81c6cb16eec430af86e6bed248098",
    strip_prefix = "rules_closure-0e187366b658d1796d2580f8b7e1a8d7e7e1492d",
    urls = [
        "https://github.com/bazelbuild/rules_closure/archive/0e187366b658d1796d2580f8b7e1a8d7e7e1492d.zip",
    ],
)

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
    sha256 = "efaf69303e01caccc2447064fc1832dfd23c0c130df0dc5fc98a13185bb7d1a7",
    strip_prefix = "protobuf-678da4f76eb9168c9965afc2149944a66cd48546",
    urls = [
        "https://github.com/google/protobuf/archive/678da4f76eb9168c9965afc2149944a66cd48546.tar.gz",
    ],
)

http_archive(
    name = "com_github_grpc_grpc",
    sha256 = "43feda4d7ce2892400d5a0cbccecc5b1790f3253244a171360018d84c2949fb7",
    strip_prefix = "grpc-1.33.2",
    urls = [
        "https://github.com/grpc/grpc/archive/v1.33.2.zip",
    ],
)

load("@io_bazel_rules_closure//closure:repositories.bzl", "rules_closure_dependencies", "rules_closure_toolchains")

rules_closure_dependencies()

rules_closure_toolchains()

load("//bazel:repositories.bzl", "grpc_web_toolchains")

grpc_web_toolchains()

load("@com_github_grpc_grpc//bazel:grpc_deps.bzl", "grpc_deps")

grpc_deps()

load("@com_github_grpc_grpc//bazel:grpc_extra_deps.bzl", "grpc_extra_deps")

grpc_extra_deps()

