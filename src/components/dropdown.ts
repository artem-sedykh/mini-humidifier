import { LitElement, html, css, customElement, property, TemplateResult, CSSResult } from 'lit-element';
import sharedStyle from '../sharedStyle';
import { PropertyValues } from 'lit-element/src/lib/updating-element';
import { Dropdown } from '../models/dropdown';
import { HASSDomEvent } from 'custom-card-helpers/src/fire-event';
import { DropdownItem } from '../types';

@customElement('mh-dropdown')
export class HumidifierDropdown extends LitElement {
  private _timer: NodeJS.Timeout | undefined;
  private _state: string | undefined;

  @property() public dropdown!: Dropdown;
  constructor() {
    super();
    this._timer = undefined;
    this._state = undefined;
  }

  private _handleChange(ev: HASSDomEvent<DropdownItem>): Promise<unknown> {
    ev.stopPropagation();

    const selected = ev.detail.id;
    const { entity } = this.dropdown;
    this._state = selected;

    this.dropdown.change(selected).then();

    if (this._timer) clearTimeout(this._timer);

    this._timer = setTimeout(async () => {
      if (this.dropdown.entity === entity) {
        this._state = this.dropdown.state?.toString() || '';

        return this.requestUpdate('_state');
      }
    }, this.dropdown.actionTimeout);

    return this.requestUpdate('_state');
  }

  protected render(): TemplateResult | void {
    return html`
      <mh-dropdown-base
        .customStyle=${this.dropdown.style}
        @change=${this._handleChange}
        .items=${this.dropdown.source}
        .icon=${this.dropdown.icon}
        .disabled="${this.dropdown.disabled}"
        .active=${this.dropdown.isActive(this._state)}
        .selected=${this._state}
      >
      </mh-dropdown-base>
      ${this.renderLabel()}
    `;
  }

  private renderLabel(): TemplateResult | void {
    const label = this.dropdown.label;
    if (!label) return;

    return html`
      <span class="label">${label}</span>
    `;
  }

  protected updated(changedProps: PropertyValues): void {
    if (changedProps.has('dropdown')) {
      this._state = this.dropdown.state?.toString() || '';

      if (this._timer) clearTimeout(this._timer);

      this.requestUpdate('_state').then();
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
        mh-dropdown-base,
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
