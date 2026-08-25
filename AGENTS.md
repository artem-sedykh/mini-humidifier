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

## The bundled models are presets, not the product

What this card is, is a kit: every control can be described in YAML - which
indicators exist and what each one reads, which buttons appear, what icon each
takes, what service each one calls, when each is disabled.
`src/configurations/` holds a dozen devices; the market has hundreds, and the
card is built this way so that a humidifier nobody here has heard of can go on a
dashboard without a pull request and without waiting for one.

That is a constraint on what may be changed, not just a description of what is:

- **A `model:` the registry does not know is supported.** It starts from the
  default configuration and warns in the console. Do not turn it into an error.
  [#112](https://github.com/artem-sedykh/mini-humidifier/issues/112) is a
  complete configuration for a `deerma.humidifier.jsq2w` - written by a user,
  posted with a screenshot, copied since - and refusing unknown ids would break
  it and every card copied from it.
- **The configuration is open at the leaves.** Indicator and button ids are
  chosen by the user, and their options are templates the user wrote. Anything
  that validates a configuration
  ([#178](https://github.com/artem-sedykh/mini-humidifier/issues/178)) or edits
  one ([#179](https://github.com/artem-sedykh/mini-humidifier/issues/179)) has
  to carry through what it does not recognise rather than dropping it. An editor
  that round-trips a hand-written card through a form and silently loses the
  half it does not model is worse than no editor.
- **Those templates are source text, not functions.** That is what forces
  several of the build constraints below - see "Why the model configurations
  stay JavaScript".

### How a preset is supposed to get into the bundle

The registry is meant to fill up from the outside, and it has: three of the
fourteen entries in `docs/models.md` are credited to the users who wrote them
(`by @ravikwow`, `by @regevbr`, `by @akovovh`). The intended path is one loop:

1. someone with a device the card does not ship for writes the configuration in
   their own YAML, because that always works;
2. if the device is common enough to be worth carrying, that configuration
   comes back as a pull request against `src/configurations/`;
3. it becomes a preset, and the next owner of that device gets it for free.

Which makes the second step worth watching for. `docs/models.md` documents it
under "Adding a model", but at the bottom of a page reached mostly by people who
already know unknown models work.
[#112](https://github.com/artem-sedykh/mini-humidifier/issues/112) is exactly
that step stalling: a complete configuration for a `deerma.humidifier.jsq2w`,
posted as an issue titled as a thank-you note in 2023, never turned into a
model. When one of those turns up, it is a contribution waiting for an invitation.

### The cost

The design is invisible. Someone whose device is not in `docs/models.md` reads
that table as a compatibility list and opens a model request; several of the
open issues are exactly that, from people who could have written the
configuration themselves in an evening and might have contributed it back.
Making this easier to find is worth more than bundling another model by hand.

## Language

**English only**, everywhere: code, comments, commit messages, issues, pull
requests, documentation, and release notes. This is a public repository with
external contributors who do not read Russian.

## Commands

```
npm ci             # install exactly what the lockfile says
npm run lint       # eslint
npm run format     # prettier --write
npm run typecheck  # tsc --noEmit over src, both languages
npm test           # vitest, the unit tests under test/
npm run test:browser  # @web/test-runner, the component tests in Chromium and WebKit
npm run rollup     # bundle src/main.ts -> dist/mini-humidifier-bundle.js
npm run check:bundle  # assertions on the built bundle (needs a build first)
npm run dev        # the same as rollup, unminified
npm run build      # lint + typecheck + test + rollup + check:bundle
npm run watch      # unminified, rebuilding on save
```

Node version comes from `.nvmrc`. Use it; CI reads the same file.

`npm run rollup` minifies; `npm run dev` produces the same bundle unminified,
which is what you want while debugging in the browser. The difference is large -
89 KB against 264 KB - so never publish a dev build.

`npm run test:browser` needs browsers to run: `npx playwright install chromium
webkit` once, which is what CI does on every run.

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
package, carries every model id from `src/humidifiers.js`, still calls services
through the `this` the model configurations are written against, and stays
within a tolerance of a recorded size.

That last one has a baseline in `scripts/bundle-baseline.json`. When a change
legitimately moves the size past the tolerance, update the file in the same
commit and say why in the message. Do not widen the tolerance to make a build
pass - the 11 KB the duplicated `@lit/reactive-element` added is exactly the
size of change it is there to catch.

**`npm test`** - vitest over `test/`, node environment. `localize`, `getLabel`,
the helpers in `src/utils/utils.js`, the model registry, the four wrappers in
`src/models/` that turn raw entity state into what a component renders, and the
configuration merging in `main.ts`. The merging tests need a DOM to construct the element, so
`test/config.test.js` asks for jsdom with a `@vitest-environment` docblock;
`setConfig` only reads and merges, and the element is never connected, so
nothing renders.

**`npm run test:browser`** - `@web/test-runner` over `test/browser/`, in
Chromium **and WebKit**, driven by playwright. Every test runs in both: Home
Assistant's companion app on iOS renders in WKWebView, and until #180 nothing
had ever run this card in a second engine. This is the layer that renders the
card: it
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
back. One more thing is needed to get that far, in
`web-test-runner.config.mjs`: the JSON translations have to be declared as
JavaScript through `mimeTypes`, so the rollup plugin that turns them into
modules is allowed to run.

There is deliberately nothing else in that page. Until #166 it also loaded
`@webcomponents/scoped-custom-element-registry`, without which the card mounted
as an empty shell - the registry is now the browser's own, so what the tests
run against is what a browser gives the card.

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
  main.ts            <mini-humidifier>, the card element: config parsing,
                     state plumbing, and the top-level render
  humidifiers.js     model id -> configuration factory registry
  configurations/    per-model defaults, grouped by the integration that
    xiaomi_miio/               provides the entity
    xiaomi_miio_airpurifier/
  components/        the sub-elements the card renders, the dropdown among
                     them, TypeScript
  models/            wrappers that turn raw hass state into what a component
                     renders (humidifier, button, indicator, targetHumidity),
                     TypeScript
  types.ts           the shapes the card works with: hass, the configuration
                     sections, the compiled template callbacks
  utils/             template compilation, click handling, element registration
  localize/          en, ru, uk
  style.js           card styles
  sharedStyle.js     styles shared with the sub-elements
test/                vitest unit tests, one file per unit under test
  browser/           component tests, run in Chromium and WebKit by @web/test-runner
    helpers/         the fake hass and the Home Assistant element stand-ins
scripts/             build-time checks that are not part of the bundle
```

## TypeScript

Everything in `src/` is TypeScript except `src/configurations/`, which stays
JavaScript on purpose - see below. `allowJs` is on for that reason, and
`checkJs` is off: those files are template source text more than they are code.

It arrived file by file, over four pull requests, because #152 asks for that -
the one attempt at doing it in a single pass was abandoned with 39k lines
changed.

`src/types.ts` is where the configuration is described, in two halves that are
worth keeping apart: **`RawCardConfig`** is the YAML a person wrote - almost
everything optional, several options accepting two shapes - and **`CardConfig`**
is what `setConfig` leaves behind, with the model's defaults merged in and every
template compiled into a callback. An option that is in neither is an option the
card does not read.

`npm run typecheck` is `tsc --noEmit`. Nothing else type checks: rollup and the
browser tests both strip types with esbuild, which does not look at them.

### Why the model configurations stay JavaScript

They are the one part of `src/` that TypeScript cannot describe without
changing what it describes. Each callback in them is written against a `this`
that only exists at runtime: `compileTemplate` takes the function's **source
text**, re-parses it with `new Function`, and calls the result with the card as
`this`. rollup keeps that text intact through `moduleContext`.

TypeScript disagrees on both counts. `this` at the top level of a module is
undefined, so the checker reports the callbacks; and esbuild, which strips the
types, rewrites that `this` to `void 0` - so the text `compileTemplate` gets
back reads `void 0.call_service(...)`.

This was measured, not assumed: moving one configuration to `.ts` and building
gives "62 calls through `this`, 6 through `void 0`" from `npm run check:bundle`.
The card would load, render, and do nothing when any control of that model is
touched.

If they are ever migrated, the shape of the fix is to give each factory an
explicit `this` parameter so the `this` inside is function-scoped rather than
module-scoped. Nothing needs it today.

### Three things to know before migrating anything else

- **`useDefineForClassFields` must stay false.** A declaration-only field
  (`hass: HomeAssistant;`) has to erase. With class fields defined it would
  assign `undefined` at construction instead, and once the components follow,
  that assignment lands on top of lit's own accessors.
- **The browser tests need `tsconfig` passed to esbuild too.** Without it the
  plugin defines class fields, and a declaration-only field then assigns
  `undefined` over lit's accessor: the components render and none of their
  properties arrive. The dropdown tests caught exactly that.
- **esbuild must not touch the JavaScript that is left.**
  `rollup.config.mjs` restricts it to `/\.ts$/` and the browser tests pass no
  `target`, both to keep it away from `src/configurations/` for the reason
  above. `check:bundle` counts the damage if that ever slips, because nothing
  else notices: the size barely moves and every other check passes.

## Registering the elements

Every component registers itself at the bottom of its own module -
`define('mh-button', HumidifierButton)` - and `main.ts` imports those modules
for that alone. `src/utils/define.ts` is `customElements.define` without the
throw when the name is already taken, which is what a page that loads the
bundle twice does.

Two consequences worth knowing:

- **The names are global.** They were not until #166, when the card mounted its
  components through `@lit-labs/scoped-registry-mixin`. That mixin calls
  `attachShadow({ customElements })`, which no browser implements - it is the
  API of a polyfill the card never shipped and Home Assistant happened to load.
  Where that polyfill was missing the card rendered an empty shell and said
  nothing, which is what [#72](https://github.com/artem-sedykh/mini-humidifier/issues/72)
  reads like.
- **Home Assistant's elements are simply used.** `ha-card`, `ha-icon` and the
  rest are defined globally by the frontend, so a template can name them. There
  is no longer any machinery waiting for them to appear, and no `render` that
  returns an empty template until it has.

## How a card configuration is resolved

This is the part worth understanding before changing anything about options.

1. The user's YAML names a `model` (default `zhimi.humidifier.cb1`).
2. `HUMIDIFIERS[model]()` in `src/humidifiers.ts` returns that model's defaults.
   A model the registry does not have falls back to `HUMIDIFIERS.default`, and
   the card warns about it in the console.

   **The fallback is a feature, not a bug to fix.** There are more humidifiers
   than this card ships configurations for, which is why it can be described in
   YAML end to end; naming a device the card does not know and writing out its
   controls is the card being used as intended.
   [#112](https://github.com/artem-sedykh/mini-humidifier/issues/112) is a
   working configuration for a `deerma.humidifier.jsq2w`. Refusing an unknown id
   would break dashboards like that one, so do not.

   The warning is for the other half of the same behaviour: a typo between
   `deerma.humidifier.mjjsq` and
   `xiaomi_miio_airpurifier:deerma.humidifier.mjjsq` - one device through two
   integrations that call different services - used to be invisible.

   Why a warning and not a thrown error, measured on 2026.8.3 rather than
   assumed: **a thrown `setConfig` message reaches the console and never the
   card**. `hui-error-card` draws a red icon and drops the text, exactly as it
   does for a built-in card with a broken config - no text, no title, no
   tooltip. Both roads end in the console, and only one of them breaks working
   dashboards. Keep that in mind before making anything else in `setConfig`
   throw: it is not a way to tell a user anything.
3. `main.ts` merges the user's YAML over those defaults, per section
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
  ancestor - Home Assistant creates one while a dashboard is being edited.

  **It is an enhancement only where the browser has never heard of it**, and
  that distinction is load-bearing. `popover="manual"` renders with the menu,
  and an engine that honours the attribute keeps such an element `display: none`
  until `showPopover` puts it in the top layer - so where the attribute applies
  and the call does not land, the menu is invisible rather than un-layered, and
  the hand positioning cannot help. `showPopover` refuses on an element that is
  already showing, and engines have refused it in other states, so the call is
  guarded and the attribute is dropped when it fails (#189). An engine with
  neither needs none of that: an unknown attribute is inert.
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
