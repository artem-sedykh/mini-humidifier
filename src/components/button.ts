import { LitElement, html, css, customElement, property, TemplateResult, CSSResult } from 'lit-element';
import { styleMap } from 'lit-html/directives/style-map';
import sharedStyle from '../sharedStyle';
import { Button } from '../models/button';
import { ActionHandlerEvent } from 'custom-card-helpers/dist';
import { PropertyValues } from 'lit-element/src/lib/updating-element';

@customElement('mh-button')
export class HumidifierButton extends LitElement {
  private _isOn: boolean;
  private _timer: NodeJS.Timeout | undefined;

  @property() public button!: Button;
  constructor() {
    super();
    this._isOn = false;
    this._timer = undefined;
  }

  private _onClick(ev: ActionHandlerEvent): Promise<unknown> {
    ev.stopPropagation();
    const entity = this.button.entity;

    this._isOn = !this._isOn;
    this.button.toggle().then();

    if (this._timer) clearTimeout(this._timer);

    this._timer = setTimeout(async () => {
      if (this.button.entity === entity) {
        this._isOn = this.button.isOn;
        return this.requestUpdate('_isOn');
      }
    }, this.button.actionTimeout);

    return this.requestUpdate('_isOn');
  }

  protected render(): TemplateResult | void {
    return html`
      <ha-icon-button
        style="${styleMap(this.button.style)}"
        .icon=${this.button.icon}
        @click=${this._onClick}
        ?disabled="${this.button.disabled || this.button.isUnavailable}"
        ?color=${this._isOn}
      >
      </ha-icon-button>
      ${this.renderLabel()}
    `;
  }

  private renderLabel(): TemplateResult | void {
    const label = this.button.label;
    if (!label) return;

    return html`
      <span class="label">${label}</span>
    `;
  }

  protected updated(changedProps: PropertyValues): void {
    if (changedProps.has('button')) {
      this._isOn = this.button.isOn;

      if (this._timer) clearTimeout(this._timer);

      this.requestUpdate('_isOn').then();
    }
  }

  static get styles(): CSSResult[] {
    return [
      sharedStyle,
      css`
        :host {
          position: relative;
          box-sizing: border-box;
          margin: 0;
          overflow: hidden;
          transition: background 0.5s;
          --paper-item-min-height: var(--mh-unit);
          --mh-dropdown-unit: var(--mh-unit);
          --mdc-icon-size: calc(var(--mh-unit) * 0.6);
        }
        :host([color]) {
          background: var(--mh-active-color);
          transition: background 0.25s;
          opacity: 1;
        }
        :host([disabled]) {
          opacity: 0.25;
          pointer-events: none;
        }
        ha-icon-button[color] {
          color: var(--mh-icon-active-color);
          opacity: 1;
        }
        ha-icon-button,
        .label {
          display: flex;
          margin-left: auto;
          margin-right: auto;
        }
        .label {
          font-size: calc(var(--mh-unit) * 0.325);
          margin-top: calc(var(--mh-unit) * -0.125);
        }
      `,
    ];
  }
}
