/**
 * @fileoverview Jasmine tests for Protobuf 3.x/4.x compatibility layer in TypeScript.
 */

import 'jasmine';
import {
  PACKED_TYPES,
  ensureBinaryReaderCompatibility,
  patchBinaryReaderPrototype,
} from './protobufcompat';

describe('ProtobufCompat (TypeScript)', () => {
  it('should define all 19 packed types', () => {
    expect(PACKED_TYPES.length).toBe(19);
    expect(PACKED_TYPES).toContain('Bool');
    expect(PACKED_TYPES).toContain('Int32');
    expect(PACKED_TYPES).toContain('Int64');
    expect(PACKED_TYPES).toContain('Uint32');
    expect(PACKED_TYPES).toContain('Uint64');
    expect(PACKED_TYPES).toContain('Float');
    expect(PACKED_TYPES).toContain('Double');
    expect(PACKED_TYPES).toContain('Enum');
  });

  it('should gracefully handle null or undefined', () => {
    expect(ensureBinaryReaderCompatibility(null)).toBeFalse();
    expect(ensureBinaryReaderCompatibility(undefined)).toBeFalse();
    expect(patchBinaryReaderPrototype(null)).toBeFalse();
    expect(patchBinaryReaderPrototype(undefined)).toBeFalse();
  });

  it('should polyfill readPacked<Type>() when only readPackable<Type>Into is present (v4 runtime)', () => {
    class MockV4Reader {
      isDelimited() {
        return true;
      }
    }

    const proto = MockV4Reader.prototype as any;
    for (const type of PACKED_TYPES) {
      proto['readPackable' + type + 'Into'] = function (dst: any[]) {
        if (type === 'Bool') {
          dst.push(true, false);
        } else if (type.endsWith('String')) {
          dst.push('123');
        } else {
          dst.push(999);
        }
      };
      expect(typeof proto['readPacked' + type]).toBe('undefined');
    }

    const patched = ensureBinaryReaderCompatibility(MockV4Reader);
    expect(patched).toBeTrue();

    const reader = new MockV4Reader() as any;
    for (const type of PACKED_TYPES) {
      expect(typeof reader['readPacked' + type]).toBe('function');
      const result = reader['readPacked' + type]();
      if (type === 'Bool') {
        expect(result).toEqual([true, false]);
      } else if (type.endsWith('String')) {
        expect(result).toEqual(['123']);
      } else {
        expect(result).toEqual([999]);
      }
    }
  });

  it('should polyfill readPackable<Type>Into when only readPacked<Type> is present (v3 runtime)', () => {
    class MockV3Reader {
      isDelimited() {
        return true;
      }
    }

    const proto = MockV3Reader.prototype as any;
    for (const type of PACKED_TYPES) {
      proto['readPacked' + type] = function () {
        if (type === 'Bool') {
          return [false, true];
        } else if (type.endsWith('String')) {
          return ['555'];
        } else {
          return [123];
        }
      };
      expect(typeof proto['readPackable' + type + 'Into']).toBe('undefined');
    }

    const patched = ensureBinaryReaderCompatibility(MockV3Reader);
    expect(patched).toBeTrue();

    const reader = new MockV3Reader() as any;
    for (const type of PACKED_TYPES) {
      expect(typeof reader['readPackable' + type + 'Into']).toBe('function');
      const dst: any[] = [];
      reader['readPackable' + type + 'Into'](dst);
      if (type === 'Bool') {
        expect(dst).toEqual([false, true]);
      } else if (type.endsWith('String')) {
        expect(dst).toEqual(['555']);
      } else {
        expect(dst).toEqual([123]);
      }
    }
  });

  it('should fallback to scalar read when delimited is false in readPackableInto polyfill', () => {
    class MockV3ScalarReader {
      isDelimited() {
        return false;
      }
      readBool() {
        return true;
      }
      readInt32() {
        return 42;
      }
      readPackedBool() {
        return [false];
      }
      readPackedInt32() {
        return [0];
      }
    }

    ensureBinaryReaderCompatibility(MockV3ScalarReader);

    const reader = new MockV3ScalarReader() as any;
    const boolDst: boolean[] = [];
    reader.readPackableBoolInto(boolDst);
    expect(boolDst).toEqual([true]);

    const intDst: number[] = [];
    reader.readPackableInt32Into(intDst);
    expect(intDst).toEqual([42]);
  });
});
