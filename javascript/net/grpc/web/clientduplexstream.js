/**
 * @fileoverview gRPC-Web ClientDuplexStream.
 */
goog.module('grpc.web.clientDuplexStream');

const RpcError = goog.require('grpc.web.RpcError');

/**
 * Interface for bidirectional streaming RPC calls. gRPC-Web
 * clients can read from or write to this stream.
 * This implementation is experimental and may change and improve in future
 * releases.
 * @interface
 * @template REQUEST, RESPONSE
 */
class ClientDuplexStream {
  /**
   * Attaches a callback to the specified event.
   * @param {string} eventType
   * @param {function(RESPONSE):undefined|function():undefined|
   *     function(!RpcError):undefined} callback
   */
  on(eventType, callback) {}

  /**
   * Removes an attached callback for the specified event.
   * @param {string} eventType
   * @param {function(RESPONSE)|function()|function(!RpcError)} callback
   */
  removeListener(eventType, callback) {}

  /**
   * Writes a message to the stream.
   * @param {REQUEST} data
   */
  write(data) {}

  /**
   * Signals that no more data will be written to the stream. The optional
   * parameter request allows one final additional chunk of message to be
   * written immediately before closing the stream
   * @param {REQUEST=} data
   */
  end(data) {}
}

exports = {ClientDuplexStream};
