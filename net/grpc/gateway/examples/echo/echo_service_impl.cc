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
#include "net/grpc/gateway/examples/echo/echo_service_impl.h"

#include <grpc++/grpc++.h>
#include <unistd.h>
#include <string>

#include "net/grpc/gateway/examples/echo/echo.grpc.pb.h"

using grpc::ServerContext;
using grpc::ServerWriter;
using grpc::Status;
using grpc::gateway::testing::EchoRequest;
using grpc::gateway::testing::EchoResponse;
using grpc::gateway::testing::EchoService;
using grpc::gateway::testing::Empty;
using grpc::gateway::testing::ServerStreamingEchoRequest;
using grpc::gateway::testing::ServerStreamingEchoResponse;


EchoServiceImpl::EchoServiceImpl() {}
EchoServiceImpl::~EchoServiceImpl() {}

void EchoServiceImpl::CopyClientMetadataToResponse(ServerContext* context) {
  for (auto& client_metadata : context->client_metadata()) {
    context->AddInitialMetadata(std::string(client_metadata.first.data(),
                                            client_metadata.first.length()),
                                std::string(client_metadata.second.data(),
                                            client_metadata.second.length()));
    context->AddTrailingMetadata(
        std::string(client_metadata.first.data(),
                    client_metadata.first.length()),
        std::string(client_metadata.second.data(),
                    client_metadata.second.length()));
  }
}

Status EchoServiceImpl::Echo(ServerContext* context, const EchoRequest* request,
                             EchoResponse* response) {
  CopyClientMetadataToResponse(context);
  response->set_message(request->message());
  return Status::OK;
}

Status EchoServiceImpl::EchoAbort(ServerContext* context,
                                  const EchoRequest* request,
                                  EchoResponse* response) {
  CopyClientMetadataToResponse(context);
  response->set_message(request->message());
  return Status(grpc::StatusCode::ABORTED,
                "Aborted from server side.");
}

Status EchoServiceImpl::NoOp(ServerContext* context, const Empty* request,
                             Empty* response) {
  CopyClientMetadataToResponse(context);
  return Status::OK;
}

Status EchoServiceImpl::ServerStreamingEcho(
    ServerContext* context, const ServerStreamingEchoRequest* request,
    ServerWriter<ServerStreamingEchoResponse>* writer) {
  CopyClientMetadataToResponse(context);
  for (int i = 0; i < request->message_count(); i++) {
    if (context->IsCancelled()) {
      return Status::CANCELLED;
    }
    ServerStreamingEchoResponse response;
    response.set_message(request->message());
    usleep(request->message_interval() * 1000);
    writer->Write(response);
  }
  return Status::OK;
}

Status EchoServiceImpl::ServerStreamingEchoAbort(
    ServerContext* context, const ServerStreamingEchoRequest* request,
    ServerWriter<ServerStreamingEchoResponse>* writer) {
  CopyClientMetadataToResponse(context);
  ServerStreamingEchoResponse response;
  response.set_message(request->message());
  writer->Write(response);
  return Status(grpc::StatusCode::ABORTED,
                "Aborted from server side.");
}
