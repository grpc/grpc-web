#ifndef NET_GRPC_GATEWAY_NGINX_UTILS_H_
#define NET_GRPC_GATEWAY_NGINX_UTILS_H_

// NOTE: Required on top in order to include ngx_config.h libc defines
#include "net/grpc/gateway/nginx_includes.h"

#include "net/grpc/gateway/log.h"
#include "third_party/grpc/include/grpc++/support/string_ref.h"

namespace grpc {
namespace gateway {

void AddHTTPHeader(ngx_http_request_t *http_request, const string &name,
                   const string_ref &value);

void AddHTTPTrailer(ngx_http_request_t *http_request, const string &name,
                    const string_ref &value);
}  // namespace gateway
}  // namespace grpc

#endif  // NET_GRPC_GATEWAY_NGINX_UTILS_H_
