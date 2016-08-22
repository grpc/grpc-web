load("//javascript/apps/jspb/builddefs:build_defs.bzl", "proto_js")
load("//javascript/closure:builddefs.bzl", "CLOSURE_COMPILER_FLAGS_FULL", "CLOSURE_EXTERNS")
load("//javascript/net/grpc/web/builddefs:build_defs.bzl", "js_grpc_web_library")
load("//third_party/grpc:grpc.bzl", "grpc_opensource_cc_library")
load("//tools/build_defs/js/devserver:defs.bzl", "js_binary_and_devserver")

grpc_opensource_cc_library(
    name = "echo_proto",
    src = "echo.proto",
    lib_deps = [
        "//third_party/grpc:grpc++_codegen_proto_internal",
    ],
)

cc_library(
    name = "echo_server_lib",
    srcs = ["echo_server.cc"],
    deps = [
        ":echo_proto",
        "//third_party/grpc:grpc++",
    ],
)

cc_binary(
    name = "echo_server",
    deps = [":echo_server_lib"],
)

proto_js(
    name = "echo_proto_js",
    srcs = ["echo.proto"],
    binary = 1,
)

js_grpc_web_library(
    name = "echo_grpc_web",
    src = "echo.proto",
    mode = "base64",
    proto_deps = [
        ":echo_proto_js",
        "//java/com/google/apps/jspb:jspb.proto",
        "//net/proto2/proto:descriptor.proto",
    ],
)

js_library(
    name = "echo_proto_js_lib",
    srcs = [
        "echo_proto_js_lib.js",
        "echo_grpc_web_pb.js",
    ],
    visibility = ["//visibility:public"],
    deps = [
        "//javascript/apps/jspb:message",
        "//javascript/apps/jspb/binary:binary_lib",
        "//javascript/closure:base",
        "//javascript/net/grpc/web:clientbase",
    ],
)

js_binary_and_devserver(
    name = "echo_js_bin",
    compile = 1,
    data = [
        "echotest.html",
    ],
    defs = CLOSURE_COMPILER_FLAGS_FULL,
    externs_list = CLOSURE_EXTERNS,
    deps = [
        ":echo_proto_js_lib",
    ],
)
