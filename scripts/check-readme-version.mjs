#!/usr/bin/env node
//
// The version in README.md is the one this repository is at, and the download
// link is not pinned to a release that has been superseded.
//
// Both halves rot silently. The `?v=` in the install instructions said `3.1.5`
// while this repository was at 3.5.2 - four releases behind - and that number
// is not decoration: the file lives in `/local`, which Home Assistant serves
// with a month-long `max-age`, so it is the only cache-buster a person has.
// Copying a stale one out of the README means the next update to the card does
// not reach the browser, which looks exactly like the update doing nothing.
// This README says so itself, twice, which is what makes an old number in it
// worse than none.
//
//   npm run check:version
//
// `release-prepare.yml` rewrites the README along with `package.json`, so the
// two cannot drift on a release. This is what says so when they do anyway -
// from a hand-made release, or from a README edited on its own.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(path.join(root, file), 'utf8');

const version = JSON.parse(read('package.json')).version.replace(/^v/, '');
const readme = read('README.md');

const problems = [];

// Every cache-buster in the instructions, as written.
const busters = [...readme.matchAll(/\?v=([\w.-]+)/g)].map(match => match[1]);

if (busters.length === 0) {
  problems.push('no `?v=` in README.md at all - the install instructions lost their cache-buster');
}

for (const found of new Set(busters)) {
  if (found !== version) {
    problems.push(`README.md says \`?v=${found}\`, package.json says ${version}`);
  }
}

// A download URL pinned to a release, rather than to whichever is latest.
const pinned = [...readme.matchAll(/releases\/download\/(v?[\w.]+)\//g)].map(match => match[1]);

for (const tag of new Set(pinned)) {
  problems.push(
    `README.md links releases/download/${tag}/ - use releases/latest/download/ so it cannot go stale`,
  );
}

console.log(`Checking ${busters.length} version references in README.md against ${version}`);

if (problems.length) {
  console.error('\n' + problems.map(problem => `  ${problem}`).join('\n') + '\n');
  process.exit(1);
}

console.log('README.md names the version this repository is at.');
