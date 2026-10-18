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

export const PACKED_TYPES: readonly string[] = [
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

function isDelimited(reader: any): boolean {
  if (typeof reader['isDelimited'] === 'function') {
    return reader['isDelimited']();
  }
  if (typeof reader['getWireType'] === 'function') {
    return reader['getWireType']() === 2;
  }
  return true;
}

export function patchBinaryReaderPrototype(readerProto: any): boolean {
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
    if (
      typeof readerProto[packedName] !== 'function' &&
      typeof readerProto[packableName] === 'function'
    ) {
      readerProto[packedName] = function (this: any) {
        const dst: any[] = [];
        this[packableName](dst);
        return dst;
      };
      patched = true;
    }

    // 2. Polyfill readPackable<Type>Into for protobuf 3.x runtime (using packed / scalar)
    if (
      typeof readerProto[packableName] !== 'function' &&
      typeof readerProto[packedName] === 'function'
    ) {
      readerProto[packableName] = function (this: any, dst: any[]) {
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

export function ensureBinaryReaderCompatibility(opt_binaryReader?: any): boolean {
  if (opt_binaryReader) {
    const proto = opt_binaryReader.prototype || opt_binaryReader;
    return patchBinaryReaderPrototype(proto);
  }

  let patched = false;

  const globalScope: any =
    (typeof globalThis !== 'undefined' && globalThis) ||
    (typeof window !== 'undefined' && window) ||
    (typeof global !== 'undefined' && global) ||
    (typeof self !== 'undefined' && self) ||
    {};

  // 1. Check global jspb.BinaryReader
  if (globalScope['jspb'] && globalScope['jspb']['BinaryReader']) {
    const proto = globalScope['jspb']['BinaryReader'].prototype;
    if (patchBinaryReaderPrototype(proto)) {
      patched = true;
    }
  }

  // 2. Check require('google-protobuf') in CommonJS/Node environments
  const req =
    (typeof require === 'function' ? require : null) ||
    (globalScope['require'] && typeof globalScope['require'] === 'function'
      ? globalScope['require']
      : null);
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

    // Also check require.cache
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
