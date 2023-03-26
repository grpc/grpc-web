/**
 *
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

#include <google/protobuf/compiler/code_generator.h>
#include <google/protobuf/compiler/plugin.h>
#include <google/protobuf/compiler/plugin.pb.h>
#include <google/protobuf/descriptor.h>
#include <google/protobuf/descriptor.pb.h>
#include <google/protobuf/io/printer.h>
#include <google/protobuf/io/zero_copy_stream.h>

#include <algorithm>
#include <iterator>
#include <set>
#include <string>

using google::protobuf::Descriptor;
using google::protobuf::EnumDescriptor;
using google::protobuf::FieldDescriptor;
using google::protobuf::FileDescriptor;
using google::protobuf::MethodDescriptor;
using google::protobuf::ServiceDescriptor;
using google::protobuf::FieldOptions;
using google::protobuf::OneofDescriptor;
using google::protobuf::compiler::CodeGenerator;
using google::protobuf::compiler::GeneratorContext;
using google::protobuf::compiler::ParseGeneratorParameter;
using google::protobuf::compiler::PluginMain;
using google::protobuf::compiler::Version;
using google::protobuf::io::Printer;
using google::protobuf::io::ZeroCopyOutputStream;

namespace grpc {
namespace web {
namespace {

using std::string;

enum Mode {
  OP = 0,       // first party google3 one platform services
  GRPCWEB = 1,  // client using the application/grpc-web wire format
};

enum ImportStyle {
  CLOSURE = 0,     // goog.require("grpc.web.*")
  COMMONJS = 1,    // const grpcWeb = require("grpc-web")
  TYPESCRIPT = 2,  // import * as grpcWeb from 'grpc-web'
};

const char GRPC_PROMISE[] = "grpc.web.promise.GrpcWebPromise";

const char* kKeyword[] = {
    "abstract",   "boolean",      "break",      "byte",    "case",
    "catch",      "char",         "class",      "const",   "continue",
    "debugger",   "default",      "delete",     "do",      "double",
    "else",       "enum",         "export",     "extends", "false",
    "final",      "finally",      "float",      "for",     "function",
    "goto",       "if",           "implements", "import",  "in",
    "instanceof", "int",          "interface",  "long",    "native",
    "new",        "null",         "package",    "private", "protected",
    "public",     "return",       "short",      "static",  "super",
    "switch",     "synchronized", "this",       "throw",   "throws",
    "transient",  "try",          "typeof",     "var",     "void",
    "volatile",   "while",        "with",
};

// Edit the version here prior to release
static const std::string GRPC_WEB_VERSION = "1.4.2";

string GetProtocVersion(GeneratorContext* context) {
  Version compiler_version;
  context->GetCompilerVersion(&compiler_version);
  return std::to_string(compiler_version.major()) + "." +
         std::to_string(compiler_version.minor()) + "." +
         std::to_string(compiler_version.patch()) +
         compiler_version.suffix();
}

bool IsReserved(const string& ident) {
  for (size_t i = 0; i < sizeof(kKeyword) / sizeof(kKeyword[0]); i++) {
    if (ident == kKeyword[i]) {
      return true;
    }
  }
  return false;
}

string GetModeVar(const Mode mode) {
  switch (mode) {
    case OP:
      return "OP";
    case GRPCWEB:
      return "GrpcWeb";
  }
  return "";
}

string GetDeserializeMethodName(std::map<string, string> vars) {
  if (vars["mode"] == GetModeVar(Mode::OP) && vars["binary"] == "false") {
    return "deserialize";
  }
  return "deserializeBinary";
}

string GetSerializeMethodName(std::map<string, string> vars) {
  if (vars["mode"] == GetModeVar(Mode::OP) && vars["binary"] == "false") {
    return "serialize";
  }
  return "serializeBinary";
}

std::string GetSerializeMethodReturnType(std::map<string, string> vars) {
  if (vars["mode"] == GetModeVar(Mode::OP) && vars["binary"] == "false") {
    return "string";
  }
  return "!Uint8Array";
}

string LowercaseFirstLetter(string s) {
  if (s.empty()) {
    return s;
  }
  s[0] = ::tolower(s[0]);
  return s;
}

string Lowercase(string s) {
  if (s.empty()) {
    return s;
  }

  for (size_t i = 0; i < s.size(); i++) {
    s[i] = ::tolower(s[i]);
  }
  return s;
}

string UppercaseFirstLetter(string s) {
  if (s.empty()) {
    return s;
  }
  s[0] = ::toupper(s[0]);
  return s;
}

string Uppercase(string s) {
  if (s.empty()) {
    return s;
  }

  for (size_t i = 0; i < s.size(); i++) {
    s[i] = ::toupper(s[i]);
  }
  return s;
}

// The following 5 functions were copied from
// google/protobuf/src/google/protobuf/stubs/strutil.h

inline bool HasPrefixString(const string& str, const string& prefix) {
  return str.size() >= prefix.size() &&
         str.compare(0, prefix.size(), prefix) == 0;
}

// Strips the given prefix from the string, as well as the remaining leading dot
// if it exists.
inline string StripPrefixString(const string& str, const string& prefix) {
  if (!HasPrefixString(str, prefix)) {
    return str;
  }

  string remaining_str = str.substr(prefix.size());
  if (!remaining_str.empty() && remaining_str[0] == '.') {
    remaining_str = remaining_str.substr(1);
  }
  return remaining_str;
}

inline bool HasSuffixString(const string& str, const string& suffix) {
  return str.size() >= suffix.size() &&
         str.compare(str.size() - suffix.size(), suffix.size(), suffix) == 0;
}

inline string StripSuffixString(const string& str, const string& suffix) {
  if (HasSuffixString(str, suffix)) {
    return str.substr(0, str.size() - suffix.size());
  } else {
    return str;
  }
}

void ReplaceCharacters(string* s, const char* remove, char replacewith) {
  const char* str_start = s->c_str();
  const char* str = str_start;
  for (str = strpbrk(str, remove); str != nullptr;
       str = strpbrk(str + 1, remove)) {
    (*s)[str - str_start] = replacewith;
  }
}

// The following function was copied from
// google/protobuf/src/google/protobuf/compiler/cpp/cpp_helpers.cc

string StripProto(const string& filename) {
  if (HasSuffixString(filename, ".protodevel")) {
    return StripSuffixString(filename, ".protodevel");
  } else {
    return StripSuffixString(filename, ".proto");
  }
}

// The following 6 functions were copied from
// google/protobuf/src/google/protobuf/compiler/js/js_generator.cc

char ToLowerASCII(char c) {
  if (c >= 'A' && c <= 'Z') {
    return (c - 'A') + 'a';
  } else {
    return c;
  }
}

std::vector<string> ParseLowerUnderscore(const string& input) {
  std::vector<string> words;
  string running = "";
  for (size_t i = 0; i < input.size(); i++) {
    if (input[i] == '_') {
      if (!running.empty()) {
        words.push_back(running);
        running.clear();
      }
    } else {
      running += ToLowerASCII(input[i]);
    }
  }
  if (!running.empty()) {
    words.push_back(running);
  }
  return words;
}

string ToUpperCamel(const std::vector<string>& words) {
  string result;
  for (size_t i = 0; i < words.size(); i++) {
    string word = words[i];
    if (word[0] >= 'a' && word[0] <= 'z') {
      word[0] = (word[0] - 'a') + 'A';
    }
    result += word;
  }
  return result;
}

// Returns the alias we assign to the module of the given .proto filename
// when importing.
string ModuleAlias(const string& filename) {
  // This scheme could technically cause problems if a file includes any 2 of:
  //   foo/bar_baz.proto
  //   foo_bar_baz.proto
  //   foo_bar/baz.proto
  //
  // We'll worry about this problem if/when we actually see it.  This name isn't
  // exposed to users so we can change it later if we need to.
  string basename = StripProto(filename);
  ReplaceCharacters(&basename, "-", '$');
  ReplaceCharacters(&basename, "/", '_');
  ReplaceCharacters(&basename, ".", '_');
  return basename + "_pb";
}

string JSMessageType(const Descriptor* desc, const FileDescriptor* file) {
  string class_name = StripPrefixString(desc->full_name(), desc->file()->package());
  if (desc->file() == file) {
    // [for protobuf .d.ts files only] Do not add the module prefix for local
    // messages.
    return class_name;
  }
  return ModuleAlias(desc->file()->name()) + "." + class_name;
}

string JSMessageType(const Descriptor* desc) {
  return JSMessageType(desc, nullptr);
}

string JSElementType(const FieldDescriptor* desc, const FileDescriptor* file) {
  switch (desc->type()) {
    case FieldDescriptor::TYPE_DOUBLE:
    case FieldDescriptor::TYPE_FLOAT:
    case FieldDescriptor::TYPE_INT32:
    case FieldDescriptor::TYPE_UINT32:
    case FieldDescriptor::TYPE_SINT32:
    case FieldDescriptor::TYPE_FIXED32:
    case FieldDescriptor::TYPE_SFIXED32:
      return "number";

    case FieldDescriptor::TYPE_INT64:
    case FieldDescriptor::TYPE_UINT64:
    case FieldDescriptor::TYPE_SINT64:
    case FieldDescriptor::TYPE_FIXED64:
    case FieldDescriptor::TYPE_SFIXED64:
      if (desc->options().jstype() == FieldOptions::JS_STRING) {
        return "string";
      } else {
        return "number";
      }

    case FieldDescriptor::TYPE_BOOL:
      return "boolean";

    case FieldDescriptor::TYPE_STRING:
      return "string";

    case FieldDescriptor::TYPE_BYTES:
      return "Uint8Array | string";

    case FieldDescriptor::TYPE_ENUM:
      if (desc->enum_type()->file() == file) {
        // [for protobuf .d.ts files only] Do not add the module prefix for
        // local messages.
        return StripPrefixString(desc->enum_type()->full_name(),
                                 desc->enum_type()->file()->package());
      }
      return ModuleAlias(desc->enum_type()->file()->name()) + "." +
             StripPrefixString(desc->enum_type()->full_name(),
                               desc->enum_type()->file()->package());

    case FieldDescriptor::TYPE_MESSAGE:
      return JSMessageType(desc->message_type(), file);

    default:
      return "{}";
  }
}

string JSFieldType(const FieldDescriptor* desc, const FileDescriptor* file) {
  string js_field_type = JSElementType(desc, file);
  if (desc->is_map()) {
    string key_type = JSFieldType(desc->message_type()->field(0), file);
    string value_type = JSFieldType(desc->message_type()->field(1), file);
    return "jspb.Map<" + key_type + ", " + value_type + ">";
  }
  if (desc->is_repeated()) {
    return "Array<" + js_field_type + ">";
  }
  return js_field_type;
}

string AsObjectFieldType(const FieldDescriptor* desc,
                         const FileDescriptor* file) {
  if (desc->type() != FieldDescriptor::TYPE_MESSAGE) {
    return JSFieldType(desc, file);
  }
  if (desc->is_map()) {
    const Descriptor* message = desc->message_type();
    string key_type = AsObjectFieldType(message->field(0), file);
    string value_type = AsObjectFieldType(message->field(1), file);
    return "Array<[" + key_type + ", " + value_type + "]>";
  }
  string field_type = JSMessageType(desc->message_type(), file) + ".AsObject";
  if (desc->is_repeated()) {
    return "Array<" + field_type + ">";
  }
  return field_type;
}

string JSElementName(const FieldDescriptor* desc) {
  return ToUpperCamel(ParseLowerUnderscore(desc->name()));
}

string JSFieldName(const FieldDescriptor* desc) {
  string js_field_name = JSElementName(desc);
  if (desc->is_map()) {
    js_field_name += "Map";
  } else if (desc->is_repeated()) {
    js_field_name += "List";
  }
  return js_field_name;
}

// Like ToUpperCamel except the first letter is not converted.
string ToCamelCase(const std::vector<string>& words) {
  if (words.empty()) {
    return "";
  }
  string result = words[0];
  return result + ToUpperCamel(std::vector<string>(
                      words.begin() + 1, words.begin() + words.size()));
}

// Like JSFieldName, but with first letter not uppercased
string CamelCaseJSFieldName(const FieldDescriptor* desc) {
  string js_field_name = ToCamelCase(ParseLowerUnderscore(desc->name()));
  if (desc->is_map()) {
    js_field_name += "Map";
  } else if (desc->is_repeated()) {
    js_field_name += "List";
  }
  return js_field_name;
}

// Returns the name of the message with a leading dot and taking into account
// nesting, for example ".OuterMessage.InnerMessage", or returns empty if
// descriptor is null. This function does not handle namespacing, only message
// nesting.
string GetNestedMessageName(const Descriptor* descriptor) {
  if (descriptor == nullptr) {
    return "";
  }
  string result =
      StripPrefixString(descriptor->full_name(), descriptor->file()->package());
  // Add a leading dot if one is not already present.
  if (!result.empty() && result[0] != '.') {
    result = "." + result;
  }
  return result;
}

// Given a filename like foo/bar/baz.proto, returns the root directory
// path ../../
string GetRootPath(const string& from_filename, const string& to_filename) {
  if (HasPrefixString(to_filename, "google/protobuf")) {
    // Well-known types (.proto files in the google/protobuf directory) are
    // assumed to come from the 'google-protobuf' npm package.  We may want to
    // generalize this exception later by letting others put generated code in
    // their own npm packages.
    return "google-protobuf/";
  }

  size_t slashes = std::count(from_filename.begin(), from_filename.end(), '/');
  if (slashes == 0) {
    return "./";
  }
  string result = "";
  for (size_t i = 0; i < slashes; i++) {
    result += "../";
  }
  return result;
}

// Splits path immediately following the final slash, separating it into a
// directory and file name component. Directory will contain the last
// slash, if it's not empty.
// If there is no slash in path, Split returns an empty directory and
// basename set to path.
// Output values have the property that path = directory + basename.
void PathSplit(const string& path, string* directory, string* basename) {
  string::size_type last_slash = path.rfind('/');
  if (last_slash == string::npos) {
    if (directory) {
      *directory = "";
    }
    if (basename) {
      *basename = path;
    }
  } else {
    if (directory) {
      *directory = path.substr(0, last_slash + 1);
    }
    if (basename) {
      *basename = path.substr(last_slash + 1);
    }
  }
}

// Returns the basename of a file.
string GetBasename(string filename) {
  string basename;
  PathSplit(filename, nullptr, &basename);
  return basename;
}

// Finds all message types used in all services in the file. Return results as a
// map of full names to descriptors to get sorted results and deterministic
// build outputs.
std::map<string, const Descriptor*> GetAllMessages(const FileDescriptor* file) {
  std::map<string, const Descriptor*> messages;
  for (int s = 0; s < file->service_count(); ++s) {
    const ServiceDescriptor* service = file->service(s);
    for (int m = 0; m < service->method_count(); ++m) {
      const MethodDescriptor* method = service->method(m);
      messages[method->input_type()->full_name()] = method->input_type();
      messages[method->output_type()->full_name()] = method->output_type();
    }
  }

  return messages;
}

void PrintClosureDependencies(Printer* printer, const FileDescriptor* file) {
  for (const auto& entry : GetAllMessages(file)) {
    printer->Print("goog.require('proto.$full_name$');\n", "full_name",
                   entry.second->full_name());
  }
}

void PrintCommonJsMessagesDeps(Printer* printer, const FileDescriptor* file) {
  std::map<string, string> vars;

  for (int i = 0; i < file->dependency_count(); i++) {
    const string& name = file->dependency(i)->name();
    vars["alias"] = ModuleAlias(name);
    vars["dep_filename"] = GetRootPath(file->name(), name) + StripProto(name);
    // we need to give each cross-file import an alias
    printer->Print(vars, "\nvar $alias$ = require('$dep_filename$_pb.js')\n");
  }

  const string& package = file->package();
  vars["package_name"] = package;

  if (!package.empty()) {
    size_t offset = 0;
    size_t dotIndex = package.find('.');

    printer->Print(vars, "const proto = {};\n");

    while (dotIndex != string::npos) {
      vars["current_package_ns"] = package.substr(0, dotIndex);
      printer->Print(vars, "proto.$current_package_ns$ = {};\n");

      offset = dotIndex + 1;
      dotIndex = package.find('.', offset);
    }
  }

  // need to import the messages from our own file
  vars["filename"] = GetBasename(StripProto(file->name()));

  if (!package.empty()) {
    printer->Print(vars,
                   "proto.$package_name$ = require('./$filename$_pb.js');\n\n");
  } else {
    printer->Print(vars, "const proto = require('./$filename$_pb.js');\n\n");
  }
}

void PrintES6Imports(Printer* printer, const FileDescriptor* file) {
  std::map<string, string> vars;

  printer->Print("import * as grpcWeb from 'grpc-web';\n\n");

  std::set<string> imports;
  for (const auto& entry : GetAllMessages(file)) {
    const string& proto_filename = entry.second->file()->name();
    string dep_filename = GetRootPath(file->name(), proto_filename) + StripProto(proto_filename);
    if (imports.find(dep_filename) != imports.end()) {
      continue;
    }
    imports.insert(dep_filename);
    // We need to give each cross-file import an alias.
    printer->Print("import * as $alias$ from '$dep_filename$_pb'; // proto import: \"$proto_filename$\"\n",
                   "alias", ModuleAlias(proto_filename),
                   "dep_filename", dep_filename,
                   "proto_filename", proto_filename);
  }
  printer->Print("\n\n");
}

void PrintTypescriptFile(Printer* printer, const FileDescriptor* file,
                         std::map<string, string> vars) {
  PrintES6Imports(printer, file);
  for (int service_index = 0; service_index < file->service_count();
       ++service_index) {
    printer->Print("export class ");
    const ServiceDescriptor* service = file->service(service_index);
    vars["service_name"] = service->name();
    printer->Print(vars, "$service_name$Client {\n");
    printer->Indent();
    printer->Print(
        "client_: grpcWeb.AbstractClientBase;\n"
        "hostname_: string;\n"
        "credentials_: null | { [index: string]: string; };\n"
        "options_: null | { [index: string]: any; };\n\n"
        "constructor (hostname: string,\n"
        "             credentials?: null | { [index: string]: string; },\n"
        "             options?: null | { [index: string]: any; }) {\n");
    printer->Indent();
    printer->Print("if (!options) options = {};\n");
    printer->Print("if (!credentials) credentials = {};\n");
    if (vars["mode"] == GetModeVar(Mode::GRPCWEB)) {
      printer->Print(vars, "options['format'] = '$format$';\n\n");
    }
    printer->Print(vars,
                   "this.client_ = new grpcWeb.$mode$ClientBase(options);\n"
                   "this.hostname_ = hostname.replace(/\\/+$$/, '');\n"
                   "this.credentials_ = credentials;\n"
                   "this.options_ = options;\n");
    printer->Outdent();
    printer->Print("}\n\n");

    for (int method_index = 0; method_index < service->method_count();
         ++method_index) {
      const MethodDescriptor* method = service->method(method_index);
      vars["js_method_name"] = LowercaseFirstLetter(method->name());
      vars["method_name"] = method->name();
      vars["input_type"] = JSMessageType(method->input_type());
      vars["output_type"] = JSMessageType(method->output_type());
      vars["serialize_func_name"] = GetSerializeMethodName(vars);
      vars["deserialize_func_name"] = GetDeserializeMethodName(vars);
      vars["method_type"] = method->server_streaming()
                                ? "grpcWeb.MethodType.SERVER_STREAMING"
                                : "grpcWeb.MethodType.UNARY";
      if (!method->client_streaming()) {
        printer->Print(vars,
                       "methodDescriptor$method_name$ = "
                       "new grpcWeb.MethodDescriptor(\n");
        printer->Indent();
        printer->Print(vars,
                       "'/$package_dot$$service_name$/$method_name$',\n"
                       "$method_type$,\n"
                       "$input_type$,\n"
                       "$output_type$,\n"
                       "(request: $input_type$) => {\n"
                       "  return request.$serialize_func_name$();\n"
                       "},\n"
                       "$output_type$.$deserialize_func_name$\n");
        printer->Outdent();
        printer->Print(");\n\n");
        if (method->server_streaming()) {
          printer->Print(vars, "$js_method_name$(\n");
          printer->Indent();
          printer->Print(vars,
                         "request: $input_type$,\n"
                         "metadata?: grpcWeb.Metadata): "
                         "grpcWeb.ClientReadableStream<$output_type$> {\n");
          printer->Print(vars, "return this.client_.serverStreaming(\n");
          printer->Indent();
          printer->Print(vars,
                         "this.hostname_ +\n"
                         "  '/$package_dot$$service_name$/$method_name$',\n"
                         "request,\n"
                         "metadata || {},\n"
                         "this.methodDescriptor$method_name$);\n");
          printer->Outdent();
          printer->Outdent();
          printer->Print("}\n\n");
        } else {
          printer->Print(vars, "$js_method_name$(\n");
          printer->Indent();
          printer->Print(vars,
                         "request: $input_type$,\n"
                         "metadata: grpcWeb.Metadata | null): "
                         "$promise$<$output_type$>;\n\n");
          printer->Outdent();

          printer->Print(vars, "$js_method_name$(\n");
          printer->Indent();
          printer->Print(vars,
                         "request: $input_type$,\n"
                         "metadata: grpcWeb.Metadata | null,\n"
                         "callback: (err: grpcWeb.RpcError,\n"
                         "           response: $output_type$) => void): "
                         "grpcWeb.ClientReadableStream<$output_type$>;\n\n");
          printer->Outdent();

          printer->Print(vars, "$js_method_name$(\n");
          printer->Indent();
          printer->Print(vars,
                         "request: $input_type$,\n"
                         "metadata: grpcWeb.Metadata | null,\n"
                         "callback?: (err: grpcWeb.RpcError,\n"
                         "           response: $output_type$) => void) {\n");
          printer->Print(vars, "if (callback !== undefined) {\n");
          printer->Indent();
          printer->Print(vars, "return this.client_.rpcCall(\n");
          printer->Indent();
          printer->Print(vars,
                         "this.hostname_ +\n"
                         "  '/$package_dot$$service_name$/$method_name$',\n"
                         "request,\n"
                         "metadata || {},\n"
                         "this.methodDescriptor$method_name$,\n"
                         "callback);\n");
          printer->Outdent();
          printer->Outdent();
          printer->Print(vars,
                         "}\n"
                         "return this.client_.unaryCall(\n");
          printer->Print(vars,
                         "this.hostname_ +\n"
                         "  '/$package_dot$$service_name$/$method_name$',\n"
                         "request,\n"
                         "metadata || {},\n"
                         "this.methodDescriptor$method_name$);\n");
          printer->Outdent();
          printer->Print("}\n\n");
        }
      }
    }
    printer->Outdent();
    printer->Print("}\n\n");
  }
}

void PrintGrpcWebDtsClientClass(Printer* printer, const FileDescriptor* file,
                                const string& client_type) {
  std::map<string, string> vars;
  vars["client_type"] = client_type;
  vars["promise"] = "Promise";
  for (int service_index = 0; service_index < file->service_count();
       ++service_index) {
    printer->Print("export class ");
    const ServiceDescriptor* service = file->service(service_index);
    vars["service_name"] = service->name();
    printer->Print(vars, "$service_name$$client_type$ {\n");
    printer->Indent();
    printer->Print(
        "constructor (hostname: string,\n"
        "             credentials?: null | { [index: string]: string; },\n"
        "             options?: null | { [index: string]: any; });\n\n");
    for (int method_index = 0; method_index < service->method_count();
         ++method_index) {
      const MethodDescriptor* method = service->method(method_index);
      vars["js_method_name"] = LowercaseFirstLetter(method->name());
      vars["input_type"] = JSMessageType(method->input_type());
      vars["output_type"] = JSMessageType(method->output_type());
      if (!method->client_streaming()) {
        if (method->server_streaming()) {
          printer->Print(vars, "$js_method_name$(\n");
          printer->Indent();
          printer->Print(vars,
                         "request: $input_type$,\n"
                         "metadata?: grpcWeb.Metadata\n");
          printer->Outdent();
          printer->Print(vars,
                         "): grpcWeb.ClientReadableStream<$output_type$>;\n\n");
        } else {
          if (vars["client_type"] == "PromiseClient") {
            printer->Print(vars, "$js_method_name$(\n");
            printer->Indent();
            printer->Print(vars,
                           "request: $input_type$,\n"
                           "metadata?: grpcWeb.Metadata\n");
            printer->Outdent();
            printer->Print(vars, "): $promise$<$output_type$>;\n\n");
          } else {
            printer->Print(vars, "$js_method_name$(\n");
            printer->Indent();
            printer->Print(vars,
                           "request: $input_type$,\n"
                           "metadata: grpcWeb.Metadata | undefined,\n"
                           "callback: (err: grpcWeb.RpcError,\n"
                           "           response: $output_type$) => void\n");
            printer->Outdent();
            printer->Print(vars,
                           "): grpcWeb.ClientReadableStream<$output_type$>;");
            printer->Print("\n\n");
          }
        }
      }
    }
    printer->Outdent();
    printer->Print("}\n\n");
  }
}

void PrintGrpcWebDtsFile(Printer* printer, const FileDescriptor* file) {
  PrintES6Imports(printer, file);
  PrintGrpcWebDtsClientClass(printer, file, "Client");
  PrintGrpcWebDtsClientClass(printer, file, "PromiseClient");
}

void PrintProtoDtsEnum(Printer* printer, const EnumDescriptor* desc) {
  std::map<string, string> vars;
  vars["enum_name"] = desc->name();

  printer->Print(vars, "export enum $enum_name$ { \n");
  printer->Indent();
  for (int i = 0; i < desc->value_count(); i++) {
    vars["value_name"] = Uppercase(desc->value(i)->name());
    vars["value_number"] = std::to_string(desc->value(i)->number());
    printer->Print(vars, "$value_name$ = $value_number$,\n");
  }
  printer->Outdent();
  printer->Print("}\n");
}

void PrintProtoDtsOneofCase(Printer* printer, const OneofDescriptor* desc) {
  std::map<string, string> vars;
  vars["oneof_name"] = ToUpperCamel(ParseLowerUnderscore(desc->name()));
  vars["oneof_name_upper"] = Uppercase(desc->name());

  printer->Print(vars, "export enum $oneof_name$Case { \n");
  printer->Indent();
  printer->Print(vars, "$oneof_name_upper$_NOT_SET = 0,\n");
  for (int i = 0; i < desc->field_count(); i++) {
    const FieldDescriptor* field = desc->field(i);
    vars["field_name"] = Uppercase(field->name());
    vars["field_number"] = std::to_string(field->number());
    printer->Print(vars, "$field_name$ = $field_number$,\n");
  }
  printer->Outdent();
  printer->Print("}\n");
}

void PrintProtoDtsMessage(Printer* printer, const Descriptor* desc,
                          const FileDescriptor* file) {
  const string& class_name = desc->name();
  std::map<string, string> vars;
  vars["class_name"] = class_name;

  printer->Print(vars, "export class $class_name$ extends jspb.Message {\n");
  printer->Indent();
  for (int i = 0; i < desc->field_count(); i++) {
    const FieldDescriptor* field = desc->field(i);
    vars["js_field_name"] = JSFieldName(field);
    vars["js_field_type"] = JSFieldType(field, file);
    if (field->type() != FieldDescriptor::TYPE_MESSAGE ||
        field->is_repeated()) {
      printer->Print(vars, "get$js_field_name$(): $js_field_type$;\n");
    } else {
      printer->Print(vars,
                     "get$js_field_name$(): $js_field_type$ | undefined;\n");
    }
    if (field->type() == FieldDescriptor::TYPE_BYTES && !field->is_repeated()) {
      printer->Print(vars,
                     "get$js_field_name$_asU8(): Uint8Array;\n"
                     "get$js_field_name$_asB64(): string;\n");
    }
    if (!field->is_map() && (field->type() != FieldDescriptor::TYPE_MESSAGE ||
                             field->is_repeated())) {
      printer->Print(vars,
                     "set$js_field_name$(value: $js_field_type$): "
                     "$class_name$;\n");
    } else if (!field->is_map()) {
      printer->Print(vars,
                     "set$js_field_name$(value?: $js_field_type$): "
                     "$class_name$;\n");
    }
    if (field->has_optional_keyword() ||
        (field->type() == FieldDescriptor::TYPE_MESSAGE &&
            !field->is_repeated() && !field->is_map())) {
      printer->Print(vars, "has$js_field_name$(): boolean;\n");
    }
    if (field->type() == FieldDescriptor::TYPE_MESSAGE || field->has_optional_keyword() ||
        field->is_repeated() || field->is_map()) {
      printer->Print(vars, "clear$js_field_name$(): $class_name$;\n");
    }
    if (field->is_repeated() && !field->is_map()) {
      vars["js_field_name"] = JSElementName(field);
      vars["js_field_type"] = JSElementType(field, file);
      if (field->type() != FieldDescriptor::TYPE_MESSAGE) {
        printer->Print(vars,
                       "add$js_field_name$(value: $js_field_type$, "
                       "index?: number): $class_name$;\n");
      } else {
        printer->Print(vars,
                       "add$js_field_name$(value?: $js_field_type$, "
                       "index?: number): $js_field_type$;\n");
      }
    }

    printer->Print("\n");
  }

  for (int i = 0; i < desc->oneof_decl_count(); i++) {
    const OneofDescriptor* oneof = desc->oneof_decl(i);
    if (!oneof->is_synthetic()) {
      vars["js_oneof_name"] = ToUpperCamel(ParseLowerUnderscore(oneof->name()));
      printer->Print(
          vars, "get$js_oneof_name$Case(): $class_name$.$js_oneof_name$Case;\n");
      printer->Print("\n");
    }
  }

  printer->Print(
      vars,
      "serializeBinary(): Uint8Array;\n"
      "toObject(includeInstance?: boolean): "
      "$class_name$.AsObject;\n"
      "static toObject(includeInstance: boolean, msg: $class_name$): "
      "$class_name$.AsObject;\n"
      "static serializeBinaryToWriter(message: $class_name$, writer: "
      "jspb.BinaryWriter): void;\n"
      "static deserializeBinary(bytes: Uint8Array): $class_name$;\n"
      "static deserializeBinaryFromReader(message: $class_name$, reader: "
      "jspb.BinaryReader): $class_name$;\n");
  printer->Outdent();
  printer->Print("}\n\n");

  printer->Print(vars, "export namespace $class_name$ {\n");
  printer->Indent();
  printer->Print("export type AsObject = {\n");
  printer->Indent();
  for (int i = 0; i < desc->field_count(); i++) {
    const FieldDescriptor* field = desc->field(i);
    string js_field_name = CamelCaseJSFieldName(field);
    if (IsReserved(js_field_name)) {
      js_field_name = "pb_" + js_field_name;
    }
    vars["js_field_name"] = js_field_name;
    vars["js_field_type"] = AsObjectFieldType(field, file);
    if ((field->type() != FieldDescriptor::TYPE_MESSAGE && !field->has_optional_keyword()) ||
        field->is_repeated()) {
      printer->Print(vars, "$js_field_name$: $js_field_type$,\n");
    } else {
      printer->Print(vars, "$js_field_name$?: $js_field_type$,\n");
    }
  }
  printer->Outdent();
  printer->Print("}\n");

  for (int i = 0; i < desc->nested_type_count(); i++) {
    if (desc->nested_type(i)->options().map_entry()) {
      continue;
    }
    printer->Print("\n");
    PrintProtoDtsMessage(printer, desc->nested_type(i), file);
  }

  for (int i = 0; i < desc->enum_type_count(); i++) {
    printer->Print("\n");
    PrintProtoDtsEnum(printer, desc->enum_type(i));
  }

  for (int i = 0; i < desc->oneof_decl_count(); i++) {
    printer->Print("\n");
    PrintProtoDtsOneofCase(printer, desc->oneof_decl(i));
  }

  printer->Outdent();
  printer->Print("}\n\n");
}

void PrintProtoDtsFile(Printer* printer, const FileDescriptor* file) {
  printer->Print("import * as jspb from 'google-protobuf'\n\n");

  for (int i = 0; i < file->dependency_count(); i++) {
    const string& name = file->dependency(i)->name();
    // We need to give each cross-file import an alias.
    printer->Print("import * as $alias$ from '$dep_filename$_pb';\n", "alias",
                   ModuleAlias(name), "dep_filename",
                   GetRootPath(file->name(), name) + StripProto(name));
  }
  printer->Print("\n\n");

  for (int i = 0; i < file->message_type_count(); i++) {
    PrintProtoDtsMessage(printer, file->message_type(i), file);
  }

  for (int i = 0; i < file->enum_type_count(); i++) {
    PrintProtoDtsEnum(printer, file->enum_type(i));
  }
}

void PrintFileHeader(Printer* printer, const std::map<string, string>& vars) {
  printer->Print(
      vars,
      "/**\n"
      " * @fileoverview gRPC-Web generated client stub for $package$\n"
      " * @enhanceable\n"
      " * @public\n"
      " */\n\n"
      "// Code generated by protoc-gen-grpc-web. DO NOT EDIT.\n"
      "// versions:\n"
      "// \tprotoc-gen-grpc-web v$version$\n"
      "// \tprotoc              v$protoc_version$\n"
      "// source: $source_file$\n\n\n"
      "/* eslint-disable */\n"
      "// @ts-nocheck\n\n\n");
}

void PrintMethodDescriptorFile(Printer* printer,
                               std::map<string, string> vars) {
  printer->Print(
      vars,
      "/**\n"
      " * @fileoverview gRPC-Web generated MethodDescriptors for $package$\n");
  if (vars["plugins"].empty()) {
    printer->Print(" * @enhanceable\n");
  }
  printer->Print(
      " * @public\n"
      " */\n\n"
      "// Code generated by protoc-gen-grpc-web. DO NOT EDIT.\n"
      "// versions:\n"
      "// \tprotoc-gen-grpc-web v$version$\n"
      "// \tprotoc              v$protoc_version$\n"
      "// source: $source_file$\n\n\n"
      "/* eslint-disable */\n"
      "// @ts-nocheck\n\n\n");

  printer->Print(vars,
                 "goog.provide('proto.$package_dot$$class_name$.$"
                 "method_name$MethodDescriptor');\n\n");
  if (!vars["plugins"].empty()) {
    printer->Print(vars,
                   "goog.require('$plugins$.$package_dot$$class_name$.$"
                   "method_name$MethodDescriptor');\n");
  }
  printer->Print(vars, "goog.require('grpc.web.MethodDescriptor');\n");
  printer->Print(vars, "goog.require('grpc.web.MethodType');\n");
  printer->Print(vars, "goog.require('$in_type$');\n");
  if (vars["out_type"] != vars["in_type"]) {
    printer->Print(vars, "goog.require('$out_type$');\n");
  }
  printer->Print(vars, "\n\ngoog.scope(function() {\n\n");

  printer->Print(
      vars,
      "/**\n"
      " * @const\n"
      " * @type {!grpc.web.MethodDescriptor<\n"
      " *   !proto.$in$,\n"
      " *   !proto.$out$>}\n"
      " */\n"
      "proto.$package_dot$$class_name$.$method_name$MethodDescriptor = \n");
  printer->Indent();
  printer->Indent();
  printer->Print(vars, "new grpc.web.MethodDescriptor(\n");
  printer->Indent();
  printer->Indent();
  printer->Print(vars,
                 "'/$package_dot$$service_name$/$method_name$',\n"
                 "$method_type$,\n"
                 "$in_type$,\n");
  printer->Print(vars,
                 "$out_type$,\n"
                 "/**\n"
                 " * @param {!proto.$in$} request\n");
  printer->Print(
      (" * @return {" + GetSerializeMethodReturnType(vars) + "}\n").c_str());
  printer->Print(
      " */\n"
      "function(request) {\n");
  printer->Print(
      ("  return request." + GetSerializeMethodName(vars) + "();\n").c_str());
  printer->Print("},\n");
  printer->Print(vars,
                 ("$out_type$." + GetDeserializeMethodName(vars)).c_str());
  printer->Print(vars, ");\n\n\n");
  printer->Outdent();
  printer->Outdent();
  printer->Outdent();
  printer->Outdent();
  printer->Print("}); // goog.scope\n\n");
}

void PrintServiceConstructor(Printer* printer, std::map<string, string> vars,
                             bool is_promise) {
  vars["is_promise"] = is_promise ? "Promise" : "";
  printer->Print(vars,
                 "/**\n"
                 " * @param {string} hostname\n"
                 " * @param {?Object} credentials\n"
                 " * @param {?grpc.web.ClientOptions} options\n"
                 " * @constructor\n"
                 " * @struct\n"
                 " * @final\n"
                 " */\n"
                 "proto.$package_dot$$service_name$$is_promise$Client =\n"
                 "    function(hostname, credentials, options) {\n"
                 "  if (!options) options = {};\n");
  if (vars["mode"] == GetModeVar(Mode::GRPCWEB)) {
    printer->Print(vars, "  options.format = '$format$';\n\n");
  }
  if (vars["mode"] == GetModeVar(Mode::OP)) {
    printer->Print(
        vars,
        "  /**\n"
        "   * @private @const {!grpc.web.$mode$ClientBase} The client\n"
        "   */\n"
        "  this.client_ = new grpc.web.$mode$ClientBase(options, "
        "$binary$);\n\n");
  } else {
    printer->Print(
        vars,
        "  /**\n"
        "   * @private @const {!grpc.web.$mode$ClientBase} The client\n"
        "   */\n"
        "  this.client_ = new grpc.web.$mode$ClientBase(options);\n\n");
  }
  printer->PrintRaw(
                 "  /**\n"
                 "   * @private @const {string} The hostname\n"
                 "   */\n"
                 "  this.hostname_ = hostname.replace(/\\/+$/, '');\n\n"
                 "};\n\n\n");
}

void PrintMethodDescriptor(Printer* printer, std::map<string, string> vars) {
  printer->Print(vars,
                 "/**\n"
                 " * @const\n"
                 " * @type {!grpc.web.MethodDescriptor<\n"
                 " *   !proto.$in$,\n"
                 " *   !proto.$out$>}\n"
                 " */\n"
                 "const methodDescriptor_$service_name$_$method_name$ = "
                 "new grpc.web.MethodDescriptor(\n");
  printer->Indent();
  printer->Print(vars,
                 "'/$package_dot$$service_name$/$method_name$',\n"
                 "$method_type$,\n"
                 "$in_type$,\n");
  printer->Print(vars,
                 "$out_type$,\n"
                 "/**\n"
                 " * @param {!proto.$in$} request\n");
  printer->Print(
      (" * @return {" + GetSerializeMethodReturnType(vars) + "}\n").c_str());
  printer->Print(
      " */\n"
      "function(request) {\n");
  printer->Print(
      ("  return request." + GetSerializeMethodName(vars) + "();\n").c_str());
  printer->Print("},\n");
  printer->Print(
      vars, ("$out_type$." + GetDeserializeMethodName(vars) + "\n").c_str());
  printer->Outdent();
  printer->Print(vars, ");\n\n\n");
}

void PrintUnaryCall(Printer* printer, std::map<string, string> vars) {
  printer->Print(
      vars,
      "/**\n"
      " * @param {!proto.$in$} request The\n"
      " *     request proto\n"
      " * @param {?Object<string, string>} metadata User defined\n"
      " *     call metadata\n"
      " * @param {function(?grpc.web.RpcError,"
      " ?proto.$out$)}\n"
      " *     callback The callback function(error, response)\n"
      " * @return {!grpc.web.ClientReadableStream<!proto.$out$>|undefined}\n"
      " *     The XHR Node Readable Stream\n"
      " */\n"
      "proto.$package_dot$$service_name$Client.prototype.$js_method_name$ =\n");
  printer->Indent();
  printer->Print(vars,
                 "  function(request, metadata, callback) {\n"
                 "return this.client_.rpcCall(this.hostname_ +\n");
  printer->Indent();
  printer->Indent();
  if (vars["mode"] == GetModeVar(Mode::OP)) {
    printer->Print(vars,
                   "'/$$rpc/$package_dot$$service_name$/$method_name$',\n");
  } else {
    printer->Print(vars, "'/$package_dot$$service_name$/$method_name$',\n");
  }
  printer->Print(vars,
                 "request,\n"
                 "metadata || {},\n"
                 "$method_descriptor$,\n"
                 "callback);\n");
  printer->Outdent();
  printer->Outdent();
  printer->Outdent();
  printer->Print("};\n\n\n");
}

void PrintPromiseUnaryCall(Printer* printer, std::map<string, string> vars) {
  printer->Print(vars,
                 "/**\n"
                 " * @param {!proto.$in$} request The\n"
                 " *     request proto\n"
                 " * @param {?Object<string, string>=} metadata User defined\n"
                 " *     call metadata\n"
                 " * @return {!$promise$<!proto.$out$>}\n"
                 " *     Promise that resolves to the response\n"
                 " */\n"
                 "proto.$package_dot$$service_name$PromiseClient.prototype"
                 ".$js_method_name$ =\n");
  printer->Indent();
  printer->Print(vars,
                 "  function(request, metadata) {\n"
                 "return this.client_.unaryCall(this.hostname_ +\n");
  printer->Indent();
  printer->Indent();
  if (vars["mode"] == GetModeVar(Mode::OP)) {
    printer->Print(vars,
                   "'/$$rpc/$package_dot$$service_name$/$method_name$',\n");
  } else {
    printer->Print(vars, "'/$package_dot$$service_name$/$method_name$',\n");
  }
  printer->Print(vars,
                 "request,\n"
                 "metadata || {},\n"
                 "$method_descriptor$);\n");
  printer->Outdent();
  printer->Outdent();
  printer->Outdent();
  printer->Print("};\n\n\n");
}

void PrintServerStreamingCall(Printer* printer, std::map<string, string> vars) {
  printer->Print(vars,
                 "/**\n"
                 " * @param {!proto.$in$} request The request proto\n"
                 " * @param {?Object<string, string>=} metadata User defined\n"
                 " *     call metadata\n"
                 " * @return {!grpc.web.ClientReadableStream<!proto.$out$>}\n"
                 " *     The XHR Node Readable Stream\n"
                 " */\n"
                 "proto.$package_dot$$service_name$$client_type$.prototype."
                 "$js_method_name$ =\n");
  printer->Indent();
  printer->Print(
      "  function(request, metadata) {\n"
      "return this.client_.serverStreaming(this.hostname_ +\n");
  printer->Indent();
  printer->Indent();
  if (vars["mode"] == GetModeVar(Mode::OP)) {
    printer->Print(vars,
                   "'/$$rpc/$package_dot$$service_name$/$method_name$',\n");
  } else {
    printer->Print(vars, "'/$package_dot$$service_name$/$method_name$',\n");
  }
  printer->Print(vars,
                 "request,\n"
                 "metadata || {},\n"
                 "$method_descriptor$);\n");
  printer->Outdent();
  printer->Outdent();
  printer->Outdent();
  printer->Print("};\n\n\n");
}

void PrintMultipleFilesMode(const FileDescriptor* file, string file_name,
                            GeneratorContext* context,
                            std::map<string, string> vars) {
  std::map<string, string> method_descriptors;
  bool has_server_streaming = false;

  // Print MethodDescriptor files.
  for (int i = 0; i < file->service_count(); ++i) {
    const ServiceDescriptor* service = file->service(i);
    vars["service_name"] = service->name();
    vars["class_name"] = LowercaseFirstLetter(service->name());

    for (int method_index = 0; method_index < service->method_count();
         ++method_index) {
      const MethodDescriptor* method = service->method(method_index);
      string method_file_name = Lowercase(service->name()) + "_" +
                                Lowercase(method->name()) +
                                "_methoddescriptor.js";
      if (method->server_streaming()) {
        has_server_streaming = true;
      }
      std::unique_ptr<ZeroCopyOutputStream> output(
          context->Open(method_file_name));
      Printer printer(output.get(), '$');

      vars["method_name"] = method->name();
      vars["in"] = method->input_type()->full_name();
      vars["in_type"] = "proto." + method->input_type()->full_name();
      vars["out"] = method->output_type()->full_name();
      vars["out_type"] = "proto." + method->output_type()->full_name();
      vars["method_type"] = method->server_streaming()
                                ? "grpc.web.MethodType.SERVER_STREAMING"
                                : "grpc.web.MethodType.UNARY";

      PrintMethodDescriptorFile(&printer, vars);
      method_descriptors[service->name() + "." + method->name()] =
          "proto." + vars["package_dot"] + vars["class_name"] + "." +
          vars["method_name"] + "MethodDescriptor";
    }
  }

  std::unique_ptr<ZeroCopyOutputStream> output1(
      context->Open(file_name + "_client_pb.js"));
  Printer printer1(output1.get(), '$');
  std::unique_ptr<ZeroCopyOutputStream> output2(
      context->Open(file_name + "_promise_client_pb.js"));
  Printer printer2(output2.get(), '$');

  PrintFileHeader(&printer1, vars);
  PrintFileHeader(&printer2, vars);

  // Print the Promise and callback client.
  for (int i = 0; i < file->service_count(); ++i) {
    const ServiceDescriptor* service = file->service(i);
    vars["service_name"] = service->name();
    printer1.Print(vars,
                   "goog.provide('proto.$package_dot$$service_name$"
                   "Client');\n\n");
    printer2.Print(vars,
                   "goog.provide('proto.$package_dot$$service_name$"
                   "PromiseClient');\n\n");
  }

  if (vars["promise"] == GRPC_PROMISE) {
    printer2.Print(vars, "goog.require('grpc.web.promise');\n");
  }
  std::map<string, string>::iterator it;
  for (it = method_descriptors.begin(); it != method_descriptors.end(); it++) {
    vars["import_mtd"] = it->second;
    printer1.Print(vars, "goog.require('$import_mtd$');\n");
    printer2.Print(vars, "goog.require('$import_mtd$');\n");
  }
  printer1.Print(vars, "goog.require('grpc.web.$mode$ClientBase');\n");
  printer1.Print(vars, "goog.require('grpc.web.ClientReadableStream');\n");
  printer1.Print(vars, "goog.require('grpc.web.RpcError');\n");
  printer2.Print(vars, "goog.require('grpc.web.$mode$ClientBase');\n");
  if (has_server_streaming) {
    printer2.Print(vars, "goog.require('grpc.web.ClientReadableStream');\n");
  }

  PrintClosureDependencies(&printer1, file);
  PrintClosureDependencies(&printer2, file);

  printer1.Print(vars, "\ngoog.requireType('grpc.web.ClientOptions');\n");
  printer2.Print(vars, "\ngoog.requireType('grpc.web.ClientOptions');\n");

  printer1.Print("\n\n\n");
  printer2.Print("\n\n\n");
  printer1.Print("goog.scope(function() {\n\n");
  printer2.Print("goog.scope(function() {\n\n");

  for (int service_index = 0; service_index < file->service_count();
       ++service_index) {
    const ServiceDescriptor* service = file->service(service_index);
    vars["service_name"] = service->name();
    PrintServiceConstructor(&printer1, vars, false);
    PrintServiceConstructor(&printer2, vars, true);

    for (int method_index = 0; method_index < service->method_count();
         ++method_index) {
      const MethodDescriptor* method = service->method(method_index);
      const Descriptor* input_type = method->input_type();
      const Descriptor* output_type = method->output_type();
      vars["js_method_name"] = LowercaseFirstLetter(method->name());
      vars["method_name"] = method->name();
      vars["in"] = input_type->full_name();
      vars["out"] = output_type->full_name();
      vars["method_descriptor"] =
          method_descriptors[service->name() + "." + method->name()];
      vars["in_type"] = "proto." + input_type->full_name();
      vars["out_type"] = "proto." + output_type->full_name();

      // Client streaming is not supported yet
      if (!method->client_streaming()) {
        if (method->server_streaming()) {
          vars["method_type"] = "grpc.web.MethodType.SERVER_STREAMING";
          vars["client_type"] = "Client";
          PrintServerStreamingCall(&printer1, vars);
          vars["client_type"] = "PromiseClient";
          PrintServerStreamingCall(&printer2, vars);
        } else {
          vars["method_type"] = "grpc.web.MethodType.UNARY";
          PrintUnaryCall(&printer1, vars);
          PrintPromiseUnaryCall(&printer2, vars);
        }
      }
    }
  }
  printer1.Print("}); // goog.scope\n\n");
  printer2.Print("}); // goog.scope\n\n");
}

void PrintClosureES6Imports(Printer* printer, const FileDescriptor* file,
                            string package_dot) {
  for (int i = 0; i < file->service_count(); ++i) {
    const ServiceDescriptor* service = file->service(i);

    string service_namespace = "proto." + package_dot + service->name();
    printer->Print(
        "import $service_name$Client_import from 'goog:$namespace$';\n",
        "service_name", service->name(), "namespace",
        service_namespace + "Client");
    printer->Print(
        "import $service_name$PromiseClient_import from 'goog:$namespace$';\n",
        "service_name", service->name(), "namespace",
        service_namespace + "PromiseClient");
  }

  printer->Print("\n\n\n");
}

void PrintGrpcWebClosureES6File(Printer* printer, const FileDescriptor* file) {
  string package_dot = file->package().empty() ? "" : file->package() + ".";

  printer->Print(
      "/**\n"
      " * @fileoverview gRPC-Web generated client stub for '$file$'\n"
      " */\n"
      "\n"
      "// Code generated by protoc-gen-grpc-web. DO NOT EDIT.\n"
      "// versions:\n"
      "// \tprotoc-gen-grpc-web v$version$\n"
      "// \tprotoc              v$protoc_version$\n"
      "// source: $source_file$\n"
      "\n"
      "\n",
      "file", file->name());

  PrintClosureES6Imports(printer, file, package_dot);

  for (int i = 0; i < file->service_count(); ++i) {
    const ServiceDescriptor* service = file->service(i);

    string service_namespace = "proto." + package_dot + service->name();
    printer->Print("export const $name$Client = $name$Client_import;\n", "name",
                   service->name());
    printer->Print(
        "export const $name$PromiseClient = $name$PromiseClient_import;\n",
        "name", service->name());
  }
}

class GeneratorOptions {
 public:
  GeneratorOptions();

  bool ParseFromOptions(const string& parameter, string* error);
  bool ParseFromOptions(const std::vector<std::pair<string, string>>& options,
                        string* error);

  // Returns the name of the output file for |proto_file|.
  string OutputFile(const string& proto_file) const;

  string mode() const { return mode_; }
  string plugins() const { return plugins_; }
  ImportStyle import_style() const { return import_style_; }
  bool generate_dts() const { return generate_dts_; }
  bool generate_closure_es6() const { return generate_closure_es6_; }
  bool multiple_files() const { return multiple_files_; }
  bool goog_promise() const { return goog_promise_; }

 private:
  string file_name_;
  string mode_;
  string plugins_;
  ImportStyle import_style_;
  bool generate_dts_;
  bool generate_closure_es6_;
  bool multiple_files_;
  bool goog_promise_;
};

GeneratorOptions::GeneratorOptions()
    : file_name_(""),
      mode_(""),
      plugins_(""),
      import_style_(ImportStyle::CLOSURE),
      generate_dts_(false),
      generate_closure_es6_(false),
      multiple_files_(false),
      goog_promise_(false) {}

bool GeneratorOptions::ParseFromOptions(const string& parameter,
                                        string* error) {
  std::vector<std::pair<string, string>> options;
  ParseGeneratorParameter(parameter, &options);
  return ParseFromOptions(options, error);
}

bool GeneratorOptions::ParseFromOptions(
    const std::vector<std::pair<string, string>>& options, string* error) {
  for (const std::pair<string, string>& option : options) {
    if ("out" == option.first) {
      file_name_ = option.second;
    } else if ("mode" == option.first) {
      mode_ = option.second;
    } else if ("import_style" == option.first) {
      if ("closure" == option.second) {
        import_style_ = ImportStyle::CLOSURE;
      } else if ("experimental_closure_es6" == option.second) {
        import_style_ = ImportStyle::CLOSURE;
        generate_closure_es6_ = true;
      } else if ("commonjs" == option.second) {
        import_style_ = ImportStyle::COMMONJS;
      } else if ("commonjs+dts" == option.second) {
        import_style_ = ImportStyle::COMMONJS;
        generate_dts_ = true;
      } else if ("typescript" == option.second) {
        import_style_ = ImportStyle::TYPESCRIPT;
        generate_dts_ = true;
      } else {
        *error = "options: invalid import_style - " + option.second;
        return false;
      }
    } else if ("multiple_files" == option.first) {
      multiple_files_ = "True" == option.second;
    } else if ("plugins" == option.first) {
      plugins_ = option.second;
    } else if ("goog_promise" == option.first) {
      goog_promise_ = "True" == option.second;
    } else {
      *error = "unsupported option: " + option.first;
      return false;
    }
  }

  if (mode_.empty()) {
    *error = "options: mode is required";
    return false;
  }

  return true;
}

string GeneratorOptions::OutputFile(const string& proto_file) const {
  if (ImportStyle::TYPESCRIPT == import_style()) {
    // Never use the value from the 'out' option when generating TypeScript.
    string directory;
    string basename;
    PathSplit(proto_file, &directory, &basename);
    return directory + UppercaseFirstLetter(StripProto(basename)) +
           "ServiceClientPb.ts";
  }
  if (!file_name_.empty()) {
    return file_name_;
  }
  return StripProto(proto_file) + "_grpc_web_pb.js";
}

class GrpcCodeGenerator : public CodeGenerator {
 public:
  GrpcCodeGenerator() {}
  ~GrpcCodeGenerator() override {}

  uint64_t GetSupportedFeatures() const override {
    // Code generators must explicitly support proto3 optional.
    return CodeGenerator::FEATURE_PROTO3_OPTIONAL;
  }

  bool Generate(const FileDescriptor* file, const string& parameter,
                GeneratorContext* context, string* error) const override {
    GeneratorOptions generator_options;
    if (!generator_options.ParseFromOptions(parameter, error)) {
      return false;
    }

    std::map<string, string> vars;
    std::map<string, string> method_descriptors;
    string package = file->package();
    vars["package"] = package;
    vars["package_dot"] = package.empty() ? "" : package + '.';
    vars["promise"] = "Promise";
    vars["plugins"] = generator_options.plugins();

    if ("binary" == generator_options.mode()) {
      vars["mode"] = GetModeVar(Mode::OP);
      vars["binary"] = "true";
    } else if ("grpcweb" == generator_options.mode()) {
      vars["mode"] = GetModeVar(Mode::GRPCWEB);
      vars["format"] = "binary";
    } else if ("grpcwebtext" == generator_options.mode()) {
      vars["mode"] = GetModeVar(Mode::GRPCWEB);
      vars["format"] = "text";
    } else if ("jspb" == generator_options.mode()) {
      vars["mode"] = GetModeVar(Mode::OP);
      vars["binary"] = "false";
      if (generator_options.goog_promise()) {
        vars["promise"] = GRPC_PROMISE;
      }
    } else {
      *error = "options: invalid mode - " + generator_options.mode();
      return false;
    }

    if (generator_options.generate_dts()) {
      string proto_dts_file_name = StripProto(file->name()) + "_pb.d.ts";
      std::unique_ptr<ZeroCopyOutputStream> proto_dts_output(
          context->Open(proto_dts_file_name));
      Printer proto_dts_printer(proto_dts_output.get(), '$');
      PrintProtoDtsFile(&proto_dts_printer, file);
    }

    if (!file->service_count()) {
      // No services, nothing to do.
      return true;
    }

    vars["version"]        = GRPC_WEB_VERSION;
    vars["protoc_version"] = GetProtocVersion(context);
    vars["source_file"]    = file->name();

    string file_name = generator_options.OutputFile(file->name());
    if (generator_options.multiple_files() &&
        ImportStyle::CLOSURE == generator_options.import_style()) {
      PrintMultipleFilesMode(file, file_name, context, vars);
      return true;
    }

    std::unique_ptr<ZeroCopyOutputStream> output(context->Open(file_name));
    Printer printer(output.get(), '$');
    PrintFileHeader(&printer, vars);

    if (ImportStyle::TYPESCRIPT == generator_options.import_style()) {
      PrintTypescriptFile(&printer, file, vars);
      return true;
    }

    for (int i = 0; i < file->service_count(); ++i) {
      const ServiceDescriptor* service = file->service(i);
      vars["service_name"] = service->name();
      switch (generator_options.import_style()) {
        case ImportStyle::CLOSURE:
          printer.Print(
              vars,
              "goog.provide('proto.$package_dot$$service_name$Client');\n");
          printer.Print(vars,
                        "goog.provide('proto.$package_dot$$service_name$"
                        "PromiseClient');\n");
          break;
        case ImportStyle::COMMONJS:
          break;
        case ImportStyle::TYPESCRIPT:
          break;
      }
    }
    printer.Print("\n");

    switch (generator_options.import_style()) {
      case ImportStyle::CLOSURE:
        if (vars["promise"] == GRPC_PROMISE) {
          printer.Print(vars, "goog.require('grpc.web.promise');\n");
        }
        printer.Print(vars, "goog.require('grpc.web.MethodDescriptor');\n");
        printer.Print(vars, "goog.require('grpc.web.MethodType');\n");
        printer.Print(vars, "goog.require('grpc.web.$mode$ClientBase');\n");
        printer.Print(vars, "goog.require('grpc.web.AbstractClientBase');\n");
        printer.Print(vars, "goog.require('grpc.web.ClientReadableStream');\n");
        printer.Print(vars, "goog.require('grpc.web.RpcError');\n");

        PrintClosureDependencies(&printer, file);
        printer.Print(vars, "\ngoog.requireType('grpc.web.ClientOptions');\n");
        printer.Print("\n\n\n");
        printer.Print("goog.scope(function() {\n\n");
        break;
      case ImportStyle::COMMONJS:
        printer.Print(vars, "const grpc = {};\n");
        printer.Print(vars, "grpc.web = require('grpc-web');\n\n");
        PrintCommonJsMessagesDeps(&printer, file);
        break;
      case ImportStyle::TYPESCRIPT:
        break;
    }

    for (int service_index = 0; service_index < file->service_count();
         ++service_index) {
      const ServiceDescriptor* service = file->service(service_index);
      vars["service_name"] = service->name();
      PrintServiceConstructor(&printer, vars, false);
      PrintServiceConstructor(&printer, vars, true);

      for (int method_index = 0; method_index < service->method_count();
           ++method_index) {
        const MethodDescriptor* method = service->method(method_index);
        const Descriptor* input_type = method->input_type();
        const Descriptor* output_type = method->output_type();
        vars["js_method_name"] = LowercaseFirstLetter(method->name());
        vars["method_name"] = method->name();
        vars["in"] = input_type->full_name();
        vars["out"] = output_type->full_name();
        vars["method_descriptor"] =
            "methodDescriptor_" + service->name() + "_" + method->name();

        // Cross-file ref in CommonJS needs to use the module alias instead
        // of the global name.
        if (ImportStyle::COMMONJS == generator_options.import_style() &&
            input_type->file() != file) {
          vars["in_type"] = ModuleAlias(input_type->file()->name()) +
                            GetNestedMessageName(input_type);
        } else {
          vars["in_type"] = "proto." + input_type->full_name();
        }
        if (ImportStyle::COMMONJS == generator_options.import_style() &&
            output_type->file() != file) {
          vars["out_type"] = ModuleAlias(output_type->file()->name()) +
                             GetNestedMessageName(output_type);
        } else {
          vars["out_type"] = "proto." + output_type->full_name();
        }

        // Client streaming is not supported yet
        if (!method->client_streaming()) {
          if (method->server_streaming()) {
            vars["method_type"] = "grpc.web.MethodType.SERVER_STREAMING";
            PrintMethodDescriptor(&printer, vars);
            vars["client_type"] = "Client";
            PrintServerStreamingCall(&printer, vars);
            vars["client_type"] = "PromiseClient";
            PrintServerStreamingCall(&printer, vars);
          } else {
            vars["method_type"] = "grpc.web.MethodType.UNARY";
            PrintMethodDescriptor(&printer, vars);
            PrintUnaryCall(&printer, vars);
            PrintPromiseUnaryCall(&printer, vars);
          }
        }
      }
    }

    switch (generator_options.import_style()) {
      case ImportStyle::CLOSURE:
        printer.Print("}); // goog.scope\n\n");
        break;
      case ImportStyle::COMMONJS:
        if (!vars["package"].empty()) {
          printer.Print(vars, "module.exports = proto.$package$;\n\n");
        } else {
          printer.Print(vars, "module.exports = proto;\n\n");
        }
        break;
      case ImportStyle::TYPESCRIPT:
        break;
    }

    if (generator_options.generate_dts()) {
      string grpcweb_dts_file_name =
          StripProto(file->name()) + "_grpc_web_pb.d.ts";
      string proto_dts_file_name = StripProto(file->name()) + "_pb.d.ts";

      std::unique_ptr<ZeroCopyOutputStream> grpcweb_dts_output(
          context->Open(grpcweb_dts_file_name));
      Printer grpcweb_dts_printer(grpcweb_dts_output.get(), '$');

      PrintGrpcWebDtsFile(&grpcweb_dts_printer, file);
    }

    if (generator_options.generate_closure_es6()) {
      string es6_file_name = StripProto(file->name()) + ".pb.grpc-web.js";

      std::unique_ptr<ZeroCopyOutputStream> es6_output(
          context->Open(es6_file_name));
      Printer es6_printer(es6_output.get(), '$');

      PrintGrpcWebClosureES6File(&es6_printer, file);
    }

    return true;
  }
};

}  // namespace
}  // namespace web
}  // namespace grpc

int main(int argc, char* argv[]) {
  if (argc == 2 && std::string(argv[1]) == "--version") {
    std::cout << argv[0] << " " << grpc::web::GRPC_WEB_VERSION << std::endl;
    return 0;
  }

  grpc::web::GrpcCodeGenerator generator;
  PluginMain(argc, argv, &generator);
  return 0;
}
