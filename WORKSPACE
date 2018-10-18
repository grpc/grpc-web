workspace(name = "com_github_grpc_grpc_web")

http_archive(
    name = "io_bazel_rules_closure",
    sha256 = "4463509e8f86c9b7726b6b7c751132f0ca14f907cba00759b21f8577c2dcf710",
    strip_prefix = "rules_closure-acad96981d76b60844bf815d03043619714839ad",
    urls = [
        "https://github.com/bazelbuild/rules_closure/archive/acad96981d76b60844bf815d03043619714839ad.zip",
    ],
)

load("@io_bazel_rules_closure//closure:defs.bzl", "closure_repositories")

closure_repositories()
