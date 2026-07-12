import {Metadata} from './metadata';
import {MethodDescriptor} from './methoddescriptor';
import {Request} from './request';

/** Internal implementation of `Request`. */
export class RequestInternal<REQUEST, RESPONSE>
  implements Request<REQUEST, RESPONSE>
{
  constructor(
    private readonly requestMessage: REQUEST,
    private readonly methodDescriptor: MethodDescriptor<REQUEST, RESPONSE>,
    private readonly metadata: Metadata,
  ) {}

  getRequestMessage(): REQUEST {
    return this.requestMessage;
  }

  getMethodDescriptor(): MethodDescriptor<REQUEST, RESPONSE> {
    return this.methodDescriptor;
  }

  getMetadata(): Metadata {
    return this.metadata;
  }

  withMetadata(key: string, value: string): this {
    this.metadata[key] = value;
    return this;
  }
}

