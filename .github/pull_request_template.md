## What this changes

<!-- One or two sentences. Link the issue if there is one. -->

## How it was verified

<!--
The tests cover the pure logic and the built bundle. Nothing opens a browser,
so this is still the part that matters.

Which Home Assistant version did you load the card on, and which device? The
card renders Home Assistant's own frontend elements and they change between
releases, so "it works here" is only meaningful with a version next to it.
-->

- Home Assistant version:
- Device / model:

## Checklist

- [ ] `npm run build` and `npm run format:check` pass (lint, tests, bundle checks)
- [ ] The card was loaded in a running Home Assistant, not only built
- [ ] Documentation in `docs/` updated, if this changes or adds an option
- [ ] A new model is registered in `src/humidifiers.js` and listed in `docs/models.md`
