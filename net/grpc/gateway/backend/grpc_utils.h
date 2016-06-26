#ifndef NET_GRPC_GATEWAY_BACKEND_GRPC_UTILS_H_
#define NET_GRPC_GATEWAY_BACKEND_GRPC_UTILS_H_

#include <string>

#include "third_party/grpc/include/grpc/grpc.h"

namespace grpc {
namespace gateway {
std::string GrpcCallErrorToString(grpc_call_error error);
}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_BACKEND_GRPC_UTILS_H_
