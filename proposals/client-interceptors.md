# gRPC-Web Client Interceptors

* Author(s): Roger Chapman (rogchap@gmail.com)
* Approver: TBC
* Status: Draft
* Implemented in: web (closure/javascript)
* Last updated: 2019-05-11

## Abstract

gRPC-Web clients will present an interceptor interface. Consumers of these clients can provide an ordered list of interceptors with methods to be executed on any outbound or inbound operation. The gRPC-Web client interceptor framework API will provide similar functionality as existing gRPC interceptor implementations.

## Background

Client interceptors is a common pattern for implentations of gRPC in many langauges. Currently, gRPC-Web has no support for client interceptors.

### Releated Proposals:

This proposal is based off the work done by [NodeJS Client Interceptors](https://github.com/grpc/proposal/blob/master/L5-node-client-interceptors.md). The gRPC-Web client interceptor API will not be a one-to-one port of the NodeJS version, but will aim to have a familiar API.

## Proposal

### A simple example

This example logs all outbound requests:

```javascript
var interceptor = function(options, nextCall) {
  return new InterceptingCall(nextCall(options), {
    send: function(request, next) {
      console.log(request);
      next(request);
    }
  });
}


var client = new MyServiceClient(hostname, credentials, { interceptors: [interceptor] });
// ... or via method call
client.myCall(message, {}, { interceptors: [interceptor] });
```

### Interceptor API

An interceptor is a function which takes an `options` object and a `nextCall` function and returns an `InterceptingCall` object:

```javascript
/**
 * @param {Object} options
 * @param {string} options.hostname The server host to call
 * @param {Object} options.credentials Credentials used to authenticate with the server
 * @param {MethodDescriptor} options.methodDiscriptor A container of properties describing the call (see below)
 * @param {Function} nexCall Constructs the next interceptor in the chain
 * @returns {InterceptingCall} 
 */
var interceptor = function(options, nextCall) {
  return new InterceptingCall(nexCall(options));
}
```

An interceptor function allows developers to modify the call options, store any call-scoped values needed, and define interception methods.

The interceptor function must return an `InterceptingCall` object. An `InterceptingCall` represents an element in the interceptor chain. Any intercepted methods are implemented in the requester object, an optional parameter to the constructor. Returning `new InterceptingCall(nextCall(options))` will satisfy the contract (but provide no interceptor functionality).

Most interceptors will define a `requester` object (described below) which is passed to the the `InterceptingCall` constructor: `return new InterceptingCall(nextCall(options), requester);`

The `options` argument to the `nextCall` function includes options accepted by `rpcCall` and `serverStreaming` constructor. Modifying the options that are passed to the `nextCall` function will have the effect of changing the options passed to the underlying `rpcCall`/`serverStreaming` constructor.

Additionally, the `options` argument includes a `MethodDescriptor` object. The `MethodDescriptor` is a container for properties of the call which are used internally and may also be useful to interceptors:

```javascript
/**
 * @param {string} name The name of the call, i.e. 'myCall' 
 * @param {string} serviceName The name of the service, i.e. 'MyService'
 * @param {string} path The full path of the call, i.e. '/MyService/MyCall'
 * @param {MethodType} methodType One of two types: MethodType.UNARY or MethodType.SERVER_STREAMING
 * @param {grpc.web.AbstractClientBase.MethodInfo} methodInfo Properties containing the serialize and deserialize functions
 */
MethodDescriptor(name, serviceName, path, methodType, methodInfo)
```
*Do not modify the `options.methodDescriptor` object. The MethodDescriptor passed to the interceptor options is not consumed by the underlying gRPC code and changes will only affect downstream interceptors*

A `requester` object is a plain Javascript object implementing zero or more outbound interception methods:

```javascript
/**
 * An interception method called before an outbound call has started.
 * @param {grpc.web.Metadata} metadata The call's outbound metadata (request headers).
 * @param {object} listener The listener which will be intercepting inbound operations.
 * @param {Function} next A callback which continues the gRPC interceptor chain, called with the metadata to send and the inbound listener.
 */
 start(metadata, listener, next)
```
```javascript
/**
 * An interception method called prior to every outbound request.
 * @param {Object} request protobuf message
 * @param {Function} next A callback which continues the gRPC interceptor chain, called with the request to send.
 */
send(request, next)
```

A `listener` object implements zero or more methods for intercepting inbound operations. The listener passed into a requester's `start` method implements all the inbound interception methods. Inbound operations will be passed through a listener at each step in the interceptor chain. Three usage patterns are supported for listeners:

1. Pass the listener along without modification: `next(metadata, listener)`. In this case the interceptor declines to intercept any inbound operations.
1. Create a new listener with one or more inbound interception methods and pass it to next. In this case the interceptor will fire on the inbound operations implemented in the new listener.
1. Store the listener to make direct inbound calls on later. This effectively short-circuits the interceptor stack. Short-circuiting a request in this way will skip interceptors which have not yet fired, but will fire the listeners on any 'earlier' interceptors in the stack.

*Do not modify the listener passed in. Either pass it along unmodified or call methods on it to short-circuit the interceptor stack.*

The `listener` methods are:

```javascript
/**
 * An inbound interception method triggered when each response is received.
 * @param {object} response The protobuf message received.
 * @param {function} next A callback which continues the gRPC interceptor chain. Pass it the response to respond with.
 */
onData(response, next)
```
```javascript
/**
 * An inbound interception method triggered when status is received.
 * @param {object} status The status received.
 * @param {function} next A callback which continues the gRPC interceptor chain. Pass it the status to respond with.
 */
 onStatus(status, next)
```
```javascript
/**
 * An inbound interception method triggered when an error is received.
 * @param {grpc.web.ErrorRequest} error The error received.
 * @param {function} next A callback which continues the gRPC interceptor chain. Pass it the error to respond with.
 */
 onError(error, next)
```

 ### Examples

 #### Simple

 A trivial implementation of all interception methods

```javascript
var interceptor = function(options, nextCall) {
  var requester = {
    start: function(metadata, listener, next) {
      var newListener = {
        onData: function(response, next) {
          next(response);
        },
        onStatus: function(status, next) {
          next(status);
        },
        onError: function(error, next) {
          next(error);
        }
      }
      next(metadata, newListener);
    },
    send: function(request, next) {
      next(request);
    }
  };
  return new InterceptingCall(nextCall(options), requester);
}
```
(Requesters and listeners do not need to implement all methods)

**Autorization**

```javascript
var interceptor = function(options, nextCall) {
  var requester = {
    start: function(metadata, listener, next) {
      var token = localStorage.getItem('authToken');
      metadata.add('authorization', 'Bearer '+ token);
      next(metadata, listener);
    }
  }
  return new InterceptingCall(nextCall(options), requester);
}
```

#### Advanced Examples

**Retries**

```javascript
// Unary RPCs only
var maxRetries = 3;
var interceptor = function(options, nextCall) {
  var savedMetadata;
  var savedRequest;
  var savedResponse;
  var savedNext;
  var requester = {
    start: function(metadata, listener, next) {
      savedMetadata = metadata;
      var newListener = {
        onData: function(response, next) {
          savedResponse = response;
          savedNext = next;
        },
        onStatus: function(status, next) {
          var retries = 0;
          var retry = function(request, metadata) {
            retries++;
            var newCall = nextCall(options);
            newCall.start(metadata, {
              onData: function(response) {
                savedResponse = response;
              },
              onStatus: function(status) {
                if (status.code !== StatusCode.OK) {
                  if (retries <= maxRetries) {
                    retry(request, metadata);
                  } else {
                    savedNext(savedResponse);
                    next(status);
                  }
                } else {
                  savedNext(savedResponse);
                  next({code: StatusCode.OK})
                }
              },
            })
          }
          if (status.code !== StatusCode.OK) {
            retry(savedRequest, savedMetadata);
          } else {
            savedNext(savedResponse);
            next(status);
          }
        }
      };
      next(metadata, listener);
    },
    send: function(request, next) {
      savedRequest = request;
      next(request);
    },
  };
  return new InterceptingCall(nextCall(options), requester);
}
```

### Usage

Interceptors can be configured during client construction, or on individual invocations of gRPC calls.

#### At client construction

An `InterceptorProvider` type will be provided for computing the association of interceptors with gRPC calls dynamically.

```javascript
/**
* @param {Function} getInterceptorForMethod A filter method which accepts a MethodDescriptor and returns
* `undefined` (when no interceptor should be associated) or a single interceptor object.
* @constructor
*/
InterceptorProvider(getInterceptorForMethod)
```
An array of `interceptors` can be passed in the `options` parameter when constructing a client:

```javascript
var client = new MyServiceClient(hostname, credentials, { interceptors: [ myInterceptor ] });
```

Alternatively, an array of `interceptorProviders` can be passed in the `options` parameter when constructing a client:

```javascript
var interceptorProviders = [
    new InterceptorProvider(function(methodDescriptor) {
        if (methodDescriptor.methodType === MethodType.UNARY) {
            return unaryInterceptor;
        }
    }),
    new InterceptorProvider(function(methodDescriptor) {
        if (methodDescriptor.methodType === MethodType.SERVER_STREAMING) {
            return streamingInterceptor;
        }
    }),
];
var constructorOptions = {
    interceptorProviders: interceptorProviders,
};
var client = new MyServiceClient(hostname, credentials, constructorOptions);
```
The order of the InterceptorProviders will determine the order of the resulting interceptor stack.

#### At call invocation

If an array of interceptors is provided at call invocation via `options.interceptors`, the call will ignore all interceptors provided via the client constructor.

Example:

```javascript
client.myCall(request, metadata, { interceptors: [ myInterceptor ] }, callback);
```

Alternatively, an array of InterceptorProviders can be passed at call invocation (which will also supersede constructor options):

```javascript
client.myCall(request, metadata, { interceptorProviders: [ myInterceptorProvider ] }, callback);
```

The framework will throw an error if both `interceptors` and `interceptorProviders` are provided in the invocation options.

## Implementation

> WIP