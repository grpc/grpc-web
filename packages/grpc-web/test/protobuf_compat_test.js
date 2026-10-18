/**
 * @fileoverview Tests for google-protobuf 3.x and 4.x compatibility layer.
 * Verifies resolution of https://github.com/grpc/grpc-web/issues/1525.
 */

const assert = require('assert');
const grpcWeb = require('../index.js');
const jspb = require('google-protobuf');

describe('Protobuf 3.x / 4.x Compatibility', function() {
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

  it('should export ensureBinaryReaderCompatibility', function() {
    assert.strictEqual(typeof grpcWeb.ensureBinaryReaderCompatibility, 'function');
  });

  it('should gracefully handle null/undefined inputs', function() {
    assert.strictEqual(grpcWeb.ensureBinaryReaderCompatibility(null), false);
    assert.strictEqual(grpcWeb.ensureBinaryReaderCompatibility(undefined), false);
  });

  it('should polyfill readPacked<Type>() when only readPackable<Type>Into is present (protobuf 4.x runtime)', function() {
    class MockV4Reader {
      constructor() {
        this.delimited = true;
      }
      isDelimited() {
        return this.delimited;
      }
    }

    // Set up mock v4 methods: readPackable<Type>Into exists, readPacked<Type> is undefined
    PACKED_TYPES.forEach(type => {
      MockV4Reader.prototype['readPackable' + type + 'Into'] = function(dst) {
        if (type === 'Bool') {
          dst.push(true, false, true);
        } else if (type === 'Int64String' || type === 'Uint64String' || type === 'Sint64String' || type === 'Fixed64String' || type === 'Sfixed64String') {
          dst.push('100', '200');
        } else {
          dst.push(42, 84);
        }
      };
      assert.strictEqual(typeof MockV4Reader.prototype['readPacked' + type], 'undefined');
    });

    const patched = grpcWeb.ensureBinaryReaderCompatibility(MockV4Reader);
    assert.strictEqual(patched, true);

    const reader = new MockV4Reader();

    // Verify all 19 readPacked methods were polyfilled and return arrays
    PACKED_TYPES.forEach(type => {
      assert.strictEqual(typeof reader['readPacked' + type], 'function');
      const result = reader['readPacked' + type]();
      assert(Array.isArray(result));
      if (type === 'Bool') {
        assert.deepStrictEqual(result, [true, false, true]);
      } else if (type.endsWith('String')) {
        assert.deepStrictEqual(result, ['100', '200']);
      } else {
        assert.deepStrictEqual(result, [42, 84]);
      }
    });
  });

  it('should polyfill readPackable<Type>Into when only readPacked<Type> is present (protobuf 3.x runtime)', function() {
    class MockV3Reader {
      constructor() {
        this.delimited = true;
      }
      isDelimited() {
        return this.delimited;
      }
    }

    // Set up mock v3 methods: readPacked<Type> exists, readPackable<Type>Into is undefined
    PACKED_TYPES.forEach(type => {
      MockV3Reader.prototype['readPacked' + type] = function() {
        if (type === 'Bool') {
          return [false, true];
        } else if (type.endsWith('String')) {
          return ['123'];
        } else {
          return [99];
        }
      };
      assert.strictEqual(typeof MockV3Reader.prototype['readPackable' + type + 'Into'], 'undefined');
    });

    const patched = grpcWeb.ensureBinaryReaderCompatibility(MockV3Reader);
    assert.strictEqual(patched, true);

    const reader = new MockV3Reader();

    // Verify all 19 readPackable*Into methods were polyfilled and mutate dst
    PACKED_TYPES.forEach(type => {
      assert.strictEqual(typeof reader['readPackable' + type + 'Into'], 'function');
      const dst = [];
      reader['readPackable' + type + 'Into'](dst);
      if (type === 'Bool') {
        assert.deepStrictEqual(dst, [false, true]);
      } else if (type.endsWith('String')) {
        assert.deepStrictEqual(dst, ['123']);
      } else {
        assert.deepStrictEqual(dst, [99]);
      }
    });
  });

  it('should polyfill readPackable<Type>Into with scalar fallback when non-delimited', function() {
    class MockV3ScalarReader {
      constructor() {
        this.delimited = false;
      }
      isDelimited() {
        return false;
      }
      readBool() {
        return true;
      }
      readInt32() {
        return 777;
      }
      readPackedBool() {
        return [false];
      }
      readPackedInt32() {
        return [111];
      }
    }

    grpcWeb.ensureBinaryReaderCompatibility(MockV3ScalarReader);

    const reader = new MockV3ScalarReader();
    const boolDst = [];
    reader.readPackableBoolInto(boolDst);
    assert.deepStrictEqual(boolDst, [true]);

    const intDst = [];
    reader.readPackableInt32Into(intDst);
    assert.deepStrictEqual(intDst, [777]);
  });

  it('should deserialize wire-format packed repeated bools with simulated v4 reader', function() {
    // 1. Encode wire format packed booleans using jspb.BinaryWriter
    const writer = new jspb.BinaryWriter();
    const expectedBools = [true, false, true, true, false];
    writer.writePackedBool(1, expectedBools);
    const bytes = writer.getResultBuffer();

    // 2. Create simulated v4 reader inheriting from BinaryReader but with readPackedBool removed
    class SimV4BinaryReader extends jspb.BinaryReader {
      constructor(data) {
        super(data);
      }
      // Simulate v4: only readPackableBoolInto exists
      readPackableBoolInto(dst) {
        const tmpReader = new jspb.BinaryReader(bytes);
        tmpReader.nextField();
        grpcWeb.ensureBinaryReaderCompatibility(jspb.BinaryReader);
        const vals = tmpReader.readPackedBool();
        for (let i = 0; i < vals.length; i++) {
          dst.push(vals[i]);
        }
      }
    }
    SimV4BinaryReader.prototype.readPackedBool = undefined;

    // Verify calling readPackedBool before polyfill throws TypeError
    const unpatchedReader = new SimV4BinaryReader(bytes);
    unpatchedReader.nextField();
    assert.throws(() => {
      unpatchedReader.readPackedBool();
    }, TypeError);

    // Apply polyfill
    grpcWeb.ensureBinaryReaderCompatibility(SimV4BinaryReader);

    // Verify calling readPackedBool now succeeds (as called by 3.x generated stubs)
    const patchedReader = new SimV4BinaryReader(bytes);
    patchedReader.nextField();
    const actualBools = patchedReader.readPackedBool();
    assert.deepStrictEqual(actualBools, expectedBools);
  });
});
