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
    emptyOutDir: false,
    lib: {
      name: 'Tuff',
      formats: ['es'],
      fileName: (format) => `index.js`,
      entry: {
        keyboard: './src/keyboard',
        state: './src/state',
        strings: './src/strings',
        sets: './src/sets',
        urls: './src/urls',
        objects: './src/objects',
        parts: './src/parts',
        messages: './src/messages',
        nav: './src/nav',
        routing: './src/routing',
        svg: './src/svg',
        mat: './src/mat',
        forms: './src/forms',
        types: './src/types',
        html: './src/html',
        trig: './src/trig',
        box: './src/box',
        vec: './src/vec',
        tags: './src/tags',
        arrays: './src/arrays',
        logging: './src/logging',
      }
    }
  },
})