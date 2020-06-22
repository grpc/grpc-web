/**
 * @fileoverview grpc.web.CallOptions
 */

goog.module('grpc.web.CallOptions');
goog.module.declareLegacyNamespace();

/**
 * The collection of runtime options for a new RPC call.
 * @unrestricted
 */
class CallOptions {
  /**
   * @param {!Object<string, !Object>=} options
   */
  constructor(options) {
    /**
     * @const {!Object<string, !Object>}
     * @private
     */
    this.properties_ = options || {};
  }

  /**
   * Add a new CallOption or override an existing one.
   *
   * @param {string} name name of the CallOption that should be
   *     added/overridden.
   * @param {VALUE} value value of the CallOption
   * @template VALUE
   */
  setOption(name, value) {
    this.properties_[name] = value;
  }

  /**
   * Get the value of one CallOption.
   *
   * @param {string} name name of the CallOption.
   * @return {!Object} value of the CallOption. If name doesn't exist, will
   *     return 'undefined'.
   */
  get(name) {
    return this.properties_[name];
  }

  /**
   * Remove a CallOption.
   *
   * @param {string} name name of the CallOption that shoud be removed.
   */
  removeOption(name) {
    delete this.properties_[name];
  }

  /**
   * @return {!Array<string>}
   */
  getKeys() {
    return Object.keys(this.properties_);
  }
}



exports = CallOptions;
