package grpc.testing.main;

import com.google.protobuf.ByteString;
import grpc.testing.EmptyOuterClass.Empty;
import grpc.testing.Messages.EchoStatus;
import grpc.testing.Messages.Payload;
import grpc.testing.Messages.ResponseParameters;
import grpc.testing.Messages.SimpleRequest;
import grpc.testing.Messages.SimpleResponse;
import grpc.testing.Messages.StreamingOutputCallResponse;
import grpc.testing.TestServiceGrpc.TestServiceImplBase;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import java.util.logging.Logger;
import org.apache.commons.lang3.StringUtils;

/**
 * Implements the service methods defined in test.proto
 */
public class TestService extends TestServiceImplBase {

  private static final Logger LOGGER = Logger.getLogger(TestService.class.getName());

  @Override
  public void unaryCall(SimpleRequest request, StreamObserver<SimpleResponse> responseObserver) {
    if (request.hasResponseStatus()) {
      EchoStatus echoStatus = request.getResponseStatus();
      Status status = Status.fromCodeValue(echoStatus.getCode());
      status = status.withDescription(echoStatus.getMessage());
      responseObserver.onError(status.asRuntimeException());
      return;
    }
    int responseSizeDesired = request.getResponseSize();
    String resp = StringUtils.repeat("0", responseSizeDesired);
    Payload out = Payload.newBuilder().setBody(ByteString.copyFromUtf8(resp)).build();
    SimpleResponse response = SimpleResponse.newBuilder().setPayload(out).build();
    responseObserver.onNext(response);
    responseObserver.onCompleted();
  }

  @Override
  public void emptyCall(Empty request, io.grpc.stub.StreamObserver<Empty> responseObserver) {
    responseObserver.onNext(Empty.newBuilder().build());
    responseObserver.onCompleted();
  }

  @Override
  public void streamingOutputCall(grpc.testing.Messages.StreamingOutputCallRequest request,
      io.grpc.stub.StreamObserver<grpc.testing.Messages.StreamingOutputCallResponse> responseObserver) {
    for (ResponseParameters params: request.getResponseParametersList()) {
      String str = StringUtils.repeat("0", params.getSize());
      Payload out = Payload.newBuilder().setBody(ByteString.copyFromUtf8(str)).build();
      StreamingOutputCallResponse resp =
          StreamingOutputCallResponse.newBuilder().setPayload(out).build();
      responseObserver.onNext(resp);
      // do we need to sleep before sending next one out
      try {
        if (params.getIntervalUs() >= 1000) {
          Thread.sleep(params.getIntervalUs() / 1000);
        }
      } catch (InterruptedException e) {
        e.printStackTrace();
        // TODO ignore?
      }
    }
    responseObserver.onCompleted();
  }
}
