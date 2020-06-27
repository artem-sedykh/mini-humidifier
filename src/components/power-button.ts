import { LitElement, html, css, customElement, property, TemplateResult, CSSResult } from 'lit-element';
import sharedStyle from '../sharedStyle';
import { PowerButton } from '../models/power-button';

@customElement('mh-power')
export class HumidifierPowerButton extends LitElement {
  @property() public button!: PowerButton;
  constructor() {
    super();
  }

  protected render(): TemplateResult | void {
    if (this.button.hide) return;

    if (this.button.type === 'toggle') {
      return html`
        <ha-entity-toggle .stateObj=${this.button.entity} .hass=${this.button.hass}> </ha-entity-toggle>
      `;
    }

    return html`
      <mh-button class="power-button" .button=${this.button}> </mh-button>
    `;
  }

  static get styles(): CSSResult[] {
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
