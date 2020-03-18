package com.google.grpcweb;

import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.logging.Logger;
import org.apache.commons.io.IOUtils;

/**
 * Reads frames from the input bytes and returns a single message.
 */
class MessageDeframer {
  private static final Logger LOGGER = Logger.getLogger(MessageDeframer.class.getName());
  static final byte DATA_BYTE = (byte) 0x00;

  // TODO: Max value of Java int is = (2GB - 1). Max POST size can be 2GB or even 4GB.
  // fix this code to be able to handle upto 4GB input size.
  private int mLength = 0;
  private int mReadSoFar = 0;
  private int mNumFrames = 0;

  private ArrayList<byte[]> mFrames = new ArrayList<>();
  private byte[] mMsg = null;

  byte[] getMessageBytes() { return mMsg;}
  int getLength() { return mLength;}

  /** Reads the bytes from the given InputStream and populates bytes in {@link #mMsg}
   */
  boolean processInput(InputStream in) {
    byte[] inBytes;
    try {
      inBytes = IOUtils.toByteArray(in);
    } catch (IOException e) {
      e.printStackTrace();
      LOGGER.warning("invalid input");
      return false;
    }
    if (inBytes.length < 5) {
      LOGGER.warning("invalid input. Expected minimum of 5 bytes");
      return false;
    }

    while (getNextFrameBytes(inBytes)) {}

    // Make sure the input has a valid message
    if (mFrames.isEmpty()) {
      LOGGER.warning("input has NO frames!");
      return false;
    }
    // common case is only one frame.
    if (mFrames.size() == 1) {
      mMsg = mFrames.get(0);
    } else {
      // concatenate all frames into one byte array
      mMsg = new byte[mLength];
      int offset = 0;
      for (byte[] f : mFrames) {
        System.arraycopy(f, 0, mMsg, offset, f.length);
        offset += f.length;
      }
      mFrames = null;
    }
    return true;
  }

  /** returns true if the next frame is a DATA frame */
  private boolean getNextFrameBytes(byte[] inBytes) {
    // Firstbyte should be 0x00 (for this to be a DATA frame)
    int firstByteValue = inBytes[mReadSoFar] | DATA_BYTE;
    if (firstByteValue != 0) {
      LOGGER.fine("done with DATA bytes");
      return false;
    }

    // Next 4 bytes = length of the bytes array starting after the 4 bytes.
    int offset = mReadSoFar + 1;
    int len = ByteBuffer.wrap(inBytes, offset, 4).getInt();
    if (len <= 0) {
      LOGGER.warning(String.format("invalid length value: %d", len));
      return false;
    }
    // Make sure we have enough bytes in the inputstream
    int expectedNumBytes = len + 5 + mReadSoFar;
    if (inBytes.length < expectedNumBytes) {
      LOGGER.warning(String.format("input doesn't have enough bytes. expected: %d, found %d",
          expectedNumBytes,  inBytes.length));
      return false;
    }

    // Read "len" bytes into message
    mLength += len;
    offset += 4;
    byte[] inputBytes = Arrays.copyOfRange(inBytes, offset, len + offset);
    mFrames.add(inputBytes);
    mReadSoFar += (len + 5);
    mNumFrames++;
    // we have more frames to process, if there are bytes unprocessed
    return inBytes.length > mReadSoFar;
  }
}
