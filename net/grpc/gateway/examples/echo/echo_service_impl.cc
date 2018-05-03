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

#include "net/grpc/gateway/examples/echo/echo_service_impl.h"

#include <grpcpp/grpcpp.h>
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
