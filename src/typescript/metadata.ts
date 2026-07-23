/**
 * @fileoverview gRPC-Web request/response metadata.
 *
 * Request and response headers will be included in the Metadata.
 */

export interface Metadata {
  [key: string]: string;
}
