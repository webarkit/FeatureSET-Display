import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Library build. Produces:
//   dist/ARFset.js     (ESM, default export { ARFset })
//   dist/ARFset.umd.js (UMD, exposes window.ARFset = { ARFset })
//
// The hand-written dist/ARFset.d.ts is preserved across builds via
// emptyOutDir: false.
export default defineConfig({
  build: {
    target: 'esnext',
    emptyOutDir: false,
    outDir: 'dist',
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'ARFset',
      formats: ['es', 'umd'],
      fileName: (format) => format === 'es' ? 'ARFset.js' : 'ARFset.umd.js',
    },
  },
});
