package com.google.grpcweb;

import com.google.common.annotations.VisibleForTesting;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;
import javax.servlet.ServletInputStream;
import javax.servlet.http.HttpServletRequest;

class MessageHandler {
  private static final Logger LOGGER = Logger.getLogger(MessageHandler.class.getName());

  @VisibleForTesting
  enum ContentType {
    GRPC_WEB_BINARY,
    GRPC_WEB_TEXT;
  }

  private static Map<String, ContentType> GRPC_GCP_CONTENT_TYPES =
     new HashMap<String, ContentType>() {{
         put("application/grpc-web", ContentType.GRPC_WEB_BINARY);
         put("application/grpc-web+proto", ContentType.GRPC_WEB_BINARY);
         put("application/grpc-web-text", ContentType.GRPC_WEB_TEXT);
         put("application/grpc-web-text+proto", ContentType.GRPC_WEB_TEXT);
     }};

  /**
   * Validate the content-type
   */
  ContentType validateContentType(HttpServletRequest req) throws IllegalArgumentException {
    String contentType = req.getContentType();
    if (contentType == null || !GRPC_GCP_CONTENT_TYPES.containsKey(contentType)) {
      throw new IllegalArgumentException("This content type is not used for grpc-web: "
          + contentType);
    }
    return GRPC_GCP_CONTENT_TYPES.get(contentType);
  }

  /**
   * Find the input arg protobuf class for the given rpc-method.
   * Convert the given bytes to the input protobuf. return that.
   */
  private Object getInputProtobufObj(Method rpcMethod, byte[] in) {
    Class[] inputArgs = rpcMethod.getParameterTypes();
    Class inputArgClass = inputArgs[0];
    LOGGER.fine("inputArgClass name: " + inputArgClass.getName());

    // use the inputArg classtype to create a protobuf object
    Method parseFromObj;
    try {
      parseFromObj = inputArgClass.getMethod("parseFrom", byte[].class);
    } catch (NoSuchMethodException e) {
      throw new IllegalArgumentException("Couldn't find method in 'parseFrom' in "
          + inputArgClass.getName());
    }

    Object inputObj;
    try {
      inputObj = parseFromObj.invoke(null, in);
    } catch (InvocationTargetException | IllegalAccessException e) {
      throw new IllegalArgumentException(e);
    }

    if (inputObj == null || !inputArgClass.isInstance(inputObj)) {
      throw new IllegalArgumentException(
          "Input obj is **not** instance of the correct input class type");
    }
    return inputObj;
  }

  /**
   * Invoke the rpc-method and get the result.
   */
  Object invokeRpcAndGetResult(HttpServletRequest req, ContentType contentType,
      Object stub, Method rpcMethod)
      throws IOException {
    ServletInputStream in = req.getInputStream();
    MessageDeframer deframer = new MessageDeframer();
    if (!deframer.processInput(in, contentType)) {
      return null;
    }
    Object inObj = getInputProtobufObj(rpcMethod, deframer.getMessageBytes());

    Class returnClassType = rpcMethod.getReturnType();
    LOGGER.fine("returnClassType is : " + returnClassType.getName());
    Object outObj;
    try {
      outObj = rpcMethod.invoke(stub, inObj);
    } catch (InvocationTargetException | IllegalAccessException e) {
      e.printStackTrace();
      throw new IllegalArgumentException(e);
    }
    if (!returnClassType.isInstance(outObj)) {
      throw new IllegalArgumentException(
          "return obj is **not** instance of the correct output class type: "
          + returnClassType.getName());
    }
    return outObj;
  }
}
