const path = require('path');

const common = {
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        }],
      },
    ],
  },
  resolve: {
    extensions: ['.js'],
    // @see https://stackoverflow.com/questions/59487224/webpack-throws-error-with-emscripten-cant-resolve-fs
    fallback: {
      fs: false,
      path: false,
      crypto: false,
    },
  },
};

// ESM build for module consumers (import / bundlers / Node ESM).
const esmConfig = {
  ...common,
  experiments: { outputModule: true },
  output: {
    path: path.resolve('dist'),
    filename: 'ARFset.js',
    library: { type: 'module' },
  },
};

// UMD build for script-tag consumers: exposes window.ARFset.
// Mirrors the legacy global API so `new ARFset.ARFset()` keeps working.
const umdConfig = {
  ...common,
  output: {
    path: path.resolve('dist'),
    filename: 'ARFset.umd.js',
    library: {
      name: 'ARFset',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'this',
  },
};

module.exports = [esmConfig, umdConfig];
