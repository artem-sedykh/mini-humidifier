#!/usr/bin/env node
//
// The entity ids the bundled presets compute are still ids the integration
// produces.
//
//   npm run check:models            # against the snapshot, no network
//   npm run check:models -- --update  # refetch the snapshot from home-assistant/core
//
// A preset in src/configurations/xiaomi_miio/ reaches for entities by name:
// `sensor.{entity_id}_water_level`, `switch.{entity_id}_dry_mode`,
// `select.{entity_id}_led_brightness` and a dozen more, each built out of the
// humidifier's own id. Those suffixes are not an API. They are slugs of the
// display names the `xiaomi_miio` integration gives its entities, and Home
// Assistant renames those when it decides to.
//
// When one changes the card does not break loudly. The indicator or button is
// skipped, the user sees a card with a hole in it after an update, and the
// report arrives as "the water level stopped working". Nothing else here can
// see it coming: every layer of the test suite, the bench included, runs
// against entities this repository names itself, which makes the convention
// true by construction wherever it is checked. This is the one thing that
// checks it against somebody else's file.
//
// The snapshot is committed so the build never needs the network, and
// `integration-drift.yml` refreshes it weekly. A red scheduled run is the
// signal; a red build on an unrelated pull request would not be.
//
// Deliberately out of scope: src/configurations/xiaomi_miio_airpurifier/, whose
// presets read attributes off a `fan` entity from syssi's custom component
// rather than companion entities. Their contract is a different file in a
// different repository. A `{entity_id}_` reference appearing in one of them
// fails this check rather than passing unexamined.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(path.join(root, file), 'utf8');

const SNAPSHOT = 'scripts/integration-entities.json';
const PRESETS = 'src/configurations/xiaomi_miio';
const UNCHECKED = 'src/configurations/xiaomi_miio_airpurifier';

// Where the names come from. Keyed by the component name Home Assistant uses
// in a `%key:component::<name>::...%` reference, so `resolve` below can follow
// one without a table of its own - and `xiaomi_miio` is in here for that reason
// as much as for its own names: half of them point at each other.
const SOURCES = {
  xiaomi_miio: 'homeassistant/components/xiaomi_miio/strings.json',
  sensor: 'homeassistant/components/sensor/strings.json',
  binary_sensor: 'homeassistant/components/binary_sensor/strings.json',
};

const REF = 'dev';
const RAW = 'https://raw.githubusercontent.com/home-assistant/core';

// Home Assistant's own, near enough: lower case, everything outside [a-z0-9]
// becomes a separator, runs collapse, edges are trimmed. "PM2.5" is the one
// that matters and the one a hand-written list gets wrong - it is `pm2_5`.
const slugify = name =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

// `"name": "[%key:component::sensor::entity_component::illuminance::name%]"` -
// Home Assistant's own way of saying "the same as that one". Left unresolved it
// would enter the snapshot as a slug of the reference text, and the first run
// of this script did exactly that: `sensor.motor_speed` points at
// `component::xiaomi_miio::entity::number::motor_speed`, so two presets came
// back as reading an entity the integration does not create.
const resolve = (value, files) => {
  const match = /^\[%key:(.+)%\]$/.exec(value);
  if (!match) return value;

  const [, pointer] = match;
  const parts = pointer.split('::');
  if (parts[0] !== 'component') return null;

  const file = files[parts[1]];
  if (!file) return null;

  let node = file;
  for (const part of parts.slice(2)) {
    node = node?.[part];
  }
  return typeof node === 'string' ? resolve(node, files) : null;
};

const fetchJson = async file => {
  const url = `${RAW}/${REF}/${file}`;
  const response = await fetch(url);

  if (!response.ok) throw new Error(`${url}: ${response.status} ${response.statusText}`);
  return response.json();
};

// Every entity id suffix the integration can produce, by domain: the entities
// it names itself, plus the device classes it leaves Home Assistant to name -
// `sensor.<id>_temperature` has no entry of its own in the integration, it has
// a device class.
const build = files => {
  const entities = {};
  const put = (domain, name, from) => {
    const slug = slugify(name);
    if (!slug) return;

    entities[domain] ||= {};
    // First writer wins, so a device class never shadows a name the
    // integration chose for itself.
    entities[domain][slug] ||= { name, from };
  };

  for (const [domain, keys] of Object.entries(files.xiaomi_miio.entity || {})) {
    for (const [key, value] of Object.entries(keys)) {
      const name = resolve(value?.name, files);
      if (typeof name === 'string') put(domain, name, `entity.${domain}.${key}`);
    }
  }

  for (const domain of ['sensor', 'binary_sensor']) {
    const component = files[domain]?.entity_component || {};

    for (const [deviceClass, value] of Object.entries(component)) {
      if (deviceClass === '_') continue;
      const name = resolve(value?.name, files);
      if (typeof name === 'string') put(domain, name, `device_class.${deviceClass}`);
    }
  }

  return entities;
};

const update = async () => {
  const files = {};
  for (const [name, file] of Object.entries(SOURCES)) files[name] = await fetchJson(file);

  const snapshot = {
    // What this is and where it came from, in the file itself: it is read by a
    // person exactly once, on the day the weekly run turns red.
    source: {
      repository: 'home-assistant/core',
      ref: REF,
      files: Object.values(SOURCES),
      fetched: new Date().toISOString().slice(0, 10),
    },
    entities: build(files),
  };

  writeFileSync(path.join(root, SNAPSHOT), `${JSON.stringify(snapshot, null, 2)}\n`);

  const count = Object.values(snapshot.entities).reduce((n, d) => n + Object.keys(d).length, 0);
  console.log(`Wrote ${SNAPSHOT}: ${count} entity names from ${REF}.`);
};

// Every `<domain>.{entity_id}_<suffix>` a preset reads. The digits matter:
// `sensor.{entity_id}_pm2_5` is one of these and a `[a-z_]` pattern misses it.
const references = directory => {
  const found = [];

  for (const file of readdirSync(path.join(root, directory)).filter(n => n.endsWith('.js'))) {
    const source = read(path.join(directory, file));

    for (const match of source.matchAll(/'([a-z_]+)\.\{entity_id\}_([a-z0-9_]+)'/g)) {
      found.push({ file: `${directory}/${file}`, domain: match[1], suffix: match[2] });
    }
  }
  return found;
};

if (process.argv.includes('--update')) {
  await update();
  process.exit(0);
}

const snapshot = JSON.parse(read(SNAPSHOT));
const problems = [];
const used = references(PRESETS);
let renamed = false;

for (const { file, domain, suffix } of used) {
  const known = snapshot.entities[domain];

  if (!known) {
    problems.push(`${file}: reads a \`${domain}\` entity, and the integration creates none`);
    continue;
  }

  if (!known[suffix]) {
    // The failure has to carry the alternatives. Somebody reading it is being
    // told that a name they did not choose has changed, in a repository they
    // are not looking at.
    const near = Object.keys(known)
      .filter(candidate => candidate.includes(suffix.split('_')[0]) || suffix.includes(candidate))
      .slice(0, 5);

    renamed = true;
    problems.push(
      `${file}: \`${domain}.{entity_id}_${suffix}\` - the integration names no ${domain} ` +
        `entity that slugs to \`${suffix}\`` +
        (near.length ? `. Near it: ${near.map(n => `\`${n}\``).join(', ')}` : ''),
    );
  }
}

// The other integration is not covered, and saying so is part of the check: a
// companion entity appearing there means somebody is relying on a naming
// convention nothing holds to anything.
for (const { file, domain, suffix } of references(UNCHECKED)) {
  problems.push(
    `${file}: \`${domain}.{entity_id}_${suffix}\` - this check only covers the ` +
      'xiaomi_miio presets, and the custom component names its entities elsewhere. ' +
      'See #267 before adding companion entities here',
  );
}

console.log(
  `Checking ${used.length} entity ids the presets compute against ` +
    `${Object.values(snapshot.entities).reduce((n, d) => n + Object.keys(d).length, 0)} names ` +
    `the integration declares (snapshot of ${snapshot.source.fetched})`,
);

// A check that stopped finding anything would pass in silence.
if (used.length < 12) {
  console.error(`only ${used.length} entity ids found - the expression above has stopped matching`);
  process.exit(1);
}

if (problems.length) {
  console.error('\n' + problems.map(problem => `  ${problem}`).join('\n') + '\n');
  // Only where it fits: the message about the other integration is not about a
  // rename, and advice that does not match the failure is advice nobody reads
  // the next time either.
  if (renamed) {
    console.error(
      'If the integration renamed an entity, the preset follows it and the change is\n' +
        'breaking for anyone whose Home Assistant is older - say so in the release notes.\n',
    );
  }
  process.exit(1);
}

console.log('Every entity id the presets compute is one the integration still produces.');
