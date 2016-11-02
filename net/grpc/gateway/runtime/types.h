#ifndef NET_GRPC_GATEWAY_RUNTIME_TYPES_H_
#define NET_GRPC_GATEWAY_RUNTIME_TYPES_H_

#include <string>
#include <utility>
#include <vector>

#include "third_party/grpc/include/grpc++/support/slice.h"
#include "third_party/grpc/include/grpc++/support/string_ref.h"

namespace grpc {
namespace gateway {

typedef std::pair<std::string, string_ref> Header;
typedef Header Trailer;
typedef std::vector<Header> Headers;
typedef Headers Trailers;
typedef std::vector<Slice> Message;

}  // namespace gateway
}  // namespace grpc

#endif  // NET_GRPC_GATEWAY_RUNTIME_TYPES_H_
