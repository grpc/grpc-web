/** @fileoverview gRPC-Web Status codes and mapping. */

export interface Status {
  code: number;
  details: string;
  metadata?: {[key: string]: string};
}

