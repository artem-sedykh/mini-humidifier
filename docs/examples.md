# Examples

[Home](../README.md) | [Configuration](configuration.md) | [Models](models.md) | [Custom device](custom-device.md) | [Controls](controls.md) | [Indicators](indicators.md) | [Buttons](buttons.md) | [Examples](examples.md) | [Development](development.md)

Complete cards to copy, then the `tap_action` snippets.

## A card with no options

```yaml
type: custom:mini-humidifier
entity: humidifier.bedroom
```

The default preset (`zhimi.humidifier.cb1`) fills in the rest: a name, the
target-humidity slider, and indicators for water level, temperature, humidity
and motor speed.

![The default card](images/default.png)

## A generic humidifier

```yaml
type: custom:mini-humidifier
entity: humidifier.bedroom
model: humidifier
```

For a device in the `humidifier` domain that is not a Xiaomi. The domain preset
reads what Home Assistant guarantees for that domain - `humidity`,
`current_humidity`, `available_modes` - and calls `humidifier.*` services, so
an MQTT humidifier or a dehumidifier on a smart switch works as it is.

![A generic humidifier](images/model-humidifier.png)

## Custom name, secondary info and indicators

```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
name: Bedroom
secondary_info:
  icon: mdi:fan
indicators:
  humidity:
    icon: mdi:water
    unit: '%'
    round: 0
    source:
      attribute: current_humidity
  temperature:
    icon: mdi:thermometer-low
    unit: '°C'
    round: 1
    source:
      attribute: temperature
  water_level:
    icon: mdi:tray-full
    unit: '%'
    round: 0
    source:
      attribute: depth
      mapper: (val) => Math.round(val)
```

`name` overrides the entity name, `secondary_info` puts a line under it, and
`indicators` replaces the read-only values. The `mapper` is a function that
runs on the value you read - here it just rounds; the ones bundled models ship
convert between liters and percent, or colour the reading, as in
[Indicators](indicators.md).

![Custom name, secondary info and indicators](images/custom-indicators.png)

## Action object examples

The snippets below are for the `tap_action` object, and the same shape works
for an indicator's `tap_action`.

```yaml
# call-service example
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
tap_action:
  action: call-service
  service: xiaomi_miio.fan_set_led_brightness
  service_data:
    brightness: 1

# navigate example
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
tap_action:
  action: navigate
  navigation_path: '/lovelace/4'

# url example
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
tap_action:
  action: url
  url: 'https://www.google.com/'

# none example - the shorthand for {action: none}
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
tap_action: none

# more-info for a custom entity example
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
tap_action:
  action: more-info
  entity: sensor.humidity
```

Any action that needs nothing but its name can be written as a bare string:
`tap_action: none` and `tap_action: more-info` mean the same as
`tap_action: {action: none}` and `tap_action: {action: more-info}`.
