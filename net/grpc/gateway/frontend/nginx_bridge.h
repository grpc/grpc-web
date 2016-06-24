#ifndef NET_GRPC_GATEWAY_FRONTEND_NGINX_BRIDGE_H_
#define NET_GRPC_GATEWAY_FRONTEND_NGINX_BRIDGE_H_

#include "third_party/nginx/src/src/core/ngx_core.h"

const ngx_str_t GRPC_WEB_CONTENT_TYPE_PROTO =
    ngx_string("application/x-protobuf");
const ngx_str_t GRPC_WEB_CONTENT_TYPE_JSON = ngx_string("application/json");

// Configuration directives for GRPC gateway.
#define GRPC_HANDSHAKE_PLAIN 0
#define GRPC_HANDSHAKE_SSL 1
#define GRPC_HANDSHAKE_LOAS2 2

typedef struct ngx_grpc_gateway_loc_conf_s ngx_grpc_gateway_loc_conf_t;
struct ngx_grpc_gateway_loc_conf_s {
  ngx_str_t grpc_pass;
  ngx_uint_t grpc_handshake;
};

#endif  // NET_GRPC_GATEWAY_FRONTEND_NGINX_BRIDGE_H_
