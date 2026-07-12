import {Metadata} from './metadata';
import {MethodDescriptorInterface} from './methoddescriptorinterface';
import {MethodType} from './methodtype';
import {Request} from './request';
import {RequestInternal} from './requestinternal';
import {Status} from './status';
import {UnaryResponse} from './unaryresponse';
import {UnaryResponseInternal} from './unaryresponseinternal';

/** MethodDescriptor describes a method of a service. */
export class MethodDescriptor<REQUEST, RESPONSE>
  implements MethodDescriptorInterface<REQUEST, RESPONSE>
{
  constructor(
    readonly name: string,
    readonly methodType: MethodType | null,
    readonly requestType: new (...p1: any[]) => REQUEST,
    readonly responseType: new (...p1: any[]) => RESPONSE,
    readonly requestSerializeFn: (p1: REQUEST) => any,
    readonly responseDeserializeFn: (p1: any) => RESPONSE,
  ) {}

  createRequest(
    requestMessage: REQUEST,
    metadata: Metadata = {},
  ): Request<REQUEST, RESPONSE> {
    return new RequestInternal(requestMessage, this, metadata);
  }

  createUnaryResponse(
    responseMessage: RESPONSE,
    metadata: Metadata = {},
    status: Status | null = null,
  ): UnaryResponse<RESPONSE> {
    return new UnaryResponseInternal(responseMessage, metadata, status);
  }

  getName(): string {
    return this.name;
  }

  getMethodType(): MethodType | null {
    return this.methodType;
  }

  getResponseMessageCtor(): new (...p1: any[]) => RESPONSE {
    return this.responseType;
  }

  getRequestMessageCtor(): new (...p1: any[]) => REQUEST {
    return this.requestType;
  }

  getResponseDeserializeFn(): (p1: any) => RESPONSE {
    return this.responseDeserializeFn;
  }

  getRequestSerializeFn(): (p1: REQUEST) => any {
    return this.requestSerializeFn;
  }
}
