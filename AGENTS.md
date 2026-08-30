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

## Helping someone with a device the card has no preset for

A different job from fixing a bug in `src/`, with a different output: the
answer is a YAML block, not a diff. Most requests that arrive as "add support
for X" are this one.

**The page to work from is [docs/custom-device.md](docs/custom-device.md).** It
carries the worked example (a Levoit Classic 300S through VeSync, from #124) and
the contract underneath the options - what a `source` is, what a template runs
as, which options are not templates, and what the card warns about rather than
refusing. Do not re-derive any of that from `src/`; if something there is wrong
or missing, the fix belongs in that page, where the next person also gets it.

What to establish before writing YAML, in this order:

1. **The entity's domain and attributes**, from Developer tools -> States. The
   bug report template already asks for these. Which attribute holds the target
   and which holds the reading is the fork everything else hangs off.
2. **The other entities the integration created** beside the humidifier - a
   night light, a switch, a sensor. Most "the card cannot do X" turns out to be
   X living on a second entity, which `state: entity` and `source: entity`
   reach.
3. **Which base**: `model: humidifier` for a `humidifier` entity, a bundled id
   when the device is close to one, `none` when they are writing everything
   themselves. Leaving `model:` out is not neutral - it is the Xiaomi default,
   including its 30-80 slider range, which overrides what the device reports.

Four mistakes worth recognising on sight, all of them seen in the tracker:

- **`entity_id:` at the top of a button or an indicator** (#124). Not an option
  the card reads, and not reported either, because unknown keys inside a control
  are the template scope. The control looks configured and acts on the
  humidifier.
- **Expecting `hide`, `min`, `max` or `step` to be templates.** They are values.
  A control that should come and go with the device is `disabled`.
- **A slider that is greyed out on a device with no modes** (#70, #125). The
  presets guard for it now; on an old bundle the answer was `disabled: false`,
  and the difference between "your card is old" and "write this option" is worth
  checking before answering.
- **A template with a syntax error takes the whole card down**, red rectangle
  and all, while a template that throws when it runs only takes its own option
  out. Both report in the console and nowhere else, so ask for the console
  before theorising.

When a configuration works, say so and then ask for it back: a preset is one
file in `src/configurations/` plus a line in the registry, and three of the
bundled fourteen arrived exactly that way. That loop is the point of the design,
and it only closes if someone mentions it.

## Language

**English only**, everywhere: code, comments, commit messages, issues, pull
requests, documentation, and release notes. This is a public repository with
external contributors who do not read Russian.

The documentation site is English too. A machine-translated Russian locale was
built and published for a day, and then removed: the structure survived
translation intact, but the vocabulary did not - `string` came out as
"струна", `entity_id` as "Существо_id", and "which set of device defaults to
start from" acquired a meaning of its own. On a reference table that is worse
than no translation, because a reader cannot tell which rows to trust.

## Commands

```
npm ci             # install exactly what the lockfile says
npm run lint       # eslint
npm run format     # prettier --write
npm run typecheck  # tsc --noEmit over src, both languages
npm test           # vitest, the unit tests under test/
npm run test:coverage # the same, with coverage and its thresholds
npm run test:browser  # @web/test-runner, the component tests in Chromium and WebKit
npm run rollup     # bundle src/main.ts -> dist/mini-humidifier-bundle.js
npm run check:bundle  # assertions on the built bundle (needs a build first)
npm run check:docs  # every path the documentation names exists
npm run check:options # every option the card reads is documented, and the reverse
npm run check:models  # the presets' entity names still match the integration
npm run check:version # the README names the version in package.json
npm run changelog  # rebuild CHANGELOG.md from release_notes/ (--check in CI)
npm run dev        # the same as rollup, unminified
npm run build      # everything CI runs, in the same order: lint, typecheck,
                   # format:check, check:docs, check:options, check:models,
                   # check:version,
                   # changelog --check, test, rollup, check:bundle
npm run watch      # unminified, rebuilding on save
npm run bench      # up | setup | shot | down - the Home Assistant in a container
npm run test:e2e   # the scenarios in test/e2e/, against that Home Assistant
npm run bench:coverage # which parts of src/ those scenarios reach
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

Four layers, all run by CI, in the order of how much they cost to run.

CI runs them on every push and pull request, and **once a week on master**
whether anything changed or not. Nothing here changes on its own; everything it
is built against does - browsers, transitive dependencies, the runner image -
and a scheduled run finds that kind of break before an outside contributor hits
it on their own pull request and assumes they caused it. The same run can be
started by hand from the Actions tab when something outside is suspected.

**`npm run check:bundle`** - `scripts/check-bundle.mjs`, assertions on
`dist/mini-humidifier-bundle.js` after `npm run rollup`. Every regression this
repository has shipped so far lived in the build rather than in the source: a
development build of lit reaching users, two copies of `@lit/reactive-element`
in one bundle, a lit directive left unresolved and emitted as an external
`require`. None of them is visible in the source, all of them are visible in the
output file. The script checks that the bundle registers the element, resolves
every import, is not lit's development build, holds exactly one copy of each lit
package, carries every model id from `src/humidifiers.ts`, still calls services
through the `this` the model configurations are written against, and stays
within a tolerance of a recorded size.

That last one has a baseline in `scripts/bundle-baseline.json`. When a change
legitimately moves the size past the tolerance, update the file in the same
commit and say why in the message. Do not widen the tolerance to make a build
pass - the 11 KB the duplicated `@lit/reactive-element` added is exactly the
size of change it is there to catch.

**`npm run check:docs`** - `scripts/check-docs-paths.mjs`, over every markdown
file except `release_notes/`, which records what was true at a release rather
than what is true now. Every path the prose names has to exist; a path named
because it is absent goes in the script's `IGNORED` map with its reason. It
exists because paths in this file said `.js` for the whole of the TypeScript
migration and nothing noticed - `mkdocs build --strict` checks the links
between pages of the site, not the paths a sentence names, and it never sees
this file at all.

**`npm run check:options`** - `scripts/check-docs-options.mjs` (#258). The
other half of the check above: that one asks whether a file exists, this one
whether an **option** does, and whether anybody says so. A path rots loudly
when a file moves; an option rots quietly when the code and the prose stop
agreeing, and in the sister card one had been declared, read, styled by nothing
and documented nowhere for six years.

Three lists describe this card's options and all three can drift:
`RawCardConfig` in `src/types.ts` is what a user's YAML may be, `CARD_OPTIONS`
in `src/utils/validateConfig.ts` is what the card does **not** warn about, and
the table in `docs/configuration.md` is what a reader trusts. The comment above
`CARD_OPTIONS` already said it "has to stay level" with the other two; this is
what makes it so. A key missing from `CARD_OPTIONS` is the expensive direction:
the card warns the user about an option it does read.

The tap actions are held the same way - every action in `TAP_ACTIONS`, plus
`none`, has to appear in the documentation. An option deliberately in one list
and not another goes in the script's `IGNORED` map with its reason; `type` is
there, as Lovelace's key rather than the card's. All four directions have been
seen failing, not only passing.

**`npm run check:models`** - `scripts/check-model-entities.mjs` (#267). The
presets in `src/configurations/xiaomi_miio/` reach for entities by name -
`sensor.{entity_id}_water_level`, `switch.{entity_id}_dry_mode`,
`select.{entity_id}_led_brightness` and a dozen more, each built out of the
humidifier's own id. Those suffixes are not an API: they are slugs of the
display names the integration gives its entities, and Home Assistant renames
those when it decides to.

When one changes the card does not break loudly. The control is skipped, the
user sees a card with a hole in it after an update, and the report arrives as
"the water level stopped working". Nothing else here can see it coming - the
unit layer, the browser layer and the bench all run against entities this
repository names itself, which makes the convention true by construction
wherever it is checked.

It runs against `scripts/integration-entities.json`, a snapshot of the names
`home-assistant/core` declares, so the build never touches the network.
`.github/workflows/integration-drift.yml` refetches it weekly and pushes a
branch when it moved; a red run there is the signal, and a red build on
somebody's unrelated pull request would not be. Refresh it by hand with
`npm run check:models -- --update`.

The `xiaomi_miio_airpurifier` presets are deliberately not covered: they read
attributes off a `fan` entity from syssi's custom component, whose names live in
another repository. A `{entity_id}_` reference appearing in one of them fails
the check rather than passing unexamined. Seen failing four ways: a preset
renamed, a name gone from the snapshot, a companion entity added to the
unchecked presets, and the whole thing finding nothing.

**`npm run check:version`** - `scripts/check-readme-version.mjs`. Every `?v=`
in `README.md` names the version in `package.json`, and no download link is
pinned to a release tag. The install instructions said `?v=3.1.5` while this
repository was at 3.5.2 - four releases behind - and that number is the only
cache-buster a person has: `/local` is served with a month-long `max-age`, so
a stale one copied out of the README makes the next update to the card look
like it did nothing. This README explains that twice, which is what makes an
old number in it worse than none. `release-prepare.yml` rewrites it along with
`package.json`; this is what says so when the two drift anyway. Seen failing
three ways: a stale number, no `?v=` at all, and a link pinned to a tag.

**`npm test`** - vitest over `test/`, node environment. `localize`, `getLabel`,
the helpers in `src/utils/utils.ts`, the model registry, the four wrappers in
`src/models/` that turn raw entity state into what a component renders, every
branch of `handleClick` - which is the whole of what `tap_action` does - and the
configuration merge, from both ends. `test/build-config.test.js` calls
`buildCardConfig` directly, with no element and no DOM, which is what #233 made
possible; `test/config.test.js` goes on doing it through a constructed card,
because what it pins down is what the merge has always done and a rewrite of it
would have meant the move took something with it.

Three files need a DOM and ask for jsdom with a `@vitest-environment` docblock:
`test/config.test.js`, because it constructs the element, though `setConfig`
only reads and merges so nothing renders; `test/handle-click.test.js`, because
dispatching an event and pushing history is all that file does; and
`test/documented-contract.test.js`, for the same reason as the first.

That last one is not about the card so much as about the page that describes
it. `docs/custom-device.md` is written as the contract an assistant configures
against, which makes each of its claims a thing that can quietly stop being
true - `source: __init` still building a dropdown from the entity, `unit` still
taking a template, an indicator still having no `call_service`, a template that
fails to parse still being the one fatal mistake. Every test in it is one
sentence from that page, written as YAML text rather than as a function, since
that is the only form the documentation can show.

`npm run test:coverage` is the same run with `@vitest/coverage-v8` on, and CI
uses it in place of `npm test`. It measures **the unit layer only**, and what it
leaves out is the point (`coverage.exclude` in `vitest.config.mjs` carries the
reasons):

- `src/configurations/**` never executes as written - `compileTemplate` re-parses
  the source text of every callback with `new Function`, so v8 attributes
  nothing to those files however well they are covered. The browser layer runs
  the compiled copies.
- `src/components/**` render in the browser layer, and under vitest only their
  import-time code runs.

The thresholds are set to what the suite covers today rather than to a round
number, so they say "this must not slide" and not "aim here". Raise them when
coverage rises. `coverage/index.html` after a run is where "which lines" has an
answer, and the CI job summary carries the four numbers.

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

**`npm run test:e2e`** - the bench (#257): a real Home Assistant in a container,
a broker to invent devices on, the card on a real dashboard. This is the layer
that answers the distinction the paragraph above draws, and the reason it
matters here more than in the sister card is
`src/components/targetHumidity.ts`, which picks its layout by asking `ha-slider`
which of three implementations it is. Everything about that decision was
untested until this existed.

It is driven by a manifest (`test/e2e/bench.json`) rather than by anything in
`test/bench/`, which names no card - the directory arrived from the sister card
as a copy. `.github/workflows/bench.yml` runs it against the pinned version and
against `latest`, the second allowed to fail on purpose, and it is deliberately
not part of `Continuous Integration`. How to run it, what the fixtures are and
why they are optimistic: `test/bench/README.md`.

On its first run it found #263 - a card whose entity is not in `hass.states`
rendered nothing at all and threw on every update.

It is also the only layer where a **model preset** meets the device it was
written for (#266). A preset reads a family of entities named after the
humidifier's own id - `sensor.{entity_id}_water_level`,
`select.{entity_id}_led_brightness`, `number.{entity_id}_favorite_level` - and
the fake `hass` in `test/browser/` carries one such family, the one
`zhimi.humidifier.cb1` reads. Three of the four `xiaomi_miio` presets had
therefore never rendered an indicator with a value anywhere: their entities
were simply absent, every control that needed one was skipped, and what was
left still looked like a card. The manifest's fourth view gives each of them
its own entities, which is a matter of naming MQTT fixtures correctly - the
card never talks to `xiaomi_miio`, only to entity ids and core-domain
services. `test/e2e/models.test.mjs` also photographs each card into
`test/e2e/shots/`, which is where a picture of a preset comes from when
`docs/models.md` wants one.

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
  main.ts            <mini-humidifier>, the card element: lifecycle, state
                     plumbing, and the top-level render
  config/            buildConfig.ts - the user's YAML merged over a model's
                     defaults, every template compiled. No DOM, no lit
  humidifiers.ts     model id -> configuration factory registry
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
  style.ts           card styles
  sharedStyle.ts     styles shared with the sub-elements
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
   controls is the card being used as intended. `model: none` is the registry's
   own answer to the same need - a preset that brings nothing, so a card
   describing its own controls does not have to hide the default set's first
   (#186).
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
3. `src/config/buildConfig.ts` merges the user's YAML over those defaults, per
   section, and compiles every template. It is a plain function rather than
   part of the element (#233): it needs no `hass` and no DOM, only a
   `TemplateRuntime` - `callService` and `localize`, both of which read
   `this.hass` when a template runs rather than when it compiles, because
   `setConfig` happens before the card has one. `setConfig` is left reading as
   validate, build, assign.

`setConfig` also runs `src/utils/validateConfig.ts` over the raw YAML and warns
about what the card is going to ignore (#178). Two rules hold it in place, and
both are easy to "improve" into a bug:

- **Unknown keys are only reported at the top level.** Inside an indicator or a
  button, a key the card does not read is an extension point - the template
  scope is `{ ...value }`, so anything written beside a template is readable
  from it as `this.` - and a closed vocabulary would reject the bundled presets.
- **The string form of `tap_action` is shorthand, everywhere.** An indicator's
  is normalised to `{ action: <string> }` by `getIndicatorConfig`, and since
  #206 the card's own is normalised the same way in `setConfig`. Before that
  the card did not, so every string but `none` reached `handleClick` and
  returned early - a dead click with a pointer cursor - and `computeClasses`
  compared the whole option against `'none'`, so the object form of "do
  nothing" still drew as clickable. Both are fixed rather than described; do
  not re-introduce a second meaning for the string.

It warns and never throws, for the reason under point 2.

Two more things warn, both added by #211 and both about what the card leaves
out rather than about what it was given:

- **A control whose entity is not in `hass.states` is skipped**, which is the
  right thing to render and used to be the whole of what happened.
  `warnMissing` names the control and the entity id, once per card
  configuration rather than once per `hass`. The id is usually computed from
  `{entity_id}`, so what is missing is a name nobody typed - #78 and #98 are
  both that, and the second took fourteen comments to find.
- **A template that throws is caught by the wrapper in `compileTemplate`**,
  which warns with the option's path and answers `undefined`, so the card
  renders as if that option had not been written. Unwrapped, the throw happened
  inside a component's render and left that component in the tree with an empty
  shadow root - a control that vanished, with nothing on screen to say why
  (#70).

Keys in `HUMIDIFIERS` come in two shapes:

- `zhimi.humidifier.cb1` - the model as reported by Home Assistant's own
  `xiaomi_miio` integration.
- `xiaomi_miio_airpurifier:deerma.humidifier.mjjsq` - the same device through
  syssi's third-party `xiaomi_miio_airpurifier` integration, which exposes
  different attributes and different services. The prefix is what
  distinguishes them.

### Adding a model

Copy the closest existing file in `src/configurations/<integration>/`, adjust
it, and register it in `src/humidifiers.ts`. Two things to get right:

- `change_action` and `toggle_action` must call services that actually exist in
  the integration the model is filed under. Copying a configuration from
  another integration and leaving its service calls in place produces a card
  that renders correctly and does nothing when clicked.
- The functions in these files are called with `this` bound to the card. That
  is not ordinary module scope: `rollup.config.mjs` sets `moduleContext` to
  `this` for exactly these directories. Do not "fix" it by importing something.

Document the new model in the options reference, and in
`README.md` under the list of available default configurations.

## The visual editor

`src/configForm.ts`, reached through the static `getConfigForm` on the card
(#179). It is a **schema** that Home Assistant renders itself, not an editor
element of this card's own, and that choice is the whole of why the editor is
safe for a hand-written configuration:

- `hui-form-editor` passes the **whole config** into `ha-form` as `data` and
  re-emits what comes back, and `ha-form` merges each field change over it
  (`this.data = { ...this.data, ...newValue }`). Every key the schema does not
  mention survives. Measured on 2026.8.3 against the real elements: a card with
  an unknown `model` and an `indicators` section carrying a template came back
  from an edit intact.
- `ha-form` is Home Assistant's import, not ours. An editor element of our own
  would have to force the frontend to load `ha-form` first - it is lazily
  loaded and absent until some editor has been opened - which is what the
  `loadCardHelpers()` preload trick in other cards is for.

**Labels.** `computeLabel` answers only for `model`, `scale` and `group`, from
this card's own `localize` (`editor.*` in `src/localize/languages/*.json`).
Everything else returns nothing on purpose: `hui-form-editor` then falls through
to `ui.panel.lovelace.editor.card.generic.<name>`, which Home Assistant ships
translated into every language it supports, so `entity`, `name` and `icon` read
the same as in a built-in card's editor at no cost here.

The fallback given to `localize` is an **empty string**, not the default
`unknown`: the frontend reads `computeLabel(...) || <its own key> || <the
capitalised field name>`, so a language this card has no dictionary for lands on
the field name rather than on the word "unknown".

The language comes from the `home-assistant` element at the root of the
document, because `computeLabel` is handed the schema and Home Assistant's
`localize` and nothing else - no `hass` - and `getConfigForm` is static, so
there is no card instance to ask either.

Two consequences to keep in mind before extending it:

- **The schema cannot depend on the configuration.** `getConfigForm` is static
  and takes no arguments. That is why only the flat options are in it: which
  indicators and buttons a card has depends on its model and on ids the user
  chose. Doing those means an editor element, and then the merge is ours to get
  right.
- **There is no `assertConfig`, on purpose.** Throwing from it sends the card to
  the YAML editor with "visual editor is not supported", which is the right
  move when an editor would misrepresent a configuration. Nothing here can:
  what the schema does not name, Home Assistant carries through.

## Home Assistant compatibility

The card renders Home Assistant's own frontend elements (`ha-card`, `ha-icon`,
`ha-icon-button`, `ha-relative-time`, `ha-slider`, `ha-entity-toggle`). None of
them are a stable API:
they are internal frontend components that change between releases without
notice, and they have broken this card before.

Known boundary: **Home Assistant 2025.10** replaced the mwc-based `ha-slider`
with a WebAwesome one (frontend `20250924.0`, first shipped in core 2025.10.0).
That changed the element's box model, its custom properties, and the meaning of
its `value` attribute. `src/components/targetHumidity.ts` carries the code that
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

`src/components/dropdown-base.ts` is the card's own menu, and it is worth
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

## The documentation site

`docs/` rendered with MkDocs Material and published to GitHub Pages by
`.github/workflows/docs.yml` (#222). The content lives in `docs/` and nowhere
else - that is the whole difference from the wiki that was considered and
rejected, which would have been a second copy to keep level with the first.

- **`mkdocs build --strict`** runs on every pull request that touches the docs.
  A link to a page that does not exist fails the run rather than shipping a 404,
  and that is the only link checking this repository has: it caught three broken
  links on the first build.
- **The front page is README.md.** `scripts/mkdocs_hooks.py` writes it to
  `docs/index.md` at build time (git-ignored) and rewrites the absolute
  `blob/master/docs/...` links in it to stay on the site. It is written to disk
  rather than generated in memory because `mkdocs-static-i18n` reads
  `abs_src_path` off every file it sorts into a locale, and a generated file has
  none - the build dies with a `TypeError` before it renders a page.
- **The breadcrumb line** at the top of each page (`Home | Configuration | ...`)
  is stripped by the same hook. It exists for people reading the files on
  GitHub, where nothing else links the pages together; on the site the sidebar
  does that job.
- **Links out of `docs/`** - `../AGENTS.md`, `../.nvmrc` - are repointed at the
  repository, because nothing above `docs/` is published.
- **`llms.txt` and `llms-full.txt`** are written into the built site by the same
  hook, after the pages are on disk (#256): an index of every page with a line
  saying what is on it, and every page concatenated for grounding an answer in
  one fetch. People configure this card with an assistant and the assistants do
  not know it, so what comes back names options that do not exist - and this
  card is unusually bad at saying so, since an unknown key inside a control is
  the template scope rather than an error. Both files are generated from the
  pages the site is built from; a page in `nav` with no line in `PAGE_SUMMARIES`
  fails the build, which is what keeps the two level. `docs/ai-assistants.md` is
  the page for the reader doing the asking.
- **The site is built from master**, so it can be ahead of the release a reader
  has installed. The announcement bar in `overrides/main.html` says so.

## Releasing

Run the **Prepare a release** workflow (`workflow_dispatch`,
`.github/workflows/release-prepare.yml`) with the version, without the leading
`v`. It checks the release notes exist and are not empty, that the tag is new
and the version ahead of the current one, bumps `package.json`, rebuilds
`CHANGELOG.md` and pushes `release/<version>`. The run summary links to the
pull request form.

**Open that pull request by hand.** A pull request opened with `GITHUB_TOKEN`
does not trigger other workflows - GitHub blocks that to stop workflows
recursing - so the required "Lint, test and build" check would never report on
it and it could not be merged at all. One click, and the checks then run as they
do for any branch.

Then merge it, tag `v<version>` and push the tag.

By hand, if the workflow is not available:

1. Bump `version` in `package.json`. It carries a `v` prefix here
   (`"v3.1.5"`), which is unusual but load-bearing: the README badge reads it.
   Bump the `?v=` in the README's install instructions with it - `npm run
   check:version` fails the build until they agree, and the **Prepare a
   release** workflow does both in one step.
2. Write `release_notes/v<version>.md`. The release job reads that exact path
   and fails if it is missing.
3. `npm run changelog`, and commit `CHANGELOG.md` with it. CI fails if the
   generated file and `release_notes/` disagree.

   Start straight at the content - no `## v<version>` heading and no badges.
   That file is the release body, and HACS shows it in the update dialog under
   a heading it draws itself, so a version heading of our own appears twice and
   a shields.io badge is clutter in a narrow dialog. Lead with one sentence on
   why the release matters, then `### Fixed` / `### Changed` lists. Keep links
   absolute.
4. Tag `v<version>` and push the tag. `.github/workflows/cd.yml` builds, checks
   that the tag and `package.json` agree, and publishes the bundle with those
   notes as the release body.

### Provenance

`cd.yml` attests the bundle with `actions/attest` and appends its sha256 to the
release body, so the asset on the releases page can be tied back to the run
that built it (#181):

```console
gh attestation verify mini-humidifier-bundle.js -R artem-sedykh/mini-humidifier
```

The attestation is over `dist/mini-humidifier-bundle.js` as built in that run.
If the upload step ever starts publishing something the build did not produce,
this is what says so - a served file that is not the built file has no symptom
until someone hits the bug it carries.

`actions/attest` rather than `actions/attest-build-provenance`: since v4 the
latter is a wrapper over the former, and with only `subject-path` given they
generate the same SLSA build provenance.

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

- The bench covers the elements the component tests stand in for, but only on
  the versions it is pointed at. No version matrix has been run here yet, and
  `docs/index.md` claims 2022.11 and newer on nobody's measurement - see the
  last section of `test/bench/README.md` before trying to turn that into a
  number.
