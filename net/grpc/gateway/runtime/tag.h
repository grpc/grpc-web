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
// shared_ptr to hold the target and keep it from being deleted. After the bound
// function get invoked, the tag will be deleted, hence the reference count of
// the target object get decreased by 1 and will be released if no other
// shared_ptr hold it.
// The bound object must extend std::enable_shared_from_this.
template <class C, class F>
Tag* BindTo(C* object, F function) {
  return new Tag(object->shared_from_this(),
                 std::function<void(bool)>(
                     std::bind(function, object, std::placeholders::_1)));
}
}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_RUNTIME_TAG_H_
