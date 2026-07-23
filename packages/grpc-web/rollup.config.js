import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'index.closure.js',
  output: [
    {
      file: 'index.js',
      format: 'cjs',
      sourcemap: true
    },
    {
      file: 'index.esm.js',
      format: 'es',
      sourcemap: true
    }
  ],
  plugins: [
    nodeResolve(),
    commonjs()
  ]
};
