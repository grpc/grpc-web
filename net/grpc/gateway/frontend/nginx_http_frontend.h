#ifndef NET_GRPC_GATEWAY_FRONTEND_NGINX_HTTP_FRONTEND_H_
#define NET_GRPC_GATEWAY_FRONTEND_NGINX_HTTP_FRONTEND_H_

// NOTE: Required on top in order to include ngx_config.h libc defines
#include "net/grpc/gateway/nginx_includes.h"

#include <algorithm>
#include <functional>
#include <map>
#include <memory>

#include "net/grpc/gateway/backend/backend.h"
#include "net/grpc/gateway/codec/decoder.h"
#include "net/grpc/gateway/codec/encoder.h"
#include "net/grpc/gateway/frontend/frontend.h"
#include "net/grpc/gateway/runtime/constants.h"
#include "third_party/grpc/include/grpc++/support/byte_buffer.h"
#include "third_party/grpc/include/grpc++/support/string_ref.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
  // The pointer of the frontend instance which serves the request.
  std::shared_ptr<grpc::gateway::Frontend> frontend;
} grpc_gateway_request_context;

// Interface between nginx and GRPC gateway. Starts with "grpc_gateway_" prefix.
ngx_int_t grpc_gateway_handler(ngx_http_request_t *r);
ngx_int_t grpc_gateway_init_process(ngx_cycle_t *cycle);
void grpc_gateway_exit_process(ngx_cycle_t *cycle);

// Internal methods for nginx bridge.
void continue_read_request_body(ngx_http_request_t *r);
grpc::gateway::Frontend *get_frontend(ngx_http_request_t *r);

// Client liveness detection event handler.
void client_liveness_detection_handler(ngx_event_t *event);
#ifdef __cplusplus
}
#endif

namespace grpc {
namespace gateway {

// The HTTP proxy based on Nginx.
class NginxHttpFrontend : public Frontend {
 public:
  explicit NginxHttpFrontend(std::unique_ptr<Backend> backend);
  ~NginxHttpFrontend() override;
  NginxHttpFrontend(const NginxHttpFrontend &) = delete;
  NginxHttpFrontend &operator=(const NginxHttpFrontend &) = delete;

  void Start() override;

  void Send(std::unique_ptr<Response> response) override;

  void set_http_request(ngx_http_request_t *http_request) {
    http_request_ = http_request;
  }

  void set_encoder(std::unique_ptr<Encoder> encoder) {
    encoder_ = std::move(encoder);
  }

  void set_decoder(std::unique_ptr<Decoder> decoder) {
    decoder_ = std::move(decoder);
  }

  void set_request_protocol(Protocol protocol) { request_protocol_ = protocol; }

  void set_response_protocol(Protocol protocol) {
    response_protocol_ = protocol;
  }

  void set_client_liveness_detection_interval(
      ngx_msec_t client_liveness_detection_interval) {
    client_liveness_detection_interval_ = client_liveness_detection_interval;
  }

  void OnClientLivenessDetectionEvent(ngx_event_t *event);

  void StopClientLivenessDetection();

 private:
  friend void ::continue_read_request_body(ngx_http_request_t *r);

  // Invoked by nginx when more request body is available to read.
  void ContinueReadRequestBody();

  // Decode and send GRPC messages to backend. Returns true if a GRPC message
  // has been sent.
  bool SendRequestToBackend();

  // Add request initial metadata to the request to backend. It's no-op if
  // request initial metadata has been sent before.
  void AddRequestInitialMetadataOnce(const std::unique_ptr<Request> &request);

  // Add a request message to the request to backend.
  void AddRequestMessage(const std::unique_ptr<Request> &request);

  // Decode the request body.
  Status DecodeRequestBody();

  // Callback when the GRPC message has been sent to backend.
  void SendRequestToBackendDone(bool result);

  void SendResponseMessageToClient(Response *response);

  void SendResponseStatusToClient(Response *response);

  void SendResponseHeadersToClient(Response *response);

  void SendResponseTrailersToClient(Response *response);

  void SendErrorToClient(const grpc::Status &status);

  void WriteToNginxResponse(uint8_t *data, size_t size);

  ngx_http_request_t *http_request_;
  std::unique_ptr<Decoder> decoder_;
  std::unique_ptr<Encoder> encoder_;
  // The frontend protocol of the current processing request.
  Protocol request_protocol_;
  // The frontend protocol of the current processing response.
  Protocol response_protocol_;
  // True if already reach the end of the HTTP request from nginx.
  bool is_request_half_closed_;
  // True if the half close has been sent to the GRPC backend.
  bool is_request_half_closed_sent_;
  // True if the request metadata has been sent to the GRPC backend.
  bool is_request_init_metadata_sent_;
  // True if the response headers have been sent back via nginx.
  bool is_response_http_headers_sent_;
  // True if the response trailers have been sent back via nginx.
  bool is_response_status_sent_;
  // A timer for client liveness detection.
  ngx_event_t *client_liveness_detection_timer_;
  // The client liveness detection interval in millisecond.
  ngx_msec_t client_liveness_detection_interval_;
  // A dummy connection wraps the client liveness detection timer.
  ngx_connection_t *client_liveness_detection_timer_connection_;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_FRONTEND_NGINX_HTTP_FRONTEND_H_
