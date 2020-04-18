import { LitElement, html, css } from 'lit-element';

import './fanSpeedMenu';
import './ledButtonMenu';

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

  renderDryButton(context) {
    return html`
      <paper-icon-button class='dry-button'
        .icon=${context.config.dry_button.icon}
        @click=${e => context.toggleDry(e)}
        ?color=${context.humidifier.isDryOn}>
      </paper-icon-button>
    `;
  }

  renderSpeedMenu(context) {
    return html`
       <mh-fan-speed-menu
          .icon=${context.config.fan_mode_button.icon}
          .config=${context.config}
          .humidifier=${context.humidifier}>
       </mh-fan-speed-menu>
    `;
  }

  renderLedButton(context) {
    if (context.config.led_button.type === 'dropdown')
      return html`
         <mh-led-button-menu class='led-button'
            .icon=${context.config.led_button.icon}
            .config=${context.config}
            .humidifier=${context.humidifier}>
         </mh-led-button-menu>
      `;

    return html`
       <paper-icon-button 
          .icon=${context.config.led_button.icon}
          @click=${e => context.toggleLedBrightness(e)}
          ?color=${context.humidifier.isLedBrightnessOn}>
        </paper-icon-button>
    `;
  }

  renderBuzzerButton(context) {
    return html`
       <paper-icon-button class='buzzer-button'
          .icon=${context.config.buzzer_button.icon}
          @click=${e => context.toggleBuzzer(e)}
          ?color=${context.humidifier.isBuzzerOn}>
        </paper-icon-button>
    `;
  }

  renderChildLockButton(context) {
    return html`
       <paper-icon-button class='child-lock-button'
          .icon=${context.config.child_lock_button.icon}
          @click=${e => context.toggleChildLock(e)}
          ?color=${context.humidifier.isChildLockOn}>
        </paper-icon-button>
    `;
  }

  render() {
    const context = this;
    const dryButtonConf = this.config.dry_button;
    const fanModeButtonConf = this.config.fan_mode_button;
    const ledButtonConf = this.config.led_button;
    const buzzerButtonConf = this.config.buzzer_button;
    const childlockButtonConf = this.config.child_lock_button;

    const source = [
      {
        hide: dryButtonConf.hide,
        order: dryButtonConf.order,
        render: this.renderDryButton,
      },
      {
        hide: fanModeButtonConf.hide,
        order: fanModeButtonConf.order,
        render: this.renderSpeedMenu,
      },
      {
        hide: ledButtonConf.hide,
        order: ledButtonConf.order,
        render: this.renderLedButton,
      },
      {
        hide: buzzerButtonConf.hide,
        order: buzzerButtonConf.order,
        render: this.renderBuzzerButton,
      },
      {
        hide: childlockButtonConf.hide,
        order: childlockButtonConf.order,
        render: this.renderChildLockButton,
      }]
      .filter(b => !b.hide)
      .sort((a, b) => ((a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0)));

    return html`
     <div class='mh-humidifier-info__controls'>
       ${source.map(item => item.render(context))}
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
        overflow: hidden;
        transition: background .5s;
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
    `];
  }
}

customElements.define('mp-humidifier-controls', MiniHumidifierControls);
