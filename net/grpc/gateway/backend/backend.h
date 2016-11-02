#ifndef NET_GRPC_GATEWAY_BACKEND_BACKEND_H_
#define NET_GRPC_GATEWAY_BACKEND_BACKEND_H_

#include <memory>

#include "net/grpc/gateway/runtime/request.h"
#include "net/grpc/gateway/runtime/tag.h"
#include "third_party/grpc/include/grpc++/support/status.h"

namespace grpc {
namespace gateway {

class Frontend;

class Backend {
 public:
  Backend();
  virtual ~Backend();
  Backend(const Backend&) = delete;
  Backend& operator=(const Backend&) = delete;

  // Start the backend proxy progress.
  virtual void Start() = 0;

  // Send request to backend.
  virtual void Send(std::unique_ptr<Request> request, Tag* on_done) = 0;

  // Cancel the request to backend.
  virtual void Cancel(const Status& reason) = 0;

 protected:
  Frontend* frontend() { return frontend_; }

 private:
  friend class Frontend;

  void set_frontend(Frontend* frontend) { frontend_ = frontend; }

  Frontend* frontend_;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_BACKEND_BACKEND_H_
