/**
 * @fileoverview gRPC web client Readable Stream
 *
 * This class is being returned after a gRPC streaming call has been
 * started. This class provides functionality for user to operates on
 * the stream, e.g. set onData callback, etc.
 *
 * This wraps the underlying goog.net.streams.NodeReadableStream
 *
 * @author stanleycheung@google.com (Stanley Cheung)
 */
goog.provide('grpc.web.ClientReadableStream');



/**
 * A stream that the client can read from. Used for calls that are streaming
 * from the server side.
 *
 * @interface
 */
grpc.web.ClientReadableStream = function() {};


/**
 * Register a callback to handle I/O events.
 *
 * @param {string} eventType The event type
 * @param {function(?)} callback The call back to handle the event with
 * an optional input object
 * @return {!grpc.web.ClientReadableStream} this object
 */
grpc.web.ClientReadableStream.prototype.on = goog.abstractMethod;



/**
 * Close the stream.
 */
grpc.web.ClientReadableStream.prototype.cancel = goog.abstractMethod;
