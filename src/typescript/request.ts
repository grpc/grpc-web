import {Metadata} from './metadata';
import {MethodDescriptorInterface} from './methoddescriptorinterface';

/** Individual gRPC-Web request instance. */
export interface Request<REQUEST, RESPONSE> {
  getRequestMessage(): REQUEST;

  getMethodDescriptor(): MethodDescriptorInterface<REQUEST, RESPONSE>;

  getMetadata(): Metadata;

  withMetadata(key: string, value: string): Request<REQUEST, RESPONSE>;
}

