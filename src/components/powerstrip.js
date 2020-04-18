import { LitElement, html, css } from 'lit-element';

import sharedStyle from '../sharedStyle';

import getLabel from '../utils/getLabel';

import './targetHumiditySlider';

class MiniHumidifierPowerstrip extends LitElement {
  static get properties() {
    return {
      hass: {},
      humidifier: {},
      config: {},
    };
  }

  renderPowerButton() {
    if (this.config.power_button.hide)
      return '';

    if (this.config.power_button.type === 'toggle') {
      return html`
          <ha-entity-toggle
            .stateObj=${this.humidifier.entity}
            .hass=${this.hass}>
          </ha-entity-toggle>
      `;
    }

    return html`
        <paper-icon-button class='power-button'
          .icon=${this.config.power_button.icon}
          @click=${e => this.humidifier.togglePower(e)}
          ?color=${this.humidifier.isOn}>
        </paper-icon-button>
    `;
  }

  render() {
    if (this.humidifier.isUnavailable)
      return html`
        <span class='label ellipsis'>        
          ${getLabel(this.hass, 'state.default.unavailable', 'Unavailable')}
        </span>`;

    return html`
        <mp-target-humidity-slider
          .hass=${this.hass}
          .humidifier=${this.humidifier}
          .config=${this.config}>
        </mp-target-humidity-slider>
        ${this.renderPowerButton()}
    `;
  }

  static get styles() {
    return [
      sharedStyle,
      css`
        :host {
          display: flex;
          margin: 0;
          max-height: var(--mh-unit);
        }
        mp-target-humidity-slider {
          flex: 1;
        }
      `,
    ];
  }
}

customElements.define('mh-powerstrip', MiniHumidifierPowerstrip);
