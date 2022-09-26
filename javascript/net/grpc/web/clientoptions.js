goog.module('grpc.web.ClientOptions');
goog.module.declareLegacyNamespace();

const {StreamInterceptor, UnaryInterceptor} = goog.require('grpc.web.Interceptor');


/**
 * Options that are available during the client construction.
 * @record
 */
class ClientOptions {
  constructor() {
    /**
     * Whether to use the HttpCors library to pack http headers into a special
     * url query param $httpHeaders= so that browsers can bypass CORS OPTIONS
     * requests.
     * @type {boolean|undefined}
     */
    this.suppressCorsPreflight;

    /**
     * Whether to turn on XMLHttpRequest's withCredentials flag.
     * @type {boolean|undefined}
     */
    this.withCredentials;

    /**
     * Unary interceptors. Note that they are only available in grpcweb and
     * grpcwebtext mode
     * @type {!Array<!UnaryInterceptor>|undefined}
     */
    this.unaryInterceptors;

    /**
     * Stream interceptors. Note that they are only available in grpcweb and
     * grpcwebtext mode
     * @type {!Array<!StreamInterceptor>|undefined}
     */
    this.streamInterceptors;

    /**
     * Protocol buffer format for open source gRPC-Web. This attribute should be
     * specified by the gRPC-Web build rule by default.
     * @type {string|undefined}
     */
    this.format;

    /**
     * The Worker global scope. Once this option is specified, gRPC-Web will
     * also use 'fetch' API as the underlying transport instead of native
     * XmlHttpRequest.
     * @type {!WorkerGlobalScope|undefined}
     */
    this.workerScope;

    /**
     * This is an experimental feature to reduce memory consumption
     * during high throughput server-streaming calls by using
     * 'streamBinaryChunks' mode FetchXmlHttpFactory.
     * @type {boolean|undefined}
     */
    this.useFetchDownloadStreams;
  }
}

exports = ClientOptions;
