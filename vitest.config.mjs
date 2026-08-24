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
  },
});
