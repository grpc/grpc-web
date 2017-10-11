#include "net/grpc/gateway/runtime/grpc_event_queue.h"

#include <algorithm>
#include <memory>

#include "net/grpc/gateway/log.h"
#include "net/grpc/gateway/runtime/nginx_notify_queue.h"
#include "net/grpc/gateway/runtime/tag.h"
#include "third_party/grpc/include/grpc/grpc.h"
#include "third_party/grpc/include/grpc/support/time.h"

namespace grpc {
namespace gateway {

GrpcEventQueue::GrpcEventQueue()
    : queue_(grpc_completion_queue_create_for_next(nullptr)), thread_id_(0) {}

GrpcEventQueue::~GrpcEventQueue() {}

void GrpcEventQueue::Start() {
  gpr_thd_options thread_options = gpr_thd_options_default();
  gpr_thd_options_set_joinable(&thread_options);
  int ret = gpr_thd_new(&thread_id_, ExecuteEventLoop, this, &thread_options);
  INFO("GRPC event thread started: %d", ret);
}

void GrpcEventQueue::Stop() {
  grpc_completion_queue_shutdown(queue_);
  gpr_thd_join(thread_id_);
  grpc_completion_queue_destroy(queue_);
}

void GrpcEventQueue::ExecuteEventLoop(void* queue) {
  GrpcEventQueue* grpc_queue = reinterpret_cast<GrpcEventQueue*>(queue);
  while (true) {
    grpc_event event = grpc_completion_queue_next(
        grpc_queue->queue_, gpr_inf_future(GPR_CLOCK_REALTIME), nullptr);
    if (event.type == grpc_completion_type::GRPC_QUEUE_SHUTDOWN) {
      INFO("GRPC event completion queue has been shutdown, exiting.");
      return;
    }
    if (event.tag != nullptr) {
      std::unique_ptr<Tag> callback(reinterpret_cast<Tag*>(event.tag));
      callback->set_result(event.success);
      NginxNotifyQueue::Get().Add(std::move(callback));
    }
  }
}
}  // namespace gateway
}  // namespace grpc
