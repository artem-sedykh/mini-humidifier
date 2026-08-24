import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Several @material/* packages publish sourcemaps that point at sources they
  // do not ship, and vite prints a warning for each one on every run. Nothing
  // in this repository can fix them, and the noise buries the test output.
  logLevel: 'error',
  test: {
    include: ['test/**/*.test.js'],
    // Node by default: most of what is worth testing here is pure. The files
    // that need a DOM ask for one with a `@vitest-environment jsdom` docblock.
    environment: 'node',
  },
});
