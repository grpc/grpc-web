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

#include "net/grpc/gateway/runtime/nginx_notify_queue.h"

#include <algorithm>
#include <utility>

#include "net/grpc/gateway/log.h"

namespace grpc {
namespace gateway {

NginxNotifyQueue& NginxNotifyQueue::Get() {
  static NginxNotifyQueue instance;
  return instance;
}

void NginxNotifyQueue::NginxNotifyEventsCallback(ngx_event_t* event) {
  NginxNotifyQueue::Get().ProcessEvents(event);
}

NginxNotifyQueue::NginxNotifyQueue() : mutex_(), waiting_for_notify_(false) {
  gpr_mu_init(&mutex_);
  ngx_notify_init(&notify_, NginxNotifyEventsCallback,
                  const_cast<ngx_cycle_t*>(ngx_cycle));
}

NginxNotifyQueue::~NginxNotifyQueue() { gpr_mu_destroy(&mutex_); }

void NginxNotifyQueue::Add(std::unique_ptr<Tag> tag) {
  gpr_mu_lock(&mutex_);
  queue_.push_back(std::move(tag));
  if (waiting_for_notify_) {
    gpr_mu_unlock(&mutex_);
    return;
  }

  waiting_for_notify_ = true;
  ngx_int_t rc = ngx_notify(&notify_);
  GPR_ASSERT(rc == NGX_OK);
  if (rc != NGX_OK) {
    ERROR("ngx_notify failed, rc = %" PRIdPTR ".", rc);
  }
  gpr_mu_unlock(&mutex_);
}

void NginxNotifyQueue::ProcessEvents(ngx_event_t* event) {
  gpr_mu_lock(&mutex_);
  while (!queue_.empty()) {
    std::unique_ptr<Tag> tag = std::move(queue_.front());
    queue_.pop_front();
    (*tag)();
  }

  if (waiting_for_notify_) {
    waiting_for_notify_ = false;
  }
  gpr_mu_unlock(&mutex_);
}
}  // namespace gateway
}  // namespace grpc
