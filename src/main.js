import { html, LitElement } from 'lit-element';
import { classMap } from 'lit-html/directives/class-map';
import { styleMap } from 'lit-html/directives/style-map';
import HumidifierObject from './model';
import style from './style';
import sharedStyle from './sharedStyle';
import handleClick from './utils/handleClick';

import './components/dropdown';
import './components/powerstrip';
import './components/controls';
import './components/info';
import './components/togglePanel';

import ICON from './const';

if (!customElements.get('ha-slider')) {
  customElements.define(
    'ha-slider',
    class extends customElements.get('paper-slider') {},
  );
}

class MiniHumidifier extends LitElement {
  constructor() {
    super();
    this.initial = true;
    this.toggle = false;
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
  }

  get hass() {
    return this._hass;
  }

  get name() {
    return this.config.name || this.humidifier.name;
  }

  getFanModeButtonConfig(config) {
    const fanModeConf = {
      icon: ICON.FAN,
      hide: false,
      order: 1,
      ...config.fan_mode_button || {},
    };

    fanModeConf.source = {
      auto: 'Auto',
      silent: 'Silent',
      medium: 'Medium',
      high: 'High',
      ...(config.fan_mode_button || {}).source,
    };

    const source = [
      {
        id: 'auto',
        value: 'Auto',
        name: 'Auto',
        hide: false,
        order: 0,
      },
      {
        id: 'silent',
        value: 'Silent',
        name: 'Silent',
        hide: false,
        order: 1,
      },
      {
        id: 'medium',
        value: 'Medium',
        name: 'Medium',
        hide: false,
        order: 2,
      },
      {
        id: 'high',
        value: 'High',
        name: 'High',
        hide: false,
        order: 3,
      },
      {
        id: 'strong',
        value: 'Strong',
        name: 'Strong',
        hide: true,
        order: 4,
      }];

    const data = Object.entries(fanModeConf.source);

    for (let i = 0; i < data.length; i += 1) {
      const key = data[i][0];
      const value = data[i][1];

      const item = source.find(s => s.id.toUpperCase() === key.toUpperCase());

      if (item) {
        if (typeof (value) === 'object') {
          if ('value' in value)
            item.value = value.value;
          if ('name' in value)
            item.name = value.name;
          if ('hide' in value)
            item.hide = value.hide;
          if ('order' in value)
            item.order = value.order;
        } else {
          item.name = value;
        }
      }
    }

    fanModeConf.source = source;
    return fanModeConf;
  }

  getLedButtonConfig(config) {
    const ledButtonSource = (config.led_button || {}).source || {};

    const ledButtonConfig = {
      icon: ICON.LEDBUTTON,
      hide: false,
      type: 'button',
      order: 2,
      ...config.led_button || {},
    };

    const source = {
      bright: {
        value: 0,
        order: 0,
        name: 'Bright',
      },
      dim: {
        value: 1,
        order: 1,
        name: 'Dim',
      },
      off: {
        value: 2,
        order: 2,
        name: 'Off',
      },
    };

    if (ledButtonSource.bright) {
      if (typeof (ledButtonSource.bright) === 'object') {
        source.bright = { ...source.bright, ...ledButtonSource.bright };
      } else {
        source.bright.name = ledButtonSource.bright;
      }
    }

    if (ledButtonSource.dim) {
      if (typeof (ledButtonSource.dim) === 'object') {
        source.dim = { ...source.dim, ...ledButtonSource.dim };
      } else {
        source.dim.name = ledButtonSource.dim;
      }
    }

    if (ledButtonSource.off) {
      if (typeof (ledButtonSource.off) === 'object') {
        source.off = { ...source.off, ...ledButtonSource.off };
      } else {
        source.off.name = ledButtonSource.off;
      }
    }

    ledButtonConfig.source = Object.keys(source).map(key => ({
      id: key,
      name: source[key].name,
      order: source[key].order,
      value: source[key].value,
    }));
    return ledButtonConfig;
  }

  setConfig(config) {
    if (!config.entity || config.entity.split('.')[0] !== 'fan')
      throw new Error('Specify an entity from within the fan domain.');

    this.config = {
      toggle_power: true,
      fan_modes: [],
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

    this.config.depth = {
      icon: ICON.DEPTH,
      max_value: 120,
      unit_type: 'percent',
      fixed: 0,
      order: 0,
      unit: '%',
      volume: 4,
      hide: false,
      ...config.depth || {},
    };
    this.config.fan_mode_button = this.getFanModeButtonConfig(config);
    this.config.child_lock_button = {
      icon: ICON.CHILDLOCK,
      hide: false,
      order: 4,
      ...config.child_lock_button || {},
    };
    this.config.buzzer_button = {
      icon: ICON.BUZZER,
      hide: false,
      order: 3,
      ...config.buzzer_button || {},
    };
    this.config.led_button = this.getLedButtonConfig(config);
    this.config.temperature = {
      icon: ICON.TEMPERATURE,
      unit: '°C',
      source: { enitity: undefined, attribute: undefined },
      order: 1,
      fixed: 1,
      hide: false,
      ...config.temperature || {},
    };
    this.config.humidity = {
      icon: ICON.HUMIDITY,
      unit: '%',
      source: { enitity: undefined, attribute: undefined },
      order: 2,
      fixed: 1,
      hide: false,
      ...config.humidity || {},
    };
    this.config.target_humidity = {
      icon: ICON.HUMIDITY,
      hide: false,
      unit: '%',
      min: 30,
      max: 80,
      step: 10,
      ...config.target_humidity || {},
    };
    this.config.dry_button = {
      icon: ICON.DRY,
      hide: false,
      order: 0,
      ...config.dry_button || {},
    };
    this.config.toggle_button = {
      icon: ICON.TOGGLE,
      hide: false,
      default: false,
      ...config.toggle_button || {},
    };
    this.config.power_button = {
      icon: ICON.POWER,
      type: 'toggle',
      hide: false,
      ...config.power_button || {},
    };

    this.toggle = this.config.toggle_button.default;
  }

  render({ config } = this) {
    return html`
      <ha-card
        class=${this.computeClasses()}
        style=${this.computeStyles()}
        @click=${e => this.handlePopup(e)}>
        <div class='mh__bg'>
        </div>
        <div class='mh-humidifier'>
          <div class='mh-humidifier__core flex'>
            ${this.renderIcon()}
            <div class='entity__info'>
              ${this.renderEntityName()}
            </div>
            <mh-powerstrip
              .hass=${this.hass}
              .humidifier=${this.humidifier}
              .config=${config}>
            </mh-powerstrip>
          </div>
          ${this.renderBottomPanel(config)}
        </div>
      </ha-card>
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

  toggleButtonCls() {
    return this.toggle ? 'open' : '';
  }

  renderIcon() {
    const state = this.humidifier.isActive;
    return html`
      <div class='entity__icon' ?color=${state}>
        <ha-icon .icon=${this.computeIcon()} ></ha-icon>
      </div>`;
  }

  renderToggle() {
    if (this.config.toggle_button.hide)
      return '';

    return html`
        <div class='mh-humidifier__toggle'>
          <paper-icon-button class='toggle-button ${this.toggleButtonCls()}'
          .icon=${this.config.toggle_button.icon}
          @click=${e => this.handleToggle(e)}>
          </paper-icon-button>
        </div>
    `;
  }

  renderBottomPanel(config) {
    if (this.humidifier.isUnavailable)
      return '';

    return html`
        <div class='mh-humidifier__bottom flex'>
          <mp-humidifier-state
            .hass=${this.hass}
            .humidifier=${this.humidifier}
            .config=${this.config}>
          </mp-humidifier-state>
          ${this.renderToggle()}
        </div>
        <mp-toggle-panel
          .hass=${this.hass}
          .humidifier=${this.humidifier}
          .visible=${this.toggle}
          .config=${config}>
        </mp-toggle-panel>
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

    return html`
      <div class='entity__secondary_info'>
         <iron-icon class='entity__secondary_info_icon' .icon=${this.config.fan_mode_button.icon}></iron-icon>
         <span class='entity__secondary_info__name'>${this.secondaryInfoLabel}</span>
      </div>
    `;
  }

  get secondaryInfoLabel() {
    const item = this.humidifier.fanSpeed;
    return item ? item.name : '';
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
