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

#ifndef NET_GRPC_GATEWAY_CODEC_DECODER_H_
#define NET_GRPC_GATEWAY_CODEC_DECODER_H_

#include <deque>
#include <memory>
#include <vector>

#include "third_party/grpc/include/grpcpp/support/byte_buffer.h"
#include "third_party/grpc/include/grpcpp/support/slice.h"

namespace grpc {
namespace gateway {

// Interface for GRPC-Gateway decoders. A decoder instance records the internal
// states during the processing of a request (stream). Decoder decodes different
// front end protocols to GRPC backend.
class Decoder {
 public:
  Decoder();
  virtual ~Decoder();
  Decoder(const Decoder&) = delete;
  Decoder& operator=(const Decoder&) = delete;

  // Appends a piece of data to decode.
  virtual void Append(Slice input);

  // Decodes the inputs passed to `Append()` since the last call to `Decode()`
  // and appends the decoded results to those available from `results()`.
  // This method may be invoked multiple times when processing a streamed
  // request.
  virtual Status Decode() = 0;

  // Returns the decoded messages.
  std::deque<std::unique_ptr<ByteBuffer>>* results() { return &results_; }

 protected:
  // Returns the buffered inputs. When the inputs are not enough to be decoded
  // into a new message they will be buffered in this field.
  std::vector<Slice>* inputs() { return &inputs_; }

 private:
  std::vector<Slice> inputs_;
  std::deque<std::unique_ptr<ByteBuffer>> results_;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_CODEC_DECODER_H_
