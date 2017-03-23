#ifndef NET_GRPC_GATEWAY_EXAMPLES_ECHO_ECHO_SERVICE_IMPL_H_
#define NET_GRPC_GATEWAY_EXAMPLES_ECHO_ECHO_SERVICE_IMPL_H_

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

#include <grpc++/grpc++.h>
#include <unistd.h>
#include <string>

#include "net/grpc/gateway/examples/echo/echo.grpc.pb.h"

class EchoServiceImpl final :
    public grpc::gateway::testing::EchoService::Service {
 public:
  EchoServiceImpl();
  ~EchoServiceImpl() override;

  void CopyClientMetadataToResponse(grpc::ServerContext* context);
  grpc::Status Echo(
      grpc::ServerContext* context,
      const grpc::gateway::testing::EchoRequest* request,
      grpc::gateway::testing::EchoResponse* response) override;
  grpc::Status EchoAbort(
      grpc::ServerContext* context,
      const grpc::gateway::testing::EchoRequest* request,
      grpc::gateway::testing::EchoResponse* response) override;
  grpc::Status NoOp(
      grpc::ServerContext* context,
      const grpc::gateway::testing::Empty* request,
      grpc::gateway::testing::Empty* response) override;
  grpc::Status ServerStreamingEcho(
      grpc::ServerContext* context,
      const grpc::gateway::testing::ServerStreamingEchoRequest* request,
      grpc::ServerWriter<
      grpc::gateway::testing::ServerStreamingEchoResponse>* writer) override;
  grpc::Status ServerStreamingEchoAbort(
      grpc::ServerContext* context,
      const grpc::gateway::testing::ServerStreamingEchoRequest* request,
      grpc::ServerWriter<
      grpc::gateway::testing::ServerStreamingEchoResponse>* writer) override;
};

#endif  // NET_GRPC_GATEWAY_EXAMPLES_ECHO_ECHO_SERVICE_IMPL_H_
