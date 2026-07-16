import {Metadata} from './metadata';
import {Status} from './status';

/** UnaryResponse returned by gRPC-Web unary calls. */
export interface UnaryResponse<RESPONSE> {
  getResponseMessage(): RESPONSE;

  getMetadata(): Metadata;

  /**
   * gRPC status. Trailer metadata returned from a gRPC server is in
   * status.metadata.
   */
  getStatus(): Status | null;
}

