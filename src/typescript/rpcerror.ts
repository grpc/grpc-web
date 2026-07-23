/** @fileoverview gRPC-Web Error objects. */

import {Metadata} from './metadata';
import {StatusCode, statusCodeName} from './statuscode';

/**
 * gRPC-Web Error object, contains the {@link StatusCode}, a string message
 * and {@link Metadata} contained in the error response.
 */
export class RpcError extends Error {
  override name = 'RpcError';

  constructor(
    public code: StatusCode,
    message: string,
    public metadata: Metadata = {},
  ) {
    super(message);
    // Ensures `instanceof` works properly. See go/typescript-extending-builtins
    Object.setPrototypeOf(this, new.target.prototype);
  }

  override toString(): string {
    const status = statusCodeName(this.code) || String(this.code);
    let out = `RpcError(${status})`;
    if (this.message) {
      out += ': ' + this.message;
    }
    return out;
  }
}
