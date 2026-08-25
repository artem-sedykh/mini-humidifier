# Configuration

[Home](../README.md) | [Configuration](configuration.md) | [Models](models.md) | [Controls](controls.md) | [Indicators](indicators.md) | [Buttons](buttons.md) | [Examples](examples.md) | [Development](development.md)

Every option the card accepts. Start from the [quick start](../README.md#quick-start)
and add only what you need - everything below has a default.

Options marked **object** open a block of their own, documented on the page the
last column points at.

## Card options

`entity`, `model`, `name`, `icon`, `scale` and `group` can be set in the visual
editor, from the card's edit dialog. Everything else on this page is YAML, and
the editor leaves it alone: options it does not show are carried through
untouched, so a card written by hand can be opened in the editor and saved
again without losing anything.

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `type` | string | **required** | `custom:mini-humidifier` |
| `entity` | string | **required** | An entity_id from an entity within the `fan` or `humidifier` domain. |
| `name` | string | optional | Override the entity's friendly name. |
| `icon` | string | optional | Specify a custom icon from any of the available mdi icons. |
| `model` | string | `zhimi.humidifier.cb1` | Which set of device defaults to start from, see [Models](models.md). |
| `group` | boolean | `false` | Removes paddings, background color and box-shadow, see [Group](controls.md#group). |
| `scale` | number | `1` | UI scale modifier. |
| `tap_action` | [action object](#action-object-options) | `more-info` | Action on click/tap, see [Examples](examples.md#action-object-options-examples). |
| `toggle` | object | optional | The button that shows and hides the bottom panel, see [Toggle button](controls.md#toggle-button). |
| `secondary_info` | object | optional | The line under the entity name, see [Secondary info](controls.md#secondary-info). |
| `power` | object | optional | The power button, see [Power button](controls.md#power-button). |
| `target_humidity` | object | optional | The slider row, see [Target humidity](controls.md#target-humidity). |
| `indicators` | object | optional | Read-only values under the entity name, see [Indicators](indicators.md). |
| `buttons` | object | optional | Buttons and dropdowns in the bottom panel, see [Buttons](buttons.md). |

Every option listed anywhere in this documentation exists in the v3 line. The
card requires Home Assistant 2022.11 or newer; see
[Compatibility](../README.md#compatibility).

## Action object options

| Name | Type | Default | Options | Description |
|------|:----:|:-------:|:-----------:|-------------|
| `action` | string | `more-info` | `more-info` / `navigate` / `call-service` / `url` / `none` | Action to perform. |
| `entity` | string | | Any entity id | Override default entity of `more-info`, when `action` is defined as `more-info`. |
| `service` | string | | Any service | Service to call (e.g. `fan.turn_on`) when `action` is defined as `call-service`. |
| `service_data` | object | | Any service data | Service data to include with the service call (e.g. `entity_id: fan.xiaomi_miio_device`). |
| `navigation_path` | string | | Any path | Path to navigate to (e.g. `/lovelace/0/`) when `action` is defined as `navigate`. |
| `url` | string | | Any URL | URL to open when `action` is defined as `url`. |

An action that needs nothing but its name can be written as a bare string:
`tap_action: none` and `tap_action: more-info` mean the same as
`tap_action: {action: none}` and `tap_action: {action: more-info}`. The same
shorthand works for an indicator's `tap_action`.

## Theme variables

Set these in your Home Assistant theme to change the appearance of the card.
Any CSS color notation works: a color name, hexadecimal, `rgb`, `rgba`, `hsl`,
`hsla`.

| Name | Default | Description |
|------|---------|-------------|
| `mini-humidifier-name-font-weight` | `400` | Font weight of the entity name |
| `mini-humidifier-info-font-weight` | `300` | Font weight of the states |
| `mini-humidifier-icon-color` | `var(--mini-humidifier-base-color, var(--paper-item-icon-color, #44739e))` | The color for icons |
| `mini-humidifier-button-color` | `var(--mini-humidifier-button-color, var(--paper-item-icon-color, #44739e))` | The color for button icons |
| `mini-humidifier-accent-color` | `var(--accent-color)` | The accent color of UI elements |
| `mini-humidifier-base-color` | `var(--primary-text-color)` and `var(--paper-item-icon-color)` | The color of base text |
| `mini-humidifier-background-opacity` | `1` | Opacity of the background |
| `mini-humidifier-scale` | `1` | Scale of the card |
