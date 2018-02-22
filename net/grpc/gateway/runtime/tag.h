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

#ifndef NET_GRPC_GATEWAY_RUNTIME_TAG_H_
#define NET_GRPC_GATEWAY_RUNTIME_TAG_H_

#include <functional>
#include <memory>

namespace grpc {
namespace gateway {

// The Tag class represents an async operation, it holds a shared_ptr to the
// caller to avoid the caller from being deleted before the callback getting
// invoked.
class Tag {
 public:
  Tag(std::shared_ptr<void> instance, std::function<void(bool)> function);
  virtual ~Tag();
  Tag(const Tag&) = delete;
  Tag& operator=(const Tag&) = delete;

  // Invokes the callback associated to this tag.
  void operator()();

  bool result() { return result_; }
  void set_result(bool result) { result_ = result; }

 private:
  // The target instance.
  std::shared_ptr<void> instance_;
  // The callback function.
  std::function<void(bool)> function_;
  // The result of the tag from completion queue.
  bool result_;
};

// Creates a tag which is bound to the specified function. The tag will keep a
// shared_ptr to hold the object and keep it from being deleted. After the bound
// function get invoked, the tag will be deleted, hence the reference count of
// the object get decreased by 1 and will be released if no other shared_ptr
// hold it.
// The bound object must extend std::enable_shared_from_this.
// Note: the object and target can be different instance, in that case, the
// object owns the target. For example, object can be a frontend instance and
// target can be a backend object. The frontend object owns the backend object
// and only the frontend object is used for reference count.
template <class C, class T, class F>
Tag* BindTo(C* object, T target, F function) {
  return new Tag(object->shared_from_this(),
                 std::function<void(bool)>(
                     std::bind(function, target, std::placeholders::_1)));
}
}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_RUNTIME_TAG_H_
