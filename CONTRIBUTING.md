# Contributing

Thanks for taking the time. This is a small repository, so the process is
short.

Everything here is in **English**: code, comments, commit messages, issues and
pull requests.

## Reporting something

Use the [issue templates](https://github.com/artem-sedykh/mini-humidifier/issues/new/choose).
They ask for two things that are easy to leave out and impossible to work
without:

- **Your Home Assistant version.** The card renders Home Assistant's own
  frontend elements, and those change between releases. Home Assistant 2025.10
  replaced the slider this card is built on; a layout report without a version
  cannot be placed.
- **The entity's state and attributes**, from **Developer tools -> States**.
  Almost every "this option does nothing" turns out to be a device that reports
  different attributes than the configured model expects.

## Asking for a new device

Open a [device support issue](https://github.com/artem-sedykh/mini-humidifier/issues/new/choose)
with the entity attributes and the services the integration offers. That is
enough to write the configuration.

Better still, write it yourself - it is one file of defaults, no framework
knowledge needed. See [Adding a model](docs/models.md#adding-a-model).

## Changing the code

Pull requests go against `master`. The `dev` and `typescript` branches are
historical and have not moved since 2020.

```console
git clone https://github.com/artem-sedykh/mini-humidifier.git
cd mini-humidifier
npm ci
npm run rollup
```

[docs/development.md](docs/development.md) has the rest: where to put the
built bundle so Home Assistant serves it, and how to iterate.

A few things worth knowing before you start, all of them in
[AGENTS.md](AGENTS.md):

- **The tests stop at Home Assistant's own elements.** `npm test` covers the
  pure logic, `npm run check:bundle` covers the build output, and
  `npm run test:browser` renders the card in Chromium - but against stand-ins
  for `ha-card`, `ha-slider` and the rest, because those exist only inside a
  running frontend and are where this card has broken before. Please load your
  change into a running Home Assistant, say which version you tested on, and be
  plain about what you could not check.
- The elements the card renders belong to the Home Assistant frontend and are
  not a stable API. Feature-detect them rather than branching on a version
  string.
- Model configurations are evaluated with `this` bound to the card, through a
  rollup `moduleContext` setting. That is deliberate, not a bug to fix.
- Prettier is configured with `embeddedLanguageFormatting: off`, because it
  otherwise rewrites the markup inside lit templates. Please leave it off.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
without a scope: `fix:`, `feat:`, `ci:`, `build:`, `docs:`.

CI runs lint, formatting, the unit tests, the component tests in Chromium, the
build, assertions on the built bundle, HACS validation, and a gate that catches
CRLF and BOM. `npm run format:check && npm run build` locally covers most of it
- `build` already chains lint, tests, the bundle and its checks. The component
tests are the one part it leaves out, because they need a browser installed:
`npx playwright install chromium`, then `npm run test:browser`.

## Releasing

Maintainers only. Bump `version` in `package.json`, add
`release_notes/v<version>.md`, tag `v<version>` and push the tag. The release
workflow refuses to publish if the tag and `package.json` disagree, or if the
notes are missing.
