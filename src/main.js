import { html, LitElement } from 'lit-element';
import { classMap } from 'lit-html/directives/class-map';
import { styleMap } from 'lit-html/directives/style-map';

import style from './style';
import sharedStyle from './sharedStyle';
import handleClick from './utils/handleClick';
import { compileTemplate, toggleState } from './utils/utils';
import ICON from './const';

import './components/dropdown';
import './components/indicators';
import './components/buttons';
import './components/targetHumidity';
import './components/power';

import IndicatorObject from './models/indicator';
import ButtonObject from './models/button';
import TargetHumidityObject from './models/targetHumidity';
import HumidifierObject from './models/humidifier';
import getLabel from './utils/getLabel';
import './initialize';

if (!customElements.get('ha-slider')) {
  customElements.define(
    'ha-slider',
    class extends customElements.get('paper-slider') {},
  );
}

if (!customElements.get('ha-icon-button')) {
  customElements.define(
    'ha-icon-button',
    class extends customElements.get('paper-icon-button') {},
  );
}

class MiniHumidifier extends LitElement {
  constructor() {
    super();
    this.initial = true;
    this.toggle = false;
    this.indicators = {};
    this.buttons = {};
    this.targetHumidity = {};
    this.power = {};
  }

  static get properties() {
    return {
      _hass: {},
      config: {},
      entity: {},
      humidifier: {},
      initial: Boolean,
      toggle: Boolean,
    };
  }

  static get styles() {
    return [
      sharedStyle,
      style,
    ];
  }

  set hass(hass) {
    if (!hass) return;
    const entity = hass.states[this.config.entity];
    this._hass = hass;

    if (entity && this.entity !== entity) {
      this.entity = entity;
      this.humidifier = new HumidifierObject(hass, this.config, entity);
    }

    this.updateIndicators(hass);
    this.updateButtons(hass);
    this.updateTargetHumidity(hass);
    this.updatePower(hass);
  }

  get hass() {
    return this._hass;
  }

  get name() {
    return this.config.name || this.humidifier.name;
  }

  updateIndicators(hass) {
    const indicators = { };
    let changed = false;

    for (let i = 0; i < this.config.indicators.length; i += 1) {
      const config = this.config.indicators[i];
      const { id } = config;

      const entityId = config.source.entity || this.humidifier.id;
      const entity = hass.states[entityId];

      if (entity) {
        indicators[id] = new IndicatorObject(entity, config, this.humidifier);
      }

      if (entity !== (this.indicators[id] && this.indicators[id].entity))
        changed = true;
    }

    if (changed)
      this.indicators = indicators;
  }

  updateButtons(hass) {
    const buttons = { };
    let changed = false;

    for (let i = 0; i < this.config.buttons.length; i += 1) {
      const config = this.config.buttons[i];
      const { id } = config;

      const entityId = (config.state && config.state.entity) || this.humidifier.id;
      const entity = hass.states[entityId];

      if (entity) {
        buttons[id] = new ButtonObject(entity, config, this.humidifier);
      }

      if (entity !== (this.buttons[id] && this.buttons[id].entity))
        changed = true;
    }

    if (changed)
      this.buttons = buttons;
  }

  updatePower(hass) {
    const config = this.config.power;

    const entityId = (config.state && config.state.entity) || this.humidifier.id;
    const entity = hass.states[entityId];
    const power = entity ? new ButtonObject(entity, config, this.humidifier) : {};

    if (entity !== (this.power && this.power.entity))
      this.power = power;
  }

  updateTargetHumidity(hass) {
    const entityId = (this.config.target_humidity.source
      && this.config.target_humidity.source.entity) || this.config.entity;

    const entity = hass.states[entityId];
    const targetHumidity = new TargetHumidityObject(hass, entity, this.config, this.humidifier);

    if (this.targetHumidity.value !== targetHumidity.value) {
      this.targetHumidity = targetHumidity;
    }
  }

  getIndicatorConfig(key, value, config) {
    const item = {
      id: key,
      source: { enitity: undefined, attribute: undefined, mapper: undefined },
      icon: '',
      ...value,
    };

    item.functions = item.functions || {};
    const context = { ...value };
    context.entity_config = config;
    context.toggle_state = toggleState;

    if (item.source.mapper) {
      item.functions.mapper = compileTemplate(item.source.mapper, context);
    }

    if (typeof item.icon === 'object') {
      item.functions.icon = {};

      if (item.icon.template)
        item.functions.icon.template = compileTemplate(item.icon.template, context);

      if (item.icon.style)
        item.functions.icon.style = compileTemplate(item.icon.style, context);
    }

    return item;
  }

  getIndicatorsConfig(config) {
    const defaultIndicators = {
      depth: {
        icon: ICON.DEPTH,
        unit: '%',
        round: 0,
        order: 0,
        max_value: 125,
        volume: 4,
        type: 'percent',
        hide: false,
        source: {
          attribute: 'depth',
          mapper: (val) => {
            const value = (100 * (val || 0)) / this.max_value;
            return this.type === 'liters' ? (value * this.volume) / 100 : value;
          },
        },
      },
      temperature: {
        icon: ICON.TEMPERATURE,
        unit: '°C',
        round: 1,
        order: 1,
        hide: false,
        source: { attribute: 'temperature' },
      },
      humidity: {
        icon: ICON.HUMIDITY,
        unit: '%',
        round: 1,
        order: 2,
        hide: false,
        source: { attribute: 'humidity' },
      },
    };

    const data = Object.entries(config.indicators || {});

    for (let i = 0; i < data.length; i += 1) {
      const key = data[i][0];
      const value = data[i][1] || {};

      defaultIndicators[key] = { ...defaultIndicators[key] || {}, ...value };
    }

    return Object.entries(defaultIndicators).map(i => this.getIndicatorConfig(i[0], i[1], config));
  }

  getButtonConfig(value, config) {
    const item = {
      icon: 'mdi:radiobox-marked',
      type: 'button',
      toggle_action: undefined,
      ...value,
    };

    item.functions = {};

    const context = { ...value };
    context.call_service = (domain, service, options) => this.hass.callService(
      domain, service, options,
    );
    context.entity_config = config;
    context.toggle_state = toggleState;

    if (item.disabled) {
      item.functions.disabled = compileTemplate(item.disabled, context);
    }

    if (item.state && item.state.mapper) {
      item.functions.state = { mapper: compileTemplate(item.state.mapper, context) };
    }

    if (item.active) {
      item.functions.active = compileTemplate(item.active, context);
    }

    if (item.source && item.source.__filter) {
      item.functions.source = { filter: compileTemplate(item.source.__filter, context) };
    }

    if (item.toggle_action) {
      item.functions.toggle_action = compileTemplate(item.toggle_action, context);
    }

    if (item.change_action) {
      item.functions.change_action = compileTemplate(item.change_action, context);
    }

    if (item.style)
      item.functions.style = compileTemplate(item.style, context);

    return item;
  }

  getButtonsConfig(config) {
    const defaultButtonsConfig = {
      dry: {
        icon: ICON.DRY,
        hide: false,
        order: 0,
        state: { attribute: 'dry', mapper: state => (state ? 'on' : 'off') },
        toggle_action: (state, entity) => {
          const service = state === 'on' ? 'fan_set_dry_off' : 'fan_set_dry_on';
          const options = { entity_id: entity.entity_id };
          return this.call_service('xiaomi_miio', service, options);
        },
      },
      mode: {
        icon: ICON.FAN,
        type: 'dropdown',
        hide: false,
        order: 1,
        source: {
          auto: 'auto',
          silent: 'silent',
          medium: 'medium',
          high: 'high',
        },
        active: (state, entity) => (entity.state !== 'off'),
        disabled: (state, entity) => (entity.attributes.depth === 0),
        state: { attribute: 'mode' },
        change_action: (selected, entity) => {
          const options = { entity_id: entity.entity_id, speed: selected };
          return this.call_service('fan', 'set_speed', options);
        },
      },
      led: {
        icon: ICON.LEDBUTTON,
        type: 'dropdown',
        hide: false,
        order: 2,
        active: state => (state !== 2 && state !== '2'),
        source: { 0: 'Bright', 1: 'Dim', 2: 'Off' },
        state: { attribute: 'led_brightness' },
        change_action: (selected, entity) => {
          const options = { entity_id: entity.entity_id, brightness: selected };
          return this.call_service('xiaomi_miio', 'fan_set_led_brightness', options);
        },
      },
      buzzer: {
        icon: ICON.BUZZER,
        hide: false,
        order: 3,
        state: { attribute: 'buzzer', mapper: state => (state ? 'on' : 'off') },
        toggle_action: (state, entity) => {
          const service = state === 'on' ? 'fan_set_buzzer_off' : 'fan_set_buzzer_on';
          const options = { entity_id: entity.entity_id };
          return this.call_service('xiaomi_miio', service, options);
        },
      },
      child_lock: {
        icon: ICON.CHILDLOCK,
        hide: false,
        order: 4,
        state: { attribute: 'child_lock', mapper: state => (state ? 'on' : 'off') },
        toggle_action: (state, entity) => {
          const service = state === 'on' ? 'fan_set_child_lock_off' : 'fan_set_child_lock_on';
          const options = { entity_id: entity.entity_id };
          return this.call_service('xiaomi_miio', service, options);
        },
      },
    };

    const entries = Object.entries(config.buttons || {});

    for (let i = 0; i < entries.length; i += 1) {
      const key = entries[i][0];
      const value = entries[i][1] || {};

      defaultButtonsConfig[key] = { ...defaultButtonsConfig[key] || {}, ...value };
    }

    const data = Object.entries(defaultButtonsConfig);

    const buttons = [];

    for (let i = 0; i < data.length; i += 1) {
      const key = data[i][0];
      const value = data[i][1];
      const button = this.getButtonConfig(value, config);
      button.id = key;

      if (!('order' in button))
        button.order = i + 1;

      buttons.push(button);
    }

    return buttons;
  }

  getTargetHumidityConfig(config) {
    const item = {
      icon: ICON.HUMIDITY,
      unit: '%',
      min: 30,
      max: 80,
      step: 10,
      hide: false,
      state: { entity: undefined, attribute: 'target_humidity' },
      change_action: (selected, _, entity) => {
        const options = { entity_id: entity.entity_id, humidity: selected };
        return this.call_service('xiaomi_miio', 'fan_set_target_humidity', options);
      },
      ...config.target_humidity || {},
    };

    item.functions = { icon: {} };
    const context = { ...config.target_humidity || {} };
    context.call_service = (domain, service, options) => this.hass.callService(
      domain, service, options,
    );
    context.entity_config = config;
    context.toggle_state = toggleState;

    if (typeof item.icon === 'object') {
      if (item.icon.template)
        item.functions.icon.template = compileTemplate(item.icon.template, context);

      if (item.icon.style)
        item.functions.icon.style = compileTemplate(item.icon.style, context);
    }

    if (item.change_action) {
      item.functions.change_action = compileTemplate(item.change_action, context);
    }

    if (item.state && item.state.mapper) {
      item.functions.state = { mapper: compileTemplate(item.state.mapper, context) };
    }

    return item;
  }

  getPowerConfig(config) {
    const item = {
      icon: ICON.POWER,
      type: 'button',
      hide: false,
      toggle_action: (state, entity) => {
        const service = state === 'on' ? 'turn_off' : 'turn_on';
        return this.call_service('fan', service, { entity_id: entity.entity_id });
      },
      ...config.power || {},
    };

    return this.getButtonConfig(item, config);
  }

  setConfig(config) {
    if (!config.entity || config.entity.split('.')[0] !== 'fan')
      throw new Error('Specify an entity from within the fan domain.');

    this.config = {
      tap_action: {
        action: 'more-info',
        navigation_path: '',
        url: '',
        entity: '',
        service: '',
        service_data: {},
      },
      ...config,
    };
    this.config.toggle = {
      icon: ICON.TOGGLE,
      hide: false,
      default: false,
      ...config.toggle || {},
    };
    this.config.power = this.getPowerConfig(config);
    this.config.target_humidity = this.getTargetHumidityConfig(config);
    this.config.indicators = this.getIndicatorsConfig(config);
    this.config.buttons = this.getButtonsConfig(config);

    this.toggle = this.config.toggle.default;
  }

  render() {
    return html`
      <ha-card
        class=${this.computeClasses()}
        style=${this.computeStyles()}>
        <div class='mh__bg'>
        </div>
        <div class='mh-humidifier'>
          <div class='mh-humidifier__core flex'>
            ${this.renderIcon()}
            <div class='entity__info'>
              <div class="wrap">
                <div class="entity__info__name_wrap" 
                  @click=${e => this.handlePopup(e)}>
                  ${this.renderEntityName()}
                </div>
                <div class="ctl-wrap">
                  ${this.renderUnavailable()}
                  ${this.renderTargetHumidifier()}
                  ${this.renderPower()}
                </div>
              </div>
              ${this.renderBottomPanel()}
            </div>
          </div>
          ${this.renderTogglePanel()}
        </div>
      </ha-card>
    `;
  }

  renderTargetHumidifier() {
    if (this.humidifier.isUnavailable)
      return '';

    return html`
      <mh-target-humidity
        .targetHumidity=${this.targetHumidity}>
      </mh-target-humidity>
    `;
  }

  renderPower() {
    if (this.humidifier.isUnavailable || this.power.hide)
      return '';

    return html`
        <mh-power
          .power=${this.power}
          .hass=${this.hass}>
        </mh-power>
    `;
  }

  renderUnavailable() {
    if (!this.humidifier.isUnavailable)
      return '';

    return html`
        <span class="label unavailable ellipsis">        
          ${getLabel(this.hass, 'state.default.unavailable', 'Unavailable')}
        </span>
      `;
  }

  handlePopup(e) {
    e.stopPropagation();
    handleClick(this, this._hass, this.config, this.config.tap_action, this.humidifier.id);
  }

  handleToggle(e) {
    e.stopPropagation();
    this.toggle = !this.toggle;
  }

  renderIcon() {
    const state = this.humidifier.isActive;
    return html`
      <div class='entity__icon' ?color=${state}>
        <ha-icon .icon=${this.computeIcon()} ></ha-icon>
      </div>`;
  }

  renderTogglePanel() {
    if (!this.toggle)
      return '';

    return html`
        <div class="mh-toggle_content">
          <mh-buttons
            .buttons=${this.buttons}>
          </mh-buttons>
        </div>
    `;
  }

  renderBottomPanel() {
    if (this.humidifier.isUnavailable)
      return '';

    return html`
        <div class='bottom flex'>
          <mh-indicators .indicators=${this.indicators}></mh-indicators>
          ${this.renderToggleButton()}
        </div>
    `;
  }

  renderToggleButton() {
    if (this.config.buttons.filter(b => !b.hide).length === 0)
      return '';

    if (this.config.toggle.hide)
      return '';

    const cls = this.toggle ? 'open' : '';
    return html`
        <ha-icon-button class='toggle-button ${cls}'
          .icon=${this.config.toggle.icon}
          @click=${e => this.handleToggle(e)}>
        </ha-icon-button>
    `;
  }

  renderEntityName() {
    return html`
      <div class='entity__info__name'>
        ${this.name}
      </div>
     ${this.renderSecondaryInfo()}
    `;
  }

  renderSecondaryInfo() {
    if (this.humidifier.isUnavailable)
      return '';

    const { mode } = this.buttons;
    const { selected } = mode;
    const label = selected ? selected.name : mode.state;

    return html`
      <div class='entity__secondary_info ellipsis'>
         <ha-icon class='entity__secondary_info_icon' .icon=${mode.icon}></ha-icon>
         <span class='entity__secondary_info__name'>${label}</span>
      </div>
    `;
  }

  computeIcon() {
    return this.config.icon ? this.config.icon : this.humidifier.icon || ICON.DEFAULT;
  }

  computeClasses({ config } = this) {
    return classMap({
      '--initial': this.initial,
      '--collapse': config.collapse,
      '--group': config.group,
      '--more-info': config.tap_action !== 'none',
      '--inactive': !this.humidifier.isActive,
      '--unavailable': this.humidifier.isUnavailable,
    });
  }

  computeStyles() {
    const { scale } = this.config;
    return styleMap({
      ...(scale && { '--mh-unit': `${40 * scale}px` }),
    });
  }
}

customElements.define('mini-humidifier', MiniHumidifier);
