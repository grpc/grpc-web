/**
 * @fileoverview gRPC-Web generated client stub for todoPackage
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!



const grpc = {};
grpc.web = require('grpc-web');

const proto = {};
proto.todoPackage = require('./todo_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.todoPackage.GreeterClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'text';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

  /**
   * @private @const {?Object} The credentials to be used to connect
   *    to the server
   */
  this.credentials_ = credentials;

  /**
   * @private @const {?Object} Options for the client
   */
  this.options_ = options;
};


/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.todoPackage.GreeterPromiseClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'text';

  /**
   * @private @const {!proto.todoPackage.GreeterClient} The delegate callback based client
   */
  this.delegateClient_ = new proto.todoPackage.GreeterClient(
      hostname, credentials, options);

};


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.todoPackage.HelloRequest,
 *   !proto.todoPackage.HelloReply>}
 */
const methodInfo_Todo = new grpc.web.AbstractClientBase.MethodInfo(
  proto.todoPackage.HelloReply,
  /** @param {!proto.todoPackage.HelloRequest} request */
  function(request) {
    return request.serializeBinary();
  },
  proto.todoPackage.HelloReply.deserializeBinary
);


/**
 * @param {!proto.todoPackage.HelloRequest} request The
 *     request proto
 * @param {!Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.todoPackage.HelloReply)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.todoPackage.HelloReply>|undefined}
 *     The XHR Node Readable Stream
 */
proto.todoPackage.GreeterClient.prototype.todo =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/todoPackage.Greeter/Todo',
      request,
      metadata,
      methodInfo_Todo,
      callback);
};


/**
 * @param {!proto.todoPackage.HelloRequest} request The
 *     request proto
 * @param {!Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.todoPackage.HelloReply>}
 *     The XHR Node Readable Stream
 */
proto.todoPackage.GreeterPromiseClient.prototype.todo =
    function(request, metadata) {
  return new Promise((resolve, reject) => {
    this.delegateClient_.todo(
      request, metadata, (error, response) => {
        error ? reject(error) : resolve(response);
      });
  });
};


module.exports = proto.todoPackage;

