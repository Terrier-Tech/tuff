import * as path from 'path'
import {defineConfig} from 'vite'
import { fileURLToPath } from 'url'

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
  }
})