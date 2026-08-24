# Models

[Home](../README.md) | [Configuration](configuration.md) | [Models](models.md) | [Controls](controls.md) | [Indicators](indicators.md) | [Buttons](buttons.md) | [Examples](examples.md) | [Development](development.md)

The card ships defaults for a number of devices. `model:` picks which set of
defaults the card starts from; anything you set in YAML is merged over them.

## Available default configurations

Each entry is the value to put in `model:`. The source file for every one of
them lives in
[src/configurations](https://github.com/artem-sedykh/mini-humidifier/tree/master/src/configurations).

Devices exposed by Home Assistant's own
[xiaomi_miio](https://www.home-assistant.io/integrations/xiaomi_miio)
integration:

| `model:` | |
|---|---|
| `zhimi.humidifier.cb1` | the default, used for any unrecognised model |
| `zhimi.humidifier.ca1` | |
| `zhimi.humidifier.ca4` | |
| `zhimi.airpurifier.ma2` | |
| `zhimi.airfresh.va2` | |
| `deerma.humidifier.jsq` | |
| `deerma.humidifier.jsq1` | |
| `deerma.humidifier.mjjsq` | |

The same devices through syssi's third-party
[xiaomi_miio_airpurifier](https://github.com/syssi/xiaomi_airpurifier)
integration, which reports different attributes and calls different services:

| `model:` | |
|---|---|
| `xiaomi_miio_airpurifier:zhimi.humidifier.cb1` | |
| `xiaomi_miio_airpurifier:zhimi.humidifier.ca4` | by @ravikwow |
| `xiaomi_miio_airpurifier:zhimi.airpurifier.mb3` | by @regevbr |
| `xiaomi_miio_airpurifier:zhimi.airfresh.va2` | |
| `xiaomi_miio_airpurifier:deerma.humidifier.mjjsq` | |
| `xiaomi_miio_airpurifier:deerma.humidifier.jsq5` | by @akovovh |

An unrecognised `model:` is not an error. The card falls back to
`zhimi.humidifier.cb1`, so a typo produces a card that renders but brings the
wrong defaults.

## Adding a model

1. Copy the closest existing file in `src/configurations/<integration>/` and
   adjust it. [zhimi_humidifier_cb1.js](https://github.com/artem-sedykh/mini-humidifier/blob/master/src/configurations/xiaomi_miio/zhimi_humidifier_cb1.js)
   is the reference.
2. Register it in
   [src/humidifiers.js](https://github.com/artem-sedykh/mini-humidifier/blob/master/src/humidifiers.js).
3. Make sure `change_action` and `toggle_action` call services that exist in
   the integration you filed the model under. A configuration copied from
   another integration renders correctly and does nothing when clicked.
4. Add the model to the tables above.
5. Open a pull request. If you cannot write the file, open an issue with the
   entity's attributes from **Developer tools -> States** instead.

> Using the default configuration for a specific model

```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
# zhimi.humidifier.cb1 default value may be omitted, added for example.
model: 'zhimi.humidifier.cb1'
```

[deerma.humidifier.mjjsq](https://github.com/artem-sedykh/mini-humidifier/blob/master/src/configurations/xiaomi_miio_airpurifier/deerma_humidifier_mjjsq.js)
```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
model: 'xiaomi_miio_airpurifier:deerma.humidifier.mjjsq'
```
> localize status indicator
```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
model: 'deerma.humidifier.mjjsq'
indicators:
  status:
    empty: пустой
    filled: полный
```
