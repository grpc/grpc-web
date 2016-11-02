#ifndef NET_GRPC_GATEWAY_FRONTEND_FRONTEND_H_
#define NET_GRPC_GATEWAY_FRONTEND_FRONTEND_H_

#include <memory>

#include "net/grpc/gateway/backend/backend.h"
#include "net/grpc/gateway/runtime/response.h"

namespace grpc {
namespace gateway {

class Frontend : public std::enable_shared_from_this<Frontend> {
 public:
  explicit Frontend(std::unique_ptr<Backend> backend);
  virtual ~Frontend();
  Frontend(const Frontend&) = delete;
  Frontend& operator=(const Frontend&) = delete;

  // Start the frontend proxy progress.
  virtual void Start() = 0;

  // Send response to client.
  virtual void Send(std::unique_ptr<Response> response) = 0;

 protected:
  Backend* backend() { return backend_.get(); }
  std::shared_ptr<Frontend> shared_ptr() { return shared_from_this(); }

 private:
  std::unique_ptr<Backend> backend_;
};
}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_FRONTEND_FRONTEND_H_
