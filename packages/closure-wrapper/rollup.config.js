  import { join } from 'path';
  import commonjs from '@rollup/plugin-commonjs';
  import typescriptPlugin from 'rollup-plugin-typescript2';
  import typescript from 'typescript';
  import pkg from './package.json';
  
  // Path to your files downloaded by Yarn
  const closureBlobsDir = './node_modules/closure-net/grpc_web/';
  
  const buildPlugins = [
    // Configure the TypeScript plugin
    typescriptPlugin({
      typescript,
      clean: true,
      tsconfigOverride: {
        compilerOptions: {
          target: 'es2020',
          allowJs: true
        }
      }
    }),
    commonjs()
  ];
  
  /**
   * ESM build (Matching Firebase)
   */
  const esmBuilds = [
    {
      input: join(closureBlobsDir, 'grpc_web_blob_es2022.js'),
      output: [
        {
          file: pkg.exports['./blob'].require, 
          format: 'cjs',
          sourcemap: true
        },
        {
          file: pkg.exports['./blob'].default, 
          format: 'es',
          sourcemap: true
        }
      ],
      plugins: buildPlugins
    }
  ];
  
  export default esmBuilds;