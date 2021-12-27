const path = require('path')
const { defineConfig } = require('vite')

import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

module.exports = defineConfig({
  plugins: [
    vanillaExtractPlugin()
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/tuff/main.ts'),
      name: 'Tuff',
      formats: ['es'],
      fileName: (format) => `tuff.${format}.js`
    },
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        counter: path.resolve(__dirname, 'counter.html')
      }
    }
  }
})