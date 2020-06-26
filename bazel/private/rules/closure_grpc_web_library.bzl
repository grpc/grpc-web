# This rule was inspired by rules_closure`s implementation of
# |closure_proto_library|, licensed under Apache 2.
# https://github.com/bazelbuild/rules_closure/blob/3555e5ba61fdcc17157dd833eaf7d19b313b1bca/closure/protobuf/closure_proto_library.bzl

"""Starlark rules for using gRPC-Web with Bazel and `rules_closure`."""

load("@io_bazel_rules_closure//closure/compiler:closure_js_library.bzl", "create_closure_js_library")
load("@io_bazel_rules_closure//closure/private:defs.bzl", "CLOSURE_JS_TOOLCHAIN_ATTRS", "unfurl")  # buildifier: disable=bzl-visibility
load("@io_bazel_rules_closure//closure/protobuf:closure_proto_library.bzl", "closure_proto_aspect")
load("@rules_proto//proto:defs.bzl", "ProtoInfo")

# This was borrowed from Rules Go, licensed under Apache 2.
# https://github.com/bazelbuild/rules_go/blob/67f44035d84a352cffb9465159e199066ecb814c/proto/compiler.bzl#L72
def _proto_path(proto):
    path = proto.path
    root = proto.root.path
    ws = proto.owner.workspace_root
    if path.startswith(root):
        path = path[len(root):]
    if path.startswith("/"):
        path = path[1:]
    if path.startswith(ws):
        path = path[len(ws):]
    if path.startswith("/"):
        path = path[1:]
    return path

def _proto_include_path(proto):
    path = proto.path[:-len(_proto_path(proto))]
    if not path:
        return "."
    if path.endswith("/"):
        path = path[:-1]
    return path

def _proto_include_paths(protos):
    return [_proto_include_path(proto) for proto in protos]

def _generate_closure_grpc_web_src_progress_message(proto):
    # TODO(yannic): Add a better message?
    return "Generating GRPC Web for %s" % proto

def _assert(condition, message):
    if not condition:
        fail(message)

def _generate_closure_grpc_web_srcs(
        label,
        actions,
        protoc,
        protoc_gen_grpc_web,
        import_style,
        mode,
        sources,
        transitive_sources):
    args = actions.args()

    args.add("--plugin", "protoc-gen-grpc-web=" + protoc_gen_grpc_web.executable.path)

    args.add_all(_proto_include_paths(transitive_sources.to_list()), format_each = "-I%s")

    args.add("--grpc-web_opt", "mode=" + mode)
    if "es6" == import_style:
        args.add("--grpc-web_opt", "import_style=experimental_closure_es6")
    else:
        args.add("--grpc-web_opt", "import_style=" + import_style)

    root = None

    files = []
    es6_files = []
    for src in sources:
        basename = src.basename[:-(len(src.extension) + 1)]

        js = actions.declare_file(basename + "_grpc_web_pb.js", sibling = src)
        files.append(js)

        _assert(
            ((root == None) or (root == js.root.path)),
            "proto sources do not have the same root: '{}' != '{}'".format(root, js.root.path),
        )
        root = js.root.path

        if "es6" == import_style:
            es6 = actions.declare_file(basename + ".pb.grpc-web.js", sibling = src)
            es6_files.append(es6)

            _assert(root == es6.root.path, "ES6 file should have same root: '{}' != '{}'".format(root, es6.root.path))

    _assert(root, "At least one source file is required")

    args.add("--grpc-web_out", root)
    args.add_all(sources)

    actions.run(
        tools = [protoc_gen_grpc_web],
        inputs = transitive_sources,
        outputs = files + es6_files,
        executable = protoc,
        arguments = [args],
        progress_message =
            _generate_closure_grpc_web_src_progress_message(str(label)),
    )

    return files, es6_files

_error_multiple_deps = "".join([
    "'deps' attribute must contain exactly one label ",
    "(we didn't name it 'dep' for consistency). ",
    "We may revisit this restriction later.",
])

def _closure_grpc_web_library_impl(ctx):
    if len(ctx.attr.deps) > 1:
        # TODO(yannic): Revisit this restriction.
        fail(_error_multiple_deps, "deps")

    grpc_web_toolchain = ctx.toolchains["@com_github_grpc_grpc_web//bazel:toolchain_type"]

    proto_info = ctx.attr.deps[0][ProtoInfo]
    srcs, es6_srcs = _generate_closure_grpc_web_srcs(
        label = ctx.label,
        actions = ctx.actions,
        protoc = ctx.executable._protoc,
        protoc_gen_grpc_web = grpc_web_toolchain.generator,
        import_style = ctx.attr.import_style,
        mode = ctx.attr.mode,
        sources = proto_info.direct_sources,
        transitive_sources = proto_info.transitive_imports,
    )

    deps = unfurl(ctx.attr.deps, provider = "closure_js_library")
    deps.append(grpc_web_toolchain.runtime_library)
    library = create_closure_js_library(
        ctx = ctx,
        srcs = srcs + es6_srcs,
        deps = deps,
        suppress = [
            "misplacedTypeAnnotation",
            "unusedPrivateMembers",
            "reportUnknownTypes",
            "strictDependencies",
            "extraRequire",
        ],
        lenient = False,
    )

    # `rules_closure` still uses the legacy provider syntax.
    # buildifier: disable=rule-impl-return
    return struct(
        exports = library.exports,
        closure_js_library = library.closure_js_library,
        # The usual suspects are exported as runfiles, in addition to raw source.
        runfiles = ctx.runfiles(files = srcs),
    )

closure_grpc_web_library = rule(
    implementation = _closure_grpc_web_library_impl,
    attrs = dict({
        "deps": attr.label_list(
            mandatory = True,
            providers = [ProtoInfo, "closure_js_library"],
            # The files generated by this aspect are required dependencies.
            aspects = [closure_proto_aspect],
        ),
        "import_style": attr.string(
            default = "closure",
            values = [
                "closure",

                # This is experimental and requires closure-js.
                # We reserve the right to do breaking changes at any time.
                "es6",
            ],
        ),
        "mode": attr.string(
            default = "grpcwebtext",
            values = ["grpcwebtext", "grpcweb"],
        ),

        # Internal only.

        # TODO(yannic): Switch to using `proto_toolchain` after
        # https://github.com/bazelbuild/rules_proto/pull/25 lands.
        "_protoc": attr.label(
            default = Label("@com_google_protobuf//:protoc"),
            executable = True,
            cfg = "host",
        ),
    }, **CLOSURE_JS_TOOLCHAIN_ATTRS),
    toolchains = [
        "@com_github_grpc_grpc_web//bazel:toolchain_type",
    ],
    # TODO(yannic): Remove after `--incompatible_override_toolchain_transition` is flipped.
    # https://github.com/bazelbuild/bazel/issues/11584
    incompatible_use_toolchain_transition = True,
)
