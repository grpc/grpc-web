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

#ifndef NET_GRPC_GATEWAY_BACKEND_BACKEND_H_
#define NET_GRPC_GATEWAY_BACKEND_BACKEND_H_

#include <memory>

#include "net/grpc/gateway/runtime/request.h"
#include "net/grpc/gateway/runtime/tag.h"
#include "third_party/grpc/include/grpc++/support/status.h"

namespace grpc {
namespace gateway {

class Frontend;

class Backend {
 public:
  Backend();
  virtual ~Backend();
  Backend(const Backend&) = delete;
  Backend& operator=(const Backend&) = delete;

  // Start the backend proxy progress.
  virtual void Start() = 0;

  // Send request to backend.
  virtual void Send(std::unique_ptr<Request> request, Tag* on_done) = 0;

  // Cancel the request to backend.
  virtual void Cancel(const Status& reason) = 0;

 protected:
  Frontend* frontend() { return frontend_; }

 private:
  friend class Frontend;

  void set_frontend(Frontend* frontend) { frontend_ = frontend; }

  Frontend* frontend_;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_BACKEND_BACKEND_H_
