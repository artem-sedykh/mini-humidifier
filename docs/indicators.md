# Indicators

[Home](../README.md) | [Getting started](getting-started.md) | [Configuration](configuration.md) | [Models](models.md) | [Custom device](custom-device.md) | [Controls](controls.md) | [Indicators](indicators.md) | [Buttons](buttons.md) | [Examples](examples.md) | [AI assistants](ai-assistants.md) | [Development](development.md)

Indicators are the read-only values shown under the entity name: temperature,
humidity, water tank level, and anything else you point them at.

Options under `indicators: <name>:`, where `<name>` is yours to choose.

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | string or object | | A custom mdi icon, or an icon config object. |
| `icon: template` | function | | Icon template function. |
| `icon: style` | function | | Function returning icon styles. |
| `value: style` | function | | Function returning styles for the reading and its unit. |
| `unit` | string or object | | Display unit, or a unit config object. |
| `unit: template` | function | | Function returning the unit, for a reading whose unit depends on its value. |
| `round` | number | | Number of decimals to round the value to. |
| `hide` | boolean | `false` | Hide the indicator. |
| `order` | number | its position | Sort order among the indicators, lowest first. |
| `tap_action` | [action object](configuration.md#action-object-options) | optional | Action on click/tap. |
| `source` | object | | Where to read the value from. |
| `source: entity` | string | current entity | Entity to read the value from. |
| `source: attribute` | string | | Attribute to read the value from. |
| `source: mapper` | function | | Value processing function. |

The defaults for `zhimi.humidifier.cb1` set up three of them - depth,
temperature and humidity - see [Default indicators](#default-indicators).

Adding a simple indicator:
```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
indicators:
  test:
    icon: mdi:water
    unit: '%'
    round: 1
    source:
      entity: sensor.humidity
```
## Indicator functions

> Consider configuring an indicator using javascript
> Functions available for the indicator:  

| Name | Type | execution context | arguments | return type |
|------|------|-------------------|-----------|-------------|
|`source:mapper` | function | indicator config | value, entity, humidifier_entity | any
|`icon:template` | function | indicator config | value, entity, humidifier_entity | string
|`icon:style` | function | indicator config | value, entity, humidifier_entity | object
|`unit:template` | function | indicator config | value, entity, humidifier_entity | string

`value` - current indicator value  
`entity` - indicator entity  
`humidifier_entity` - humidifier entity

## Source mapper

> Using the mapper function, you can change the indicator value:
> For zhimi.humidifier.cb1, a maximum depth value of 125 is used, which is 4 liters of tank,
> let's get how much water is left in liters or in percent
```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
indicators:
  depth:
    icon: 'mdi:tray-full'
    unit: '%'
    round: 0
    # variable used in mapper
    max_value: 125
    # variable used in mapper
    volume: 4
    # variable used in mapper
    type: 'percent'
    source:
      attribute: depth
      mapper: >
        (val) => {
          const value = (100 * (val || 0)) / this.max_value;
          return this.type === 'liters' ? (value * this.volume) / 100 : value;
        }
```

## Icon template, style

> The indicator icon can be calculated dynamically
  for example:
```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
indicators:
  depth:
    icon:
      template: >
        (value) => {
          if (value === 0)
            return 'mdi:tray';

          if (value <= 20)
            return 'mdi:tray-minus';

          return 'mdi:tray-full';
        }
      style: >
        (value) => {
          if (value === 0)
            return { color: 'red' };

          if (value <= 20)
            return { color: '#FD451D' };

          return {};
        }
    unit: '%'
    round: 0
    # variable used in mapper
    max_value: 125
    # variable used in mapper
    volume: 4
    # variable used in mapper
    type: 'liters'
    source:
      attribute: depth
      mapper: >
        (val) => {
          const value = (100 * (val || 0)) / this.max_value;
          return this.type === 'liters' ? (value * this.volume) / 100 : value;
        }
```

## Default indicators

> The plugin is configured by default for zhimi.humidifier.cb1 and 3 default indicators are available in it temperature, humidity, depth
> Their configuration looks like this:

```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
indicators:
  depth:
    icon: 'mdi:tray-full'
    unit: '%'
    round: 0
    order: 0
    max_value: 125
    volume: 4
    type: 'percent'
    source:
      attribute: depth
      mapper: >
        (val) => {
          const value = (100 * (val || 0)) / this.max_value;
          return this.type === 'liters' ? (value * this.volume) / 100 : value;
        }
  temperature:
    icon: 'mdi:thermometer-low'
    unit: '°C'
    round: 1
    order: 1
    source:
      attribute: temperature
  humidity:
    icon: 'mdi:water'
    unit: '%'
    round: 1
    order: 2
    source:
      attribute: humidity
```

> You can override the default indicators or even hide them and add your own
> We will display the depth value in liters and change the humidity icon as well as hide the temperature:

```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
indicators:
  depth:
    unit: 'L'
    type: 'liters'
  humidity:
    icon: 'mdi:water-outline'
  temperature:
    hide: on
```

## Colouring the reading

`icon: style` colours the icon; `value: style` colours the number and the unit
after it. They are separate on purpose - an icon style is often geometry as well
as colour - and both are handed the same three arguments: the reading, the
entity it came from, and the humidifier.

The bundled `zhimi.airpurifier.ma2` colours an AQI dot from a table of levels.
Any key you write beside a template is readable from it as `this.`, so the same
table can colour the number as well:

```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
indicators:
  aqi:
    levels:
      - { max: 50, color: '#1CC09B' }
      - { max: 100, color: '#FFDE33' }
      - { max: 150, color: '#F88B48' }
      - { max: 100000, color: '#E64650' }
    unit: 'µg/m³'
    round: 0
    source:
      entity: sensor.{entity_id}_pm2_5
    value:
      style: |
        (value) => {
          const level = this.levels.find(l => Number(value) <= l.max);
          return level ? { color: level.color } : {};
        }
```

A style function that returns nothing leaves the reading as it was, and one
that throws is reported in the browser console by name, with the card rendering
as if it had not been written.
