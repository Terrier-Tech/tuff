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
    lib: {
      name: 'Tuff',
      formats: ['es'],
      fileName: (format) => `index.js`,
      entry: {
        keyboard: './src/keyboard.ts',
        state: './src/state.ts',
        strings: './src/strings.ts',
        sets: './src/sets.ts',
        urls: './src/urls.ts',
        objects: './src/objects.ts',
        parts: './src/parts.ts',
        messages: './src/messages.ts',
        nav: './src/nav.ts',
        routing: './src/routing.ts',
        svg: './src/svg.ts',
        mat: './src/mat.ts',
        forms: './src/forms.ts',
        types: './src/types.ts',
        html: './src/html.ts',
        trig: './src/trig.ts',
        box: './src/box.ts',
        vec: './src/vec.ts',
        tags: './src/tags.ts',
        arrays: './src/arrays.ts',
        logging: './src/logging.ts',
      }
    }
  },
})