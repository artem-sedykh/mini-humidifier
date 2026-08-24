# AGENTS.md

Guidance for AI coding agents working on this repository. Human contributors
are welcome to read it too - it is the short version of how this card is put
together and what breaks it.

## What this is

`mini-humidifier` is a custom Lovelace card for Home Assistant: a single
JavaScript bundle that Home Assistant loads in the browser. There is no server
side, no Python, and no Home Assistant integration in this repository. The card
reads entity state out of the `hass` object and calls Home Assistant services
back.

Distribution is HACS: users get `mini-humidifier-bundle.js` as a release asset,
so **the release asset is the product**. A change is not shipped until it is in
a tagged release.

## Language

**English only**, everywhere: code, comments, commit messages, issues, pull
requests, documentation, and release notes. This is a public repository with
external contributors who do not read Russian.

## Commands

```
npm ci             # install exactly what the lockfile says
npm run lint       # eslint
npm run format     # prettier --write
npm run rollup     # bundle src/main.js -> dist/mini-humidifier-bundle.js
npm run babel      # transpile and minify that bundle in place
npm run build      # lint + rollup + babel
npm run watch      # rollup in watch mode
```

Node version comes from `.nvmrc`. Use it; CI reads the same file.

`npm run rollup` alone produces an unminified bundle that still works in the
browser, which is what you want while developing. The `babel` step is what
minifies, and it is not optional for a release: skipping it roughly doubles the
asset size.

There is no test suite. This is the single biggest risk in the repository: the
only way to know a change works is to load the bundle into a running Home
Assistant. Say so plainly when you cannot verify something, rather than
implying a change is tested.

## Verifying a change by hand

1. `npm run rollup`
2. Copy `dist/mini-humidifier-bundle.js` into the Home Assistant `config/www`
   directory.
3. Reference it from a dashboard resource with a cache-busting query string
   (`/local/mini-humidifier-bundle.js?v=<anything-new>`).
4. Hard-reload the browser. The frontend caches resources aggressively, and a
   stale bundle looks exactly like a change that did nothing.

## Layout

```
src/
  main.js            <mini-humidifier>, the card element: config parsing,
                     state plumbing, and the top-level render
  humidifiers.js     model id -> configuration factory registry
  configurations/    per-model defaults, grouped by the integration that
    xiaomi_miio/               provides the entity
    xiaomi_miio_airpurifier/
  components/        the sub-elements the card renders
    mwc/             thin wrappers around @material/mwc-* elements
  models/            wrappers that turn raw hass state into what a component
                     renders (humidifier, button, indicator, targetHumidity)
  utils/             template compilation, click handling, element definitions
  localize/          en, ru, uk
  style.js           card styles
  sharedStyle.js     styles shared with the sub-elements
```

## How a card configuration is resolved

This is the part worth understanding before changing anything about options.

1. The user's YAML names a `model` (default `zhimi.humidifier.cb1`).
2. `HUMIDIFIERS[model]()` in `src/humidifiers.js` returns that model's defaults.
   An unknown model silently falls back to `HUMIDIFIERS.default`, so a typo in
   `model:` produces a working but wrong card rather than an error.
3. `main.js` merges the user's YAML over those defaults, per section
   (`getPowerConfig`, `getTargetHumidityConfig`, `getIndicatorsConfig`,
   `getButtonsConfig`).

Keys in `HUMIDIFIERS` come in two shapes:

- `zhimi.humidifier.cb1` - the model as reported by Home Assistant's own
  `xiaomi_miio` integration.
- `xiaomi_miio_airpurifier:deerma.humidifier.mjjsq` - the same device through
  syssi's third-party `xiaomi_miio_airpurifier` integration, which exposes
  different attributes and different services. The prefix is what
  distinguishes them.

### Adding a model

Copy the closest existing file in `src/configurations/<integration>/`, adjust
it, and register it in `src/humidifiers.js`. Two things to get right:

- `change_action` and `toggle_action` must call services that actually exist in
  the integration the model is filed under. Copying a configuration from
  another integration and leaving its service calls in place produces a card
  that renders correctly and does nothing when clicked.
- The functions in these files are called with `this` bound to the card. That
  is not ordinary module scope: `rollup.config.js` sets `moduleContext` to
  `this` for exactly these directories. Do not "fix" it by importing something.

Document the new model in the options reference, and in
`README.md` under the list of available default configurations.

## Home Assistant compatibility

The card renders Home Assistant's own frontend elements (`ha-card`, `ha-slider`,
`ha-icon-button`, `ha-entity-toggle`, `mwc-*`). None of them are a stable API:
they are internal frontend components that change between releases without
notice, and they have broken this card before.

Known boundary: **Home Assistant 2025.10** replaced the mwc-based `ha-slider`
with a WebAwesome one (frontend `20250924.0`, first shipped in core 2025.10.0).
That changed the element's box model, its custom properties, and the meaning of
its `value` attribute. `src/components/targetHumidity.js` carries the code that
copes with both.

When you touch anything that talks to a Home Assistant element:

- Assume the element differs across versions and check, rather than assuming
  the version you happen to run is the only one.
- Prefer property bindings (`.value=`) over attribute bindings (`value=`) for
  anything the user can interact with. Attributes on the newer elements often
  map to a "default" that stops applying after the first interaction.
- Feature-detect the element. Do not branch on the Home Assistant version
  string unless there is no way to detect the behaviour itself.

## Conventions

- ESLint 10 flat config in `eslint.config.js`. Prettier owns formatting;
  `eslint-config-prettier` switches off the rules that would argue with it.
- `embeddedLanguageFormatting` is **off** in `.prettierrc.json` on purpose.
  With it on, prettier reformats the HTML and CSS inside the lit `html` and
  `css` tagged templates, rewriting attribute quotes and moving whitespace
  between elements. That is not a no-op for rendering. Leave it off.
- Conventional Commits, no scope: `fix:`, `feat:`, `ci:`, `build:`, `docs:`.
- Punctuation stays ASCII. No em dashes, no smart quotes, no ellipsis
  character - they break literal greps and are a giveaway of generated text.

## Releasing

1. Bump `version` in `package.json`. It carries a `v` prefix here
   (`"v3.1.5"`), which is unusual but load-bearing: the README badge reads it.
2. Write `release_notes/v<version>.md`. The release job reads that exact path
   and fails if it is missing.
3. Tag `v<version>` and push the tag. `.github/workflows/cd.yml` builds, checks
   that the tag and `package.json` agree, and publishes the bundle with those
   notes as the release body.

HACS shows `info.md`, not `README.md` (`"render_readme": false` in
`hacs.json`). Update it when the install instructions or the pitch change.

### HACS and Home Assistant versions

HACS has no release channels. `hacs.json` supports a `homeassistant` key - a
minimum Home Assistant version, read from the tag being installed - but it does
not hold users back on an older release. A user below the minimum still sees
the update in HACS, and the install fails with an error; they then have to pick
an older version by hand.

So a release that requires a newer Home Assistant is a breaking change for
everyone below it, not a silent no-op. Prefer making the card work across
versions over gating the release.

## Known debt

- No tests.
- `rollup-plugin-node-resolve` is the deprecated pre-scope package, unmaintained
  since 2019, and rollup is still on 2.x.
- `babel-preset-minify` is unmaintained and drags in `core-js` 2.
- Several bundled model configurations call `fan.set_speed`, a service Home
  Assistant removed in 2023.7, so those mode dropdowns are dead on any
  currently supported version.
