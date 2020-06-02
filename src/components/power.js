import { css, html, LitElement } from 'lit-element';
import sharedStyle from '../sharedStyle';

class PowerButton extends LitElement {
  static get properties() {
    return {
      humidifier: { type: Object },
      config: { type: Object },
      hass: { type: Object },
    };
  }

  render() {
    if (this.config.power.hide)
      return '';

    if (this.config.power.type === 'toggle') {
      return html`
          <ha-entity-toggle
            .stateObj=${this.humidifier.entity}
            .hass=${this.hass}>
          </ha-entity-toggle>
      `;
    }

    return html`
        <ha-icon-button class='power-button'
          .icon=${this.config.power.icon}
          @click=${e => this.humidifier.togglePower(e)}
          ?color=${this.humidifier.isOn}>
        </ha-icon-button>
    `;
  }

  static get styles() {
    return [
      sharedStyle,
      css`
     :host {
        position: relative;
        box-sizing: border-box;
        min-width: 0;
        font-weight: var(--mh-info-font-weight);
      }
    `];
  }
}

customElements.define('mh-power', PowerButton);
