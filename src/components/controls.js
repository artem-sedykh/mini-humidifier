import { LitElement, html, css } from 'lit-element';

import './button';
import './fanSpeedMenu';

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

  renderDry() {
    if (this.config.dry.hide)
      return '';

    return html`
      <paper-icon-button class='dry-button'
        .icon=${this.config.dry.icon}
        @click=${e => this.toggleDry(e)}
        ?color=${this.humidifier.isDryOn}>
      </paper-icon-button>
    `;
  }

  renderSpeedMenu() {
    if (this.config.fan_mode.hide)
      return '';

    return html`
       <mh-fan-speed-menu
          .config=${this.config}
          .humidifier=${this.humidifier}>
       </mh-fan-speed-menu>
    `;
  }

  renderLedButton() {
    if (this.config.led_button.hide)
      return '';

    return html`
       <paper-icon-button class='led-button'
          .icon=${this.config.led_button.icon}
          @click=${e => this.toggleLedBrightness(e)}
          ?color=${this.humidifier.isLedBrightnessOn}>
        </paper-icon-button>
    `;
  }

  renderBuzzer() {
    if (this.config.buzzer.hide)
      return '';

    return html`
       <paper-icon-button class='buzzer-button'
          .icon=${this.config.buzzer.icon}
          @click=${e => this.toggleBuzzer(e)}
          ?color=${this.humidifier.isBuzzerOn}>
        </paper-icon-button>
    `;
  }

  renderChildLock() {
    if (this.config.child_lock.hide)
      return '';

    return html`
       <paper-icon-button class='child-lock-button'
          .icon=${this.config.child_lock.icon}
          @click=${e => this.toggleChildLock(e)}
          ?color=${this.humidifier.isChildLockOn}>
        </paper-icon-button>
    `;
  }

  render() {
    return html`
     <div class='mh-humidifier-info__controls'>
       ${this.renderDry()}
       ${this.renderSpeedMenu()}
       ${this.renderLedButton()}
       ${this.renderBuzzer()}
       ${this.renderChildLock()}
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
        width: 100%;
        justify-content: space-evenly;
      }
      .mh-humidifier-info__controls paper-icon-button {
        color: var(--mh-icon-color);
      }
      .led-button {
        margin-top: -1px;
      }
    `];
  }
}

customElements.define('mp-humidifier-controls', MiniHumidifierControls);
