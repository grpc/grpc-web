#include "net/grpc/gateway/frontend/frontend.h"

#include <memory>

namespace grpc {
namespace gateway {

Frontend::Frontend(std::unique_ptr<Backend> backend)
    : backend_(std::move(backend)) {
  backend_->set_frontend(this);
}

Frontend::~Frontend() {}

}  // namespace gateway
}  // namespace grpc
