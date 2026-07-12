/** @fileoverview gRPC-Web generic transport interface. */

import { XhrIo, listen, NodeReadableStream } from '@closure-net/blob';

/** This interface abstracts the transport implementation underneath the ClientReadableStream. */
export interface GenericTransportInterface {
  nodeReadableStream: NodeReadableStream | null | undefined;
  xhr: XhrIo;
}
