/**
 * @fileoverview Compatibility layer between google-protobuf 3.x and 4.x.
 *
 * In protobuf 4.x (protobuf-javascript), jspb.BinaryReader replaced
 * readPacked<Type>() with readPackable<Type>Into(dst).
 * Stubs compiled with protoc-gen-js 3.x call readPacked<Type>(), which throws
 * TypeError: reader.readPacked<Type> is not a function when run with google-protobuf 4.x.
 * Conversely, stubs compiled with protoc-gen-js 4.x call readPackable<Type>Into(dst),
 * which does not exist in google-protobuf 3.x.
 *
 * This module ensures bidirectional compatibility on jspb.BinaryReader.prototype.
 */

goog.module('grpc.web.ProtobufCompat');
goog.module.declareLegacyNamespace();

/**
 * List of packed/packable types in jspb.BinaryReader.
 * @const {!Array<string>}
 */
const PACKED_TYPES = [
  'Int32',
  'Int64',
  'Int64String',
  'Uint32',
  'Uint64',
  'Uint64String',
  'Sint32',
  'Sint64',
  'Sint64String',
  'Fixed32',
  'Fixed64',
  'Fixed64String',
  'Sfixed32',
  'Sfixed64',
  'Sfixed64String',
  'Float',
  'Double',
  'Bool',
  'Enum',
];

/**
 * Checks if the reader's current wire format is delimited.
 * @param {!Object} reader
 * @return {boolean}
 */
function isDelimited(reader) {
  if (typeof reader['isDelimited'] === 'function') {
    return reader['isDelimited']();
  }
  if (typeof reader['getWireType'] === 'function') {
    return reader['getWireType']() === 2;
  }
  return true;
}

/**
 * Polyfills missing readPacked* and readPackable*Into methods on a BinaryReader prototype.
 * @param {?Object} readerProto
 * @return {boolean}
 */
function patchBinaryReaderPrototype(readerProto) {
  if (!readerProto || typeof readerProto !== 'object') {
    return false;
  }
  let patched = false;
  for (let i = 0; i < PACKED_TYPES.length; i++) {
    const type = PACKED_TYPES[i];
    const packedName = 'readPacked' + type;
    const packableName = 'readPackable' + type + 'Into';
    const scalarName = 'read' + type;

    // 1. Polyfill readPacked<Type> for protobuf 4.x runtime (using packable)
    if (typeof readerProto[packedName] !== 'function' &&
        typeof readerProto[packableName] === 'function') {
      readerProto[packedName] = /** @this {!Object} */ function() {
        const dst = [];
        this[packableName](dst);
        return dst;
      };
      patched = true;
    }

    // 2. Polyfill readPackable<Type>Into for protobuf 3.x runtime (using packed / scalar)
    if (typeof readerProto[packableName] !== 'function' &&
        typeof readerProto[packedName] === 'function') {
      readerProto[packableName] = /** @this {!Object} */ function(dst) {
        if (isDelimited(this)) {
          const vals = this[packedName]();
          for (let j = 0; j < vals.length; j++) {
            dst.push(vals[j]);
          }
        } else if (typeof this[scalarName] === 'function') {
          dst.push(this[scalarName]());
        }
      };
      patched = true;
    }
  }
  return patched;
}

/**
 * Ensures BinaryReader compatibility across protobuf 3.x and 4.x.
 * If opt_binaryReader is provided, patches its prototype.
 * Otherwise, discovers jspb.BinaryReader from global scope or require('google-protobuf').
 * @param {?Object=} opt_binaryReader
 * @return {boolean} Whether any prototype was patched
 */
function ensureBinaryReaderCompatibility(opt_binaryReader) {
  if (opt_binaryReader) {
    const proto = opt_binaryReader.prototype || opt_binaryReader;
    return patchBinaryReaderPrototype(proto);
  }

  let patched = false;

  const globalScope =
      (typeof globalThis !== 'undefined' && globalThis) ||
      (typeof window !== 'undefined' && window) ||
      (typeof global !== 'undefined' && global) ||
      (typeof self !== 'undefined' && self) ||
      (typeof goog !== 'undefined' && goog.global) ||
      {};

  // 1. Check global jspb.BinaryReader
  if (globalScope['jspb'] && globalScope['jspb']['BinaryReader']) {
    const proto = globalScope['jspb']['BinaryReader'].prototype;
    if (patchBinaryReaderPrototype(proto)) {
      patched = true;
    }
  }

  // 2. Check require('google-protobuf') in CommonJS/Node environments
  const req = (typeof require === 'function' ? require : null) ||
      (globalScope['require'] && typeof globalScope['require'] === 'function' ?
          globalScope['require'] : null);
  if (req) {
    try {
      const protobuf = req('google-protobuf');
      if (protobuf && protobuf['BinaryReader']) {
        const proto = protobuf['BinaryReader'].prototype;
        if (patchBinaryReaderPrototype(proto)) {
          patched = true;
        }
      }
    } catch (e) {
      // Ignore resolution errors
    }

    // Also check require.cache for any loaded google-protobuf instances
    try {
      if (req.cache) {
        for (const modId in req.cache) {
          if (modId.indexOf('google-protobuf') !== -1 && req.cache[modId]) {
            const exp = req.cache[modId].exports;
            if (exp && exp['BinaryReader'] && exp['BinaryReader'].prototype) {
              if (patchBinaryReaderPrototype(exp['BinaryReader'].prototype)) {
                patched = true;
              }
            }
          }
        }
      }
    } catch (e) {
      // Ignore cache inspection errors
    }
  }

  return patched;
}

exports = {
  PACKED_TYPES,
  patchBinaryReaderPrototype,
  ensureBinaryReaderCompatibility,
};
