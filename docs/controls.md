# Controls

[Home](../README.md) | [Getting started](getting-started.md) | [Configuration](configuration.md) | [Models](models.md) | [Custom device](custom-device.md) | [Controls](controls.md) | [Indicators](indicators.md) | [Buttons](buttons.md) | [Examples](examples.md) | [AI assistants](ai-assistants.md) | [Development](development.md)

The parts of the card a user interacts with, plus the line of text under the
entity name.

## Target humidity

Options under `target_humidity:`.

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | string or object | `mdi:water` | A custom mdi icon, or an icon config object. |
| `icon: template` | function | | Icon retrieval function. |
| `icon: style` | function | | Function returning icon styles. |
| `hide` | boolean | `false` | Hide the target humidity control. |
| `hide_indicator` | boolean | `false` | Hide the value shown next to the slider. |
| `disabled` | boolean or function | from the model | Disable the slider. Falls back to the value in the configured [model](models.md), and then to the [default model](https://github.com/artem-sedykh/mini-humidifier/blob/master/src/configurations/xiaomi_miio/zhimi_humidifier_cb1.js#L28). |
| `unit` | string or object | `%` | Display unit, or a unit config object. |
| `unit: template` | function | | Function returning the unit, for a value whose unit depends on it. |
| `min` | number | from the model, then the entity | Minimum target humidity. When neither the configuration nor the model gives a number, the entity's `min_humidity` is used, and 0 when it reports none. |
| `max` | number | from the model, then the entity | Maximum target humidity. Falls back to the entity's `max_humidity` the same way, and to 100. |
| `step` | number | from the model | Slider step, 1 when nothing gives one. Not read from the entity. |
| `action_timeout` | number | `3500` | Milliseconds to wait before the card re-reads the entity state after a change. |
| `state` | object | | Where to read the current value from. |
| `state: entity` | string | current entity | Entity to read the value from. |
| `state: attribute` | string | from the model | Attribute to read the value from - `humidity` in most presets, `target_humidity` in some. |
| `change_action` | function | | Called when the user moves the slider. |

> Functions available for the target_humidity:  

| Name | Type | execution context | arguments | return type |
|------|------|-------------------|-----------|-------------|
|`state:mapper` | function | target_humidity config | current_value, entity, humidifier_entity  | any
|`change_action` | function | target_humidity config | value, current_value, entity, humidifier_entity  | promise
|`icon:template` | function | target_humidity config | current_value, entity, humidifier_entity | string
|`icon:style` | function | target_humidity config | current_value, entity, humidifier_entity | object
|`unit:template` | function | target_humidity config | current_value, entity, humidifier_entity | string

`current_value` - selected value  
`value` - target_humidity value  
`entity` - target_humidity entity  
`humidifier_entity` - humidifier entity  

**execution context methods:**  

| Name | arguments | description | return type |
|------|-----------|-------------|-------------|
|`toggle_state` | sate | toggle state, example: `this.toggle_state('on') => off`  | string
|`call_service` | domain, service, options, | call Home Assistant service | promise

> Configuration example for the target_humidity:  
```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
target_humidity:
  state:
    attribute: target_humidity
    mapper: (current_value, entity, humidifier_entity) => current_value
  icon:
    template: (current_value, entity, humidifier_entity) => 'mdi:tray-full'
    style: "(current_value, entity, humidifier_entity) => ({ color: 'red' })"
  unit: '%'
  hide: off
  min: 30
  max: 80
  step: 10
  change_action: >
    (value, current_value, entity, humidifier_entity) => {
      const options = { entity_id: entity.entity_id, humidity: value };
      return this.call_service('xiaomi_miio', 'fan_set_target_humidity', options);
    }
```

> The default configuration is configured for `zhimi.humidifier.cb1`,  
> to set target humidity, use the service `xiaomi_miio.fan_set_target_humidity`
> Example:

```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
target_humidity:
  icon: 'mdi:water'
  state:
    attribute: target_humidity
  unit: '%'
  min: 30
  max: 80
  step: 10
  change_action: >
    (selected, state, entity) => {
      const options = { entity_id: entity.entity_id, humidity: selected };
      return this.call_service('xiaomi_miio', 'fan_set_target_humidity', options);
    }
```
## Power button

Options under `power:`.

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `type` | string | `button` | `toggle` or `button`. |
| `icon` | string | `mdi:power` | Specify a custom icon from any of the available mdi icons. |
| `hide` | boolean | `false` | Hide the power button. |
| `action_timeout` | number | `3500` | Milliseconds to wait before the card re-reads the entity state after a change. |
| `disabled` | function | | Button disabled calculation function. |
| `style` | function | | Function returning custom styles. |
| `state` | object | | Where to read the button state from. |
| `state: entity` | string | current entity | Entity to read the state from. |
| `state: attribute` | string | | Attribute to read the state from. |
| `state: mapper` | function | | State value processing function. |
| `toggle_action` | function | | Called when the button is clicked. |

> Functions available for the power:  

| Name | Type | execution context | arguments | return type |
|------|------|-------------------|-----------|-------------|
|`state:mapper` | function | power config | state, entity, humidifier_entity | string
|`disabled` | function | power config | state, entity, humidifier_entity | boolean
|`style` | function | power config | state, entity, humidifier_entity | object
|`toggle_action` | function | power config | state, entity, humidifier_entity | promise

`state` - current power state  
`entity` - current power entity  
`humidifier_entity` - humidifier entity  

**execution context methods:**  

| Name | arguments | description | return type |
|------|-----------|-------------|-------------|
|`toggle_state` | sate | toggle state, example: `this.toggle_state('on') => off`  | string
|`call_service` | domain, service, options, | call Home Assistant service | promise

> The power button can be of two types: `button` or `toggle`, default type: `button`
> Attention, the following configuration attributes (icon, disabled, state:attribute, style, toggle_action) are not available for the toggle type,
> since a standard ha-entity-toggle is used, the state of which I do not control

> Configuration example for the power button type `toggle`:
  
```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
power:
  hide: off
state:
  mapper: (state, entity, humidifier_entity) => state
```

> Configuration example for the power button type `button`:
  
```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
power:
  icon: 'mdi:power'
  type: button
  state:
    mapper: (state, entity, humidifier_entity) => state
  hide: off
  disabled: (state, entity, humidifier_entity) => false
  style: "(state, entity, humidifier_entity) => ({ color: 'red' })"
  toggle_action: >
    (state, entity) => {
      const service = state === 'on' ? 'turn_off' : 'turn_on';
      return this.call_service('fan', service, { entity_id: entity.entity_id });
    }
```
> The default configuration is configured for `zhimi.humidifier.cb1`,  
> to on / off, use the service `fan.turn_on`, `fan.turn_off`
> Example:

 ```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
power:
  icon: 'mdi:power'
  type: button
  hide: off
  toggle_action: >
     (current_state, entity) => {
       const service = current_state === 'on' ? 'turn_off' : 'turn_on';
       return this.call_service('fan', service, { entity_id: entity.entity_id });
     }
 ```

## Toggle button

Options under `toggle:`.

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | string | `mdi:dots-horizontal` | Custom icon. |
| `hide` | boolean | `false` | Hide the button. |
| `default` | boolean | `off` | Whether the bottom panel starts open. |

> toggle button configuration

> For example, we want to always show control buttons, and toggle button hide:

```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
toggle:
  default: on
  hide: on
```

## Secondary info

Options under `secondary_info:`. A bare string is accepted as a shorthand for
`type:`.

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `type` | string | `mode` | `last-changed` or `mode`. |
| `icon` | string | | Icon, for type `mode`. |
| `hide` | boolean | `false` | Hide the secondary info line. |

```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
secondary_info: last-changed

type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
secondary_info: #default type mode, changing icon
  icon: 'mdi:fan'
```

## Group

> To display entities inside the container, set the group configuration parameter to `on`

```yaml
type: entities
title: Climate
show_header_toggle: true
state_color: true
entities:
  - entity: fan.xiaomi_miio_device
    type: custom:mini-humidifier
    group: on
```
