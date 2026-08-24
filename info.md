[![Last Version](https://img.shields.io/github/package-json/v/artem-sedykh/mini-humidifier?label=release)](https://github.com/artem-sedykh/mini-humidifier/releases/latest)
[![HACS Default](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/hacs/default)

A minimalistic yet customizable humidifier card for the
[Home Assistant](https://github.com/home-assistant/home-assistant) Lovelace UI.
Works with any entity in the `fan` or `humidifier` domain, and ships defaults
for a number of Xiaomi humidifiers and air purifiers.

<p align="center">
  <img src="https://raw.githubusercontent.com/artem-sedykh/mini-humidifier/master/images/preview.png" />
</p>

Requires Home Assistant 2022.11 or newer.

After downloading, reload the browser and add the card to a dashboard:

```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
```

That is the whole minimum configuration - everything else has a default taken
from the model the card is configured for.

**Card options, supported models and examples are in the
[documentation](https://github.com/artem-sedykh/mini-humidifier#documentation).**
