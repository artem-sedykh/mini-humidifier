import { LitElement, html } from 'lit-element';
import { classMap } from 'lit-html/directives/class-map';
import { styleMap } from 'lit-html/directives/style-map';
import HumidifierObject from './model';
import style from './style';
import sharedStyle from './sharedStyle';

import './components/dropdown';
import './components/powerstrip';
import './components/controls';
import './components/info';
import './components/togglePanel';

import {
  ICON,
} from './const';

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
    this.edit = false;
  }

  static get properties() {
    return {
      _hass: {},
      config: {},
      entity: {},
      humidifier: {},
      initial: Boolean,
      edit: Boolean,
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

    const conf = {
      toggle_power: true,
      ...config,
    };
    this.config = conf;
  }

  // eslint-disable-next-line no-unused-vars
  render({ config } = this) {
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
              ${this.renderEntityName()}
            </div>
            <mh-powerstrip
              .hass=${this.hass}
              .humidifier=${this.humidifier}
              .config=${config}>
            </mh-powerstrip>
          </div>
          <div class='mh-humidifier__bottom flex'>
            <mp-humidifier-state
              .hass=${this.hass}
              .humidifier=${this.humidifier}
              .config=${config}>
            </mp-humidifier-state>

          </div>
          <mp-toggle-panel
            .hass=${this.hass}
            .humidifier=${this.humidifier}
            .config=${config}>
          </mp-toggle-panel>
        </div>
      </ha-card>
    `;
  }

  renderIcon() {
    const state = this.humidifier.isActive;
    return html`
      <div class='entity__icon' ?color=${state}>
        <ha-icon .icon=${this.computeIcon()} ></ha-icon>
      </div>`;
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
    return html`
      <div class='entity__secondary_info'>
         <iron-icon class='entity__secondary_info_icon' .icon=${ICON.FAN}></iron-icon>
         <span class='entity__secondary_info__name'>${this.secondaryInfoLabel}</span>
      </div>
    `;
  }

  get secondaryInfoLabel() {
    const selectedId = this.humidifier.fanSpeed.toUpperCase();
    const item = this.humidifier.fanSpeedSource.find(s => s.id.toUpperCase() === selectedId);
    let label = item ? item.name : '';
    label = label ? `${label}, ${this.humidifier.temperature}°C` : `${label} ${this.humidifier.temperature}°C`;
    return label;
  }

  computeIcon() {
    return this.config.icon ? this.config.icon : this.humidifier.icon || ICON.DEFAULT;
  }

  computeClasses({ config } = this) {
    return classMap({
      '--initial': this.initial,
      '--collapse': config.collapse,
      '--inactive': !this.humidifier.isActive,
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
