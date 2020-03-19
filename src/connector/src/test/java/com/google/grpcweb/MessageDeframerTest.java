package com.google.grpcweb;

import static com.google.common.truth.Truth.assertThat;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.util.ArrayList;
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

  @Test
  public void testProcessInput_Singleframe() throws IOException {
    String source = "This is the source of my input stream";
    byte[] str = stringToFrame(source);
    InputStream in = new ByteArrayInputStream(str);
    assertTrue(testInstance.processInput(in));
    byte[] result = testInstance.getMessageBytes();
    assertTrue(source.equals(new String(result)));
    assertEquals(source.length(), testInstance.getLength());
  }

  @Test
  public void testProcessInput_Manyframes() throws IOException {
    ArrayList<String> inputSrcs = new ArrayList<>();
    // Create 10 frames
    for (int i = 0; i < 10; i++) {
      inputSrcs.add("this is string# " + i);
    }
    ByteArrayOutputStream combined = new ByteArrayOutputStream();
    String concatenatedInputSrc = "";
    for (String s : inputSrcs) {
      combined.write(stringToFrame(s));
      concatenatedInputSrc += s;
    }
    byte[] combinedBytes = combined.toByteArray();
    assertEquals(concatenatedInputSrc.length() + inputSrcs.size() * 5,
        combinedBytes.length);
    InputStream in = new ByteArrayInputStream(combinedBytes);
    assertTrue(testInstance.processInput(in));
    byte[] result = testInstance.getMessageBytes();
    assertTrue(concatenatedInputSrc.equals(new String(result)));
    assertEquals(concatenatedInputSrc.length(), testInstance.getLength());
  }

  @Test
  public void testProcessInput_NoDataframeInInput() throws IOException {
    String source = "This is the source of my input stream";
    byte[] str = stringToFrame(source);
    // change the first byte to a non-DATA frame
    str[0] = (byte) 0x80;
    InputStream in = new ByteArrayInputStream(str);
    assertFalse(testInstance.processInput(in));
    assertNull(testInstance.getMessageBytes());
    assertEquals(0, testInstance.getLength());
  }

  private byte[] stringToFrame(String source) throws IOException {
    ByteArrayOutputStream output = new ByteArrayOutputStream();
    output.write(MessageDeframer.DATA_BYTE);
    output.write(ByteBuffer.allocate(4).putInt(source.length()).array());
    output.write(source.getBytes());
    return output.toByteArray();
  }
}
