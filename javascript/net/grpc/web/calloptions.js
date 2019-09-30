/**
 * @fileoverview grpc.web.CallOptions
 */

goog.module('grpc.web.CallOptions');
goog.module.declareLegacyNamespace();

/**
 * The collection of runtime options for a new RPC call.
 *
 * @constructor
 */
const CallOptions = function() {
  /**
   * @const {!Object<string, ?>}
   * @private
   */
  this.properties_ = {};
};

/**
 * Add a new CallOption or override an existing one.
 *
 * @param {string} name name of the CallOption that should be added/overridden.
 * @param {?} value value of the CallOption
 */
CallOptions.prototype.setOption = function(name, value) {
  this.properties_[name] = value;
};

/**
 * Get the value of one CallOption.
 *
 * @param {string} name name of the CallOption.
 * @return {?} value of the CallOption. If name doesn't exist, will return
 *     'undefined'.
 */
CallOptions.prototype.get = function(name) {
  return this.properties_[name];
};

/**
 * Remove a CallOption.
 *
 * @param {string} name name of the CallOption that shoud be removed.
 */
CallOptions.prototype.removeOption = function(name) {
  delete this.properties_[name];
};

exports = CallOptions;
