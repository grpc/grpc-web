#include "net/grpc/gateway/runtime/tag.h"

#include <algorithm>

namespace grpc {
namespace gateway {

Tag::Tag(std::shared_ptr<void> instance, std::function<void(bool)> function)
    : instance_(std::move(instance)),
      function_(std::move(function)),
      result_(false) {}

Tag::~Tag() {}

void Tag::operator()() { function_(result_); }

}  // namespace gateway
}  // namespace grpc
