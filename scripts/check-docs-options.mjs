#!/usr/bin/env node
//
// Every option the card reads is documented, and every option the
// documentation names is read.
//
// `check-docs-paths.mjs` answers "does this file exist"; this answers "does
// this option exist, and does anybody say so". They are different failures: a
// path rots when a file moves, and it is loud. An option rots when the code and
// the prose stop agreeing, which is quiet and lasts - in the sister card an
// option was declared, read, styled by nothing and documented nowhere for six
// years.
//
//   npm run check:options
//
// There is a third list here that the sister card does not have. `CARD_OPTIONS`
// in src/utils/validateConfig.ts decides what the card warns about, and its own
// comment says it "has to stay level with `RawCardConfig` in types.ts and the
// table in docs/configuration.md". Nothing made it. A key missing from it is
// not a silent no-op like a missing table row: the card warns the user about an
// option it does read, which is worse than saying nothing.
//
// An option that is deliberately undocumented goes in IGNORED with its reason,
// not into a widened rule.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(path.join(root, file), 'utf8');

const IGNORED = new Map([
  [
    'type',
    "Lovelace's own key, not the card's: it is in CARD_OPTIONS so the card does " +
      'not warn about it, and in the table because a card cannot be written without it',
  ],
]);

// The card's own options, as the types declare them. `RawCardConfig` is what a
// user's YAML is allowed to be, so it is the list to hold the rest against.
const configKeys = () => {
  const types = read('src/types.ts');
  const block = types.match(/export interface RawCardConfig \{([\s\S]*?)\n\}/);

  if (!block) throw new Error('RawCardConfig is not in src/types.ts any more');

  return [...block[1].matchAll(/^\s{2}([a-z_]+)\??:/gm)].map(match => match[1]);
};

// What `validateConfig` treats as the card's own, and therefore does not warn
// about. `FOREIGN_OPTIONS` is deliberately not read here: those are keys other
// software writes into the configuration, and none of them is the card's to
// document.
const validatedKeys = () => {
  const source = read('src/utils/validateConfig.ts');
  const block = source.match(/const CARD_OPTIONS = \[([\s\S]*?)\];/);

  if (!block) throw new Error('CARD_OPTIONS is not in src/utils/validateConfig.ts any more');

  return [...block[1].matchAll(/'([a-z_]+)'/g)].map(match => match[1]);
};

// The actions `handleClick` handles. `none` is not in the list - it is a
// documented action that works by falling through the switch - so it is added
// here the same way validateConfig adds it.
const tapActions = () => {
  const source = read('src/const.ts');
  const block = source.match(/export const TAP_ACTIONS = \[([\s\S]*?)\];/);

  if (!block) throw new Error('TAP_ACTIONS is not in src/const.ts any more');

  return [...[...block[1].matchAll(/'([a-z-]+)'/g)].map(match => match[1]), 'none'];
};

const docsFiles = readdirSync(path.join(root, 'docs'))
  .filter(name => name.endsWith('.md'))
  .map(name => `docs/${name}`);

const documentation = [...docsFiles, 'README.md'].map(read).join('\n');

// Both languages: `src/configurations/` stays JavaScript on purpose, and a
// model configuration reads options the TypeScript never names.
const source = readdirSync(path.join(root, 'src'), { recursive: true })
  .map(String)
  .filter(name => name.endsWith('.ts') || name.endsWith('.js'))
  .map(name => read(path.posix.join('src', name.split(path.sep).join('/'))))
  .join('\n');

// Word-for-word rather than substring: `tap_action` must be documented as
// itself and not be satisfied by `tap_actions` appearing somewhere. Split
// rather than a boundary expression, because the names carry both underscores
// and hyphens and a boundary treats the two differently.
const words = text => new Set(text.split(/[^A-Za-z0-9_-]+/));
const mentioned = (haystack, name) => words(haystack).has(name);

const problems = [];
let checked = 0;

const declared = configKeys();
const validated = validatedKeys();

for (const key of declared) {
  checked += 1;
  if (IGNORED.has(key)) continue;

  if (!mentioned(documentation, key))
    problems.push(`option \`${key}\` is read by the card and documented nowhere`);

  if (!validated.includes(key)) {
    problems.push(
      `option \`${key}\` is in RawCardConfig and not in CARD_OPTIONS - ` +
        'the card warns the user about an option it reads',
    );
  }
}

for (const key of validated) {
  checked += 1;
  if (IGNORED.has(key)) continue;

  if (!declared.includes(key)) {
    problems.push(
      `\`${key}\` is in CARD_OPTIONS and not in RawCardConfig - ` +
        'the card stays quiet about an option nothing reads',
    );
  }
}

for (const action of tapActions()) {
  checked += 1;
  if (!mentioned(documentation, action))
    problems.push(`tap action \`${action}\` is handled by the card and documented nowhere`);
}

// The other direction. The option tables in configuration.md are the list a
// reader trusts, so a row naming something the code never reads is worse than
// a missing row: it describes a card that does not exist.
//
// The theme variables further down that page are not options and do not match:
// they carry hyphens, and a row is only taken when the name is `[a-z_]+`.
const table = read('docs/configuration.md')
  .split('\n')
  .filter(line => /^\| `[a-z_]+` +\|/.test(line))
  .map(line => line.split('|')[1].trim().replaceAll('`', ''));

for (const option of new Set(table)) {
  checked += 1;
  if (IGNORED.has(option)) continue;
  if (!mentioned(source, option))
    problems.push(`\`${option}\` is documented and the card never reads it`);
}

console.log(`Checking ${checked} options named by the card and by its documentation`);

// A check that stopped finding anything would pass in silence.
if (checked < 40) {
  console.error(`only ${checked} options checked - the expressions above have stopped matching`);
  process.exit(1);
}

if (problems.length) {
  console.error('\n' + problems.map(problem => `  ${problem}`).join('\n') + '\n');
  process.exit(1);
}

console.log('Every option the card reads is documented, and the other way round.');
