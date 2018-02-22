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

#ifndef NET_GRPC_GATEWAY_RUNTIME_REQUEST_H_
#define NET_GRPC_GATEWAY_RUNTIME_REQUEST_H_

#include <algorithm>
#include <memory>

#include "net/grpc/gateway/runtime/types.h"

namespace grpc {
namespace gateway {

class Request {
 public:
  Request();
  virtual ~Request();
  Request(const Request&) = delete;
  Request& operator=(const Request&) = delete;

  void set_headers(std::unique_ptr<Headers> headers) {
    headers_ = std::move(headers);
  }
  Headers* headers() { return headers_.get(); }
  std::unique_ptr<Headers> release_headers() { return std::move(headers_); }

  void set_message(std::unique_ptr<Message> message) {
    message_ = std::move(message);
  }
  Message* message() { return message_.get(); }
  std::unique_ptr<Message> release_message() { return std::move(message_); }

  bool final() const { return final_; }
  void set_final(bool final) { final_ = final; }

  bool empty() const {
    return (!headers_ || headers_->empty()) &&
           (!message_ || message_->empty()) && !final();
  }

 private:
  std::unique_ptr<Headers> headers_;
  std::unique_ptr<Message> message_;
  bool final_;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_RUNTIME_REQUEST_H_
