/** @fileoverview gRPC-Web UnaryResponse internal implementation. */

import {Metadata} from './metadata';
import {Status} from './status';
import {UnaryResponse} from './unaryresponse';

/** @final */
export class UnaryResponseInternal<RESPONSE>
  implements UnaryResponse<RESPONSE>
{
  constructor(
    private readonly responseMessage: RESPONSE,
    private readonly metadata: Metadata = {},
    private readonly status: Status | null = null,
  ) {}

  getResponseMessage(): RESPONSE {
    return this.responseMessage;
  }

  getMetadata(): Metadata {
    return this.metadata;
  }

  getStatus(): Status | null {
    return this.status;
  }
}

