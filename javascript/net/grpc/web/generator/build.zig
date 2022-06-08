const std = @import("std");
const CrossTarget = std.zig.CrossTarget;

fn format(comptime fmt: []const u8, args: anytype) []const u8 {
    return std.fmt.allocPrint(std.testing.allocator, fmt, args) catch unreachable;
}

const BinaryTarget = struct {
    name: []const u8,
    arch: []const u8,
};

pub fn build(b: *std.build.Builder) void {
    // Standard release options allow the person running `zig build` to select
    // between Debug, ReleaseSafe, ReleaseFast, and ReleaseSmall.
    const mode = b.standardReleaseOptions();

    var version = if (std.os.getenv("VERSION")) |v| v else "unknown";

    var targets = [_]BinaryTarget{
        // for now, let's only build aarch64 binaries
        // .{ .name = format("protoc-gen-grpc-web-{s}-linux-x86_64", .{version}), .arch = "x86_64-linux" },
        // .{ .name = format("protoc-gen-grpc-web-{s}-darwin-x86_64", .{version}), .arch = "x86_64-macos" },
        // .{ .name = format("protoc-gen-grpc-web-{s}-windows-x86_64", .{version}), .arch = "x86_64-windows" },

        .{ .name = format("protoc-gen-grpc-web-{s}-linux-aarch64", .{version}), .arch = "aarch64-linux" },
        .{ .name = format("protoc-gen-grpc-web-{s}-darwin-aarch64", .{version}), .arch = "aarch64-macos" },
        .{ .name = format("protoc-gen-grpc-web-{s}-windows-aarch64", .{version}), .arch = "aarch64-windows" },
    };

    for (targets) |target| {
        const exe = b.addExecutable(target.name, "grpc_generator.cc");
        exe.linkLibCpp();
        exe.linkSystemLibrary("pthread");
        exe.linkSystemLibrary("dl");
        exe.addIncludeDir("../../../../../third_party/protobuf/src");
        exe.defineCMacro("HAVE_PTHREAD", "1");
        exe.addCSourceFiles(&[_][]const u8{
            // libprotobuf_lite source files (copied from third_party/protobuf/cmake/libprotobuf-lite.cmake)
            "../../../../../third_party/protobuf/src/google/protobuf/any_lite.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/arena.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/arenastring.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/extension_set.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/generated_enum_util.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/generated_message_table_driven_lite.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/generated_message_util.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/implicit_weak_message.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/io/coded_stream.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/io/io_win32.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/io/strtod.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/io/zero_copy_stream.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/io/zero_copy_stream_impl.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/io/zero_copy_stream_impl_lite.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/map.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/message_lite.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/parse_context.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/repeated_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/stubs/bytestream.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/stubs/common.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/stubs/int128.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/stubs/status.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/stubs/statusor.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/stubs/stringpiece.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/stubs/stringprintf.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/stubs/structurally_valid.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/stubs/strutil.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/stubs/time.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/wire_format_lite.cc",

            // libprotobuf ssource files (copied from third_party/protobuf/cmake/libprotobuf.cmake)
            "../../../../../third_party/protobuf/src/google/protobuf/any.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/any.pb.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/api.pb.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/importer.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/parser.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/descriptor.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/descriptor.pb.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/descriptor_database.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/duration.pb.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/dynamic_message.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/empty.pb.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/extension_set_heavy.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/field_mask.pb.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/generated_message_reflection.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/generated_message_table_driven.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/io/gzip_stream.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/io/printer.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/io/tokenizer.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/map_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/message.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/reflection_ops.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/service.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/source_context.pb.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/struct.pb.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/stubs/substitute.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/text_format.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/timestamp.pb.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/type.pb.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/unknown_field_set.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/util/delimited_message_util.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/util/field_comparator.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/util/field_mask_util.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/util/internal/datapiece.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/util/internal/default_value_objectwriter.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/util/internal/error_listener.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/util/internal/field_mask_utility.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/util/internal/json_escaping.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/util/internal/json_objectwriter.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/util/internal/json_stream_parser.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/util/internal/object_writer.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/util/internal/proto_writer.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/util/internal/protostream_objectsource.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/util/internal/protostream_objectwriter.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/util/internal/type_info.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/util/internal/type_info_test_helper.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/util/internal/utility.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/util/json_util.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/util/message_differencer.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/util/time_util.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/util/type_resolver_util.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/wire_format.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/wrappers.pb.cc",

            // libprotoc source files (copied from third_party/protobuf/cmake/libprotoc.cmake)
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/code_generator.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/command_line_interface.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/cpp/cpp_enum.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/cpp/cpp_enum_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/cpp/cpp_extension.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/cpp/cpp_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/cpp/cpp_file.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/cpp/cpp_generator.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/cpp/cpp_helpers.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/cpp/cpp_map_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/cpp/cpp_message.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/cpp/cpp_message_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/cpp/cpp_padding_optimizer.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/cpp/cpp_primitive_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/cpp/cpp_service.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/cpp/cpp_string_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/csharp/csharp_doc_comment.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/csharp/csharp_enum.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/csharp/csharp_enum_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/csharp/csharp_field_base.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/csharp/csharp_generator.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/csharp/csharp_helpers.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/csharp/csharp_map_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/csharp/csharp_message.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/csharp/csharp_message_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/csharp/csharp_primitive_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/csharp/csharp_reflection_class.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/csharp/csharp_repeated_enum_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/csharp/csharp_repeated_message_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/csharp/csharp_repeated_primitive_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/csharp/csharp_source_generator_base.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/csharp/csharp_wrapper_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_context.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_doc_comment.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_enum.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_enum_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_enum_field_lite.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_enum_lite.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_extension.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_extension_lite.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_file.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_generator.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_generator_factory.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_helpers.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_map_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_map_field_lite.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_message.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_message_builder.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_message_builder_lite.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_message_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_message_field_lite.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_message_lite.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_name_resolver.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_primitive_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_primitive_field_lite.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_service.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_shared_code_generator.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_string_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/java/java_string_field_lite.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/js/js_generator.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/js/well_known_types_embed.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/objectivec/objectivec_enum.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/objectivec/objectivec_enum_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/objectivec/objectivec_extension.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/objectivec/objectivec_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/objectivec/objectivec_file.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/objectivec/objectivec_generator.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/objectivec/objectivec_helpers.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/objectivec/objectivec_map_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/objectivec/objectivec_message.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/objectivec/objectivec_message_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/objectivec/objectivec_oneof.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/objectivec/objectivec_primitive_field.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/php/php_generator.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/plugin.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/plugin.pb.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/python/python_generator.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/ruby/ruby_generator.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/subprocess.cc",
            "../../../../../third_party/protobuf/src/google/protobuf/compiler/zip_writer.cc",
        }, &[_][]const u8{
            "-pthread",
        });

        exe.setTarget(CrossTarget.parse(.{ .arch_os_abi = target.arch }) catch unreachable);
        exe.setBuildMode(mode);
        exe.strip = true;
        exe.install();
    }
}
