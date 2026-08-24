# Indicators

[Home](../README.md) | [Configuration](configuration.md) | [Models](models.md) | [Controls](controls.md) | [Indicators](indicators.md) | [Buttons](buttons.md) | [Examples](examples.md) | [Development](development.md)

Indicators are the read-only values shown under the entity name: temperature,
humidity, water tank level, and anything else you point them at.

> The indicators display additional information on the card, for example, you can display humidity, depth, temperature, etc.  
> The default configuration for `zhimi.humidifier.cb1`  uses three indicators depth, temperature, humidity.
> [zhimi.humidifier.cb1 indicators](#default-indicators)

> Adding a simple indicator:
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

## default-indicators

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
