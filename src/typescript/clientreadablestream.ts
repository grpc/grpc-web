/**
 * @fileoverview gRPC web client Readable Stream
 *
 * This class is being returned after a gRPC streaming call has been
 * started. This class provides functionality for user to operates on
 * the stream, e.g. set onData callback, etc.
 *
 * This wraps the underlying goog.net.streams.NodeReadableStream
 */

import {Metadata} from './metadata';
import {Status} from './status';

// Note: Using a string enum for event types would be ideal here, but it
// would break the "default export" mechanism used in this module, which is
// relied upon by gRPC-Web codegen.
interface EventTypeMap<RESPONSE> {
  data: (response: RESPONSE) => void;
  // Note: `err` is of type `any` because this class is shared between
  // gRPC-Web and FC Data. See:
  // google3/javascript/frameworks/client/data/streaming/favaclientreadablestream.js
  // TODO(eryu): Potentially split ClientReadableStream from FC Data so that
  // RpcError can be used here instead of any.
  // tslint:disable-next-line:no-any
  error: (err: any) => void;
  metadata: (metadata: Metadata) => void;
  status: (status: Status) => void;
  end: () => void;
}

/**
 * A stream that the client can read from. Used for calls that are streaming
 * from the server side.
 */
export interface ClientReadableStream<RESPONSE> {
  /**
   * Register a callback to handle different stream events.
   *
   * Available event types for gRPC-Web:
   *
   * -   `'data'`: Emitted when a new response message chunk is received and
   *     successfully handled by gRPC-Web client.
   * -   `'status'`: Emitted when the Google RPC status of the response stream is
   *     received.
   * -   `'end'`: Emitted when all the data have been successfully consumed from
   *     the stream.
   * -   `'error'`: Typically, this may occur when an underlying internal
   *     failure happens, or a stream implementation attempts to push an invalid
   *     chunk of data.
   * -   `'metadata'`: Emitted when the response metadata is received, including
   *     response headers.
   *
   * For server-streaming calls, the 'data' and 'status' callbacks (if exist)
   * will always precede 'metadata', 'error', or 'end' callbacks.
   *
   * @param eventType The type of event to listen for.
   * @param callback The callback to handle the event.
   * @return this object
   */
  on<T extends keyof EventTypeMap<RESPONSE>>(
    eventType: T,
    callback: EventTypeMap<RESPONSE>[T],
  ): ClientReadableStream<RESPONSE>;

  /**
   * Removes a particular callback.
   *
   * @param eventType The event type
   * @param callback The callback to remove
   * @return this object
   */
  removeListener<T extends keyof EventTypeMap<RESPONSE>>(
    eventType: T,
    callback: EventTypeMap<RESPONSE>[T],
  ): ClientReadableStream<RESPONSE>;

  /** Closes the stream. */
  cancel(): void;
}