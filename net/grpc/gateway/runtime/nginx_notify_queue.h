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

#ifndef NET_GRPC_GATEWAY_RUNTIME_NGINX_NOTIFY_QUEUE_H_
#define NET_GRPC_GATEWAY_RUNTIME_NGINX_NOTIFY_QUEUE_H_

// NOTE: Required on top in order to include ngx_config.h libc defines
#include "net/grpc/gateway/nginx_includes.h"

#include <deque>
#include <memory>

#include "net/grpc/gateway/runtime/tag.h"
#include "third_party/grpc/include/grpc/support/sync.h"

namespace grpc {
namespace gateway {

// The queue which dispatch async IO events back to the Nginx main event loop
// for processing. It's a singleton, since Nginx uses a global socket fd for its
// notify mechanism.
class NginxNotifyQueue {
 public:
  // Returns the singleton of NginxNotifyQueue.
  static NginxNotifyQueue& Get();

  virtual ~NginxNotifyQueue();
  NginxNotifyQueue(const NginxNotifyQueue&) = delete;
  NginxNotifyQueue& operator=(const NginxNotifyQueue&) = delete;

  // Add a Tag to the nginx notify queue, its callback will be invoked in the
  // main nginx event loop later.
  void Add(std::unique_ptr<Tag> tag);

 private:
  static void NginxNotifyEventsCallback(ngx_event_t* event);
  NginxNotifyQueue();
  void ProcessEvents(ngx_event_t* event);

  gpr_mu mutex_;
  ngx_event_t notify_;
  bool waiting_for_notify_;
  std::deque<std::unique_ptr<Tag>> queue_;
};
}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_RUNTIME_NGINX_NOTIFY_QUEUE_H_
