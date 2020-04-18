import { LitElement, html, css } from 'lit-element';

import './dropdown';

class MiniHumidifierLedButtonMenu extends LitElement {
  static get properties() {
    return {
      humidifier: {},
      config: {},
      icon: String,
    };
  }

  get source() {
    return this.humidifier.ledButtonValue || {};
  }

  get sources() {
    return this.humidifier.ledButtonSource
      .map(s => ({ name: s.name, id: s.id, type: 'source' }));
  }

  render() {
    return html`
      <mh-dropdown
        @change=${this.handleSource}
        .humidifier=${this.humidifier}
        .items=${this.sources}
        .icon=${this.icon}
        .active=${this.humidifier.isLedBrightnessOn} 
        .selected=${this.source.id}>
      </mh-dropdown>
    `;
  }

  handleSource(ev) {
    const { id } = ev.detail;

    this.humidifier.setLedButtonBrightness(ev, id);
  }

  static get styles() {
    return css`
      :host {
        min-width: var(--mh-unit);
      }
    `;
  }
}

customElements.define('mh-led-button-menu', MiniHumidifierLedButtonMenu);
