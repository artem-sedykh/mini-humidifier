import resolve from 'rollup-plugin-node-resolve';
import json from '@rollup/plugin-json';

const path = require('path');

const configurationPaths = [
  path.resolve('./src/configurations/'),
  path.resolve('./src/configurations/xiaomi_miio/'),
  path.resolve('./src/configurations/xiaomi_miio_airpurifier')];

export default {
  input: 'src/main.js',
  moduleContext(id) {
    if (configurationPaths.includes(path.parse(id).dir)) {
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
