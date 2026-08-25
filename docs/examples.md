# Examples

[Home](../README.md) | [Configuration](configuration.md) | [Models](models.md) | [Custom device](custom-device.md) | [Controls](controls.md) | [Indicators](indicators.md) | [Buttons](buttons.md) | [Examples](examples.md) | [Development](development.md)

Ready-made snippets for the `tap_action` object.

## Action object options examples

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

# navigate example
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
tap_action:
  action: url
  url: 'https://www.google.com/'

# none example - the shorthand for {action: none}
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
tap_action: none

# more-info for custom entity example
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
tap_action:
  action: more-info
  entity: sensor.humidity
```
