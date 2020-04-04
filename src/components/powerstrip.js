import { LitElement, html, css } from 'lit-element';

import './sourceMenu';

import { ICON } from '../const';
import sharedStyle from '../sharedStyle';

import getLabel from '../utils/getLabel';

class MiniHumidifierPowerstrip extends LitElement {
  static get properties() {
    return {
      hass: {},
      humidifier: {},
      config: {},
    };
  }

  get powerColor() {
    return this.humidifier.isActive;
  }

  handleTargetHumidityChange(ev) {
    const vol = parseFloat(ev.target.value);
    this.humidifier.setTargetHumidity(ev, vol);
  }

  renderTargetHumiditySlider() {

    return html`
      <div class='mh-controls__target_humidifier --slider flex'>
        <ha-slider
          @change=${this.handleTargetHumidityChange}
          @click=${e => e.stopPropagation()}
          min=${this.humidifier.minTargetHumidity}
          max=${this.humidifier.maxTargetHumidity}
          step=${this.humidifier.targetHumidityStep}
          value=${this.humidifier.targetHumidity}
          dir=${'ltr'}
          ignore-bar-touch pin>
        </ha-slider>
      </div>`;
  }

  render() {
    if (this.humidifier.isUnavailable)
      return html`
        <span class='label ellipsis'>        
          ${getLabel(this.hass, 'state.default.unavailable', 'Unavailable')}
        </span>`;

    return html`
        <mh-controls>
          ${this.renderTargetHumiditySlider()}
        </mh-controls>
        <mh-source-menu
          .humidifier=${this.humidifier}
          ?full=${true}>
        </mh-source-menu>
     
        <paper-icon-button class='power-button'
          .icon=${ICON.POWER}
          @click=${e => this.humidifier.togglePower(e)}
          ?color=${this.powerColor}>
        </paper-icon-button>
    `;
  }

  static get styles() {
    return [
      sharedStyle,
      css`
        :host {
          display: flex;
          line-height: var(--mh-unit);
          max-height: var(--mh-unit);
        }
        :host([flow]) mh-controls {
          max-width: unset;
        }
        mh-controls {
          max-width: calc(var(--mh-unit) * 5);
          line-height: initial;
          justify-content: flex-end;
        }
        paper-icon-button {
          min-width: var(--mh-unit);
        }
        :host([flow]) mh-controls {
          max-width: unset;
        }
        mh-controls {
          max-width: calc(var(--mmp-unit) * 5);
          line-height: initial;
          justify-content: flex-end;
        }
        .mh-controls__target_humidifier {
          flex: 100;
          max-height: var(--mmp-unit);
        }
      `,
    ];
  }
}

customElements.define('mh-powerstrip', MiniHumidifierPowerstrip);
