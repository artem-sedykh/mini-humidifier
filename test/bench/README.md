# The bench

A Home Assistant of its own, in a container, with a broker to invent devices
on. It exists for the failures the other layers cannot see: the ones where
**Home Assistant changed rather than the card**.

`test/browser/` renders this card against **stand-ins** for the Home Assistant
elements - the stubs carry a `display` and nothing else - so there is nothing
in them to break. And this card leans on one of those elements harder than
most: [`src/components/targetHumidity.ts`](../../src/components/targetHumidity.ts)
picks its layout by asking `ha-slider` which of **three** implementations it
is - paper-slider, MdSlider, and the WebAwesome one since 2025.10. Until this
directory existed, that decision had never run against any of them.

The sister card has two of these in its history: its entity icon stopped being
centred when `ha-icon-button` was rebuilt and the size moved from
`--mdc-icon-button-size` to `--ha-icon-button-size`, and its dropdowns
disappeared on 2026.5 when `mwc` went. Both were invisible to every test it had
while they were broken.

Nothing in this directory names a card. What is under test comes from a
manifest - `test/e2e/bench.json` here - which is how it arrived from the sister
card: a copy, with the card's name changed in the selector, the bundle path,
and the theme.

## Running it

```
npm run rollup          # the bench serves dist/, so build first
npm run bench up        # fresh instance, entities, dashboard
npm run test:e2e        # the scenarios in test/e2e/
npm run bench shot      # a picture of the dashboard and of each card
npm run bench down      # and it is gone
```

`shot` is the other half of what this is for: an answer to "the layout is off"
that is a screenshot rather than a paragraph. Point `BENCH_MANIFEST` at a
manifest holding the reporter's own YAML and the pictures are of their card.

A picture taken by an **external browser** comes out in whatever language the
bench host speaks, because the frontend renders in the machine's locale. The
scenarios never hit that - `open()` in `browser.mjs` pins `locale: 'en-US'`
and `selectedLanguage: 'en'` - but a manual playwright session does not, so
capturing screenshots from one needs the same two pins:

```js
localStorage.setItem('selectedLanguage', JSON.stringify('en'));
```

`up` and `down` need docker on this machine. Everything else talks to whatever
`BENCH_URL` names, so a bench running on another host is used from here with
`BENCH_URL=http://<host>:8124 npm run test:e2e`.

### A bench on another host

Two variables besides the URL are the point of contact when the bench is not
on this machine:

| variable | what it is |
|---|---|
| `BENCH_MQTT_HOST` | where the broker answers - the bench host, not `localhost` |
| `BENCH_MQTT_INTERNAL_PORT` | the port Home Assistant reaches the broker on from inside the container: `1883` on the compose network, the published port when the host is named by address |

The bundle is the other trap. The bench serves the `dist/` it was started with,
from the `/config/www/bench` mount; build the new bundle first, then copy it to
that directory on the bench host, or the scenarios exercise the previous build
while the manifest talks about a new option. Compare the two by hash rather
than by trusting the copy - and compare against the hash you **expect**, not
against the one that has just been built, which matches every time and
therefore checks nothing.

| variable | default | what it is |
|---|---|---|
| `BENCH_URL` | `http://localhost:8124` | where Home Assistant answers |
| `BENCH_HA_VERSION` | `2026.8.3` | the image tag, and the point of the bench: vary it |
| `BENCH_HA_PORT` | `8124` | published port |
| `BENCH_MQTT_PORT` | `1884` | published broker port |
| `BENCH_CARD_DIST` | `../../dist` | what is served as `/local/bench/` |
| `BENCH_MANIFEST` | `test/e2e/bench.json` | which card, which entities, which dashboard |

## In CI

`.github/workflows/bench.yml`, on pushes and pull requests that touch `src/`,
`test/bench/` or `test/e2e/`, and once a week. Two legs:

- **the pinned version** - what the card is documented against and what most
  users are on. Not allowed to fail.
- **`latest`** - allowed to fail, on purpose. A break there is news about Home
  Assistant rather than about the branch being pushed, and blocking a
  contributor's pull request on it would be telling them to fix something that
  is not theirs. Home Assistant ships monthly, which is what the weekly run is
  for: hearing it before a user does.

It is deliberately **not** part of `Continuous Integration`. That workflow's
`build` job is the required check on master, and a required check should be
quick and should answer for this repository alone.

Screenshots are uploaded as an artifact on every run, failed or not - a red
browser test is hard to read without one.

## What the manifest holds

Four views, and the difference between the first two is the point:

- **Cards** is the card as its defaults render it, plus the cases the scenarios
  need: a dehumidifier with no modes, an entity that is not in `hass.states`, a
  `fan` entity, `model: none`, the power button as a toggle, `scale: 2`;
- **As people write them** is one card modelled on configurations in daily use -
  modes renamed, indicators reading sensors beside the humidifier, one of them
  mapping its value through a template, a dropdown calling `humidifier.set_mode`
  itself, a button pointed at a switch, `tap_action` written as a bare string;
- **A translucent card** carries `"theme": "glass"`, applied from
  `config-seed/themes/glass.yaml`. A theme is the only native way to set the
  variables the card reads; the way most people actually set them is
  `card_mod`, a third-party resource this bench does not carry.
- **Models** is one card per bundled preset from
  `src/configurations/xiaomi_miio/`, each with the whole family of entities its
  preset reads (#266). See below.

A card with nothing but an `entity` exercises almost none of what the tracker
asks about, which is why the second view exists.

## How the entities work

MQTT humidifiers, a fan, a switch and three sensors, published as discovery
messages **by Home Assistant itself** (`mqtt.publish`), so the bench needs no
MQTT client of its own.

The fixtures deliberately have **no state topics** for what the card writes.
Home Assistant is optimistic without them: a press moves the entity with no
device on the other end to echo it back, which is what lets a scenario assert
on a press at all. What the bench drives instead - the current humidity, the
water level, the room sensors, availability - has topics of its own, which is
how a scenario puts an entity into a state that matters.

The cost of that is where an optimistic entity **starts**: `unknown`. The card
reads that as unavailable and draws none of the controls, so there is nothing
to press. Hence `start` in the manifest - a list of service calls made after
the entity registers, with its own id filled in:

```json
"start": [
  { "domain": "humidifier", "service": "turn_on" },
  { "domain": "humidifier", "service": "set_humidity", "data": { "humidity": 55 } }
]
```

The state a scenario finds is therefore made the way a user would make it, by
calling the service, rather than by writing a state Home Assistant would never
have produced.

Removing an entity is an empty retained payload on its discovery topic. That is
also how an entity leaves `hass.states` for real, which is the situation behind
[#263].

### The build under test, and the month of cache in front of it

Home Assistant serves `/local` with `Cache-Control: public, max-age=2678400`.
The bundle's path does not change between deploys, so a browser that has looked
at the bench once goes on rendering the build it saw then - and says nothing
about it. The scenarios never notice, because each run opens a fresh profile; a
person looking at the dashboard does, and the card's console banner cannot tell
them apart, since it prints the version from `package.json` and that is one
string for every build between releases.

So `prepare()` registers the resource as `<bundle>.js?v=<etag>` and updates that
url when the file changes ([#275]). The value follows the file rather than the
clock: `ETag` here is the file's mtime and size, so a reload with nothing
deployed still comes out of the cache - `transferSize: 0`, measured - and a
reload after a deploy fetches.

It also deletes anything else registered out of the bench's own directory. Two
resources pointing at one bundle both load and the card's `define` runs twice;
a resource left behind by whatever the bench held before 404s on every page
load. This bench had been carrying the sister card's bundle since it was
converted.

### The model fixtures

A preset in `src/configurations/xiaomi_miio/` is an agreement with an
integration rather than a card configuration: it reads
`sensor.{entity_id}_water_level`, `switch.{entity_id}_dry_mode`,
`select.{entity_id}_led_brightness` and a dozen more, building each id out of
the humidifier's own. None of those entities existed anywhere in this
repository, so three of the four presets had never rendered an indicator with a
value in any test.

Emulating the device is therefore not emulating Xiaomi. The card never talks to
`xiaomi_miio`: it talks to entity ids and to services in core domains, so
`bench_cb1` and its eight companions are ordinary MQTT entities that happen to
be named the way the integration names its own. The fixtures do copy the
integration where copying is free - the modes are `Silent`, `Medium`, `High`,
`Auto` with the real capitalisation, `deerma` has `Humidity` rather than
`auto`, the va2 fan carries the real 1-4 speed range - because a preset that
only works against lower-case modes is a preset that does not work.

Two things about fixture ids, both measured here rather than assumed, and both
able to waste an hour:

- **The `name` decides the entity id, not `object_id`.** A fixture with
  `"object_id": "bench_cb1_water_lvl"` and `"name": "Bench cb1 water level"`
  registers as `sensor.bench_cb1_water_level`. The two agree throughout the
  manifest, so the `object_id` fields document intent and decide nothing;
  renaming a fixture means renaming its `name`.
- **An id already handed out survives `forget`.** Home Assistant keeps deleted
  registry entries and gives the same entity id back to the same `unique_id`,
  so changing a fixture's name alone changes nothing on a bench that has run
  before. Change the `unique_id` with it.

Which is also why `models.test.mjs` opens by asserting that every fixture came
back as `<domain>.<its own key>`: the presets rest on that, and the `_2` Home
Assistant appends to the second device of a kind is what breaks it in the field
([#78], [#98]).

## What it found on the first run

[#263]. The manifest has a card pointed at `humidifier.bench_missing`, an
entity nobody created. The card rendered **nothing at all** - no `ha-card`, a
blank space on the dashboard - and threw `Cannot read properties of undefined
(reading 'isActive')` on every state update, with the message in the console
where a person looking at a blank space has no reason to look. The model was
built only when the entity existed, and every render path reads it.

Which is the whole argument for this directory: a missing entity is a state the
stand-ins cannot produce, because the fake `hass` in `test/browser/` is written
by the test that needs it.

## What the scenarios reach

```
npm run dev             # unminified, and the sourcemap the report maps through
npm run bench up
npm run bench:coverage  # runs the scenarios, then reports against src/
```

It answers one question - which parts of `src/` a browser driving a real
dashboard never reaches - and it is **a diagnostic, not a metric**: no
threshold, no badge, nothing fails on it.

It is also not comparable with `npm run test:coverage`. That number is the unit
layer, which excludes `src/components/**` because those only run in a browser;
this one is mostly about exactly those files. One percentage speaking for both
would be a number nobody could act on.

The unminified build is why it is a separate run: what ships is the minified
one, and that is what the scenarios normally exercise.

## Waiting for something to have happened

**Poll for the state; do not wait out a duration and read once.** `until()` in
`browser.mjs` takes a check and a `diagnose`, and everything that arrives
asynchronously - a press reaching an entity, a menu opening, a label appearing -
is read through it.

A fixed `waitForTimeout` in that position is a race with no symptom but an
occasional red run, and the cost is not the rerun: the failure lands on
whatever branch happens to be under it and reads as that branch breaking
something.

`diagnose` is the other half. `timed out: last value null` says nothing; the
entity's own state printed beside it says whether the press never arrived or
arrived and changed something else.

A fixed wait is still right in three places, and they are worth telling apart:

- **settling after a load** - the `waitForTimeout(1500)` in a `before` hook,
  after `waitForSelector`, where nothing is being asserted yet;
- **waiting for something to be over** - a dialog closing, a menu dismissed by
  Escape;
- **asserting that nothing happens** - a control that presses a reading with no
  `tap_action` and expects no dialog. There is no state to poll for; the wait
  is the measurement.

## Pointing it at an older Home Assistant

`BENCH_HA_VERSION` is the point of this directory, and this card has more
reason to use it than most: the slider it renders has been three different
elements, and `docs/index.md` claims 2022.11 and newer.

No matrix has been run here yet. When one is, the lesson from the sister card's
attempt is worth having first: **every leg of it failed before rendering
anything**, because `setupBroker` handed the MQTT config flow keys that arrived
when that flow was rewritten, and an older Home Assistant answers `extra keys
not allowed`. The payload is built from the step's own `data_schema` for that
reason - send what this version offers, skip what it does not - and anything
added there should be built the same way.

The other half of that lesson: most of what such a matrix turns up is about the
**scenarios**, not about the card. What an open dialog looks like, whether a
theme variable reaches `ha-card`, how the editor opens - all of it is Home
Assistant internals a scenario had to assume. Expect to triage version by
version rather than to read a table.

## What it is not

It is **not** where geometry is measured. `test/browser/` renders the card in
two engines in seconds, needs no container and gives the same numbers every
time; a scenario here costs a container boot and can only ever be flakier. What
belongs here is what a whole Home Assistant has to answer: the real elements,
the real dashboard, the real service call.

It is also not a replacement for a live installation. Real integrations, real
devices and real themes still live there.

## Four things that cost an afternoon

- **All four onboarding steps have to be closed**, not just the user: `user`,
  `core_config`, `analytics`, `integration`. While any is open the frontend
  redirects a browser to `/onboarding.html`, which from the outside looks
  exactly like a card that will not load.
- **A dashboard url has to contain a hyphen.** `bench` is rejected,
  `card-bench` is not.
- **Discovery does not decide an entity's id.** The entity registry remembers
  what it gave a `unique_id` the first time, and Home Assistant's rules for
  deriving an id from a device and a name have changed more than once. The
  bench reads the ids back out of the registry and substitutes them into the
  dashboard, so a manifest names fixtures by their own key
  (`{{bench_humidifier}}`).
- **The broker is set up through the config flow**, not by writing a config
  entry: MQTT has had no YAML for the connection since 2022. Its `broker` step
  has a section named `other_settings` whose two certificate keys are required
  even when nothing about them is being set.

[#78]: https://github.com/artem-sedykh/mini-humidifier/issues/78
[#98]: https://github.com/artem-sedykh/mini-humidifier/issues/98
[#263]: https://github.com/artem-sedykh/mini-humidifier/issues/263
[#275]: https://github.com/artem-sedykh/mini-humidifier/issues/275
