import resolve from 'rollup-plugin-node-resolve';
import json from '@rollup/plugin-json';
import ignore from './rollup-plugins/ignore';

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
    ignore({
      files: [
        '@material/mwc-menu/mwc-menu-surface.js',
        '@material/mwc-ripple/mwc-ripple.js',
        '@material/mwc-list/mwc-list.js',
        '@material/mwc-list/mwc-list-item.js',
      ].map(file => require.resolve(file)),
    }),
  ],
};
