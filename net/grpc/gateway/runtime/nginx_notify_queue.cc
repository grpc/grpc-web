#include "net/grpc/gateway/runtime/nginx_notify_queue.h"

#include <algorithm>

#include "net/grpc/gateway/log.h"
#include "third_party/nginx/src/src/core/ngx_config.h"
#include "third_party/nginx/src/src/event/ngx_event.h"

namespace grpc {
namespace gateway {

NginxNotifyQueue& NginxNotifyQueue::Get() {
  static NginxNotifyQueue instance;
  return instance;
}

void NginxNotifyQueue::NginxNotifyEventsCallback(ngx_event_t* event) {
  NginxNotifyQueue::Get().ProcessEvents(event);
}

NginxNotifyQueue::NginxNotifyQueue() : mutex_(), waiting_for_notify_(false) {}

NginxNotifyQueue::~NginxNotifyQueue() {}

void NginxNotifyQueue::Add(std::unique_ptr<Tag> tag) {
  gpr_mu_lock(&mutex_);
  queue_.push_back(std::move(tag));
  if (waiting_for_notify_) {
    gpr_mu_unlock(&mutex_);
    return;
  }

  waiting_for_notify_ = true;
  ngx_int_t rc = ngx_notify(NginxNotifyEventsCallback);
  GPR_ASSERT(rc == NGX_OK);
  if (rc != NGX_OK) {
    ERROR("ngx_notify failed, rc = %i", rc);
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
