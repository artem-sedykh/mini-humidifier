# Mini Humidifier

[![](https://img.shields.io/github/release/artem-sedykh/mini-humidifier.svg?style=flat-square)](https://github.com/artem-sedykh/mini-humidifier/releases/latest)
[![Build Status](https://travis-ci.com/artem-sedykh/mini-humidifier.svg?branch=master)](https://travis-ci.com/artem-sedykh/mini-humidifier)

Tested on [zhimi.humidifier.cb1](https://www.home-assistant.io/integrations/fan.xiaomi_miio/)

A minimalistic yet customizable humidifier card for [Home Assistant](https://github.com/home-assistant/home-assistant) Lovelace UI.

Inspired by [mini media player](https://github.com/kalkih/mini-media-player).

![Preview Image](https://user-images.githubusercontent.com/861063/79474272-dc2c2700-800e-11ea-8cf8-3facde2b3442.png)

## Install

*This card is available in [HACS](https://github.com/custom-components/hacs) (Home Assistant Community Store)*

### Simple install

1. Download and copy `mini-humidifier-bundle.js` from the [latest release](https://github.com/artem-sedykh/mini-humidifier/releases/latest) into your `config/www` directory.

2. Add a reference to `mini-humidifier-bundle.js` inside your `ui-lovelace.yaml`.

  ```yaml
  resources:
    - url: /local/mini-humidifier-bundle.js?v=1.0.2
      type: module
  ```

### CLI install

1. Move into your `config/www` directory

2. Grab `mini-humidifier-bundle.js`

  ```console
  $ wget https://github.com/artem-sedykh/mini-humidifier/releases/download/v1.0.1/mini-humidifier-bundle.js
  ```

3. Add a reference to `mini-humidifier-bundle.js` inside your `ui-lovelace.yaml`.

  ```yaml
  resources:
    - url: /local/mini-humidifier-bundle.js?v=1.0.2
      type: module
  ```

## Updating
1. Find your `mini-humidifier-bundle.js` file in `config/www` or wherever you ended up storing it.

2. Replace the local file with the latest one attached in the [latest release](https://github.com/artem-sedykh/mini-humidifier/releases/latest).

3. Add the new version number to the end of the cards reference url in your `ui-lovelace.yaml` like below.

  ```yaml
  resources:
    - url: /local/mini-humidifier-bundle.js?v=1.0.2
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
| group | boolean | optional | v1.0.1 | Removes paddings, background color and box-shadow.
| **power_button** | object | optional | v1.0.3 | Power button
| power_button: `type` | string | optional | v1.0.3 | `toggle` or `button`, default `mdi:power`
| power_button: `icon` | string | optional | v1.0.3 | Custom icon for type `buttom`, default value `mdi:fan`
| power_button: `hide` | boolean | optional | v1.0.3 | Hide button, default value `False`
| **dry_button** | object | optional | v1.0.1 | Dry mode on/off button
| dry_button: `icon` | string | optional | v1.0.1 | Custom icon, default value `mdi:weather-sunny`
| dry_button: `hide` | boolean | optional | v1.0.1 | Hide button, default value `False`
| dry_button: `order` | number | optional | v1.0.1 | Sort order, default value `0`
| **fan_mode_button** | object | optional | v1.0.1 | Dry mode on/off button
| fan_mode_button: `icon` | string | optional | v1.0.1 | Custom icon, default value `mdi:fan`
| fan_mode_button: `hide` | boolean | optional | v1.0.1 | Hide button, default value `False`
| fan_mode_button: `order` | number | optional | v1.0.1 | Sort order, default value `1`
| fan_mode_button: `source` | object | optional | v1.0.1 | Source for fan mode drop down list.
| fan_mode_button: `source: auto` | string | optional | v1.0.1 | Title for auto mode, default: `Auto`
| fan_mode_button: `source: silent` | string | optional | v1.0.1 | Title for silent mode, default: `Silent`
| fan_mode_button: `source: medium` | string | optional | v1.0.1 | Title for medium mode, default: `Medium`
| fan_mode_button: `source: high` | string | optional | v1.0.1 | Title for high mode, default: `High`
| **led_button** | object | optional | v1.0.1 | Button Illumination on/off
| led_button: `icon` | string | optional | v1.0.1 | Custom icon, default value `mdi:lightbulb-on-outline`
| led_button: `hide` | boolean | optional | v1.0.1 | Hide button, default value `False`
| led_button: `order` | number | optional | v1.0.1 | Sort order, default value `2`
| led_button: `type` | string | optional | v1.0.2 | Render type, available values `button or dropdown` default value `button`
| led_button: `source` | object | optional | v1.0.2 | Source for dropdown button type, supported values are 0 (Bright), 1 (Dim), 2 (Off).
| led_button: `source:bright` | object | optional | v1.0.2 | 0 (Bright)
| led_button: `source:bright:value` | number | optional | v1.0.2 | Bright value, default `0`
| led_button: `source:bright:name` | number | optional | v1.0.2 | name, default `Bright`
| led_button: `source:bright:order` | number | optional | v1.0.2 | Sort order, default `0`
| led_button: `source:dim` | object | optional | v1.0.2 | 0 (Dim)
| led_button: `source:dim:value` | number | optional | v1.0.2 | Dim value, default `1`
| led_button: `source:dim:name` | number | optional | v1.0.2 | name, default `Dim`
| led_button: `source:dim:order` | number | optional | v1.0.2 | Sort order, default `1`
| led_button: `source:'off'` | object | optional | v1.0.2 | 0 (Off), the key must be written in quotation marks, without them the parameter will be false
| led_button: `source:'off':value` | number | optional | v1.0.2 | Off value, default `2`
| led_button: `source:'off':name` | number | optional | v1.0.2 | name, default `Off`
| led_button: `source:'off':order` | number | optional | v1.0.2 | Sort order, default `2`
| **buzzer_button** | object | optional | v1.0.1 | Buzzer on/off
| buzzer_button: `icon` | string | optional | v1.0.1 | Custom icon, default value `mdi:bell-outline`
| buzzer_button: `hide` | boolean | optional | v1.0.1 | Hide button, default value `False`
| buzzer_button: `order` | number | optional | v1.0.1 | Sort order, default value `3`
| **child_lock_button** | object | optional | v1.0.1 | Child lock on/off
| child_lock_button: `icon` | string | optional | v1.0.1 | Custom icon, default value `mdi:lock`
| child_lock_button: `hide` | boolean | optional | v1.0.1 | Hide button, default value `False`
| child_lock_button: `order` | number | optional | v1.0.1 | Sort order, default value `4`
| **toggle_button** | object | optional | v1.0.1 | Toggle button.
| toggle_button: `icon` | string | optional | v1.0.1 | Custom icon, default value `mdi:dots-horizontal`
| toggle_button: `hide` | boolean | optional | v1.0.1 | Hide button, default value `False`
| **depth** | object | optional | v1.0.1 | Information indicator, showing how much water is left in the humidifier
| depth: `icon` | string | optional | v1.0.1 | Custom icon, default value `mdi:beaker-outline`
| depth: `hide` | boolean | optional | v1.0.1 | Hide indicator, default value `False`
| depth: `order` | number | optional | v1.0.1 | Indicator sort order, default value `0`
| depth: `unit_type` | string | optional | v1.0.1 | Indicator type available Values: `liters` or `percent`, default `percent`
| depth: `unit` | string | optional | v1.0.1 | display unit, default `%`
| depth: `max_value` | number | optional | v1.0.1 | Depth attribute value with a full tank of humidifier, default `120`
| depth: `volume` | number | optional | v1.0.1 | Humidifier tank volume, needed to calculate values in liters, default `4` liters
| depth: `fixed` | number | optional | v1.0.1 | Rounding the calculated values, default value `0`
| **temperature** | object | optional | v1.0.1 | Information indicator, showing temperature
| temperature: `icon` | string | optional | v1.0.1 | Custom icon, default value `mdi:thermometer-low`
| temperature: `hide` | boolean | optional | v1.0.1 | Hide indicator, default value `False`
| temperature: `order` | number | optional | v1.0.1 | Indicator sort order, default value `1`
| temperature: `unit` | string | optional | v1.0.1 | display unit, default `°C`
| **humidity** | object | optional | v1.0.1 | Information indicator, showing humidity
| humidity: `icon` | string | optional | v1.0.1 | Custom icon, default value `mdi:water-outline`
| humidity: `hide` | boolean | optional | v1.0.1 | Hide indicator, default value `False`
| humidity: `order` | number | optional | v1.0.1 | Indicator sort order, default value `2`
| humidity: `unit` | string | optional | v1.0.1 | display unit, default `%`
| **target_humidity** | object | optional | v1.0.1 | Target humidity
| target_humidity: `icon` | string | optional | v1.0.1 | Custom icon, default value `mdi:water-outline`
| target_humidity: `hide` | boolean | optional | v1.0.1 | Hide indicator, default value `False`
| target_humidity: `unit` | string | optional | v1.0.1 | display unit, default `%`
| target_humidity: `min` | number | optional | v1.0.1 | minimum target humidity, default value `30` [see](https://www.home-assistant.io/integrations/fan.xiaomi_miio/)
| target_humidity: `max` | number | optional | v1.0.1 | maximum target humidity, default value `80` [see](https://www.home-assistant.io/integrations/fan.xiaomi_miio/)
| target_humidity: `step` | number | optional | v1.0.1 | slider step, default value `10`
| scale | number | optional | v1.0.3 | UI scale modifier, default is 1.

### Theme variables
The following variables are available and can be set in your theme to change the appearence of the card.
Can be specified by color name, hexadecimal, rgb, rgba, hsl, hsla, basically anything supported by CSS.

| name | Default | Description |
|------|---------|-------------|
| mini-humidifier-name-font-weight | 400 | Font weight of the entity name
| mini-humidifier-info-font-weight | 300 | Font weight of the states
| mini-humidifier-icon-color | --mini-humidifier-base-color, var(--paper-item-icon-color, #44739e) | The color for icons
| mini-humidifier-button-color | #44739e | The color for buttons icons
| mini-humidifier-accent-color | var(--accent-color) | The accent color of UI elements
| mini-humidifier-base-color | var(--primary-text-color) & var(--paper-item-icon-color) | The color of base text
| mini-humidifier-background-opacity | 1 | Opacity of the background
| mini-humidifier-scale | 1 | Scale of the card


### Example usage

#### Basic card
<img src="https://user-images.githubusercontent.com/861063/79479945-27960380-8016-11ea-8110-5460566feb0b.png" width="500px" alt="Basic card example" />  

```yaml
- type: custom:mini-humidifier
  entity: fan.xiaomi_miio_device
```

#### Entity card
For use Entities card you need to add `group: on`

<img src="https://user-images.githubusercontent.com/861063/79480184-75127080-8016-11ea-8b0b-c102bf26a5d6.png" width="500px" alt="Entities card example" />


```yaml
- type: entities
  title: Entities
  state_color: true
  entities:
    - type: custom:mini-humidifier
      entity: fan.xiaomi_miio_device
      group: on

    - entity: switch.living_room_wall_switch_right
```

#### fan mode source 

```yaml
- type: custom:mini-humidifier
  entity: fan.xiaomi_miio_device
  fan_mode_button:
    source:
      auto: Авто
      silent: Тихий
      medium: Средний
      high: Высокоий
```


#### led button dropdown list configuration


<img src="https://user-images.githubusercontent.com/861063/79615043-7a50e780-810a-11ea-8716-f96f868be879.png" width="500px" alt="Entities card example" />

```yaml
- type: custom:mini-humidifier
  entity: fan.xiaomi_miio_device
  led_button:
    type: dropdown
    source:
      bright:
        name: Bright
      dim:
        name: Dim
      'off':
        name: 'Off'
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
