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

import { ICON } from './const';

if (!customElements.get('ha-slider')) {
  customElements.define(
    'ha-slider',
    class extends customElements.get('paper-slider') {},
  );
}

// eslint-disable-next-line no-unused-vars
class MiniHumidifier extends LitElement {
  constructor() {
    super();
    this.initial = true;
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

  setConfig(config) {
    if (!config.entity || config.entity.split('.')[0] !== 'fan')
      throw new Error('Specify an entity from within the fan domain.');

    const depthDefaultConf = {
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

    this.config = {
      toggle_power: true,
      fan_modes: [],
      tap_action: {
        action: 'more-info',
      },
      ...config,
    };
    this.config.depth = depthDefaultConf;
    this.config.fan_mode_button = fanModeConf;
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
    this.config.led_button = {
      icon: ICON.LEDBUTTON,
      hide: false,
      order: 2,
      ...config.led_button || {},
    };
    this.config.temperature = {
      icon: ICON.TEMPERATURE,
      unit: '°C',
      order: 1,
      hide: false,
      ...config.temperature || {},
    };
    this.config.humidity = {
      icon: ICON.HUMIDITY,
      unit: '%',
      order: 2,
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
      ...config.toggle_button || {},
    };
  }

  // eslint-disable-next-line no-unused-vars
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
    const selectedId = this.humidifier.fanSpeed.toUpperCase();
    const item = this.humidifier.fanSpeedSource.find(s => s.id.toUpperCase() === selectedId);
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
