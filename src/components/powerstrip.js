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
        <ha-entity-toggle
          .stateObj=${this.humidifier.entity}
          .hass=${this.hass}>
        </ha-entity-toggle>
    `;
  }

  static get styles() {
    return [
      sharedStyle,
      css`
        :host {
          display: flex;
          margin: 0;
          line-height: var(--mh-unit);
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
