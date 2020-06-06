import resolve from 'rollup-plugin-node-resolve';
import json from '@rollup/plugin-json';

const path = require('path');

const configurationPath = path.resolve('./src/configurations/');

export default {
  input: 'src/main.js',
  moduleContext(id) {
    if (path.parse(id).dir === configurationPath) {
      return 'this';
    }
  },
  output: {
    file: 'dist/mini-humidifier-bundle.js',
    format: 'umd',
    name: 'MiniHumidifier',
  },
  plugins: [
    resolve(),
    json(),
  ],
};
