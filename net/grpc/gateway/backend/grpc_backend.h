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

  void set_address(string address) { address_ = address; }
  void set_host(string host) { host_ = host; }
  void set_method(string method) { method_ = method; }
  void set_use_shared_channel_pool(bool use_shared_channel_pool) {
    use_shared_channel_pool_ = use_shared_channel_pool;
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
  char* status_details_;
  size_t status_details_capacity_;
  grpc_metadata_array response_trailing_metadata_;
  // True if the GRPC call has been cancelled by client.
  bool is_cancelled_;
  // The status which represents why the GRPC call is cancelled.
  Status cancel_reason_;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_BACKEND_GRPC_BACKEND_H_
