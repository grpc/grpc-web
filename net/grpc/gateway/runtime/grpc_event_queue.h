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

#ifndef NET_GRPC_GATEWAY_RUNTIME_GRPC_EVENT_QUEUE_H_
#define NET_GRPC_GATEWAY_RUNTIME_GRPC_EVENT_QUEUE_H_

#include "third_party/grpc/include/grpc/grpc.h"
#include "third_party/grpc/src/core/lib/gprpp/thd.h"

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

  grpc_core::Thread thread_;
};
}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_RUNTIME_GRPC_EVENT_QUEUE_H_
