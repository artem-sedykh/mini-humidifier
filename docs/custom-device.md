# A device with no preset

[Home](../README.md) | [Configuration](configuration.md) | [Models](models.md) | [Custom device](custom-device.md) | [Controls](controls.md) | [Indicators](indicators.md) | [Buttons](buttons.md) | [Examples](examples.md) | [Development](development.md)

The card ships defaults for fourteen devices. The market has hundreds, so
configuring one the card has never heard of is the normal path rather than a
workaround, and this page walks it end to end: what to read off the device
first, which base to start from, and how to write the parts the base does not
cover.

It is also the page to hand an AI assistant that is helping with a card. The
assistant does not need to know your humidifier - it needs the language the
card speaks, and that language is [the contract](#the-contract) at the bottom.

The worked example is real: a Levoit Classic 300S through the
[VeSync](https://www.home-assistant.io/integrations/vesync/) integration, from
[issue #124](https://github.com/artem-sedykh/mini-humidifier/issues/124),
including the mistake it was opened for.

## 1. Read the entity before writing any YAML

Everything the card can show comes out of the entity, so open **Developer tools
-> States**, find the entity, and read what is actually there rather than what
the integration's page says it should be. A `humidifier` entity looks roughly
like this, and the names are what matter - your values will differ:

```yaml
humidifier.classic300s:
  state: 'on'
  attributes:
    min_humidity: 30
    max_humidity: 80
    humidity: 60            # the target, what the slider sets
    current_humidity: 52    # the reading, what the indicator shows
    mode: auto
    available_modes: [auto, sleep, manual]
```

Two things are worth writing down before moving on: **which attribute holds the
target** and **which holds the reading**. They are `humidity` and
`current_humidity` for the domain, but a device exposed as `fan` by an
integration of its own puts them wherever it likes, and every mismatch further
down starts here.

Then open **Settings -> Devices & services**, find the device, and look at the
list of entities beside it. An integration rarely creates one: this one adds a
night light and a reading of its own.

| Entity | What it is |
|---|---|
| `humidifier.classic300s` | the humidifier: on/off, target, modes |
| `sensor.classic300s_current_humidity` | the room reading, as a sensor |
| `light.classic300s_night_light` | the night light, dimmable |

Those three lines are the whole input. Everything below is decided by them.

## 2. Pick the base

`model:` says which set of defaults your YAML is merged over. There are four
answers and they are not interchangeable:

| Your device | `model:` | What you get |
|---|---|---|
| a `humidifier` entity | `humidifier` | power, target humidity, the reading, modes - built on the domain |
| close to a bundled device | that device's id | its controls, to adjust rather than write |
| you are describing everything yourself | `none` | nothing at all |
| you want your device named in the config | your own string | the **default** Xiaomi set, and a console warning |

The Classic 300S is a `humidifier` entity, so `model: humidifier` - and that
already covers power, the target slider, the modes dropdown from
`available_modes`, and a humidity reading from `current_humidity`.

**The slider range is the reason this choice matters more than it looks.**
`min`, `max` and `step` are read from the configuration first and from the
entity's `min_humidity` / `max_humidity` only when the configuration is silent.
The default Xiaomi preset is not silent - it says 30, 80 and 10 - so a card that
falls back to it gets that range whatever the device reports. `humidifier` and
`none` say nothing on purpose, so the device's own range wins.

Leaving `model:` out is the same as naming a device the card does not ship for:
both land on the default Xiaomi preset, whose buttons call `xiaomi_miio`
services. That is supported and sometimes what you want - see
[Models](models.md#naming-a-device-the-card-does-not-ship-for) - but it is
rarely the right base for a device from another integration.

## 3. Add what the base does not cover

A preset covers what its foundation guarantees. Everything else - a night
light, a buzzer, a filter reading, a humidity sensor that lives outside the
humidifier - is written on top, and there are only two shapes to write.

**A reading is an indicator.** `source: entity` points it at any entity in the
installation; leave it out and it reads the card's own.

```yaml
indicators:
  humidity:
    icon: mdi:water
    unit: '%'
    round: 0
    source:
      entity: sensor.classic300s_current_humidity
```

**Anything you press is a button**, and `state: entity` is what points it
somewhere other than the humidifier. That entity is also the one the button's
templates are handed as their `entity` argument, which is what makes
`toggle_action` short:

```yaml
buttons:
  night_light:
    icon: mdi:lightbulb-night
    type: dropdown
    order: 2
    state:
      entity: light.classic300s_night_light
      attribute: brightness
    source:
      '0': 'Off'
      '128': 'Dim'
      '255': 'Bright'
    active: (state) => Number(state) > 0
    change_action: |
      (selected, state, entity) => {
        const options = { entity_id: entity.entity_id, brightness: Number(selected) };
        return this.call_service('light', 'turn_on', options);
      }
```

A plain `switch` needs less than that: a button with no `toggle_action` calls
`switch.toggle` on its own entity, so `state: entity` alone is a working
switch button.

### The mistake this example was opened for

Issue #124 wrote `entity_id: light.classic300s_night_light` at the top of the
button, and the dropdown drove the humidifier instead of the light. Nothing
warned, and here is why: **a key the card does not read inside a button or an
indicator is left alone on purpose**. It becomes part of the template scope -
readable from the templates as `this.entity_id` - which is how the bundled
presets carry their own values. So the button looked configured, and was not.

The option that points a control at another entity is `state: entity` for a
button and `source: entity` for an indicator. There is no third spelling.

## 4. The finished card

```yaml
type: custom:mini-humidifier
entity: humidifier.classic300s
model: humidifier
name: Bedroom
indicators:
  humidity:
    icon: mdi:water
    unit: '%'
    round: 0
    source:
      entity: sensor.classic300s_current_humidity
buttons:
  night_light:
    icon: mdi:lightbulb-night
    type: dropdown
    order: 2
    state:
      entity: light.classic300s_night_light
      attribute: brightness
    source:
      '0': 'Off'
      '128': 'Dim'
      '255': 'Bright'
    active: (state) => Number(state) > 0
    change_action: |
      (selected, state, entity) => {
        const options = { entity_id: entity.entity_id, brightness: Number(selected) };
        return this.call_service('light', 'turn_on', options);
      }
```

Power, the slider with the device's own 30-80 range, and the modes dropdown are
not in there because `model: humidifier` brings them.

Check the `brightness` values your own integration reports rather than copying
these: VeSync reports a plain 0-255 for some models and a small step count for
others, and a dropdown whose ids do not match what the entity holds shows no
selection.

## 5. Read the console once

Open the browser console after the card renders. This is where the card says
what it could not do, because a message thrown from a card configuration never
reaches the screen - Home Assistant draws a red rectangle and drops the text.
The card therefore warns and renders instead of failing, and the console is the
only place any of it appears:

| What you see | What it means |
|---|---|
| `... is not one of the bundled model configurations` | the `model:` you wrote is not in the registry, so the card started from the default Xiaomi set |
| `'x' is not an option this card reads` | a top-level key the card ignores, sometimes with the option you meant |
| `... reads sensor.x, which does not exist` | an entity id that resolves to nothing - the control is left out |
| `... threw TypeError ...` | one of your templates failed, and the card rendered as if that option had not been written |
| `... is 'x', which the card does not handle` | a `tap_action` name that is not one of the five |

An empty console and a card that still looks wrong means the configuration
arrived intact and the values are not what you expected - go back to
**Developer tools -> States**.

## The contract

The rest of the documentation lists options page by page. This is the part that
does not fit in a table: what those options are made of.

### Where a value comes from

Indicators read through `source`, buttons and the two single controls read
through `state`. Both are the same three keys:

| Key | Default | What it does |
|---|---|---|
| `entity` | the card's entity | which entity to read |
| `attribute` | the entity's `state` | which attribute to read |
| `mapper` | | a template that turns the raw value into what is shown |

`{entity_id}` in an `entity` is replaced with the object id of the card's own
entity: on a card for `humidifier.bedroom`, `switch.{entity_id}_heater` resolves
to `switch.bedroom_heater`. That is how the bundled presets reach the entities
their integrations create, and it is available to your YAML for the same reason.
Home Assistant appends `_2` to the second device of a kind, which is enough to
break the match - the card names any entity it cannot find in the console rather
than leaving the control silently missing.

### Where a dropdown's items come from

A `dropdown` button offers what its own `source` block holds, and there are two
ways to fill it:

- **Written out**, as `value: label` pairs. Use it when the values are fixed:
  the three brightness levels of a night light are not going to change.
- **Built from the entity**, with `source: __init` - a template handed the
  button's entity, answering a list of `{ id, name }`. Use it when the device
  decides: `available_modes` is a different list on every humidifier, and the
  domain preset's modes dropdown is exactly this.

```yaml
buttons:
  mode:
    type: dropdown
    state:
      attribute: mode
    source:
      __init: |
        (entity) =>
          (entity.attributes.available_modes || []).map(mode => ({ id: mode, name: mode }))
    change_action: |
      (selected, state, entity) => {
        const options = { entity_id: entity.entity_id, mode: selected };
        return this.call_service('humidifier', 'set_mode', options);
      }
```

`|| []` rather than `entity.attributes.available_modes.map(...)`, because a
device that reports no modes at all is normal - a generic_hygrostat has none.
`source: __filter` is the other half of the same idea: it post-processes the
list, whichever way it was built, which is how the bundled presets translate
their labels.

An item's `id` is matched against the button's state to decide which one is
selected, so ids that do not appear in the state show as no selection at all.

### What a template is

Every option documented as a function is a template, and a template is **source
text**, not a closure. The card takes the text of what you wrote, re-parses it
with `new Function`, and calls the result with a `this` of its own. Three
consequences, all of them things people try:

- **Nothing from outside is in scope.** No imports, no variables from elsewhere
  in the dashboard, no `hass`. What the template gets is its arguments and
  `this`.
- **`this` is the block the template is written in**, so every key you write
  beside it is readable: `max_value: 125` next to a mapper is `this.max_value`
  inside it. This is the extension point that makes the presets short, and the
  reason unknown keys inside a control are never reported as typos.
- **A template that throws when it runs does not break the card.** It is
  wrapped: the console gets the option's path and the error, once, and the card
  renders as if that option had not been written. A template that does not
  *parse* is the exception - see [what the card refuses](#what-the-card-refuses). Before the wrapper, a throw inside a render left
  that control in the tree with an empty shadow root - a slider that vanished
  with no message anywhere ([#70](https://github.com/artem-sedykh/mini-humidifier/issues/70)).

`this` also carries the methods the templates need:

| Method | What it does |
|---|---|
| `this.call_service(domain, service, options)` | calls a Home Assistant service, returns a promise |
| `this.toggle_state(state)` | `'on'` to `'off'` and back, leaving unavailable states alone |
| `this.localize(key, fallback)` | this card's own translations, for a preset that ships them |
| `this.entity_config` | the card's whole raw configuration, for a template that has to look at it |

`call_service` is on buttons, the power button and the target humidity slider -
the controls that act. An indicator gets the other three: it is read-only by
construction.

### Which options are not templates

Worth knowing before writing one that never runs:

- **`hide`** is a boolean. A control that should come and go with the device is
  written as `disabled` instead, which is a template - that is why the domain
  preset disables its modes dropdown rather than hiding it.
- **`min`, `max` and `step`** are numbers, read from the configuration and
  otherwise from the entity's `min_humidity` / `max_humidity`.
- **`order`** is a number. Written as a string, the sort is a string sort and
  `'10'` comes before `'9'`; the card warns about this one.
- **`type`, `icon` as a plain string, `unit` as a plain string** are values. Both
  `icon` and `unit` also take an object with a `template` inside, which is the
  templated form.

### Where `model` is allowed to be unknown

Anywhere. `model:` naming something the registry does not have starts the card
from the default configuration and warns in the console - it is not an error,
and it will not become one.
[Issue #112](https://github.com/artem-sedykh/mini-humidifier/issues/112) is a
complete configuration for a `deerma.humidifier.jsq2w` written by a user and
copied since; refusing unknown ids would break it and every card copied from it.
Naming your device is how a configuration stays readable to whoever opens it
next, and how a preset eventually gets contributed back.

### What the card refuses

Two things, and only two. Both stop the card from rendering at all, which on a
dashboard means a red rectangle with no text in it - the message is in the
console:

- **an `entity` outside the `fan` and `humidifier` domains.** A card with
  nothing to read has nothing to render either.
- **a template that does not parse.** The compile step is where the text you
  wrote becomes a function, and a missing brace has no value to fall back to.
  This is the one case where a mistake inside a template is fatal rather than
  reported: a template that parses and then throws when it runs is caught, named
  in the console, and skipped.

Everything else warns and renders.

## When it works, send it back

A configuration that drives a device the card has no preset for is a preset
waiting to happen, and three of the fourteen bundled models arrived exactly that
way. [Adding a model](models.md#adding-a-model) is the short version: one file
in `src/configurations/`, one line in the registry. If you would rather not write
the file, open an issue with the YAML that works and the entity's attributes -
that is the hard half, and it is already done by the time a card works.
