# Buttons

[Home](../README.md) | [Configuration](configuration.md) | [Models](models.md) | [Controls](controls.md) | [Indicators](indicators.md) | [Buttons](buttons.md) | [Examples](examples.md) | [Development](development.md)

Buttons live in the bottom panel of the card. Two types are supported:
`button` and `dropdown`.

Options under `buttons: <name>:`, where `<name>` is yours to choose.

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | string | | Specify a custom icon from any of the available mdi icons. |
| `type` | string | `button` | `button` or `dropdown`. |
| `order` | number | its position | Sort order among the buttons, lowest first. |
| `hide` | boolean | `false` | Hide the button. |
| `action_timeout` | number | `3500` | Milliseconds to wait before the card re-reads the entity state after a change. |
| `state` | object | | Where to read the button state from. |
| `state: entity` | string | current entity | Entity to read the state from. |
| `state: attribute` | string | | Attribute to read the state from. |
| `state: mapper` | function | | State processing function. |
| `disabled` | function | | Button disabled calculation function. |
| `style` | function | | Function returning custom styles. |
| `active` | function | | For type `dropdown`: whether the dropdown counts as active. |
| `source` | object | | For type `dropdown`: the items to offer. |
| `source: item` | string | | A dropdown item, in the form `value: label`. |
| `source: __filter` | function | | Filter function for the items. |
| `change_action` | function | | For type `dropdown`: called when an item is selected. |
| `toggle_action` | function | | For type `button`: called when the button is clicked. |

## Buttons functions

| Name | Type | execution context | arguments | return type |
|------|------|-------------------|-----------|-------------|
|`state:mapper` | function | button config | state, entity, humidifier_entity | any
|`source:__filter` | function | button config | state, entity, humidifier_entity | object({ id..., name... }) array
|`active` | function | button config | state, entity, humidifier_entity | boolean
|`disabled` | function | button config | state, entity, humidifier_entity | boolean
|`style` | function | button config | state, entity, humidifier_entity | object
|`toggle_action` | function | button config | state, entity, humidifier_entity | promise
|`change_action` | function | button config | selected, state, entity, humidifier_entity | promise

`state` - current button state value  
`entity` - button entity  
`humidifier_entity` - humidifier entity  
`source` - dropdown source object array: [ { id: 'id', name: 'name' }, ... ]  
`selected` -  selected dropdown value  

**execution context methods:**  

| Name | arguments | description | return type |
|------|-----------|-------------|-------------|
|`toggle_state` | sate | toggle state, example: `this.toggle_state('on') => off`  | string
|`call_service` | domain, service, options, | call Home Assistant service | promise

## Default buttons

> The following buttons are added to the default configuration: dry, mode, led, buzzer, child_lock
> These buttons are configured for zhimi.humidifier.cb1
> It looks like this:

```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
buttons:
  dry:
    icon: 'mdi:weather-sunny'
    order: 0
    state:
      attribute: dry
      # the dry attribute is of type boolean, for the button the state should be on/off/closed/locked/unavailable/unknown
      mapper: "(state) => (state ? 'on' : 'off')"
      # service is used xiaomi_miio.fan_set_dry_on or xiaomi_miio.fan_set_dry_off
    toggle_action: >
        (state, entity) => {
          const service = state === 'on' ? 'fan_set_dry_off' : 'fan_set_dry_on';
          const options = { entity_id: entity.entity_id };
          return this.call_service('xiaomi_miio', service, options);
        }
  # dropdown example
  mode:
    icon: 'mdi:fan'
    order: 1
    type: dropdown
    state:
      attribute: mode
    source:
      auto: auto
      silent: silent
      medium: medium
      high: high
    # The button will light up when the humidifier is on.
    active: "(state, entity) => (entity.state !== 'off')"
    # the button will be locked when depth is 0
    # zhimi.humidifier.cb1 does not allow changing the mode when there is no water
    disabled: "(state, entity) => (entity.attributes.depth === 0)"
    # using service: fan.set_speed
    change_action: >
      (selected, state, entity) => {
        const options = { entity_id: entity.entity_id, speed: selected };
        return this.call_service('fan', 'set_speed', options);
      }
  led:
    icon: mdi:lightbulb-on-outline
    order: 2
    type: dropdown
    state:
      attribute: led_brightness
    source:
      0: Bright
      1: Dim
      2: Off
    # button is active while any state except 2 is selected
    active: "state => (state !== 2 && state !== '2')"
    # using service: xiaomi_miio.fan_set_led_brightness
    change_action: >
      (selected, state, entity) => {
        const options = { entity_id: entity.entity_id, brightness: selected };
        return this.call_service('xiaomi_miio', 'fan_set_led_brightness', options);
      }
  buzzer:
    icon: 'mdi:bell-outline'
    order: 3
    state:
      attribute: buzzer
      mapper: "(state) => (state ? 'on' : 'off')"
      # using service: xiaomi_miio.fan_set_buzzer_on and xiaomi_miio.fan_set_buzzer_off
    toggle_action: >
        (state, entity) => {
          const service = state === 'on' ? 'fan_set_buzzer_off' : 'fan_set_buzzer_on';
          const options = { entity_id: entity.entity_id };
          return this.call_service('xiaomi_miio', service, options);
        }
  child_lock:
    icon: 'mdi:lock'
    order: 4
    state:
      attribute: child_lock
      mapper: "(state) => (state ? 'on' : 'off')"
      # using service: xiaomi_miio.fan_set_child_lock_on and xiaomi_miio.fan_set_child_lock_off
    toggle_action: >
        (state, entity) => {
          const service = state === 'on' ? 'fan_set_child_lock_off' : 'fan_set_child_lock_on';
          const options = { entity_id: entity.entity_id };
          return this.call_service('xiaomi_miio', service, options);
        }
```

> You can override the default buttons or even hide them and add your own
> Let's add translations for the mode and led buttons and hide the child_lock button

```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
buttons:
  mode:
    source:
      auto: Авто
      silent: Тихий
      medium: Средний
      high: Высокий
  led:
    source:
      0: Ярко
      1: Тускло
      2: Выкл
  child_lock:
    hide: on
```

> For some models of humidifiers, there are only two button backlight modes,
> let's change our drop-down list to a button for an example.
> it can be done in different ways, consider a few:

> 1. override current led button

```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
buttons:
  led:
    type: 'button'
    on_states: [0, 1]
    off_value: 2
    on_value: 1
    state:
      attribute: led_brightness
      mapper: "(value) => (this.on_states.includes(value) ? 'on' : 'off')"
    toggle_action: >
        (state, entity) => {
          const value = state === 'on' ? this.off_value : this.on_value;
          const options = { entity_id: entity.entity_id, brightness: value };
          return this.call_service('xiaomi_miio', 'fan_set_led_brightness', options);
        }
```

> 2. Hide led button and add new

```yaml
type: custom:mini-humidifier
entity: fan.xiaomi_miio_device
buttons:
  led:
    hide: on
  new_led:
    icon: 'mdi:lightbulb-on-outline'
    type: 'button'
    order: 2
    on_states: [0, 1]
    off_value: 2
    on_value: 1
    state:
      attribute: led_brightness
      mapper: "(value) => (this.on_states.includes(value) ? 'on' : 'off')"
    toggle_action: >
      (state, entity) => {
        const value = state === 'on' ? this.off_value : this.on_value;
        const options = { entity_id: entity.entity_id, brightness: value };
        return this.call_service('xiaomi_miio', 'fan_set_led_brightness', options);
      }
```
