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
npm test           # vitest, the unit tests under test/
npm run test:browser  # @web/test-runner, the component tests in Chromium
npm run rollup     # bundle src/main.js -> dist/mini-humidifier-bundle.js
npm run check:bundle  # assertions on the built bundle (needs a build first)
npm run dev        # the same as rollup, unminified
npm run build      # lint + test + rollup + check:bundle
npm run watch      # unminified, rebuilding on save
```

Node version comes from `.nvmrc`. Use it; CI reads the same file.

`npm run rollup` minifies; `npm run dev` produces the same bundle unminified,
which is what you want while debugging in the browser. The difference is large -
89 KB against 264 KB - so never publish a dev build.

`npm run test:browser` needs a browser to run: `npx playwright install
chromium` once, which is what CI does on every run.

The tests cover the build output, the pure logic, and the card as a browser
renders it against stand-ins for the Home Assistant elements. What they cannot
cover is those elements themselves - they are Home Assistant's, they change
between releases, and only a real frontend has them - so a change to anything
that talks to one is still verifiable by hand alone. Say plainly what you could
not check, rather than letting a green test run imply the change was tried.

## Tests

Three layers, all run by CI, in the order of how much they cost to run.

**`npm run check:bundle`** - `scripts/check-bundle.mjs`, assertions on
`dist/mini-humidifier-bundle.js` after `npm run rollup`. Every regression this
repository has shipped so far lived in the build rather than in the source: a
development build of lit reaching users, two copies of `@lit/reactive-element`
in one bundle, a lit directive left unresolved and emitted as an external
`require`. None of them is visible in the source, all of them are visible in the
output file. The script checks that the bundle registers the element, resolves
every import, is not lit's development build, holds exactly one copy of each lit
package, carries every model id from `src/humidifiers.js`, and stays within a
tolerance of a recorded size.

That last one has a baseline in `scripts/bundle-baseline.json`. When a change
legitimately moves the size past the tolerance, update the file in the same
commit and say why in the message. Do not widen the tolerance to make a build
pass - the 11 KB the duplicated `@lit/reactive-element` added is exactly the
size of change it is there to catch.

**`npm test`** - vitest over `test/`, node environment. `localize`, `getLabel`,
the helpers in `src/utils/utils.js`, the model registry, the four wrappers in
`src/models/` that turn raw entity state into what a component renders, and the
configuration merging in `main.js`. The merging tests need a DOM to construct the element, so
`test/config.test.js` asks for jsdom with a `@vitest-environment` docblock;
`setConfig` only reads and merges, and the element is never connected, so
nothing renders.

**`npm run test:browser`** - `@web/test-runner` over `test/browser/`, in
Chromium, driven by playwright. This is the layer that renders the card: it
mounts `<mini-humidifier>` with a `hass` of its own and asserts on what comes
out of the shadow roots. What it covers, and why each one is there:

- **the slider flavour detection**, one file per generation of `ha-slider`.
  The detection caches its answer in a module variable and a custom element
  name can be registered only once, so a page that has seen one flavour cannot
  be asked about another - hence three files rather than three cases.
- **a dropdown sends the command once.** Counted rather than argued from the
  code, for the reason under "Counting service calls" below.
- **an unavailable entity renders.** This is what broke when the frontend
  dropped `hass.resources` and every label lookup started throwing.
- **a state change costs one render pass per component.** Deriving state in
  `updated()` instead of `willUpdate()` asks for a second pass; three
  components did that until #160, and nothing in the layers above could say so.
- **the slider, the power button and a toggle button each send one command**,
  counted the same way, because all four controls are built the same.
- **every model in the registry renders.** A model configuration is a file of
  callbacks that only run once the card renders, so a model can pass the layers
  above and still throw the moment it is put on a dashboard.
- **`more-info` opens once** when the entity name is clicked, and
  **`secondary_info: last-changed`** hands `ha-relative-time` both the
  timestamp and `hass`.

The cost of this layer is in `test/browser/helpers/`, not in the assertions.
`ha-card`, `ha-icon`, `ha-icon-button`, `ha-relative-time`, `ha-entity-toggle`
and `ha-slider` exist only inside a running Home Assistant, so the helpers
define stand-ins - the card only passes properties into them and reads nothing
back. Two more things are needed to get that far, both in
`web-test-runner.config.mjs`: `@webcomponents/scoped-custom-element-registry`,
because the card registers its components through
`@lit-labs/scoped-registry-mixin` and Chromium does not honour the
`attachShadow({ customElements })` the mixin calls; and the JSON translations
declared as JavaScript through `mimeTypes`, so the rollup plugin that turns
them into modules is allowed to run.

Because the elements are stand-ins, this layer says the card renders and
behaves - not that it renders correctly against the real ones. That distinction
is the whole of "Home Assistant compatibility" below.

## Verifying a change by hand

1. `npm run rollup`
2. Copy `dist/mini-humidifier-bundle.js` into the Home Assistant `config/www`
   directory.
3. Reference it from a dashboard resource with a cache-busting query string
   (`/local/mini-humidifier-bundle.js?v=<anything-new>`).
4. Hard-reload the browser. The frontend caches resources aggressively, and a
   stale bundle looks exactly like a change that did nothing. The console
   banner prints the version from `package.json`, which is the only reliable
   way to tell which build is actually running.

### Counting service calls

Before blaming the card for sending a command more than once, count the
commands. Paste this into the browser console, then use the control:

```js
(() => {
  const c = document.querySelector('home-assistant').hass.connection;
  if (c.__patched) return 'already patched';
  c.__patched = 1;
  const original = c.sendMessagePromise.bind(c);
  let n = 0;
  c.sendMessagePromise = m => {
    if (m && m.type === 'call_service')
      console.log('CALL #' + ++n, m.domain + '.' + m.service, JSON.stringify(m.service_data || {}));
    return original(m);
  };
  return 'patched';
})();
```

Every service call goes through this one websocket connection, whichever
`hass` object a component happens to hold, so nothing escapes it.

This has already settled one false alarm. A humidifier beeped three times
whenever a mode was picked, which looked exactly like the card dispatching
the change three times. It sends one - the device was beeping because its
water tank was empty, and would have done so whatever was clicked.

Worth noting how that went wrong, because the pattern repeats: two
plausible explanations were argued from the code before anyone counted the
calls, and both were false. The card was displaying the answer the whole
time, in its own first indicator - water level, 0%.

## Layout

```
src/
  main.js            <mini-humidifier>, the card element: config parsing,
                     state plumbing, and the top-level render
  humidifiers.js     model id -> configuration factory registry
  configurations/    per-model defaults, grouped by the integration that
    xiaomi_miio/               provides the entity
    xiaomi_miio_airpurifier/
  components/        the sub-elements the card renders, the dropdown among them
  models/            wrappers that turn raw hass state into what a component
                     renders (humidifier, button, indicator, targetHumidity)
  utils/             template compilation, click handling, element definitions
  localize/          en, ru, uk
  style.js           card styles
  sharedStyle.js     styles shared with the sub-elements
test/                vitest unit tests, one file per unit under test
  browser/           component tests, run in Chromium by @web/test-runner
    helpers/         the fake hass and the Home Assistant element stand-ins
scripts/             build-time checks that are not part of the bundle
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

The card renders Home Assistant's own frontend elements (`ha-card`, `ha-icon`,
`ha-icon-button`, `ha-relative-time`, `ha-slider`, `ha-entity-toggle`). None of
them are a stable API:
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

## The dropdown

`src/components/dropdown-base.js` is the card's own menu, and it is worth
knowing why rather than reaching for a component library again.

It used to be `@material/mwc-menu` and `@material/mwc-list`, wrapped in scoped
registries so the card's copies would not collide with Home Assistant's. Those
packages are end of life on lit 2, which pinned the whole card to lit 2
until #148, and they cost 95 KB of a 182 KB bundle for a list of four modes. Home
Assistant's own menu was not a way out either: `ha-button-menu` was
[removed from the frontend](https://github.com/home-assistant/frontend/pull/29134)
in January 2026 in favour of a WebAwesome `ha-dropdown` with an unrelated API,
so following it would mean carrying two of them.

What the card needs is small - a button, a list of `{ id, name }` options, one
of them current - and that is what the component does. Two details are not
obvious:

- **The menu is positioned by hand.** The card clips its own overflow, so a
  menu that stayed in flow would be cut off. Where the browser has the popover
  API the menu is also put in the top layer, which survives a transformed
  ancestor - Home Assistant creates one while a dashboard is being edited. The
  popover call is an enhancement, not a requirement: without it the same fixed
  coordinates still apply.
- **Dismissal is the card's own.** `popover="manual"` means no light dismiss
  from the browser, so the component listens for a press outside itself, for
  Escape, and for the page scrolling, and closes on all three. Doing it by hand
  is what makes it behave the same whatever the engine, which matters for the
  Android companion app.

The browser tests cover the parts worth guarding: one command per selection,
what the menu shows, and the keyboard.

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

   Start straight at the content - no `## v<version>` heading and no badges.
   That file is the release body, and HACS shows it in the update dialog under
   a heading it draws itself, so a version heading of our own appears twice and
   a shields.io badge is clutter in a narrow dialog. Lead with one sentence on
   why the release matters, then `### Fixed` / `### Changed` lists. Keep links
   absolute.
3. Tag `v<version>` and push the tag. `.github/workflows/cd.yml` builds, checks
   that the tag and `package.json` agree, and publishes the bundle with those
   notes as the release body.

### What HACS shows

HACS renders **`README.md`**, and only that. The `info.md` convention is dead:
`async_get_info_file_contents` in `hacs/repositories/base.py` hardcodes the
filename list to variants of `readme`, so `info.md` is never read and the
`render_readme` manifest key no longer changes anything. Both were removed
from this repository.

Two consequences worth remembering:

- **Relative links do not work in HACS.** It hands the raw markdown to the
  Home Assistant frontend, which resolves `docs/models.md` against
  `/hacs/repository/<id>` and 404s. Links in `README.md` are absolute for
  that reason - do not "tidy" them back to relative paths.
- **HACS renders the README from the tag of the version the user has
  installed**, not from the default branch (`get_documentation` uses
  `data.installed_version`). A README fix therefore only reaches users with
  the next release, and the repository page keeps showing the old text until
  they update.

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

- The component tests render the card against stand-ins, so anything that only
  shows up against Home Assistant's own elements - which is where this card has
  broken before - is still caught by hand or not at all.
- Several bundled model configurations call `fan.set_speed`, a service Home
  Assistant removed in 2023.7, so those mode dropdowns are dead on any
  currently supported version.
