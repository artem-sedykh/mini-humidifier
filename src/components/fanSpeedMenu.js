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
    return this.humidifier.fanSpeed || {};
  }

  get sources() {
    return this.humidifier.fanSpeedSource
      .filter(s => !s.hide)
      .sort((a, b) => ((a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0)))
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
        .disabled=${this.humidifier.isFanDisabled}
        .selected=${this.source.id}>
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
