#!/usr/bin/env node
//
// Assertions on the built bundle.
//
// Every regression this repository has shipped so far lived in the build, not
// in the source: lit's development build reaching users, two copies of
// @lit/reactive-element in one bundle, a lit directive left unresolved and
// emitted as an external require. A unit test over the source would have
// caught none of them, and all of them are visible in the output file.
//
// Run after `npm run rollup`:
//
//   npm run check:bundle
//
// The size baseline lives in scripts/bundle-baseline.json. When a change
// legitimately moves the size past the tolerance, update that file in the same
// commit and say why - that is the point of it being tracked rather than
// computed.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundlePath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, 'dist', 'mini-humidifier-bundle.js');

const read = file => readFileSync(file, 'utf8');

let bundle;
try {
  bundle = read(bundlePath);
} catch {
  console.error(`No bundle at ${path.relative(root, bundlePath)}. Run \`npm run rollup\` first.`);
  process.exit(1);
}

const baseline = JSON.parse(read(path.join(root, 'scripts', 'bundle-baseline.json')));

// The model ids are read out of the source rather than imported: src is ESM
// while package.json has no "type": "module", so node cannot load it directly.
const modelIds = (() => {
  const source = read(path.join(root, 'src', 'humidifiers.js'));
  const registry = source.slice(source.indexOf('const HUMIDIFIERS = {'));
  return [...registry.matchAll(/^\s*'([^']+)':/gm)].map(match => match[1]);
})();

// lit registers its version once per copy: `(x.litHtmlVersions ??= []).push(...)`,
// which the minifier rewrites into a form that mentions the name twice. Only
// the assignment is followed directly by `).push(`, so counting that pattern
// counts copies, while counting the bare identifier would also count the read.
const countVersionRegistrations = name => {
  let count = 0;
  let from = 0;

  for (;;) {
    const at = bundle.indexOf(name, from);
    if (at === -1) return count;

    from = at + name.length;
    const tail = bundle.slice(from, from + 40);
    const close = tail.indexOf(')');
    if (close === -1) continue;

    // Skip the run of closing parens, however many the build happens to have:
    // the minified form is `x=[]).push(`, the unminified one `x = [])).push(`.
    let after = close;
    while (tail[after] === ')') after += 1;

    if (tail.slice(after).startsWith('.push(')) count += 1;
  }
};

const litPackages = ['reactiveElementVersions', 'litHtmlVersions', 'litElementVersions'];

const bytes = Buffer.byteLength(bundle);
const tolerated = Math.round(baseline.bytes * baseline.tolerance);

const checks = [
  {
    name: 'bundle is not empty',
    ok: () => bytes > 0,
    detail: () => 'the file is empty',
  },
  {
    name: 'registers the mini-humidifier element',
    ok: () => /customElements\.define\(\s*['"]mini-humidifier['"]/.test(bundle),
    detail: () => 'customElements.define("mini-humidifier", ...) is missing',
  },
  {
    name: 'no unresolved externals',
    // Anything rollup fails to resolve is treated as external and survives into
    // the UMD wrapper as a require() call, which no browser answers.
    ok: () => !bundle.includes('require('),
    detail: () => {
      const specifiers = [...bundle.matchAll(/require\(\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
      return specifiers.length ? `left as external: ${specifiers.join(', ')}` : 'require() present';
    },
  },
  {
    name: 'not a development build of lit',
    // The development export carries assertions and warnings that are useful
    // while developing and must not reach users. It announces itself.
    ok: () => !bundle.includes('Lit is in dev mode'),
    detail: () => 'built with the development export condition',
  },
  {
    name: 'exactly one copy of each lit package',
    // Two ReactiveElement classes in one bundle break the update cycle: the
    // card dispatches a change per duplicated lifecycle, and the device sees
    // several identical service calls.
    ok: () => litPackages.every(name => countVersionRegistrations(name) === 1),
    detail: () => litPackages.map(name => `${name}: ${countVersionRegistrations(name)}`).join(', '),
  },
  {
    name: 'every model id is bundled',
    ok: () => modelIds.every(id => bundle.includes(id)),
    detail: () => `missing: ${modelIds.filter(id => !bundle.includes(id)).join(', ')}`,
  },
  {
    name: 'size is within the baseline tolerance',
    ok: () => Math.abs(bytes - baseline.bytes) <= tolerated,
    detail: () =>
      `${bytes} bytes against a baseline of ${baseline.bytes} +/- ${tolerated}` +
      ` (${bytes > baseline.bytes ? '+' : ''}${bytes - baseline.bytes})`,
  },
];

console.log(
  `Checking ${path.relative(root, bundlePath)} (${bytes} bytes, ${modelIds.length} models)`,
);

let failed = 0;

for (const check of checks) {
  const passed = check.ok();
  if (!passed) failed += 1;
  console.log(
    `  ${passed ? 'ok  ' : 'FAIL'}  ${check.name}${passed ? '' : ` - ${check.detail()}`}`,
  );
}

if (failed > 0) {
  console.error(`\n${failed} bundle check${failed === 1 ? '' : 's'} failed.`);
  process.exit(1);
}

console.log(`\nAll ${checks.length} bundle checks passed.`);
