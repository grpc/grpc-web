package com.google.grpcweb;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import java.io.IOException;
import java.nio.ByteBuffer;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

@RunWith(JUnit4.class)
public class MessageFramerTest {

  private MessageFramer testInstance;

  @Before
  public void setUp() {
    testInstance = new MessageFramer();
    assertNotNull(testInstance);
  }

  @Test
  public void testProcessInput_Singleframe() throws IOException {
    String source = "This is the source of my input stream";
    byte[] bytes = source.getBytes();
    byte[] prefix = testInstance.getPrefix(bytes, MessageFramer.Type.DATA);
    assertEquals(5, prefix.length);
    int len = ByteBuffer.wrap(prefix, 1, 4).getInt();
    assertEquals(source.length(), len);
  }
  // PUNT add more tests: Empty frame, zero frames
}
