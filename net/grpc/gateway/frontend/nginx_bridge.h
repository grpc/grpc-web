#ifndef NET_GRPC_GATEWAY_FRONTEND_NGINX_BRIDGE_H_
#define NET_GRPC_GATEWAY_FRONTEND_NGINX_BRIDGE_H_

// NOTE: Required on top in order to include ngx_config.h libc defines
#include "net/grpc/gateway/nginx_includes.h"

typedef struct ngx_grpc_gateway_loc_conf_s ngx_grpc_gateway_loc_conf_t;
struct ngx_grpc_gateway_loc_conf_s {
  ngx_str_t grpc_pass;
  ngx_flag_t grpc_channel_reuse;
  ngx_msec_t grpc_client_liveness_detection_interval;
};

#endif  // NET_GRPC_GATEWAY_FRONTEND_NGINX_BRIDGE_H_
