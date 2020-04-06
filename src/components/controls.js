import { LitElement, html, css } from 'lit-element';

import './button';
import './fanSpeedMenu';

import { ICON } from '../const';
import sharedStyle from '../sharedStyle';

class MiniHumidifierControls extends LitElement {
  static get properties() {
    return {
      humidifier: {},
      hass: {},
      config: {},
    };
  }

  toggleDry(e) {
    return this.humidifier.toggleDry(e);
  }

  toggleBuzzer(e) {
    return this.humidifier.toggleBuzzer(e);
  }

  toggleLedBrightness(e) {
    return this.humidifier.toggleLedBrightness(e);
  }

  toggleChildLock(e) {
    return this.humidifier.toggleChildLock(e);
  }

  render() {
    return html`
     <div class='mh-humidifier-info__controls'>
       <paper-icon-button class='dry-button'
          .icon=${ICON.DRY}
          @click=${e => this.toggleDry(e)}
          ?color=${this.humidifier.isDryOn}>
        </paper-icon-button>
       <paper-icon-button class='buzzer-button'
          .icon=${ICON.BUZZER}
          @click=${e => this.toggleBuzzer(e)}
          ?color=${this.humidifier.isBuzzerOn}>
        </paper-icon-button>
       <paper-icon-button class='child-lock-button'
          .icon=${ICON.CHILDLOCK}
          @click=${e => this.toggleChildLock(e)}
          ?color=${this.humidifier.isChildLockOn}>
        </paper-icon-button>
       <paper-icon-button class='led-button'
          .icon=${ICON.LEDBUTTON}
          @click=${e => this.toggleLedBrightness(e)}
          ?color=${this.humidifier.isLedBrightnessOn}>
        </paper-icon-button>
       <mh-fan-speed-menu
          .humidifier=${this.humidifier}>
       </mh-fan-speed-menu>
     </div>
    `;
  }

  static get styles() {
    return [
      sharedStyle,
      css`
      :host {
        position: relative;
        box-sizing: border-box;
        margin: 0;
        min-width: 0;
        overflow: hidden;
        transition: background .5s;
        border-radius: 4px;
      }
      :host([color]) {
        background: var(--mh-active-color);
        transition: background .25s;
        opacity: 1;
      }
      :host([disabled]) {
        opacity: .25;
        pointer-events: none;
      }
      .mh-humidifier-info__controls {
        display: flex;
      }
      .mh-humidifier-info__controls paper-icon-button {
        color: var(--mh-icon-color);
        padding-right: 0;
        padding-left: 0;
        margin-right: -7px;
      }
      .led-button {
        margin-top: -1px;
      }
    `];
  }
}

customElements.define('mp-humidifier-controls', MiniHumidifierControls);
