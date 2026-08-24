import rollupJson from '@rollup/plugin-json';
import { esbuildPlugin } from '@web/dev-server-esbuild';
import { fromRollup } from '@web/dev-server-rollup';
import { playwrightLauncher } from '@web/test-runner-playwright';

// The card imports its translations as JSON modules. Rollup handles that in the
// bundle; the dev server that serves the sources to the browser needs the same
// plugin, or the import arrives as a JSON document the browser refuses to run.
const json = fromRollup(rollupJson);

export default {
  files: 'test/browser/**/*.test.js',
  nodeResolve: {
    // Both languages while the migration in #152 is under way, so an import
    // without an extension can land on either.
    extensions: ['.mjs', '.js', '.json', '.node', '.ts'],
    // The same conditions and the same dedupe as rollup.config.mjs. Two copies
    // of @lit/reactive-element break the update cycle, which is one of the
    // things these tests are here to notice.
    exportConditions: ['browser', 'production'],
    dedupe: ['lit', 'lit-html', 'lit-element', '@lit/reactive-element'],
  },
  // @web/dev-server-rollup only runs a rollup plugin over what it already
  // considers JavaScript, so the JSON has to be declared as such first.
  mimeTypes: { '**/*.json': 'js' },
  // TypeScript only, and deliberately without a `target`: naming one makes the
  // plugin transform the JavaScript as well, and esbuild rewrites a module's
  // top-level `this` to `void 0`. The model configurations are written against
  // that `this` - it is what `rollup.config.mjs` sets `moduleContext` for - and
  // `compileTemplate` re-parses their source, so the rewrite reaches the card
  // as `void 0.call_service(...)`.
  plugins: [json({ include: ['**/*.json'] }), esbuildPlugin({ ts: true })],
  // No polyfill and no page of its own: the card registers its elements in the
  // global registry, so the tests run against the same registry a browser gives
  // it in Home Assistant. Until #166 this file had to load
  // @webcomponents/scoped-custom-element-registry, without which the card
  // mounted as an empty shell.
  browsers: [playwrightLauncher({ product: 'chromium' })],
};
