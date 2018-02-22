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

#ifndef NET_GRPC_GATEWAY_BACKEND_GRPC_BACKEND_H_
#define NET_GRPC_GATEWAY_BACKEND_GRPC_BACKEND_H_

#include <memory>
#include <string>

#include "net/grpc/gateway/backend/backend.h"
#include "net/grpc/gateway/runtime/request.h"
#include "net/grpc/gateway/runtime/response.h"
#include "net/grpc/gateway/runtime/tag.h"
#include "third_party/grpc/include/grpc++/support/config.h"
#include "third_party/grpc/include/grpc/grpc.h"

namespace grpc {
namespace gateway {

class GrpcBackend : public Backend {
 public:
  GrpcBackend();
  ~GrpcBackend() override;
  GrpcBackend(const GrpcBackend&) = delete;
  GrpcBackend& operator=(const GrpcBackend&) = delete;

  void Start() override;
  void Send(std::unique_ptr<Request> request, Tag* on_done) override;
  void Cancel(const Status& reason) override;

  void set_address(const string& address) { address_ = address; }
  void set_host(const string& host) { host_ = host; }
  void set_method(const string& method) { method_ = method; }
  void set_use_shared_channel_pool(bool use_shared_channel_pool) {
    use_shared_channel_pool_ = use_shared_channel_pool;
  }
  void set_ssl(bool ssl) { ssl_ = ssl; }
  void set_ssl_pem_root_certs(const string& ssl_pem_root_certs) {
    ssl_pem_root_certs_ = ssl_pem_root_certs;
  }
  void set_ssl_pem_private_key(const string& ssl_pem_private_key) {
    ssl_pem_private_key_ = ssl_pem_private_key;
  }
  void set_ssl_pem_cert_chain(const string& ssl_pem_cert_chain) {
    ssl_pem_cert_chain_ = ssl_pem_cert_chain;
  }

 private:
  // Create a GRPC channel.
  grpc_channel* CreateChannel();

  // Create a GRPC call.
  grpc_call* CreateCall();

  void OnResponseInitialMetadata(bool result);
  void OnResponseMessage(bool result);
  void OnResponseStatus(bool result);

  void FinishWhenTagFail(const char* error);

  // The backend address we connect to.
  string address_;
  // The HTTP host header of the request.
  string host_;
  // The HTTP method of the request.
  string method_;
  // True if the shared channel pool should be used.
  bool use_shared_channel_pool_;
  // True if ssl should be used.
  bool ssl_;
  // The file location which contains the root certs in pem format.
  string ssl_pem_root_certs_;
  // The file location which contains the client private key in pem format.
  string ssl_pem_private_key_;
  // The file location which contains the client cert chain in pem format.
  string ssl_pem_cert_chain_;
  // The GRPC channel.
  grpc_channel* channel_;
  // The GRPC call.
  grpc_call* call_;
  // The GRPC request buffer.
  Request request_;
  // The GRPC request initial metadata.
  std::vector<grpc_metadata> request_initial_metadata_;
  // The GRPC response initial metadata.
  grpc_metadata_array response_initial_metadata_;
  // The GRPC request buffer.
  grpc_byte_buffer* request_buffer_;
  // The GRPC response buffer.
  grpc_byte_buffer* response_buffer_;
  grpc_status_code status_code_;
  grpc_slice status_details_;
  grpc_metadata_array response_trailing_metadata_;
  // True if the GRPC call has been cancelled by client.
  bool is_cancelled_;
  // The status which represents why the GRPC call is cancelled.
  Status cancel_reason_;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_BACKEND_GRPC_BACKEND_H_
