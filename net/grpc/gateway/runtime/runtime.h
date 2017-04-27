#ifndef NET_GRPC_GATEWAY_RUNTIME_RUNTIME_H_
#define NET_GRPC_GATEWAY_RUNTIME_RUNTIME_H_

// NOTE: Required on top in order to include ngx_config.h libc defines
#include "net/grpc/gateway/nginx_includes.h"

#include <map>
#include <memory>

#include "net/grpc/gateway/codec/decoder.h"
#include "net/grpc/gateway/codec/encoder.h"
#include "net/grpc/gateway/frontend/frontend.h"
#include "net/grpc/gateway/runtime/constants.h"
#include "net/grpc/gateway/runtime/grpc_event_queue.h"

namespace grpc {
namespace gateway {

// The GRPC gateway runtime, it's accessible from all frontend and backend
// objects when processing the requests and/or responses.
class Runtime {
 public:
  // Returns the singleton of GRPC gateway runtime.
  static Runtime &Get() {
    static Runtime runtime;
    return runtime;
  }

  virtual ~Runtime();
  Runtime(const Runtime &) = delete;
  Runtime &operator=(const Runtime &) = delete;

  // Initiate the GRPC gateway runtime.
  void Init();

  // Shutdown the GRPC gateway runtime.
  void Shutdown();

  // Creates a frontend object which is used to process the HTTP request from
  // Nginx.
  std::shared_ptr<Frontend> CreateNginxFrontend(
      ngx_http_request_t *http_request, const string &backend_address,
      const string &host, const string &backend_method,
      const ngx_flag_t &channel_reuse,
      const ngx_msec_t &client_liveness_detection_interval);

  // Returns the GRPC completion queue.
  grpc_completion_queue *grpc_event_queue() {
    return grpc_event_queue_->queue();
  }

  // Returns the GRPC backend channel for the given backend address, creates new
  // channel if needed.
  grpc_channel *GetBackendChannel(const std::string &backend_address,
                                  bool use_shared_channel_pool);

 private:
  Runtime();

  // Creates an encoder for the given content type. This method doesn't take the
  // ownership of http_request parameter and it cannot be nullptr.
  std::unique_ptr<Encoder> CreateEncoder(Protocol protocol,
                                         ngx_http_request_t *http_request);

  // Creates a decoder for the given content type. This method doesn't take the
  // ownership of http_request parameter and it cannot be nullptr.
  std::unique_ptr<Decoder> CreateDecoder(Protocol protocol,
                                         ngx_http_request_t *http_request);

  // Detects the frontend request protocol.
  Protocol DetectRequestProtocol(ngx_http_request_t *http_request);

  // Detects the frontend response protocol.
  Protocol DetectResponseProtocol(ngx_http_request_t *http_request);

  std::unique_ptr<GrpcEventQueue> grpc_event_queue_;

  // A shared map for GRPC backend channels. Indexed by the backend address.
  std::map<std::string, grpc_channel *> grpc_backend_channels_;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_RUNTIME_RUNTIME_H_
