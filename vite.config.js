import * as path from 'path'
import {defineConfig} from 'vite'
import { fileURLToPath } from 'url'

// Can't get multiple modules to work with typescript yet
// import { folderInput } from 'rollup-plugin-folder-input'

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineConfig({
  plugins: [
    vanillaExtractPlugin()
  ],
  build: {
    lib: {
      entry: path.resolve(dirname, 'src/main.ts'),
      name: 'Tuff',
      formats: ['es'],
      fileName: (format) => `tuff.${format}.js`
    }
    // rollupOptions: {
    //   input: 'src/*.ts',
    //   output: {
    //     entryFileNames: '[name].js',
    //     dir: './dist'
    //   },
    //   plugins: [
    //     folderInput()
    //   ]
    // }
  },
})