import path from 'node:path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import esbuild from 'rollup-plugin-esbuild';

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
    // The export condition is pinned deliberately. Left to itself,
    // @rollup/plugin-node-resolve picks `development` or `production` from
    // whatever NODE_ENV happens to hold, so the same commit could produce a
    // different bundle here than in CI. lit ships a separate development
    // build behind that condition: it carries assertions and warnings that
    // are useful while developing and must not reach users.
    nodeResolve({
      // The migration to TypeScript is file by file (#152), so an import
      // without an extension can land on either language.
      extensions: ['.mjs', '.js', '.json', '.node', '.ts'],
      exportConditions: [development ? 'development' : 'production'],
      // Without this, a nested copy of any of these under node_modules is a
      // separate module to rollup and gets bundled twice. Two ReactiveElement
      // classes in one bundle break the update cycle: the card ends up
      // dispatching a change per duplicated lifecycle, which reaches the
      // device as several identical service calls.
      dedupe: ['lit', 'lit-html', 'lit-element', '@lit/reactive-element'],
    }),
    json(),
    // Types are stripped here and checked by `npm run typecheck`; esbuild does
    // not check them itself. The TypeScript compiler's own rollup plugin reads
    // an API the 7.x native port no longer exposes, and esbuild is already in
    // the tree for the browser tests, so both languages go through one tool.
    // Only TypeScript goes through it: while the migration is half done (#152)
    // the JavaScript that is left reaches the bundle exactly as it was, which
    // is what makes a size comparison across a migrated file meaningful.
    esbuild({ include: /\.ts$/, target: 'es2021', tsconfig: './tsconfig.json' }),
    ...(development ? [] : [terser({ format: { comments: false } })]),
  ],
};
