#include "net/grpc/gateway/utils.h"

#include <stdarg.h>

#include "third_party/grpc/include/grpc/support/alloc.h"
#include "third_party/grpc/include/grpc/support/string_util.h"

namespace grpc {
namespace gateway {
grpc::string Format(const char* format, ...) {
  va_list args;
  va_start(args, format);
  size_t length = vsnprintf(nullptr, 0, format, args);
  va_end(args);
  va_start(args, format);
  char* buffer = reinterpret_cast<char*>(malloc(sizeof(char) * (length + 1)));
  if (vsnprintf(buffer, length + 1, format, args) < 0) {
    va_end(args);
    return nullptr;
  }
  va_end(args);
  grpc::string message(buffer);
  free(buffer);
  return message;
}
}  // namespace gateway
}  // namespace grpc
