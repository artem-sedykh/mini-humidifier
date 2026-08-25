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
  plugins: [
    json({ include: ['**/*.json'] }),
    // `tsconfig` is not optional here: without it esbuild defines class fields,
    // and a declaration-only field then assigns undefined over lit's accessor -
    // the components render, and none of their properties arrive.
    esbuildPlugin({ ts: true, tsconfig: 'tsconfig.json' }),
  ],
  // No polyfill and no page of its own: the card registers its elements in the
  // global registry, so the tests run against the same registry a browser gives
  // it in Home Assistant. Until #166 this file had to load
  // @webcomponents/scoped-custom-element-registry, without which the card
  // mounted as an empty shell.
  //
  // Two engines, not one. Home Assistant's companion app on iOS renders in
  // WKWebView and desktop Safari is a real share of the audience, so WebKit is
  // a place this card actually runs - and nothing had ever run it there. It is
  // also the only second engine a CI runner can install, which makes it the
  // cheapest evidence available that the card is not written against Blink's
  // particular behaviour. See #180.
  //
  // Two things this does not buy, so that nobody assumes otherwise later:
  //
  // - it says nothing about #72. The Android WebView is Chromium.
  // - it does not cover the dropdown's no-popover path. Both engines have the
  //   popover API, and taking `showPopover` away does not simulate one that
  //   does not: the menu still carries `popover="manual"`, which the same
  //   engine still honours, so it comes out `display: none` and 0 by 0.
  //   Measured, in both. That branch is unreachable from here.
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
    playwrightLauncher({ product: 'webkit' }),
  ],
  testFramework: {
    config: {
      // mocha's default is 2000ms, which is a fast-machine default. Two engines
      // now share a CI runner, and WebKit on Linux is the slow one: the first
      // runs failed on a different dropdown test each time, always a timeout,
      // never an assertion - the signature of a budget rather than a bug. This
      // is deliberately generous. A test that hangs still fails; a test that is
      // merely slow on a loaded runner no longer reports as a broken card.
      timeout: '10000',
    },
  },
};
