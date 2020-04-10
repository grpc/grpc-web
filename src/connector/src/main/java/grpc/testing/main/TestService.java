package grpc.testing.main;

import com.google.protobuf.ByteString;
import grpc.testing.EmptyOuterClass.Empty;
import grpc.testing.Messages.Payload;
import grpc.testing.Messages.SimpleRequest;
import grpc.testing.Messages.SimpleResponse;
import grpc.testing.TestServiceGrpc.TestServiceImplBase;
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
}
