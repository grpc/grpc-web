#include "net/grpc/gateway/runtime/request.h"

namespace grpc {
namespace gateway {

Request::Request() : final_(false) {}

Request::~Request() {}

}  // namespace gateway
}  // namespace grpc
