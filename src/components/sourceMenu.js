import { LitElement, html, css } from 'lit-element';

import './dropdown';

class MiniHumidifierSourceMenu extends LitElement {
  static get properties() {
    return {
      humidifier: {},
    };
  }

  get source() {
    return this.humidifier.fanSpeed;
  }

  get sources() {
    return this.humidifier.fanSpeedSource
      .map(s => ({ name: s.name, id: s.id, type: 'source' }));
  }

  render() {
    return html`
      <mh-dropdown
        @change=${this.handleSource}
        .items=${this.sources}
        .label=${this.source}
        .selected=${this.source}>
      </mh-dropdown>
    `;
  }

  handleSource(ev) {
    const { id } = ev.detail;
    this.humidifier.setFanSpeed(ev, id);
  }

  static get styles() {
    return css`
      :host {
        max-width: 120px;
        min-width: var(--mh-unit);
      }
      :host([full]) {
        max-width: none;
      }
    `;
  }
}

customElements.define('mh-source-menu', MiniHumidifierSourceMenu);
