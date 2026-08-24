import { css, html, LitElement } from 'lit';
import sharedStyle from '../sharedStyle';
import './button';
import define from '../utils/define';
import type ButtonObject from '../models/button';

export default class HumidifierPower extends LitElement {
  power!: ButtonObject;

  static override get properties() {
    return {
      power: { type: Object },
    };
  }

  override render() {
    if (this.power.hide) return html``;

    if (this.power.type === 'toggle') {
      return html`
          <ha-entity-toggle
            .stateObj=${this.power.entity}
            .hass=${this.power.hass}>
          </ha-entity-toggle>
      `;
    }

    return html`
       <mh-button
         class="power-button"
         .button=${this.power}>
        </mh-button>
    `;
  }

  static override get styles() {
    return [
      sharedStyle,
      css`
     :host {
        position: relative;
        box-sizing: border-box;
        min-width: 0;
        font-weight: var(--mh-info-font-weight);
      }
    `,
    ];
  }
}

define('mh-power', HumidifierPower);
