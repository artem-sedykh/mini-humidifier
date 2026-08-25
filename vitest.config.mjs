import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  // Several @material/* packages publish sourcemaps that point at sources they
  // do not ship, and vite prints a warning for each one on every run. Nothing
  // in this repository can fix them, and the noise buries the test output.
  logLevel: 'error',
  test: {
    include: ['test/**/*.test.js'],
    // The component tests under test/browser are mocha, run in a browser by
    // @web/test-runner (see web-test-runner.config.mjs). vitest matches them
    // too if left to itself, loads them without mocha's globals and reports
    // five failed files that nothing is wrong with.
    exclude: [...configDefaults.exclude, 'test/browser/**'],
    // Node by default: most of what is worth testing here is pure. The files
    // that need a DOM ask for one with a `@vitest-environment jsdom` docblock.
    environment: 'node',
    coverage: {
      provider: 'v8',
      // Every source file, whether or not a test happened to import it. The
      // point of measuring is the files nothing reaches, and those are exactly
      // the ones that are missing from a report built out of what was loaded.
      include: ['src/**/*.{ts,js}'],
      exclude: [
        // Their callbacks never run as written. `compileTemplate` takes the
        // source text of each one and re-parses it with `new Function`, so
        // what executes is a different function object and v8 attributes
        // nothing to these files - they sit at 3-10% whatever is tested, and
        // no test can move them. What does cover them is the browser layer's
        // "every model in the registry renders", which runs the compiled
        // copies. Keeping them in would also mean a new model configuration -
        // the contribution this card is built to attract - drops the total and
        // fails CI for adding a feature.
        'src/configurations/**',
        // Rendered by the browser layer (`npm run test:browser`), which
        // reports separately on purpose - see #182. Under vitest only their
        // import-time code runs, so they measure at 10-40% no matter how well
        // the components are covered where they actually run.
        'src/components/**',
        // Types erase to nothing. The file is 234 lines of interfaces and 0
        // statements, which a coverage report shows as a fully covered file.
        'src/types.ts',
      ],
      // text for the run log, json-summary for the badge, html for reading:
      // coverage/index.html is where "which lines" is a question with an
      // answer. All three land in coverage/, which is git-ignored.
      reporter: ['text', 'json-summary', 'html'],
      // What the suite covers today, floored to whole percent, rather than a
      // round number picked in advance: this is a ratchet against coverage
      // sliding, not a target to write tests at. Raise them when coverage
      // rises; the only reason to lower one is code being deleted, and that
      // belongs in the commit message.
      //
      // `main.ts` is what holds the total down, and since #233 that number
      // finally means something: what is left in it is the element and the
      // render, which only the browser layer reaches. The merge it used to
      // carry is `src/config/buildConfig.ts`, and being a pure function of its
      // arguments it sits at 100% of lines without a DOM anywhere.
      thresholds: {
        statements: 87,
        branches: 79,
        functions: 75,
        lines: 89,
      },
    },
  },
});
