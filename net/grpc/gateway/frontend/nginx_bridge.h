/**
 *
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

#ifndef NET_GRPC_GATEWAY_FRONTEND_NGINX_BRIDGE_H_
#define NET_GRPC_GATEWAY_FRONTEND_NGINX_BRIDGE_H_

// NOTE: Required on top in order to include ngx_config.h libc defines
#include "net/grpc/gateway/nginx_includes.h"

typedef struct ngx_grpc_gateway_loc_conf_s ngx_grpc_gateway_loc_conf_t;
struct ngx_grpc_gateway_loc_conf_s {
  ngx_str_t grpc_pass;
  ngx_flag_t grpc_channel_reuse;
  ngx_msec_t grpc_client_liveness_detection_interval;
  ngx_flag_t grpc_ssl;
  ngx_str_t grpc_ssl_target_name_override;
  ngx_str_t grpc_ssl_pem_root_certs;
  ngx_str_t grpc_ssl_pem_private_key;
  ngx_str_t grpc_ssl_pem_cert_chain;
};

#endif  // NET_GRPC_GATEWAY_FRONTEND_NGINX_BRIDGE_H_
