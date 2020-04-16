import { LitElement, html, css } from 'lit-element';

import './dropdown';

class MiniHumidifierFanSpeedMenu extends LitElement {
  static get properties() {
    return {
      humidifier: {},
      config: {},
      icon: String,
    };
  }

  get source() {
    return this.humidifier.fanSpeed;
  }

  get label() {
    const selectedId = this.source ? this.source.toUpperCase() : this.source;
    const item = this.sources.find(s => s.id.toUpperCase() === selectedId);
    return item ? item.name : '';
  }

  get sources() {
    return this.humidifier.fanSpeedSource
      .map(s => ({ name: s.name, id: s.id, type: 'source' }));
  }

  render() {
    return html`
      <mh-dropdown
        @change=${this.handleSource}
        .humidifier=${this.humidifier}
        .items=${this.sources}
        .icon=${this.icon}
        .active=${this.humidifier.isOn} 
        .disabled=${this.humidifier.isOff}
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
        min-width: var(--mh-unit);
      }
    `;
  }
}

customElements.define('mh-fan-speed-menu', MiniHumidifierFanSpeedMenu);
