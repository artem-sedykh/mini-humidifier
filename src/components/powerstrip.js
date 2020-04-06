import { LitElement, html, css } from 'lit-element';

import sharedStyle from '../sharedStyle';

import getLabel from '../utils/getLabel';

import './controls';

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
        <mp-humidifier-controls
          .hass=${this.hass}
          .humidifier=${this.humidifier}
          .config=${this.config}>
        </mp-humidifier-controls>
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
        ha-entity-toggle {
          margin-left: 15px;
        }
      `,
    ];
  }
}

customElements.define('mh-powerstrip', MiniHumidifierPowerstrip);
