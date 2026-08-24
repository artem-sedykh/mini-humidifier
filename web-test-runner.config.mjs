import rollupJson from '@rollup/plugin-json';
import { fromRollup } from '@web/dev-server-rollup';
import { playwrightLauncher } from '@web/test-runner-playwright';

// The card imports its translations as JSON modules. Rollup handles that in the
// bundle; the dev server that serves the sources to the browser needs the same
// plugin, or the import arrives as a JSON document the browser refuses to run.
const json = fromRollup(rollupJson);

export default {
  files: 'test/browser/**/*.test.js',
  nodeResolve: {
    // The same conditions and the same dedupe as rollup.config.mjs. Two copies
    // of @lit/reactive-element break the update cycle, which is one of the
    // things these tests are here to notice.
    exportConditions: ['browser', 'production'],
    dedupe: ['lit', 'lit-html', 'lit-element', '@lit/reactive-element'],
  },
  // @web/dev-server-rollup only runs a rollup plugin over what it already
  // considers JavaScript, so the JSON has to be declared as such first.
  mimeTypes: { '**/*.json': 'js' },
  plugins: [json({ include: ['**/*.json'] })],
  // No polyfill and no page of its own: the card registers its elements in the
  // global registry, so the tests run against the same registry a browser gives
  // it in Home Assistant. Until #166 this file had to load
  // @webcomponents/scoped-custom-element-registry, without which the card
  // mounted as an empty shell.
  browsers: [playwrightLauncher({ product: 'chromium' })],
};
