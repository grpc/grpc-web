import {
  StreamInterceptor,
  UnaryInterceptor,
} from './interceptor';

/** Options that are available during the client construction. */
export interface ClientOptions {
  /**
   * Whether to use the HttpCors library to pack http headers into a special
   * url query param $httpHeaders= so that browsers can bypass CORS OPTIONS
   * requests.
   */
  suppressCorsPreflight?: boolean;

  /** Whether to turn on XMLHttpRequest's withCredentials flag. */
  withCredentials?: boolean;

  /**
   * Unary interceptors. Interceptors are executed in reverse order for
   * request processing, and in order for response processing. Note that they
   * are only available in grpcweb and grpcwebtext mode
   */
  unaryInterceptors?: UnaryInterceptor[];

  /**
   * Stream interceptors. Interceptors are executed in reverse order for
   * request processing, and in order for response processing. Note that they
   * are only available in grpcweb and grpcwebtext mode
   */
  streamInterceptors?: StreamInterceptor[];

  /**
   * Protocol buffer format for open source gRPC-Web. This attribute should be
   * specified by the gRPC-Web build rule by default.
   */
  format?: string;

  /**
   * The Worker global scope. Once this option is specified, gRPC-Web will
   * also use 'fetch' API as the underlying transport instead of native
   * XmlHttpRequest.
   */
  workerScope?: WindowOrWorkerGlobalScope;

  /**
   * This is an experimental feature to reduce memory consumption
   * during high throughput server-streaming calls by using
   * 'streamBinaryChunks' mode FetchXmlHttpFactory.
   */
  useFetchDownloadStreams?: boolean;
}
