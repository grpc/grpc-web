var module;

/**
 * List of functions we want to preserve when running the closure compiler
 * with --compilation_level=ADVANCED_OPTIMIZATIONS.
 */
module.ClientReadableStream = function() {};
module.ClientReadableStream.prototype.on = function(eventType, callback) {};
module.ClientReadableStream.prototype.removeListener =
  function(eventType, callback) {};
module.ClientReadableStream.prototype.cancel = function() {};

module.GenericClient = function() {};
module.GenericClient.prototype.unaryCall = function(request) {};
module.GenericClient.prototype.call = function(requestMessage,
                                               methodDescriptor) {};

module.UnaryInterceptor = function() {};
module.UnaryInterceptor.prototype.intercept = function(request, invoker) {};

module.StreamInterceptor = function() {};
module.StreamInterceptor.prototype.intercept = function(request, invoker) {};

module.Request = function() {};
module.Request.prototype.getRequestMessage = function() {};
module.Request.prototype.getMethodDescriptor = function() {};
module.Request.prototype.getMetadata = function() {};
module.Request.prototype.getCallOptions = function() {};

module.UnaryResponse = function() {};
module.UnaryResponse.prototype.getResponseMessage = function() {};
module.UnaryResponse.prototype.getMetadata = function() {};
module.UnaryResponse.prototype.getMethodDescriptor = function() {};
module.UnaryResponse.prototype.getStatus = function() {};
