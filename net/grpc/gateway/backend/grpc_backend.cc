#include "net/grpc/gateway/backend/grpc_backend.h"

#include <algorithm>
#include <cctype>
#include <iterator>
#include <utility>
#include <vector>

#include "net/grpc/gateway/backend/grpc_utils.h"
#include "net/grpc/gateway/frontend/frontend.h"
#include "net/grpc/gateway/log.h"
#include "net/grpc/gateway/runtime/runtime.h"
#include "net/grpc/gateway/runtime/types.h"
#include "third_party/grpc/include/grpc++/support/string_ref.h"
#include "third_party/grpc/include/grpc/byte_buffer.h"
#include "third_party/grpc/include/grpc/byte_buffer_reader.h"
#include "third_party/grpc/include/grpc/grpc.h"
#include "third_party/grpc/include/grpc/support/slice.h"
#include "third_party/grpc/include/grpc/support/time.h"

namespace grpc {
namespace gateway {

GrpcBackend::GrpcBackend()
    : channel_(nullptr),
      call_(nullptr),
      response_message_(nullptr),
      status_code_(grpc_status_code::GRPC_STATUS_OK),
      status_details_(nullptr),
      status_details_capacity_(0),
      is_cancelled_(false) {
  grpc_metadata_array_init(&response_initial_metadata_);
  grpc_metadata_array_init(&response_trailing_metadata_);
}

GrpcBackend::~GrpcBackend() {
  DEBUG("~GrpcBackend()");
  grpc_metadata_array_destroy(&response_initial_metadata_);
  grpc_metadata_array_destroy(&response_trailing_metadata_);
}

grpc_channel* GrpcBackend::CreateChannel() {
  return grpc_insecure_channel_create(address_.c_str(), nullptr, nullptr);
}

void GrpcBackend::Start() {
  channel_ = CreateChannel();
  call_ = grpc_channel_create_call(
      channel_, nullptr, 0, Runtime::Get().grpc_event_queue(), method_.c_str(),
      host_.c_str(), gpr_inf_future(GPR_CLOCK_REALTIME), nullptr);
  // Receives GRPC response initial metadata.
  grpc_op ops[1];
  ops[0].op = GRPC_OP_RECV_INITIAL_METADATA;
  ops[0].data.recv_initial_metadata = &response_initial_metadata_;
  ops[0].flags = 0;
  ops[0].reserved = nullptr;
  grpc_call_error error = grpc_call_start_batch(
      call_, ops, 1, BindTo(this, &GrpcBackend::OnResponseInitialMetadata),
      nullptr);
  if (error != GRPC_CALL_OK) {
    DEBUG("GRPC batch failed: %s", GrpcCallErrorToString(error).c_str());
  }
}

void GrpcBackend::OnResponseInitialMetadata(bool result) {
  if (!result) {
    FinishWhenTagFail(
        "Receive GRPC response initial metadata from backend failed.");
    return;
  }

  std::unique_ptr<Response> response(new Response());
  std::unique_ptr<Headers> response_headers(new Headers());
  for (size_t i = 0; i < response_initial_metadata_.count; i++) {
    grpc_metadata* metadata = response_initial_metadata_.metadata + i;
    response_headers->push_back(
        Header(std::string(metadata->key),
               string_ref(metadata->value, metadata->value_length)));
  }
  response->set_headers(std::move(response_headers));
  frontend()->Send(std::move(response));

  // Receives next GRPC response message.
  grpc_op ops[1];
  ops[0].op = GRPC_OP_RECV_MESSAGE;
  ops[0].data.recv_message = &response_message_;
  ops[0].flags = 0;
  ops[0].reserved = nullptr;
  grpc_call_error error = grpc_call_start_batch(
      call_, ops, 1, BindTo(this, &GrpcBackend::OnResponseMessage), nullptr);
  if (error != GRPC_CALL_OK) {
    DEBUG("GRPC batch failed: %s", GrpcCallErrorToString(error).c_str());
  }
}

void GrpcBackend::OnResponseMessage(bool result) {
  if (!result) {
    FinishWhenTagFail("Receive GRPC response message from backend failed.");
    return;
  }

  if (response_message_ == nullptr) {
    // Receives the GRPC response status.
    grpc_op ops[1];
    ops[0].op = GRPC_OP_RECV_STATUS_ON_CLIENT;
    ops[0].data.recv_status_on_client.status = &status_code_;
    ops[0].data.recv_status_on_client.status_details = &status_details_;
    ops[0].data.recv_status_on_client.status_details_capacity =
        &status_details_capacity_;
    ops[0].data.recv_status_on_client.trailing_metadata =
        &response_trailing_metadata_;
    ops[0].flags = 0;
    ops[0].reserved = nullptr;
    grpc_call_error error = grpc_call_start_batch(
        call_, ops, 1, BindTo(this, &GrpcBackend::OnResponseStatus), nullptr);
    if (error != GRPC_CALL_OK) {
      DEBUG("GRPC batch failed: %s", GrpcCallErrorToString(error).c_str());
    }
    return;
  }

  std::unique_ptr<Response> response(new Response());
  std::unique_ptr<Message> message(new Message());

  grpc_byte_buffer_reader reader;
  grpc_byte_buffer_reader_init(&reader, response_message_);
  gpr_slice slice;
  while (grpc_byte_buffer_reader_next(&reader, &slice)) {
    message->push_back(Slice(slice, Slice::STEAL_REF));
  }
  grpc_byte_buffer_reader_destroy(&reader);
  response->set_message(std::move(message));
  frontend()->Send(std::move(response));

  // Receives next GRPC response message.
  grpc_op ops[1];
  ops[0].op = GRPC_OP_RECV_MESSAGE;
  ops[0].data.recv_message = &response_message_;
  ops[0].flags = 0;
  ops[0].reserved = nullptr;
  grpc_call_error error = grpc_call_start_batch(
      call_, ops, 1, BindTo(this, &GrpcBackend::OnResponseMessage), nullptr);
  if (error != GRPC_CALL_OK) {
    DEBUG("GRPC batch failed: %s", GrpcCallErrorToString(error).c_str());
  }
}

void GrpcBackend::OnResponseStatus(bool result) {
  if (!result) {
    FinishWhenTagFail("Receive GRPC response status from backend failed.");
    return;
  }

  std::unique_ptr<Response> response(new Response());
  response->set_status(std::unique_ptr<grpc::Status>(new grpc::Status(
      static_cast<grpc::StatusCode>(status_code_), status_details_)));

  std::unique_ptr<Trailers> response_trailers(new Trailers());
  for (size_t i = 0; i < response_trailing_metadata_.count; i++) {
    grpc_metadata* metadata = response_trailing_metadata_.metadata + i;
    response_trailers->push_back(
        Trailer(std::string(metadata->key),
                string_ref(metadata->value, metadata->value_length)));
  }
  response->set_trailers(std::move(response_trailers));
  frontend()->Send(std::move(response));
}

void GrpcBackend::Send(std::unique_ptr<Request> request, Tag* on_done) {
  grpc_op ops[3];
  grpc_op* op = ops;

  if (request->headers() != nullptr) {
    for (Header& header : *request->headers()) {
      std::transform(header.first.begin(), header.first.end(),
                     header.first.begin(), ::tolower);
      request_initial_metadata_.push_back({header.first.data(),
                                           header.second.data(),
                                           header.second.length(), 0});
    }
    op->op = GRPC_OP_SEND_INITIAL_METADATA;
    op->data.send_initial_metadata.metadata = request_initial_metadata_.data();
    op->data.send_initial_metadata.count = request_initial_metadata_.size();
    op->flags = 0;
    op->reserved = nullptr;
    op++;
  }

  if (request->message() != nullptr) {
    op->op = GRPC_OP_SEND_MESSAGE;
    std::vector<gpr_slice> slices;
    for (auto& piece : *request->message()) {
      // TODO(fengli): Once I get an API to access the gpr_slice in a Slice, the
      // copy can be eliminated.
      slices.push_back(gpr_slice_from_copied_buffer(
          reinterpret_cast<const char*>(piece.begin()), piece.size()));
    }
    op->data.send_message =
        grpc_raw_byte_buffer_create(slices.data(), slices.size());
    op->flags = 0;
    op->reserved = nullptr;
    op++;
  }

  if (request->final()) {
    op->op = GRPC_OP_SEND_CLOSE_FROM_CLIENT;
    op->flags = 0;
    op->reserved = nullptr;
    op++;
  }

  GPR_ASSERT(op != ops);
  if (op != ops) {
    grpc_call_error error =
        grpc_call_start_batch(call_, ops, op - ops, on_done, nullptr);
    DEBUG("grpc_call_start_batch: %s", GrpcCallErrorToString(error).c_str());
  }
}

void GrpcBackend::Cancel(const Status& reason) {
  if (is_cancelled_) {
    DEBUG("GRPC has been cancelled, skip redundant cancellation: %s",
          reason.error_message().c_str());
    return;
  }
  is_cancelled_ = true;

  DEBUG("Cancel GRPC: %s", reason.error_message().c_str());
  cancel_reason_ = reason;
  grpc_call_error error = grpc_call_cancel(call_, nullptr);
  if (error != GRPC_CALL_OK) {
    DEBUG("GRPC cancel failed: %s", GrpcCallErrorToString(error).c_str());
  }
}

void GrpcBackend::FinishWhenTagFail(const char* error) {
  DEBUG(error);
  std::unique_ptr<Response> response(new Response());
  if (is_cancelled_) {
    response->set_status(std::unique_ptr<Status>(new Status(cancel_reason_)));
  } else {
    response->set_status(
        std::unique_ptr<Status>(new Status(StatusCode::INTERNAL, error)));
  }
  frontend()->Send(std::move(response));
}
}  // namespace gateway
}  // namespace grpc
