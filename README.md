# Mini Humidifier Card

[![Last Version](https://img.shields.io/github/package-json/v/artem-sedykh/mini-humidifier?label.svg=release)](https://github.com/artem-sedykh/mini-humidifier/releases/latest)
[![Build Status](https://travis-ci.com/artem-sedykh/mini-humidifier.svg?branch=master)](https://travis-ci.com/artem-sedykh/mini-humidifier)
[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/artem-sedykh/mini-humidifier)
[![buymeacoffee_badge](https://img.shields.io/badge/Donate-buymeacoffe-ff813f?style=flat)](https://www.buymeacoffee.com/anavrin72)

> Attention! The config version *v1.0.8* **very differs** from version >= *v2.0.1*

Tested on [zhimi.humidifier.cb1](https://www.home-assistant.io/integrations/fan.xiaomi_miio/)

A minimalistic yet customizable humidifier card for [Home Assistant](https://github.com/home-assistant/home-assistant) Lovelace UI.

Inspired by [mini media player](https://github.com/kalkih/mini-media-player).

![Preview Image](https://user-images.githubusercontent.com/861063/83651482-3171c700-a5c2-11ea-8053-f66472a8d539.png)

## Install

*This card is available in [HACS](https://github.com/custom-components/hacs) (Home Assistant Community Store)*

### Simple install

1. Download and copy `mini-humidifier-bundle.js` from the [latest release](https://github.com/artem-sedykh/mini-humidifier/releases/latest) into your `config/www` directory.

2. Add a reference to `mini-humidifier-bundle.js` inside your `ui-lovelace.yaml`.

  ```yaml
  resources:
    - url: /local/mini-humidifier-bundle.js?v=2.0.1
      type: module
  ```

### CLI install

1. Move into your `config/www` directory

2. Grab `mini-humidifier-bundle.js`

  ```console
  $ wget https://github.com/artem-sedykh/mini-humidifier/releases/download/v2.0.1/mini-humidifier-bundle.js
  ```

3. Add a reference to `mini-humidifier-bundle.js` inside your `ui-lovelace.yaml`.

  ```yaml
  resources:
    - url: /local/mini-humidifier-bundle.js?v=2.0.1
      type: module
  ```

## Updating
1. Find your `mini-humidifier-bundle.js` file in `config/www` or wherever you ended up storing it.

2. Replace the local file with the latest one attached in the [latest release](https://github.com/artem-sedykh/mini-humidifier/releases/latest).

3. Add the new version number to the end of the cards reference url in your `ui-lovelace.yaml` like below.

  ```yaml
  resources:
    - url: /local/mini-humidifier-bundle.js?v=2.0.1
      type: module
  ```

*You may need to empty the browsers cache if you have problems loading the updated card.*

## Using the card

### Options

#### Card options
| Name | Type | Default | Since | Description |
|------|------|---------|-------|-------------|
| type | string | **required** | v1.0.1 | `custom:mini-humidifier`
| entity | string | **required** | v1.0.1 | An entity_id from an entity within the `fan` domain.
| name | string | optional | v1.0.1 | Override the entities friendly name.
| icon | string | optional | v1.0.1 | Specify a custom icon from any of the available mdi icons.
| group | boolean | optional | v1.0.1 | Removes paddings, background color and box-shadow. [example](#group)
| **toggle** | object | optional | v2.0.1 | Toggle button.
| toggle: `icon` | string | optional | v2.0.1 | Custom icon, default value `mdi:dots-horizontal`
| toggle: `hide` | boolean | optional | v2.0.1 | Hide button, default value `False`
| toggle: `default` | boolean | optional | v2.0.1 | Default toggle button state, default value `off`, [example](#toggle-button).
| **power** | object | optional | v2.0.1 | Power button, [example](#power-button).
| power: `type` | string | optional | v2.0.1 | `toggle` or `button`, default `button`
| power: `icon` | string | optional | v2.0.1 | Specify a custom icon from any of the available mdi icons, default `mdi:power`
| power: `hide` | boolean | optional | v2.0.1 | Hide power button, default value `False`
| power: `disabled` | function | optional | v2.0.1 | button disabled calculation function, default unset
| power: `style` | function | optional | v2.0.1 | function for getting custom styles, default unset
| power: `state` | object | optional | v2.0.1 | config to get power button state.
| power: `state:entity` | string | optional | v2.0.1 | power button entity_id, default current entity
| power: `state:attribute` | string | optional | v2.0.1 | state value attribute default 'unset'
| power: `state:mapper` | function | optional | v2.0.1 | state value processing function, default `unset`
| power: `toggle_action` | function | optional | v2.0.1 | button click processing function
| **target_humidity** | object | optional | v2.0.1 | target humidity config, [example](#target-humidity).
| target_humidity: `icon` | string | optional | v1.0.1 | Custom icon, default value `mdi:water`
| target_humidity: `icon` | object | optional | v2.0.1 | icon config
| target_humidity: `icon:template` | function | optional | v2.0.1 | icon retrieval function
| target_humidity: `icon:style` | function | optional | v2.0.1 | function to get icon styles
| target_humidity: `hide` | boolean | optional | v1.0.1 | Hide indicator, default value `False`
| target_humidity: `unit` | string | optional | v1.0.1 | display unit, default `%`
| target_humidity: `min` | number | optional | v1.0.1 | minimum target humidity, default value `30`
| target_humidity: `max` | number | optional | v1.0.1 | maximum target humidity, default value `80`
| target_humidity: `step` | number | optional | v1.0.1 | slider step, default value `10`
| target_humidity: `state` | object | optional | v2.0.1 | configuration to ge target_humidity value
| target_humidity: `state:entity` | object | optional | v2.0.1 | target_humidity entity_id, default current entity
| target_humidity: `state:attribute` | object | optional | v2.0.1 | default value `target_humidity`
| target_humidity: `change_action` | function | optional | v2.0.1 | target_humidity change function
| **indicators** | object | optional | v2.0.1 | any indicators, [examples](#indicators).
| indicators: `name` | object | optional | v2.0.1 | the name of your indicator see [examples](#indicators).
| indicators: `name:icon` | string | optional | v2.0.1 | Specify a custom icon from any of the available mdi icons.
| indicators: `name:icon` | object | optional | v2.0.1 | icon object
| indicators: `name:icon:template` | function | optional | v2.0.1 | icon template function
| indicators: `name:icon:style` | function | optional | v2.0.1 | styles
| indicators: `name:unit` | string | optional | v2.0.1 | display unit.
| indicators: `name:round` | number | optional | v2.0.1 | rounding number value.
| indicators: `name:source` | number | optional | v2.0.1 | data source.
| indicators: `name:source:entity` | string | optional | v2.0.1 | indicator entity_id
| indicators: `name:source:attribute` | string | optional | v2.0.1 | entity attribute
| indicators: `name:source:mapper` | function | optional | v2.0.1 | value processing function
| **buttons** | object | optional | v2.0.1 | any buttons, [example](#buttons).
| buttons: `name` | object | optional | v2.0.1 | the name of your button see examples
| buttons: `name:icon` | string | optional | v2.0.1 | Specify a custom icon from any of the available mdi icons.
| buttons: `name:type` | string | optional | v2.0.1 | `dropdown` or `button` default `bitton`
| buttons: `name:order` | number | optional | v2.0.1 | sort order
| buttons: `name:state` | object | optional | v2.0.1 | config to get button state.
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
| tap_action | [action object](#action-object-options) | true | v1.0.4 | Action on click/tap, [examples](#action-object-options-examples).

#### Action object options
| Name | Type | Default | Options | Description |
|------|:----:|:-------:|:-----------:|-------------|
| action | string | `more-info` | `more-info` / `navigate` / `call-service`  / `url` / `none` / `toggle` | Action to perform.
| entity | string |  | Any entity id | Override default entity of `more-info`, when  `action` is defined as `more-info`.
| service | string |  | Any service | Service to call (e.g. `fan.turn_on`) when `action` is defined as `call-service`
| service_data | object |  | Any service data | Service data to include with the service call (e.g. `entity_id: fan.xiaomi_miio_device`)
| navigation_path | string |  | Any path | Path to navigate to (e.g. `/lovelace/0/`) when `action` is defined as `navigate`.
| url | string |  | Any URL | URL to open when `action` is defined as `url`.

### Theme variables
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


#### target humidity

> Functions available for the target_humidity:  

| Name | Type | execution context | arguments | return type |
|------|------|-------------------|-----------|-------------|
|`state:mapper` | function | target_humidity config | current_value, entity, humidifier_entity  | any
|`change_action` | function | target_humidity config | value, current_value, entity, humidifier_entity  | promise
|`icon:template` | function | target_humidity config | current_value, entity, humidifier_entity | string
|`icon:style` | function | target_humidity config | current_value, entity, humidifier_entity | object

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
- type: custom:mini-humidifier
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


## Development
*If you plan to contribute back to this repo, please fork & create the PR against the [dev](https://github.com/artem-sedykh/mini-humidifier/tree/dev) branch.*

**Clone this repository into your `config/www` folder using git.**

 ```console
$ git clone https://github.com/artem-sedykh/mini-humidifier.git
```

**Add a reference to the card in your `ui-lovelace.yaml`.**

```yaml
resources:
  - url: /local/mini-humidifier/dist/mini-humidifier-bundle.js
    type: module
```

### Instructions

*Requires `nodejs` & `npm`*

1. Move into the `mini-humidifier` repo, checkout the *dev* branch & install dependencies.
```console
$ cd mini-humidifier-dev && git checkout dev && npm install
```

2. Make changes to the source

3. Build the source by running
```console
$ npm run build
```

4. Refresh the browser to see changes

    *Make sure cache is cleared or disabled*

5. *(Optional)* Watch the source and automatically rebuild on save
```console
$ npm run watch
```

*The new `mini-humidifier-bundle.js` will be build and ready inside `/dist`.*


## Getting errors?
Make sure you have `javascript_version: latest` in your `configuration.yaml` under `frontend:`.

Make sure you have the latest version of `mini-humidifier-bundle.js`.

If you have issues after updating the card, try clearing your browsers cache or restart Home Assistant.

If you are getting "Custom element doesn't exist: mini-humidifier" or running older browsers try replacing `type: module` with `type: js` in your resource reference, like below.

```yaml
resources:
  - url: ...
    type: js
```

## Inspiration
- [@kalkih](https://github.com/kalkih) - [mini-media-player](https://github.com/kalkih/mini-media-player)

## License
This project is under the MIT license.
