# Configuration

[Home](../README.md) | [Configuration](configuration.md) | [Models](models.md) | [Controls](controls.md) | [Indicators](indicators.md) | [Buttons](buttons.md) | [Examples](examples.md) | [Development](development.md)

Every option the card accepts. Start from the [quick start](../README.md#quick-start)
and add only what you need - everything below has a default.

## Card options
| Name | Type | Default | Since | Description |
|------|------|---------|-------|-------------|
| type | string | **required** | v1.0.1 | `custom:mini-humidifier`
| entity | string | **required** | v1.0.1 | An entity_id from an entity within the `fan` or `humidifier` domain.
| name | string | optional | v1.0.1 | Override the entities friendly name.
| icon | string | optional | v1.0.1 | Specify a custom icon from any of the available mdi icons.
| group | boolean | optional | v1.0.1 | Removes paddings, background color and box-shadow. [example](controls.md#group)
| **toggle** | object | optional | v2.0.1 | Toggle button.
| toggle: `icon` | string | optional | v2.0.1 | Custom icon, default value `mdi:dots-horizontal`
| toggle: `hide` | boolean | optional | v2.0.1 | Hide button, default value `False`
| toggle: `default` | boolean | optional | v2.0.1 | Default toggle button state, default value `off`, [example](controls.md#toggle-button).
| **secondary_info** | object | optional | v2.1.1 | secondary_info config. [secondary info examples](controls.md#secondary-info)
| secondary_info: `type` | string | optional | v2.1.1 | available types: `last-changed, mode`
| secondary_info: `icon` | string | optional | v2.1.1 | icon for type: `mode`
| secondary_info: `hide` | boolean | optional | v2.2.6 | Hide secondary info, default `False`
| **power** | object | optional | v2.0.1 | Power button, [example](controls.md#power-button).
| power: `type` | string | optional | v2.0.1 | `toggle` or `button`, default `button`
| power: `icon` | string | optional | v2.0.1 | Specify a custom icon from any of the available mdi icons, default `mdi:power`
| power: `hide` | boolean | optional | v2.0.1 | Hide power button, default value `False`
| power: `action_timeout` | number | optional | v2.1.1 | `ms` default value `3500`
| power: `disabled` | function | optional | v2.0.1 | button disabled calculation function, default unset
| power: `style` | function | optional | v2.0.1 | function for getting custom styles, default unset
| power: `state` | object | optional | v2.0.1 | config to get power button state.
| power: `state:entity` | string | optional | v2.0.1 | power button entity_id, default current entity
| power: `state:attribute` | string | optional | v2.0.1 | state value attribute default 'unset'
| power: `state:mapper` | function | optional | v2.0.1 | state value processing function, default `unset`
| power: `toggle_action` | function | optional | v2.0.1 | button click processing function
| **target_humidity** | object | optional | v2.0.1 | target humidity config, [example](controls.md#target-humidity).
| target_humidity: `icon` | string | optional | v1.0.1 | Custom icon, default value `mdi:water`
| target_humidity: `icon` | object | optional | v2.0.1 | icon config
| target_humidity: `icon:template` | function | optional | v2.0.1 | icon retrieval function
| target_humidity: `icon:style` | function | optional | v2.0.1 | function to get icon styles
| target_humidity: `hide` | boolean | optional | v1.0.1 | Hide target_humidity control, default value `False`
| target_humidity: `disabled` | boolean, function | optional | v2.5.3 | disable target_humidity slider, default value taken from the defined [model](models.md#adding-a-model) and if not set, from the default [model](https://github.com/artem-sedykh/mini-humidifier/blob/master/src/configurations/xiaomi_miio/zhimi_humidifier_cb1.js#L28)
| target_humidity: `hide_indicator` | boolean | optional | v2.2.1 | Hide indicator, default value `False`
| target_humidity: `unit` | string | optional | v1.0.1 | display unit, default `%`
| target_humidity: `min` | number | optional | v1.0.1 | minimum target humidity, default value `30`
| target_humidity: `max` | number | optional | v1.0.1 | maximum target humidity, default value `80`
| target_humidity: `action_timeout` | number | optional | v2.1.1 | `ms` default value `3500`
| target_humidity: `step` | number | optional | v1.0.1 | slider step, default value `10`
| target_humidity: `state` | object | optional | v2.0.1 | configuration to ge target_humidity value
| target_humidity: `state:entity` | object | optional | v2.0.1 | target_humidity entity_id, default current entity
| target_humidity: `state:attribute` | object | optional | v2.0.1 | default value `target_humidity`
| target_humidity: `change_action` | function | optional | v2.0.1 | target_humidity change function
| **indicators** | object | optional | v2.0.1 | any indicators, [examples](indicators.md).
| indicators: `name` | object | optional | v2.0.1 | the name of your indicator see [examples](indicators.md).
| indicators: `name:icon` | string | optional | v2.0.1 | Specify a custom icon from any of the available mdi icons.
| indicators: `name:icon` | object | optional | v2.0.1 | icon object
| indicators: `name:icon:template` | function | optional | v2.0.1 | icon template function
| indicators: `name:icon:style` | function | optional | v2.0.1 | styles
| indicators: `name:unit` | string | optional | v2.0.1 | display unit.
| indicators: `name:round` | number | optional | v2.0.1 | rounding number value.
| indicators: `name:hide` | boolean | optional | v2.0.1 | hide indicator, default `false`
| indicators: `name:tap_action` | [action object](#action-object-options) | true | v1.1.0 | Action on click/tap.
| indicators: `name:source` | object | optional | v2.0.1 | data source.
| indicators: `name:source:entity` | string | optional | v2.0.1 | indicator entity_id
| indicators: `name:source:attribute` | string | optional | v2.0.1 | entity attribute
| indicators: `name:source:mapper` | function | optional | v2.0.1 | value processing function
| **buttons** | object | optional | v2.0.1 | any buttons, [example](buttons.md).
| buttons: `name` | object | optional | v2.0.1 | the name of your button see examples
| buttons: `name:icon` | string | optional | v2.0.1 | Specify a custom icon from any of the available mdi icons.
| buttons: `name:type` | string | optional | v2.0.1 | `dropdown` or `button` default `button`
| buttons: `name:action_timeout` | number | optional | v2.1.1 | `ms` default value `3500`
| buttons: `name:order` | number | optional | v2.0.1 | sort order
| buttons: `name:state` | object | optional | v2.0.1 | config to get button state.
| buttons: `name:hide` | object | optional | v2.0.1 | hide button, default `false`
| buttons: `name:state:entity` | string | optional | v2.0.1 | button entity_id.
| buttons: `name:state:attribute` | string | optional | v2.0.1 | entity attribute
| buttons: `name:state:mapper` | function | optional | v2.0.1 | state processing function
| buttons: `name:disabled` | function | optional | v2.0.1 | calc disabled button
| buttons: `name:active` | function | optional | v2.0.1 | for type `dropdown`
| buttons: `name:source` | object | optional | v2.0.1 | for type `dropdown`
| buttons: `name:source:item` | string | optional | v2.0.1 | source item, format horizontal: horizontal
| buttons: `name:source:__filter` | function | optional | v2.0.1 | filter function
| buttons: `name:change_action` | function | optional | v2.0.1 | for type `dropdown`
| buttons: `name:toggle_action` | function | optional | v2.0.1 | for type `button`
| buttons: `name:style` | function | optional | v2.0.1 | styles
| scale | number | optional | v1.0.3 | UI scale modifier, default is `1`.
| model | string | optional | v2.1.1 | default configuration for a specific humidifier model, default value `zhimi.humidifier.cb1`
| tap_action | [action object](#action-object-options) | true | v1.0.4 | Action on click/tap, [examples](examples.md#action-object-options-examples).

## Action object options
| Name | Type | Default | Options | Description |
|------|:----:|:-------:|:-----------:|-------------|
| action | string | `more-info` | `more-info` / `navigate` / `call-service`  / `url` / `none` / `toggle` | Action to perform.
| entity | string |  | Any entity id | Override default entity of `more-info`, when  `action` is defined as `more-info`.
| service | string |  | Any service | Service to call (e.g. `fan.turn_on`) when `action` is defined as `call-service`
| service_data | object |  | Any service data | Service data to include with the service call (e.g. `entity_id: fan.xiaomi_miio_device`)
| navigation_path | string |  | Any path | Path to navigate to (e.g. `/lovelace/0/`) when `action` is defined as `navigate`.
| url | string |  | Any URL | URL to open when `action` is defined as `url`.

## Theme variables
The following variables are available and can be set in your theme to change the appearence of the card.
Can be specified by color name, hexadecimal, rgb, rgba, hsl, hsla, basically anything supported by CSS.

| name | Default | Description |
|------|---------|-------------|
| mini-humidifier-name-font-weight | 400 | Font weight of the entity name
| mini-humidifier-info-font-weight | 300 | Font weight of the states
| mini-humidifier-icon-color | --mini-humidifier-base-color, var(--paper-item-icon-color, #44739e) | The color for icons
| mini-humidifier-button-color |--mini-humidifier-button-color, var(--paper-item-icon-color, #44739e) | The color for buttons icons
| mini-humidifier-accent-color | var(--accent-color) | The accent color of UI elements
| mini-humidifier-base-color | var(--primary-text-color) & var(--paper-item-icon-color) | The color of base text
| mini-humidifier-background-opacity | 1 | Opacity of the background
| mini-humidifier-scale | 1 | Scale of the card
