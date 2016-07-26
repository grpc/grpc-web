#ifndef NET_GRPC_GATEWAY_UTILS_H_
#define NET_GRPC_GATEWAY_UTILS_H_

#include "third_party/grpc/include/grpc++/support/config.h"

namespace grpc {
namespace gateway {

grpc::string Format(const char* format, ...);

}  // namespace gateway
}  // namespace grpc

#endif  // NET_GRPC_GATEWAY_UTILS_H_
