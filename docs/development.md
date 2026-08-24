# Development

[Home](../README.md) | [Configuration](configuration.md) | [Models](models.md) | [Controls](controls.md) | [Indicators](indicators.md) | [Buttons](buttons.md) | [Examples](examples.md) | [Development](development.md)

Pull requests go against `master`. The `dev` and `typescript` branches are
historical and have not moved since 2020.

## Requirements

Node.js, at the version in [.nvmrc](../.nvmrc). Nothing else.

## Setup

Clone the repository into the Home Assistant `config/www` directory, so the
build output can be served straight to the browser without copying files
around:

```console
git clone https://github.com/artem-sedykh/mini-humidifier.git
cd mini-humidifier
npm ci
```

Register the built bundle as a dashboard resource, with the URL pointing into
the clone:

```yaml
resources:
  - url: /local/mini-humidifier/dist/mini-humidifier-bundle.js
    type: module
```

On a dashboard in storage mode, add the same URL through
**Settings -> Dashboards -> three-dot menu -> Resources** instead.

## Build

```console
npm run dev        # bundle unminified - readable output, what you want while working
npm run watch      # the same, rebuilding on save
npm run rollup     # bundle minified, what a release ships
npm run build      # lint + rollup
npm run lint       # eslint
npm run format     # prettier
```

Both write `dist/mini-humidifier-bundle.js`. The unminified one works in the
browser exactly the same and is far easier to debug, at 541 KB against 206 KB.

After each build, reload the browser with the cache cleared or disabled. A
stale bundle looks exactly like a change that did nothing.

## Before opening a pull request

- `npm run lint` and `npm run format` are clean. CI runs both.
- The card was actually loaded in a running Home Assistant. There is no test
  suite, so this is the only real check.
- Say which Home Assistant version you tested on. The card renders Home
  Assistant's own frontend elements, and they differ between releases - see
  [AGENTS.md](../AGENTS.md#home-assistant-compatibility).
