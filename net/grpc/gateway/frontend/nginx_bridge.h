#ifndef NET_GRPC_GATEWAY_FRONTEND_NGINX_BRIDGE_H_
#define NET_GRPC_GATEWAY_FRONTEND_NGINX_BRIDGE_H_

#include "net/grpc/gateway/nginx_includes.h"

typedef struct ngx_grpc_gateway_loc_conf_s ngx_grpc_gateway_loc_conf_t;
struct ngx_grpc_gateway_loc_conf_s {
  ngx_str_t grpc_pass;
  ngx_str_t grpc_channel_reuse;
};

#endif  // NET_GRPC_GATEWAY_FRONTEND_NGINX_BRIDGE_H_
