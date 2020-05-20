package com.google.grpcweb;

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
import java.util.logging.Logger;
import javax.servlet.http.HttpServletResponse;

class GrpcWebClientInterceptor implements ClientInterceptor {
  private static final Logger LOG = Logger.getLogger(GrpcWebClientInterceptor.class.getName());
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
        // TODO is this correct? what if onError() never gets called? maybe here it should
        //  be handled: send headers first and then send the trailers.
      } else {
        mSendResponse.writeTrailer(s, t);
        mLatch.countDown();
      }
      super.onClose(s, t);
    }
  }
}
