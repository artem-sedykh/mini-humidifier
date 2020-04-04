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

  handleTargetHumidityChange(ev) {
    const vol = parseFloat(ev.target.value);
    this.sliderValue = vol;
    this.humidifier.setTargetHumidity(ev, vol);
  }

  renderTargetHumiditySlider() {
    const sliderValue = this.sliderValue || this.humidifier.targetHumidity;
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
        <span class='info__item__value'>${sliderValue}%</span>
        <iron-icon class='info__item__icon' .icon=${ICON.HUMIDITY}></iron-icon>
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
        .mh-controls__target_humidifier {
          flex: 100;
          max-height: var(--mh-unit);
          display: flex
        }
        .mh-controls__target_humidifier ha-slider {
          height: var(--mh-unit);
          max-width: 130px;
        }
        .mh-controls__target_humidifier .info__item__value {
          text-align: left;
          text-transform: none;
          font-size: 10.5px;
          line-height: var(--mh-unit);
          font-weight: var(--mh-name-font-weight);
        }
        .mh-controls__target_humidifier .info__item__icon {
          height: var(--mh-unit);
          width: calc(var(--mh-unit) * 0.5);
          min-width: calc(var(--mh-unit) * 0.5);
          color: rgba(33, 33, 33, 0.6);
        }
      `,
    ];
  }
}

customElements.define('mh-powerstrip', MiniHumidifierPowerstrip);
