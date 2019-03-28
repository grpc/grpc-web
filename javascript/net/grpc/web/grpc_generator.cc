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
#include <google/protobuf/descriptor.h>
#include <google/protobuf/io/printer.h>
#include <google/protobuf/io/zero_copy_stream.h>
#include <google/protobuf/descriptor.pb.h>
#include <algorithm>
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
using google::protobuf::io::Printer;
using google::protobuf::io::ZeroCopyOutputStream;

namespace grpc {
namespace web {
namespace {

using std::string;

enum Mode {
  OP = 0,          // first party google3 one platform services
  GATEWAY = 1,     // open-source gRPC Gateway
  OPJSPB = 2,      // first party google3 one platform services with JSPB
  FRAMEWORKS = 3,  // first party google3 AF services with AF data add-ons
  GRPCWEB = 4,     // client using the application/grpc-web wire format
};

enum ImportStyle {
  CLOSURE = 0,     // goog.require("grpc.web.*")
  COMMONJS = 1,    // const grpcWeb = require("grpc-web")
  TYPESCRIPT = 2,  // import * as grpcWeb from 'grpc-web'
};

const char* kKeyword[] = {
  "abstract",
  "boolean",
  "break",
  "byte",
  "case",
  "catch",
  "char",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "double",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "final",
  "finally",
  "float",
  "for",
  "function",
  "goto",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "int",
  "interface",
  "long",
  "native",
  "new",
  "null",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "short",
  "static",
  "super",
  "switch",
  "synchronized",
  "this",
  "throw",
  "throws",
  "transient",
  "try",
  "typeof",
  "var",
  "void",
  "volatile",
  "while",
  "with",
};

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
    case GATEWAY:
      return "Gateway";
    case OPJSPB:
      return "OPJspb";
    case FRAMEWORKS:
      return "Frameworks";
    case GRPCWEB:
      return "GrpcWeb";
  }
  return "";
}

string GetDeserializeMethodName(const string& mode_var) {
  if (mode_var == GetModeVar(Mode::OPJSPB)) {
    return "deserialize";
  }
  return "deserializeBinary";
}

string GetSerializeMethodName(const string& mode_var) {
  if (mode_var == GetModeVar(Mode::OPJSPB)) {
    return "serialize";
  }
  return "serializeBinary";
}

string LowercaseFirstLetter(string s) {
  if (s.empty()) {
    return s;
  }
  s[0] = ::tolower(s[0]);
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

inline bool HasPrefixString(const string& str,
                            const string& prefix) {
  return str.size() >= prefix.size() &&
      str.compare(0, prefix.size(), prefix) == 0;
}

inline string StripPrefixString(const string& str, const string& prefix) {
  if (HasPrefixString(str, prefix)) {
    return str.substr(prefix.size());
  } else {
    return str;
  }
}

inline bool HasSuffixString(const string& str,
                            const string& suffix) {
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

void ReplaceCharacters(string *s, const char *remove, char replacewith) {
  const char *str_start = s->c_str();
  const char *str = str_start;
  for (str = strpbrk(str, remove);
       str != nullptr;
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

string JSMessageType(const Descriptor *desc, const FileDescriptor *file) {
  string result;
  if (desc->file() != file) {
    result = ModuleAlias(desc->file()->name());
  }
  result += StripPrefixString(desc->full_name(), desc->file()->package());
  if (!result.empty() && result[0] == '.') {
    result = result.substr(1);
  }
  return result;
}

string JSElementType(const FieldDescriptor *desc, const FileDescriptor *file)
{
  string js_field_type;
  switch (desc->type())
  {
  case FieldDescriptor::TYPE_DOUBLE:
  case FieldDescriptor::TYPE_FLOAT:
  case FieldDescriptor::TYPE_INT32:
  case FieldDescriptor::TYPE_UINT32:
  case FieldDescriptor::TYPE_SINT32:
  case FieldDescriptor::TYPE_FIXED32:
  case FieldDescriptor::TYPE_SFIXED32:
    js_field_type = "number";
    break;
  case FieldDescriptor::TYPE_INT64:
  case FieldDescriptor::TYPE_UINT64:
  case FieldDescriptor::TYPE_SINT64:
  case FieldDescriptor::TYPE_FIXED64:
  case FieldDescriptor::TYPE_SFIXED64:
    if (desc->options().jstype() == FieldOptions::JS_STRING) {
      js_field_type = "string";
    } else {
      js_field_type = "number";
    }
    break;
  case FieldDescriptor::TYPE_BOOL:
    js_field_type = "boolean";
    break;
  case FieldDescriptor::TYPE_STRING:
    js_field_type = "string";
    break;
  case FieldDescriptor::TYPE_BYTES:
    js_field_type = "Uint8Array | string";
    break;
  case FieldDescriptor::TYPE_ENUM:
    if (desc->enum_type()->file() != file) {
      js_field_type = ModuleAlias(desc->enum_type()->file()->name());
    }
    js_field_type += StripPrefixString(desc->enum_type()->full_name(),
                                       desc->enum_type()->file()->package());
    if (!js_field_type.empty() && js_field_type[0] == '.') {
      js_field_type = js_field_type.substr(1);
    }
    break;
  case FieldDescriptor::TYPE_MESSAGE:
    js_field_type = JSMessageType(desc->message_type(), file);
    break;
  default:
    js_field_type = "{}";
    break;
  }
  return js_field_type;
}

string JSFieldType(const FieldDescriptor *desc, const FileDescriptor *file) {
  string js_field_type = JSElementType(desc, file);
  if (desc->is_map()) {
    string key_type = JSFieldType(desc->message_type()->field(0), file);
    string value_type = JSFieldType(desc->message_type()->field(1), file);
    return "jspb.Map<" + key_type + ", " + value_type + ">";
  }
  if (desc->is_repeated())
  {
    return "Array<" + js_field_type + ">";
  }
  return js_field_type;
}

string AsObjectFieldType(const FieldDescriptor *desc,
                         const FileDescriptor *file) {
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

string JSElementName(const FieldDescriptor *desc) {
  return ToUpperCamel(ParseLowerUnderscore(desc->name()));
}

string JSFieldName(const FieldDescriptor *desc) {
  string js_field_name = JSElementName(desc);
  if (desc->is_map()) {
    js_field_name += "Map";
  } else if (desc->is_repeated()) {
    js_field_name += "List";
  }
  return js_field_name;
}

// Like ToUpperCamel except the first letter is not converted.
string ToCamelCase(const std::vector<string>& words)
{
  if (words.empty()) {
      return "";
  }
  string result = words[0];
  return result + ToUpperCamel(std::vector<string>(
      words.begin()+1,
      words.begin()+words.size()));
}

// Like JSFieldName, but with first letter not uppercased
string CamelCaseJSFieldName(const FieldDescriptor *desc)
{
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
  string result = StripPrefixString(descriptor->full_name(),
                                    descriptor->file()->package());
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

// Returns the basename of a file.
string GetBasename(string filename)
{
  size_t last_slash = filename.find_last_of('/');
  if (last_slash != string::npos)
  {
    return filename.substr(last_slash + 1);
  }
  return filename;
}

/* Finds all message types used in all services in the file, and returns them
 * as a map of fully qualified message type name to message descriptor */
std::map<string, const Descriptor*> GetAllMessages(const FileDescriptor* file) {
  std::map<string, const Descriptor*> message_types;
  for (int service_index = 0;
       service_index < file->service_count();
       ++service_index) {
    const ServiceDescriptor* service = file->service(service_index);
    for (int method_index = 0;
         method_index < service->method_count();
         ++method_index) {
      const MethodDescriptor *method = service->method(method_index);
      message_types[method->input_type()->full_name()] = method->input_type();
      message_types[method->output_type()->full_name()] = method->output_type();
    }
  }

  return message_types;
}

void PrintMessagesDeps(Printer* printer, const FileDescriptor* file) {
  std::map<string, const Descriptor*> messages = GetAllMessages(file);
  std::map<string, string> vars;
  for (std::map<string, const Descriptor*>::iterator it = messages.begin();
       it != messages.end(); it++) {
    vars["full_name"] = it->first;
    printer->Print(
        vars,
        "goog.require('proto.$full_name$');\n");
  }
  printer->Print("\n\n\n");
}

void PrintCommonJsMessagesDeps(Printer* printer, const FileDescriptor* file) {
  std::map<string, string> vars;

  for (int i = 0; i < file->dependency_count(); i++) {
    const string& name = file->dependency(i)->name();
    vars["alias"] = ModuleAlias(name);
    vars["dep_filename"] = GetRootPath(file->name(), name) + StripProto(name);
    // we need to give each cross-file import an alias
    printer->Print(
        vars,
        "\nvar $alias$ = require('$dep_filename$_pb.js')\n");
  }

  string package = file->package();
  vars["package_name"] = package;

  if (!package.empty()) {
    size_t offset = 0;
    size_t dotIndex = package.find('.');

    printer->Print(vars, "const proto = {};\n");

    while (dotIndex != string::npos) {
      vars["current_package_ns"] = package.substr(0, dotIndex);
      printer->Print(vars, "proto.$current_package_ns$ = {};\n");

      offset = dotIndex + 1;
      dotIndex = package.find(".", offset);
    }
  }

  // need to import the messages from our own file
  vars["filename"] = GetBasename(StripProto(file->name()));

  if (!package.empty()) {
    printer->Print(
        vars,
        "proto.$package_name$ = require('./$filename$_pb.js');\n\n");
  } else {
    printer->Print(
        vars,
        "const proto = require('./$filename$_pb.js');\n\n");
  }
}

void PrintES6Dependencies(Printer* printer, const FileDescriptor *file) {
  std::map<string, string> vars;

  for (int i = 0; i < file->dependency_count(); i++) {
    const string& name = file->dependency(i)->name();
    vars["alias"] = ModuleAlias(name);
    vars["dep_filename"] = GetRootPath(file->name(), name) + StripProto(name);
    // we need to give each cross-file import an alias
    printer->Print(
        vars,
        "import * as $alias$ from '$dep_filename$_pb';\n");
  }

  if (file->dependency_count() != 0) {
    printer->Print("\n");
  }
}

void PrintES6Imports(Printer* printer, const FileDescriptor* file) {
  std::map<string, string> vars;

  printer->Print("import * as grpcWeb from 'grpc-web';\n\n");
  PrintES6Dependencies(printer, file);

  std::map<string, const Descriptor*> messages = GetAllMessages(file);
  for (std::map<string, const Descriptor*>::iterator it = messages.begin();
       it != messages.end();) {
    if (it->second->file() != file) {
      it = messages.erase(it);
    } else {
      it++;
    }
  }

  if (messages.empty()) {
    return;
  }

  std::map<string, const Descriptor*>::iterator it = messages.begin();
  vars["base_name"] = GetBasename(StripProto(file->name()));
  vars["class_name"] = it->second->name();

  if (messages.size() == 1) {
    printer->Print(vars, "import {$class_name$} from './$base_name$_pb';\n\n");
    return;
  }

  printer->Print("import {\n");
  printer->Indent();
  printer->Print(vars, "$class_name$");

  for (it++; it != messages.end(); it++) {
    vars["class_name"] = it->second->name();
    printer->Print(vars, ",\n$class_name$");
  }

  printer->Outdent();
  printer->Print(vars, "} from './$base_name$_pb';\n\n");
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
        "options_: null | { [index: string]: string; };\n\n"
        "constructor (hostname: string,\n"
        "             credentials?: null | { [index: string]: string; },\n"
        "             options?: null | { [index: string]: string; }) {\n");
    printer->Indent();
    printer->Print("if (!options) options = {};\n");
    if (vars["mode"] == GetModeVar(Mode::GRPCWEB)) {
      printer->Print(vars, "options['format'] = '$format$';\n\n");
    }
    printer->Print(vars,
                   "this.client_ = new grpcWeb.$mode$ClientBase(options);\n"
                   "this.hostname_ = hostname;\n"
                   "this.credentials_ = credentials;\n"
                   "this.options_ = options;\n");
    printer->Outdent();
    printer->Print("}\n\n");

    for (int method_index = 0; method_index < service->method_count();
         ++method_index) {
      const MethodDescriptor* method = service->method(method_index);
      vars["js_method_name"] = LowercaseFirstLetter(method->name());
      vars["method_name"] = method->name();
      vars["input_type"] = JSMessageType(method->input_type(), file);
      vars["output_type"] = JSMessageType(method->output_type(), file);
      vars["serialize_func_name"] = GetSerializeMethodName(vars["mode"]);
      vars["deserialize_func_name"] = GetDeserializeMethodName(vars["mode"]);
      if (!method->client_streaming()) {
        printer->Print(vars,
                       "methodInfo$method_name$ = "
                       "new grpcWeb.AbstractClientBase.MethodInfo(\n");
        printer->Indent();
        printer->Print(vars,
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
                         "metadata?: grpcWeb.Metadata) {\n");
          printer->Print(vars, "return this.client_.serverStreaming(\n");
          printer->Indent();
          printer->Print(vars,
                         "this.hostname_ +\n"
                         "  '/$package_dot$$service_name$/$method_name$',\n"
                         "request,\n"
                         "metadata || {},\n"
                         "this.methodInfo$method_name$);\n");
          printer->Outdent();
          printer->Outdent();
          printer->Print("}\n\n");
        } else {
          printer->Print(vars, "$js_method_name$(\n");
          printer->Indent();
          printer->Print(vars,
                         "request: $input_type$,\n"
                         "metadata: grpcWeb.Metadata | null,\n"
                         "callback: (err: grpcWeb.Error,\n"
                         "           response: $output_type$) => void) {\n");
          printer->Print(vars, "return this.client_.rpcCall(\n");
          printer->Indent();
          printer->Print(vars,
                         "this.hostname_ +\n"
                         "  '/$package_dot$$service_name$/$method_name$',\n"
                         "request,\n"
                         "metadata || {},\n"
                         "this.methodInfo$method_name$,\n"
                         "callback);\n");
          printer->Outdent();
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
                                const string &client_type) {
  std::map<string, string> vars;
  vars["client_type"] = client_type;
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
        "             options?: null | { [index: string]: string; });\n\n");
    for (int method_index = 0; method_index < service->method_count();
         ++method_index) {
      const MethodDescriptor* method = service->method(method_index);
      vars["js_method_name"] = LowercaseFirstLetter(method->name());
      vars["input_type"] = JSMessageType(method->input_type(), file);
      vars["output_type"] = JSMessageType(method->output_type(), file);
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
            printer->Print(vars,
                           "): Promise<$output_type$>;\n\n");
          } else {
            printer->Print(vars, "$js_method_name$(\n");
            printer->Indent();
            printer->Print(vars,
                           "request: $input_type$,\n"
                           "metadata: grpcWeb.Metadata | undefined,\n"
                           "callback: (err: grpcWeb.Error,\n"
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

void PrintProtoDtsEnum(Printer *printer, const EnumDescriptor *desc)
{
  std::map<string, string> vars;
  vars["enum_name"] = desc->name();

  printer->Print(vars, "export enum $enum_name$ { \n");
  printer->Indent();
  for (int i = 0; i < desc->value_count(); i++)
  {
    vars["value_name"] = desc->value(i)->name();
    vars["value_number"] = std::to_string(desc->value(i)->number());
    printer->Print(vars, "$value_name$ = $value_number$,\n");
  }
  printer->Outdent();
  printer->Print("}\n");
}

void PrintProtoDtsOneofCase(Printer *printer, const OneofDescriptor *desc)
{
  std::map<string, string> vars;
  vars["oneof_name"] = ToUpperCamel(ParseLowerUnderscore(desc->name()));
  vars["oneof_name_upper"] = Uppercase(desc->name());

  printer->Print(vars, "export enum $oneof_name$Case { \n");
  printer->Indent();
  printer->Print(vars, "$oneof_name_upper$_NOT_SET = 0,\n");
  for (int i = 0; i < desc->field_count(); i++) {
    const FieldDescriptor *field = desc->field(i);
    vars["field_name"] = Uppercase(field->name());
    vars["field_number"] = std::to_string(field->number());
    printer->Print(vars, "$field_name$ = $field_number$,\n");
  }
  printer->Outdent();
  printer->Print("}\n");
}

void PrintProtoDtsMessage(Printer *printer, const Descriptor *desc,
                          const FileDescriptor *file) {
  string class_name = desc->name();
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
      printer->Print(vars,
                     "get$js_field_name$(): $js_field_type$;\n");
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
                     "set$js_field_name$(value: $js_field_type$): void;\n");
    } else if (!field->is_map()) {
      printer->Print(vars,
                     "set$js_field_name$(value?: $js_field_type$): void;\n");
    }
    if (field->type() == FieldDescriptor::TYPE_MESSAGE && !field->is_repeated()
        && !field->is_map()) {
      printer->Print(vars, "has$js_field_name$(): boolean;\n");
    }
    if (field->type() == FieldDescriptor::TYPE_MESSAGE ||
        field->is_repeated() || field->is_map()) {
      printer->Print(vars, "clear$js_field_name$(): void;\n");
    }
    if (field->is_repeated() && !field->is_map()) {
      vars["js_field_name"] = JSElementName(field);
      vars["js_field_type"] = JSElementType(field, file);
      if (field->type() != FieldDescriptor::TYPE_MESSAGE) {
        printer->Print(vars,
                       "add$js_field_name$(value: $js_field_type$, "
                       "index?: number): void;\n");
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
    vars["js_oneof_name"] = ToUpperCamel(ParseLowerUnderscore(oneof->name()));
    printer->Print(
        vars,
        "get$js_oneof_name$Case(): $class_name$.$js_oneof_name$Case;\n");
    printer->Print("\n");
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
    if (field->type() != FieldDescriptor::TYPE_MESSAGE ||
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

void PrintProtoDtsFile(Printer *printer, const FileDescriptor *file)
{
  printer->Print("import * as jspb from \"google-protobuf\"\n\n");
  PrintES6Dependencies(printer, file);

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
      "// GENERATED CODE -- DO NOT EDIT!\n\n\n");
}

void PrintServiceConstructor(Printer* printer,
                             std::map<string, string> vars) {
  printer->Print(
      vars,
      "/**\n"
      " * @param {string} hostname\n"
      " * @param {?Object} credentials\n"
      " * @param {?Object} options\n"
      " * @constructor\n"
      " * @struct\n"
      " * @final\n"
      " */\n"
      "proto.$package_dot$$service_name$Client =\n"
      "    function(hostname, credentials, options) {\n"
      "  if (!options) options = {};\n");
  if (vars["mode"] == GetModeVar(Mode::GRPCWEB)) {
    printer->Print(
        vars,
        "  options['format'] = '$format$';\n\n");
  }
  printer->Print(
      vars,
      "  /**\n"
      "   * @private @const {!grpc.web.$mode$ClientBase} The client\n"
      "   */\n"
      "  this.client_ = new grpc.web.$mode$ClientBase(options);\n\n"
      "  /**\n"
      "   * @private @const {string} The hostname\n"
      "   */\n"
      "  this.hostname_ = hostname;\n\n"
      "  /**\n"
      "   * @private @const {?Object} The credentials to be used to connect\n"
      "   *    to the server\n"
      "   */\n"
      "  this.credentials_ = credentials;\n\n"
      "  /**\n"
      "   * @private @const {?Object} Options for the client\n"
      "   */\n"
      "  this.options_ = options;\n"
      "};\n\n\n");
}

void PrintPromiseServiceConstructor(Printer* printer,
                                    std::map<string, string> vars) {
  printer->Print(vars,
                 "/**\n"
                 " * @param {string} hostname\n"
                 " * @param {?Object} credentials\n"
                 " * @param {?Object} options\n"
                 " * @constructor\n"
                 " * @struct\n"
                 " * @final\n"
                 " */\n"
                 "proto.$package_dot$$service_name$PromiseClient =\n"
                 "    function(hostname, credentials, options) {\n"
                 "  if (!options) options = {};\n");
  if (vars["mode"] == GetModeVar(Mode::GRPCWEB)) {
    printer->Print(vars, "  options['format'] = '$format$';\n\n");
  }
  printer->Print(
      vars,
      "  /**\n"
      "   * @private @const {!grpc.web.$mode$ClientBase} The client\n"
      "   */\n"
      "  this.client_ = new grpc.web.$mode$ClientBase(options);\n\n"
      "  /**\n"
      "   * @private @const {string} The hostname\n"
      "   */\n"
      "  this.hostname_ = hostname;\n\n"
      "  /**\n"
      "   * @private @const {?Object} The credentials to be used to connect\n"
      "   *    to the server\n"
      "   */\n"
      "  this.credentials_ = credentials;\n\n"
      "  /**\n"
      "   * @private @const {?Object} Options for the client\n"
      "   */\n"
      "  this.options_ = options;\n"
      "};\n\n\n");
}

void PrintMethodInfo(Printer* printer, std::map<string, string> vars) {
  printer->Print(
      vars,
      "/**\n"
      " * @const\n"
      " * @type {!grpc.web.AbstractClientBase.MethodInfo<\n"
      " *   !proto.$in$,\n"
      " *   !proto.$out$>}\n"
      " */\n"
      "const methodInfo_$service_name$_$method_name$ = "
      "new grpc.web.AbstractClientBase.MethodInfo(\n");
  printer->Indent();
  printer->Print(
      vars,
      "$out_type$,\n"
      "/** @param {!proto.$in$} request */\n"
      "function(request) {\n");
  printer->Print(
      ("  return request." + GetSerializeMethodName(vars["mode"]) +
       "();\n").c_str());
  printer->Print("},\n");
  printer->Print(
      vars,
      ("$out_type$." + GetDeserializeMethodName(vars["mode"]) +
       "\n").c_str());
  printer->Outdent();
  printer->Print(
      vars,
      ");\n\n\n");
}

void PrintUnaryCall(Printer* printer, std::map<string, string> vars) {
  printer->Print(
      vars,
      "/**\n"
      " * @param {!proto.$in$} request The\n"
      " *     request proto\n"
      " * @param {?Object<string, string>} metadata User defined\n"
      " *     call metadata\n"
      " * @param {function(?grpc.web.Error,"
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
  if (vars["mode"] == GetModeVar(Mode::OP) ||
      vars["mode"] == GetModeVar(Mode::OPJSPB)) {
    printer->Print(vars,
                   "'/$$rpc/$package_dot$$service_name$/$method_name$',\n");
  } else {
    printer->Print(vars, "'/$package_dot$$service_name$/$method_name$',\n");
  }
  printer->Print(
      vars,
      "request,\n"
      "metadata || {},\n"
      "methodInfo_$service_name$_$method_name$,\n"
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
                 " * @param {?Object<string, string>} metadata User defined\n"
                 " *     call metadata\n"
                 " * @return {!Promise<!proto.$out$>}\n"
                 " *     A native promise that resolves to the response\n"
                 " */\n"
                 "proto.$package_dot$$service_name$PromiseClient.prototype"
                 ".$js_method_name$ =\n");
  printer->Indent();
  printer->Print(vars,
                 "  function(request, metadata) {\n"
                 "return this.client_.unaryCall(this.hostname_ +\n");
  printer->Indent();
  printer->Indent();
  if (vars["mode"] == GetModeVar(Mode::OP) ||
      vars["mode"] == GetModeVar(Mode::OPJSPB)) {
    printer->Print(vars,
                   "'/$$rpc/$package_dot$$service_name$/$method_name$',\n");
  } else {
    printer->Print(vars, "'/$package_dot$$service_name$/$method_name$',\n");
  }
  printer->Print(vars,
                 "request,\n"
                 "metadata || {},\n"
                 "methodInfo_$service_name$_$method_name$);\n");
  printer->Outdent();
  printer->Outdent();
  printer->Outdent();
  printer->Print("};\n\n\n");
}

void PrintServerStreamingCall(Printer* printer, std::map<string, string> vars) {
  printer->Print(
      vars,
      "/**\n"
      " * @param {!proto.$in$} request The request proto\n"
      " * @param {?Object<string, string>} metadata User defined\n"
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
  if (vars["mode"] == GetModeVar(Mode::OP) ||
      vars["mode"] == GetModeVar(Mode::OPJSPB)) {
    printer->Print(vars,
                   "'/$$rpc/$package_dot$$service_name$/$method_name$',\n");
  } else {
    printer->Print(vars, "'/$package_dot$$service_name$/$method_name$',\n");
  }
  printer->Print(
      vars,
      "request,\n"
      "metadata || {},\n"
      "methodInfo_$service_name$_$method_name$);\n");
  printer->Outdent();
  printer->Outdent();
  printer->Outdent();
  printer->Print("};\n\n\n");
}

class GrpcCodeGenerator : public CodeGenerator {
 public:
  GrpcCodeGenerator() {}
  ~GrpcCodeGenerator() override {}

  bool Generate(const FileDescriptor* file, const string& parameter,
                GeneratorContext* context, string* error) const override {
    std::vector<std::pair<string, string> > options;
    ParseGeneratorParameter(parameter, &options);

    string file_name;
    string mode;
    string import_style_str;
    ImportStyle import_style;
    bool generate_dts = false;

    for (size_t i = 0; i < options.size(); ++i) {
      if (options[i].first == "out") {
        file_name = options[i].second;
      } else if (options[i].first == "mode") {
        mode = options[i].second;
      } else if (options[i].first == "import_style") {
        import_style_str = options[i].second;
      } else {
        *error = "unsupported options: " + options[i].first;
        return false;
      }
    }

    if (file_name.empty()) {
      file_name = StripProto(file->name()) + "_grpc_web_pb.js";
    }
    if (mode.empty()) {
      *error = "options: mode is required";
      return false;
    }

    std::map<string, string> vars;
    string package = file->package();
    vars["package"] = package;
    vars["package_dot"] = package.empty() ? "" : package + '.';

    if (mode == "binary") {
      vars["mode"] = GetModeVar(Mode::OP);
    } else if (mode == "base64") {
      vars["mode"] = GetModeVar(Mode::GATEWAY);
    } else if (mode == "grpcweb" || mode == "grpcwebtext") {
      vars["mode"] = GetModeVar(Mode::GRPCWEB);
      vars["format"] = (mode == "grpcweb") ? "binary" : "text";
    } else if (mode == "jspb") {
      vars["mode"] = GetModeVar(Mode::OPJSPB);
    } else if (mode == "frameworks") {
      vars["mode"] = GetModeVar(Mode::FRAMEWORKS);
    } else {
      *error = "options: invalid mode - " + mode;
      return false;
    }

    if (import_style_str == "closure" || import_style_str.empty()) {
      import_style = ImportStyle::CLOSURE;
    } else if (import_style_str == "commonjs") {
      import_style = ImportStyle::COMMONJS;
    } else if (import_style_str == "commonjs+dts") {
      import_style = ImportStyle::COMMONJS;
      generate_dts = true;
    } else if (import_style_str == "typescript") {
      import_style = ImportStyle::TYPESCRIPT;
      file_name =
          UppercaseFirstLetter(StripProto(file->name())) + "ServiceClientPb.ts";
    } else {
      *error = "options: invalid import_style - " + import_style_str;
      return false;
    }

    if (generate_dts || import_style == ImportStyle::TYPESCRIPT) {
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

    std::unique_ptr<ZeroCopyOutputStream> output(
        context->Open(file_name));
    Printer printer(output.get(), '$');
    PrintFileHeader(&printer, vars);

    if (import_style == ImportStyle::TYPESCRIPT) {
      PrintTypescriptFile(&printer, file, vars);
      return true;
    }

    for (int i = 0; i < file->service_count(); ++i) {
      const ServiceDescriptor* service = file->service(i);
      vars["service_name"] = service->name();
      switch (import_style) {
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

    switch (import_style) {
      case ImportStyle::CLOSURE:
        printer.Print(vars, "goog.require('grpc.web.$mode$ClientBase');\n");
        printer.Print(vars, "goog.require('grpc.web.AbstractClientBase');\n");
        printer.Print(vars, "goog.require('grpc.web.ClientReadableStream');\n");
        printer.Print(vars, "goog.require('grpc.web.Error');\n");

        PrintMessagesDeps(&printer, file);
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

    for (int service_index = 0;
         service_index < file->service_count();
         ++service_index) {
      const ServiceDescriptor* service = file->service(service_index);
      vars["service_name"] = service->name();
      PrintServiceConstructor(&printer, vars);
      PrintPromiseServiceConstructor(&printer, vars);

      for (int method_index = 0;
           method_index < service->method_count();
           ++method_index) {
        const MethodDescriptor* method = service->method(method_index);
        vars["js_method_name"] = LowercaseFirstLetter(method->name());
        vars["method_name"] = method->name();
        vars["in"] = method->input_type()->full_name();
        vars["out"] = method->output_type()->full_name();
        if (import_style == ImportStyle::COMMONJS &&
            method->output_type()->file() != file) {
          // Cross-file ref in CommonJS needs to use the module alias instead
          // of the global name.
          vars["out_type"] = ModuleAlias(method->output_type()->file()->name())
                             + GetNestedMessageName(method->output_type());
        } else {
          vars["out_type"] = "proto."+method->output_type()->full_name();
        }

        // Client streaming is not supported yet
        if (!method->client_streaming()) {
          PrintMethodInfo(&printer, vars);
          if (method->server_streaming()) {
            vars["client_type"] = "Client";
            PrintServerStreamingCall(&printer, vars);
            vars["client_type"] = "PromiseClient";
            PrintServerStreamingCall(&printer, vars);
          } else {
            PrintUnaryCall(&printer, vars);
            PrintPromiseUnaryCall(&printer, vars);
          }
        }
      }
    }

    switch (import_style) {
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

    if (generate_dts) {
      string grpcweb_dts_file_name =
          StripProto(file->name()) + "_grpc_web_pb.d.ts";
      string proto_dts_file_name = StripProto(file->name()) + "_pb.d.ts";

      std::unique_ptr<ZeroCopyOutputStream> grpcweb_dts_output(
          context->Open(grpcweb_dts_file_name));
      Printer grpcweb_dts_printer(grpcweb_dts_output.get(), '$');

      PrintGrpcWebDtsFile(&grpcweb_dts_printer, file);
    }

    return true;
  }
};

}  // namespace
}  // namespace web
}  // namespace grpc

int main(int argc, char* argv[]) {
  grpc::web::GrpcCodeGenerator generator;
  PluginMain(argc, argv, &generator);
  return 0;
}
