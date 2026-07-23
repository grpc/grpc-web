import {Metadata} from './metadata';
import {MethodType} from './methodtype';
import {Request} from './request';
import {Status} from './status';
import {UnaryResponse} from './unaryresponse';

/** Interface that describes a method of a service. */
export interface MethodDescriptorInterface<REQUEST, RESPONSE> {
  createRequest(
    requestMessage: REQUEST,
    metadata?: Metadata,
  ): Request<REQUEST, RESPONSE>;

  createUnaryResponse(
    responseMessage: RESPONSE,
    metadata?: Metadata,
    status?: Status | null,
  ): UnaryResponse<RESPONSE>;

  getName(): string;

  getMethodType(): MethodType | null;

  getResponseMessageCtor(): new (p1?: any[] | null) => RESPONSE;

  getRequestMessageCtor(): new (p1?: any[] | null) => REQUEST;

  getResponseDeserializeFn(): (p1: any) => RESPONSE;

  getRequestSerializeFn(): (p1: REQUEST) => any;
}

