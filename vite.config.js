import * as path from 'path'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineConfig({
  plugins: [
    vanillaExtractPlugin()
  ],
  build: {
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      name: 'Tuff',
      formats: ['es'],
      fileName: (format) => `[name].js`
    }
  },
})