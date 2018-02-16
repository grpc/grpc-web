#ifndef NET_GRPC_GATEWAY_RUNTIME_GRPC_EVENT_QUEUE_H_
#define NET_GRPC_GATEWAY_RUNTIME_GRPC_EVENT_QUEUE_H_

#include "third_party/grpc/include/grpc/grpc.h"
#include "third_party/grpc/include/grpc/support/thd_id.h"

namespace grpc {
namespace gateway {

// The queue which process GRPC IO events. In GRPC gateway, we use one single
// thread to process all GRPC IO events in a non-blocking way.
class GrpcEventQueue {
 public:
  GrpcEventQueue();
  virtual ~GrpcEventQueue();
  GrpcEventQueue(const GrpcEventQueue&) = delete;
  GrpcEventQueue& operator=(const GrpcEventQueue&) = delete;

  // Starts the GRPC IO events processing loop.
  void Start();

  // Stops the GRPC IO events processing loop.
  void Stop();

  // Returns the GRPC completion queue which is used to process all GRPC IO
  // events.
  grpc_completion_queue* queue() { return queue_; }

 private:
  static void ExecuteEventLoop(void* queue);

  grpc_completion_queue* queue_;

  gpr_thd_id thread_id_;
};
}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_RUNTIME_GRPC_EVENT_QUEUE_H_
