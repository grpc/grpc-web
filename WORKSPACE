workspace(name = "com_github_grpc_grpc_web")

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

# TODO(yannic): Update to use official repository.
# See https://github.com/bazelbuild/rules_closure/pull/278
http_archive(
    name = "io_bazel_rules_closure",
    sha256 = "248a7a98eb3962d9f0013e543ea79c5063a83bac7af349ebf412d844e6ab3035",
    strip_prefix = "rules_closure-53f2cab21fa6c608f32f114387d88ffd7868c5fc",
    urls = [
        "https://github.com/Yannic/rules_closure/archive/53f2cab21fa6c608f32f114387d88ffd7868c5fc.zip",
    ],
)

load("@io_bazel_rules_closure//closure:defs.bzl", "closure_repositories")

closure_repositories()
