# Development

[Home](../README.md) | [Getting started](getting-started.md) | [Configuration](configuration.md) | [Models](models.md) | [Custom device](custom-device.md) | [Controls](controls.md) | [Indicators](indicators.md) | [Buttons](buttons.md) | [Examples](examples.md) | [AI assistants](ai-assistants.md) | [Development](development.md)

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
npm run build      # lint + typecheck + test + rollup + check:bundle
npm run lint       # eslint
npm run format     # prettier
npm run typecheck  # tsc --noEmit over src
npm test           # vitest, the unit tests under test/
npm run test:browser  # @web/test-runner, the component tests in Chromium
npm run check:bundle  # assertions on the built bundle
```

Both write `dist/mini-humidifier-bundle.js`. The unminified one works in the
browser exactly the same and is far easier to debug, at 264 KB against 89 KB.

After each build, reload the browser with the cache cleared or disabled. A
stale bundle looks exactly like a change that did nothing.

## Before opening a pull request

- `npm run build` and `npm run format:check` are clean. CI runs the same.
- `npm run test:browser` is clean. It needs a browser once:
  `npx playwright install chromium`. `npm run build` leaves this one out for
  that reason, so run it yourself when you have touched a component.
- The card was actually loaded in a running Home Assistant. The component tests
  render it against stand-ins for Home Assistant's elements, never the real
  ones, so this is still the only check on the part users see.
- Say which Home Assistant version you tested on. The card renders Home
  Assistant's own frontend elements, and they differ between releases - see
  [AGENTS.md](../AGENTS.md#home-assistant-compatibility).
