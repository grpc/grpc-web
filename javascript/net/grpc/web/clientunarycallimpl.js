/**
 * @fileoverview This class handles ClientReadableStream returned by unary
 * calls.
 */

goog.module('grpc.web.ClientUnaryCallImpl');

goog.module.declareLegacyNamespace();

const ClientReadableStream = goog.require('grpc.web.ClientReadableStream');

/**
 * @implements {ClientReadableStream<RESPONSE>}
 * @template RESPONSE
 */
class ClientUnaryCallImpl {
  /**
   * @param {!ClientReadableStream<RESPONSE>} stream
   */
  constructor(stream) {
    this.stream = stream;
  }

  /**
   * @override
   */
  on(eventType, callback) {
    if (eventType == 'data' || eventType == 'error') {
      // unary call responses and errors should be handled by the main
      // (err, resp) => ... callback
      return this;
    }
    return this.stream.on(eventType, callback);
  }

  /**
   * @override
   */
  removeListener(eventType, callback) {
    return this.stream.removeListener(eventType, callback);
  }

  /**
   * @override
   */
  cancel() {
    this.stream.cancel();
  }
}

exports = ClientUnaryCallImpl;
