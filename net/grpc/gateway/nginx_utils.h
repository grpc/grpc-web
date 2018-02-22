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
