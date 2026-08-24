import { createRequire } from 'node:module';
import path from 'node:path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import ignore from './rollup-plugins/ignore.mjs';

const require = createRequire(import.meta.url);

// `npm run dev` and `npm run watch` set this. An unminified bundle is far
// easier to debug in the browser, and it still loads in Home Assistant.
const development = process.env.BUILD === 'development';

// The model configurations are called with `this` bound to the card rather
// than to the module. Rollup would otherwise rewrite their top-level `this`
// to undefined and every call_service in them would fail.
const configurationPaths = [
  path.resolve('./src/configurations/'),
  path.resolve('./src/configurations/xiaomi_miio/'),
  path.resolve('./src/configurations/xiaomi_miio_airpurifier'),
];

export default {
  input: 'src/main.js',
  moduleContext(id) {
    if (configurationPaths.includes(path.parse(id).dir)) {
      return 'this';
    }
    return undefined;
  },
  output: {
    file: 'dist/mini-humidifier-bundle.js',
    format: 'umd',
    name: 'MiniHumidifier',
  },
  plugins: [
    nodeResolve(),
    json(),
    ignore({
      // These are pulled in transitively but the card registers its own
      // scoped versions, so bundling them again only adds weight.
      files: [
        '@material/mwc-menu/mwc-menu-surface.js',
        '@material/mwc-ripple/mwc-ripple.js',
        '@material/mwc-list/mwc-list.js',
        '@material/mwc-list/mwc-list-item.js',
      ].map(file => require.resolve(file)),
    }),
    ...(development ? [] : [terser({ format: { comments: false } })]),
  ],
};
