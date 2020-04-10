package com.google.grpcweb;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import com.google.grpcweb.MessageHandler.ContentType;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Base64;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

@RunWith(JUnit4.class)
public class MessageDeframerTest {

  private MessageDeframer testInstance;

  @Before
  public void setUp() {
    testInstance = new MessageDeframer();
    assertNotNull(testInstance);
  }

  private void singleFrameTest(boolean encode) throws IOException {
    String source = "This is the source of my input stream";
    byte[] str = stringToFrame(source, encode);
    InputStream in = new ByteArrayInputStream(str);
    assertTrue(testInstance.processInput(in, getContentType(encode)));
    byte[] result = testInstance.getMessageBytes();
    assertTrue(source.equals(new String(result)));
    assertEquals(source.length(), testInstance.getLength());
    assertEquals(1, testInstance.getNumberOfFrames());
  }

  @Test
  public void testProcessInput_Singleframe() throws IOException {
    singleFrameTest(false);
  }

  @Test
  public void testProcessInput_Singleframe_Base64Encoded() throws IOException {
    singleFrameTest(true);
  }

  private void manyFramesTest(boolean encode) throws IOException {
    ArrayList<String> inputSrcs = new ArrayList<>();
    // Create 10 frames
    int numFrames = 10;
    for (int i = 0; i < numFrames; i++) {
      inputSrcs.add("this is string# " + i);
    }
    ByteArrayOutputStream combined = new ByteArrayOutputStream();
    String concatenatedInputSrc = "";
    // create 10 frames first and then Base64 Encode the whole string.
    for (String s : inputSrcs) {
      combined.write(stringToFrame(s, false));
      concatenatedInputSrc += s;
    }
    byte[] combinedBytesOrig = combined.toByteArray();
    byte[] combinedBytes = encode ? Base64.getEncoder().encode(combinedBytesOrig)
        : combinedBytesOrig;
    if (!encode) {
      assertEquals(concatenatedInputSrc.length() + inputSrcs.size() * 5,
          combinedBytes.length);
    }
    InputStream in = new ByteArrayInputStream(combinedBytes);
    assertTrue(testInstance.processInput(in, getContentType(encode)));
    byte[] result = testInstance.getMessageBytes();
    assertTrue(concatenatedInputSrc.equals(new String(result)));
    assertEquals(concatenatedInputSrc.length(), testInstance.getLength());
    assertEquals(10, testInstance.getNumberOfFrames());
  }

  @Test
  public void testProcessInput_Manyframes() throws IOException {
    manyFramesTest(false);
  }

  @Test
  public void testProcessInput_Manyframes_Base64Encoded() throws IOException {
    manyFramesTest(true);
  }

  public void emptyFrameTest(boolean encode) throws IOException {
    // Empty frame is a valid frame.
    byte[] str = stringToFrame("", false);
    InputStream in = new ByteArrayInputStream(str);
    assertTrue(testInstance.processInput(in, getContentType(encode)));
    assertEquals(0, testInstance.getMessageBytes().length);
    assertEquals(1, testInstance.getNumberOfFrames());
  }

  @Test
  public void testProcessInput_EmptyDataframeInInput() throws IOException {
    emptyFrameTest(false);
  }

  public void noDataTest(boolean encode) throws IOException {
    // Input has no data frames at all
    InputStream in = new ByteArrayInputStream(new byte[0]);
    assertFalse(testInstance.processInput(in, getContentType(encode)));
  }

  @Test
  public void testProcessInput_NoDataframesInInput() throws IOException {
    noDataTest(false);
  }

  @Test
  public void testProcessInput_NoDataframesInInput_Base64Encoded() throws IOException {
    noDataTest(true);
  }

  private byte[] stringToFrame(String source, boolean encode) throws IOException {
    ByteArrayOutputStream output = new ByteArrayOutputStream();
    output.write(MessageDeframer.DATA_BYTE);
    output.write(ByteBuffer.allocate(4).putInt(source.length()).array());
    output.write(source.getBytes());
    byte[] outB = output.toByteArray();
    return (encode) ? Base64.getEncoder().encode(outB) : outB;
  }

  private MessageHandler.ContentType getContentType(boolean encode) {
    return encode ? ContentType.GRPC_WEB_TEXT : ContentType.GRPC_WEB_BINARY;
  }
}
