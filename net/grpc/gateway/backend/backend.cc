#include "net/grpc/gateway/backend/backend.h"

namespace grpc {
namespace gateway {

Backend::Backend() : frontend_(nullptr) {}

Backend::~Backend() {}

}  // namespace gateway
}  // namespace grpc
