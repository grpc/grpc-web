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

#include "net/grpc/gateway/utils.h"

#include <stdarg.h>
#include <stdlib.h>

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
    return "";
  }
  va_end(args);
  grpc::string message(buffer);
  free(buffer);
  return message;
}
}  // namespace gateway
}  // namespace grpc
