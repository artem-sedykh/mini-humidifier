import { css, html, LitElement } from 'lit-element';
import { styleMap } from 'lit-html/directives/style-map';
import sharedStyle from '../sharedStyle';

class PowerButton extends LitElement {
  static get properties() {
    return {
      power: { type: Object },
      hass: { type: Object },
    };
  }

  render() {
    if (this.power.hide)
      return '';

    if (this.power.type === 'toggle') {
      return html`
          <ha-entity-toggle
            style=${styleMap(this.power.style)}
            .stateObj=${this.power.entity}
            .hass=${this.hass}>
          </ha-entity-toggle>
      `;
    }

    return html`
       <ha-icon-button
         style=${styleMap(this.power.style)}
         class='power-button'
         .icon=${this.power.icon}
         @click=${e => this.power.handleToggle(e)}
         ?disabled="${this.power.disabled}"
         ?color=${this.power.isOn}>
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
