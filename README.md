# Mini Humidifier Card

[![Last Version](https://img.shields.io/github/package-json/v/artem-sedykh/mini-humidifier?label=release)](https://github.com/artem-sedykh/mini-humidifier/releases/latest)
[![HACS Default](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/hacs/default)
[![CI](https://github.com/artem-sedykh/mini-humidifier/actions/workflows/ci.yml/badge.svg)](https://github.com/artem-sedykh/mini-humidifier/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/artem-sedykh/mini-humidifier/blob/master/LICENSE)

A minimalistic yet customizable humidifier card for the
[Home Assistant](https://github.com/home-assistant/home-assistant) Lovelace UI.

<p align="center">
  <img src="https://raw.githubusercontent.com/artem-sedykh/mini-humidifier/master/images/preview.png" />
</p>

Please star this repository if you find it useful.

## Compatibility

| | |
|---|---|
| Home Assistant | 2022.11 or newer |
| Entity domain | `fan` or `humidifier` |

The card is developed against the current Home Assistant release and tested on
[zhimi.humidifier.cb1](https://www.home-assistant.io/integrations/xiaomi_miio).
It renders Home Assistant's own frontend elements, and those change between
releases: Home Assistant 2025.10 replaced the slider the card uses, which broke
the layout of the target-humidity row. Version 3.1.6 and newer detect which
slider they are running against and lay out correctly on either side of that
line, so there is one build for every supported version.

## Install

### HACS

The card is in the HACS default repositories.

1. Open **HACS** in Home Assistant.
2. Search for **mini humidifier** and download it.
3. HACS adds the dashboard resource for you. Reload the browser afterwards.

### Manual

1. Download `mini-humidifier-bundle.js` from the
   [latest release](https://github.com/artem-sedykh/mini-humidifier/releases/latest)
   and put it in your `config/www` directory.
2. Register it as a dashboard resource.

   On a dashboard in storage mode (the default), go to
   **Settings -> Dashboards -> three-dot menu -> Resources -> Add resource**,
   URL `/local/mini-humidifier-bundle.js`, type **JavaScript Module**.

   On a dashboard in YAML mode, add it to your Lovelace configuration instead:

   ```yaml
   resources:
     - url: /local/mini-humidifier-bundle.js?v=3.1.5
       type: module
   ```

   The `?v=` part is only there to defeat the browser cache. Bump it whenever
   you replace the file.

3. Reload the browser.

## Updating

Through HACS, updates arrive like any other HACS update.

Manually: replace `config/www/mini-humidifier-bundle.js` with the file from the
[latest release](https://github.com/artem-sedykh/mini-humidifier/releases/latest),
bump the `?v=` query string if you use one, and reload the browser. Clearing the
browser cache is often necessary, because the frontend caches resources hard.

## Quick start

```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
```

That is the whole minimum configuration. Everything else has a default, taken
from the [model](https://github.com/artem-sedykh/mini-humidifier/blob/master/docs/models.md) the card is configured for.

A slightly fuller example:

```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
name: Bedroom
model: 'zhimi.humidifier.cb1'
secondary_info: last-changed
```

## Documentation

| | |
|---|---|
| [Configuration](https://github.com/artem-sedykh/mini-humidifier/blob/master/docs/configuration.md) | Every card option, the action object, theme variables |
| [Models](https://github.com/artem-sedykh/mini-humidifier/blob/master/docs/models.md) | Supported devices, and how to add one |
| [Controls](https://github.com/artem-sedykh/mini-humidifier/blob/master/docs/controls.md) | Target humidity, power button, toggle button, secondary info, group |
| [Indicators](https://github.com/artem-sedykh/mini-humidifier/blob/master/docs/indicators.md) | The read-only values under the entity name |
| [Buttons](https://github.com/artem-sedykh/mini-humidifier/blob/master/docs/buttons.md) | The bottom panel: buttons and dropdowns |
| [Examples](https://github.com/artem-sedykh/mini-humidifier/blob/master/docs/examples.md) | `tap_action` snippets |
| [Development](https://github.com/artem-sedykh/mini-humidifier/blob/master/docs/development.md) | Building the card locally |

Contributing: [CONTRIBUTING.md](https://github.com/artem-sedykh/mini-humidifier/blob/master/CONTRIBUTING.md). Agents working on this
repository should read [AGENTS.md](https://github.com/artem-sedykh/mini-humidifier/blob/master/AGENTS.md).

## Supported models

`model:` selects a set of defaults. Devices exposed by Home Assistant's own
`xiaomi_miio` integration are named by their model id; the same devices through
syssi's [xiaomi_miio_airpurifier](https://github.com/syssi/xiaomi_airpurifier)
carry an `xiaomi_miio_airpurifier:` prefix, because the attributes and services
differ.

| `xiaomi_miio` | `xiaomi_miio_airpurifier` |
|---|---|
| `zhimi.humidifier.cb1` (default) | `xiaomi_miio_airpurifier:zhimi.humidifier.cb1` |
| `zhimi.humidifier.ca1` | `xiaomi_miio_airpurifier:zhimi.humidifier.ca4` |
| `zhimi.humidifier.ca4` | `xiaomi_miio_airpurifier:deerma.humidifier.mjjsq` |
| `zhimi.airpurifier.ma2` | `xiaomi_miio_airpurifier:zhimi.airpurifier.mb3` |
| `zhimi.airfresh.va2` | `xiaomi_miio_airpurifier:zhimi.airfresh.va2` |
| `deerma.humidifier.jsq` | `xiaomi_miio_airpurifier:deerma.humidifier.jsq5` |
| `deerma.humidifier.jsq1` | |
| `deerma.humidifier.mjjsq` | |

A device that is not listed still works: the card falls back to the
`zhimi.humidifier.cb1` defaults, and everything can be overridden in YAML. See
[Models](https://github.com/artem-sedykh/mini-humidifier/blob/master/docs/models.md) for how to contribute a new one.

## Troubleshooting

**"Custom element doesn't exist: mini-humidifier"** - the resource is not
loaded. Check that the URL in the dashboard resources actually resolves in the
browser, and that its type is `module`.

**The card looks wrong after an update** - the browser is serving the old
bundle. Hard-reload, clear the cache, and bump the `?v=` query string if you
installed manually.

**A HACS update changed nothing, every time** - check where your dashboard
resources live. When HACS manages them, which is the default, it rewrites the
resource URL on every update with a version-derived `?hacstag=`, and the new
file is picked up by itself. If you keep `resources:` in YAML
(`lovelace: resource_mode: yaml`), HACS leaves them alone entirely - it logs
`YAML mode detected, can not update resources` and stops - so the URL never
changes and the browser keeps serving what it cached a month ago. In that
setup, bumping `?v=` yourself after every HACS update is not optional.

**An option does nothing** - check the `model:` value. An unrecognised model is
not an error; the card silently falls back to the default one, and the defaults
it brings may not match your device.

Still stuck? Open an [issue](https://github.com/artem-sedykh/mini-humidifier/issues)
with your card YAML and the entity's attributes from **Developer tools ->
States**.

## Inspiration

- [@kalkih](https://github.com/kalkih) - [mini-media-player](https://github.com/kalkih/mini-media-player)

## License

MIT. See [LICENSE](https://github.com/artem-sedykh/mini-humidifier/blob/master/LICENSE).
