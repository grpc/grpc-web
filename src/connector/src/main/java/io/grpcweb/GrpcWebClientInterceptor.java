/*
 * Copyright 2020  Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package io.grpcweb;

import io.grpc.CallOptions;
import io.grpc.Channel;
import io.grpc.ClientCall;
import io.grpc.ClientCall.Listener;
import io.grpc.ClientInterceptor;
import io.grpc.ForwardingClientCall.SimpleForwardingClientCall;
import io.grpc.ForwardingClientCallListener.SimpleForwardingClientCallListener;
import io.grpc.Metadata;
import io.grpc.MethodDescriptor;
import io.grpc.Status;
import java.util.concurrent.CountDownLatch;
import javax.servlet.http.HttpServletResponse;

class GrpcWebClientInterceptor implements ClientInterceptor {

  private final CountDownLatch mLatch;
  private final HttpServletResponse mResp;
  private final SendResponse mSendResponse;

  GrpcWebClientInterceptor(HttpServletResponse resp, CountDownLatch latch, SendResponse send) {
    mLatch = latch;
    mResp = resp;
    mSendResponse = send;
  }

  @Override
  public <ReqT, RespT> ClientCall<ReqT, RespT> interceptCall(MethodDescriptor<ReqT, RespT> method,
      CallOptions callOptions, Channel channel) {
   return new SimpleForwardingClientCall<ReqT, RespT>(channel.newCall(method, callOptions)) {
      @Override
      public void start(Listener<RespT> responseListener, Metadata headers) {
        super.start(new MetadataResponseListener<RespT>(responseListener), headers);
      }
    };
  }

  class MetadataResponseListener<T> extends  SimpleForwardingClientCallListener<T> {
    private boolean headersSent = false;

    MetadataResponseListener(Listener<T> responseListener) {
      super(responseListener);
    }

    @Override
    public void onHeaders(Metadata h) {
      mSendResponse.writeHeaders(h);
      headersSent = true;
    }

    @Override
    public void onClose(Status s, Metadata t) {
      if (!headersSent) {
        // seems, sometimes onHeaders() is not called before this method is called!
        // so far, they are the error cases. let onError() method in ClientListener
        // handle this call. Could ignore this.
        // TODO is this correct? what if onError() never gets called?
      } else {
        mSendResponse.writeTrailer(s, t);
        mLatch.countDown();
      }
      super.onClose(s, t);
    }
  }
}
