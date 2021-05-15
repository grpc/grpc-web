goog.module('grpc.web.ClientOptions');
goog.module.declareLegacyNamespace();

const XmlHttpFactory = goog.requireType('goog.net.XmlHttpFactory');
const {StreamInterceptor, UnaryInterceptor} = goog.require('grpc.web.Interceptor');


/**
 * Options that are availavle during the client construction.
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
     * The XmlHttpFactory for server-streaming calls.
     * Example: use 'goog.net.FetchXmlHttpFactory' to reduce memory consumption
     * during high throughput server-streaming calls.
     * <pre>
     * ...
     *
     * const xmlHttpFactory =
     *   new FetchXmlHttpFactory({streamBinaryChunks: true});
     * </pre>
     * @type {!XmlHttpFactory|undefined}
     */
    this.streamingXmlHttpFactory;
  }
}

exports = ClientOptions;
