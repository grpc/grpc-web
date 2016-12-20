/*
 *
 * Copyright 2016, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

#include <google/protobuf/compiler/code_generator.h>
#include <google/protobuf/compiler/plugin.h>
#include <google/protobuf/descriptor.h>
#include <google/protobuf/io/printer.h>
#include <google/protobuf/io/zero_copy_stream.h>

using google::protobuf::Descriptor;
using google::protobuf::FileDescriptor;
using google::protobuf::MethodDescriptor;
using google::protobuf::ServiceDescriptor;
using google::protobuf::compiler::CodeGenerator;
using google::protobuf::compiler::GeneratorContext;
using google::protobuf::compiler::ParseGeneratorParameter;
using google::protobuf::compiler::PluginMain;
using google::protobuf::io::Printer;
using google::protobuf::io::ZeroCopyOutputStream;

namespace grpc {
namespace web {
namespace {

enum Mode {
  BINARY = 0,
  BASE64 = 1,
  JSPB   = 2,
};

std::string GetMode(const Mode mode) {
  switch (mode) {
    case BINARY:
      return "BINARY";
    case BASE64:
      return "BASE64";
    case JSPB:
      return "JSPB";
  }
}

/* Finds all message types used in all services in the file, and returns them
 * as a map of fully qualified message type name to message descriptor */
std::map<std::string, const Descriptor *> GetAllMessages(
    const FileDescriptor *file) {
  std::map<std::string, const Descriptor *> message_types;
  for (int service_index = 0;
       service_index < file->service_count();
       ++service_index) {
    const ServiceDescriptor* service = file->service(service_index);
    for (int method_index = 0;
         method_index < service->method_count();
         ++method_index) {
      const MethodDescriptor *method = service->method(method_index);
      const Descriptor *input_type = method->input_type();
      const Descriptor *output_type = method->output_type();
      message_types[input_type->full_name()] = input_type;
      message_types[output_type->full_name()] = output_type;
    }
  }

  return message_types;
}

void PrintMessagesDeps(Printer* printer, const FileDescriptor* file) {
  std::map<std::string, const Descriptor *> messages = GetAllMessages(file);
  std::map<std::string, std::string> vars;
  for (std::map<std::string, const Descriptor *>::iterator it =
           messages.begin();
       it != messages.end(); it++) {
    vars["full_name"] = it->first;
    printer->Print(
        vars,
        "goog.require('proto.$full_name$');\n");
  }
  printer->Print("\n\n\n");
}


void PrintFileHeader(Printer* printer,
                     std::map<std::string, std::string> vars) {
  printer->Print(
      vars,
      "/**\n"
      " * @fileoverview gRPC Web JS generated client stub for $package$\n"
      " * @enhanceable\n"
      " * @public\n"
      " */\n"
      "// GENERATED CODE -- DO NOT EDIT!\n\n\n");
}

void PrintServiceConstructor(Printer* printer,
                             std::map<std::string, std::string> vars) {
  printer->Print(
      vars,
      "/**\n"
      "* @constructor\n"
      "*/\n"
      "proto.$package$.$service_name$Client =\n"
      "  function(hostname, credentials, options) {\n"
      "    /**\n"
      "     * @private {!grpc.web.ClientBase} the client\n"
      "     */\n"
      "    this.client_ = new grpc.web.ClientBase('$mode$');\n\n"
      "    /**\n"
      "     * @private {!string} the hostname\n"
      "     */\n"
      "    this.hostname_ = hostname;\n\n\n"
      "    /**\n"
      "     * @private {?Object} the credentials to be used to connect\n"
      "     *    to the server\n"
      "     */\n"
      "    this.credentials_ = credentials;\n\n"
      "    /**\n"
      "     * @private {?Object} options for the client\n"
      "     */\n"
      "    this.options_ = options;\n"
      "  };\n\n");
}

void PrintUnaryCall(Printer* printer,
                    std::map<std::string, std::string> vars) {
  printer->Print(
      vars,
      "/**\n"
      " * @param {!proto.$in$} request The\n"
      " *    request proto\n"
      " * @param {!Object<string, string>} metadata User defined\n"
      " *    call metadata\n"
      " * @param {function(?string, (?Object|undefined))} callback "
      "The callback\n"
      " *    function(error, response)\n"
      " * @return {!grpc.web.ClientReadableStream|undefined} The XHR Node\n"
      " *   Readable Stream\n"
      " */\n"
      "proto.$package$.$service_name$Client.prototype.$method_name$ =\n");
  printer->Indent();
  printer->Print(
      vars,
      "function(request, metadata, callback) {\n");
  if (vars["mode"] == GetMode(Mode::BINARY) ||
      vars["mode"] == GetMode(Mode::JSPB)) {
    printer->Print(
        vars,
        "var call = this.client_.rpcCall(this.hostname_ +\n"
        "  '/$$rpc/$package$.$service_name$/$method_name$',\n");
  } else {
    printer->Print(
        vars,
        "var call = this.client_.rpcCall(this.hostname_ +\n"
        "  '/$package$.$service_name$/$method_name$',\n");
  }
  printer->Indent();
  printer->Print(vars, "request,\n" "metadata,\n");

  std::string deserializeFunc;
  if (vars["mode"] == GetMode(Mode::BINARY) ||
      vars["mode"] == GetMode(Mode::BASE64)) {
    deserializeFunc = "deserializeBinary";
  } else {
    deserializeFunc = "deserialize";
  }
  printer->Print(vars, ("proto.$out$." + deserializeFunc + ",\n").c_str());
  printer->Print("callback);\n");

  printer->Outdent();
  printer->Print("return call;\n");
  printer->Outdent();
  printer->Print("};\n\n\n");
}

void PrintServerStreamingCall(Printer* printer,
                              std::map<std::string, std::string> vars) {
  printer->Print(
      vars,
      "/**\n"
      " * @param {!proto.$in$} request The request proto\n"
      " * @param {!Object<string, string>} metadata User defined\n"
      " *    call metadata\n"
      " * @return {!grpc.web.ClientReadableStream} The XHR Node\n"
      " *   Readable Stream\n"
      " */\n"
      "proto.$package$.$service_name$Client.prototype.$method_name$ =\n");
  printer->Indent();
  printer->Print(
      "function(request, metadata) {\n"
      "var stream = this.client_.serverStreaming(\n");
  printer->Indent();
  printer->Print(
      vars,
      "this.hostname_ +\n"
      "  '/$package$.$service_name$/$method_name$',\n"
      "request,\n"
      "metadata,\n"
      "proto.$out$.deserializeBinary);\n\n");
  printer->Outdent();
  printer->Print("return stream;\n");
  printer->Outdent();
  printer->Print("};\n\n\n");
}

class GrpcCodeGenerator : public CodeGenerator {
 public:
  GrpcCodeGenerator() {}
  ~GrpcCodeGenerator() override {}

  bool Generate(const FileDescriptor* file,
                const std::string& parameter,
                GeneratorContext* context,
                std::string* error) const {
    if (!file->service_count()) {
      // No services, nothing to do.
      return true;
    }

    std::vector<std::pair<std::string, std::string> > options;
    ParseGeneratorParameter(parameter, &options);

    std::string file_name;
    std::string mode;
    for (int i = 0; i < options.size(); ++i) {
      if (options[i].first == "out") {
        file_name = options[i].second;
      } else if (options[i].first == "mode") {
        mode = options[i].second;
      } else {
        *error = "unsupported options: " + options[i].first;
        return false;
      }
    }
    if (file_name.empty()) {
      *error = "options: out is required";
      return false;
    }
    if (mode.empty()) {
      *error = "options: mode is required";
      return false;
    }

    std::map<std::string, std::string> vars;
    vars["package"] = file->package();
    if (mode == "binary") {
      vars["mode"] = GetMode(Mode::BINARY);
    } else if (mode == "base64") {
      vars["mode"] = GetMode(Mode::BASE64);
    } else if (mode == "jspb") {
      vars["mode"] = GetMode(Mode::JSPB);
    } else {
      *error = "options: invalid mode - " + mode;
      return false;
    }

    std::unique_ptr<ZeroCopyOutputStream> output(
        context->Open(file_name));
    Printer printer(output.get(), '$');
    PrintFileHeader(&printer, vars);

    for (int i = 0; i < file->service_count(); ++i) {
      const ServiceDescriptor* service = file->service(i);
      vars["service_name"] = service->name();
      printer.Print(
          vars,
          "goog.provide('proto.$package$.$service_name$Client');\n");
    }
    printer.Print("\n\n");

    printer.Print("goog.require('grpc.web.ClientBase');\n\n\n\n");
    PrintMessagesDeps(&printer, file);

    for (int service_index = 0;
         service_index < file->service_count();
         ++service_index) {
      const ServiceDescriptor* service = file->service(service_index);
      vars["service_name"] = service->name();
      PrintServiceConstructor(&printer, vars);

      for (int method_index = 0;
           method_index < service->method_count();
           ++method_index) {
        const MethodDescriptor* method = service->method(method_index);
        vars["method_name"] = method->name();
        vars["in"] = method->input_type()->full_name();
        vars["out"] = method->output_type()->full_name();

        // Client streaming is not supported yet
        if (!method->client_streaming()) {
          if (method->server_streaming()) {
            if (mode == "base64") {
              PrintServerStreamingCall(&printer, vars);
            }
          } else {
            PrintUnaryCall(&printer, vars);
          }
        }
      }
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
