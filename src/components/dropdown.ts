import { LitElement, html, css } from 'lit';
import type { PropertyValues } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import sharedStyle from '../sharedStyle';
import './dropdown-base';
import define from '../utils/define';
import type ButtonObject from '../models/button';

export default class HumidifierDropDown extends LitElement {
  dropdown!: ButtonObject;

  private timer: ReturnType<typeof setTimeout> | undefined;

  private _state: string | undefined;

  constructor() {
    super();
    this.dropdown = {} as ButtonObject;
    this.timer = undefined;
    this._state = undefined;
  }

  static override get properties() {
    return {
      dropdown: { type: Object },
    };
  }

  handleChange(e: CustomEvent) {
    e.stopPropagation();

    const selected = e.detail.id;
    const { entity } = this.dropdown;
    this._state = selected;

    this.dropdown.handleChange(selected);

    clearTimeout(this.timer);

    this.timer = setTimeout(async () => {
      if (this.dropdown.entity === entity) {
        this._state =
          this.dropdown.state !== undefined && this.dropdown.state !== null
            ? this.dropdown.state.toString()
            : '';

        this.requestUpdate('_state');
      }
    }, this.dropdown.actionTimeout);

    this.requestUpdate('_state');
  }

  override render() {
    clearTimeout(this.timer);

    return html`
      <mh-dropdown-base
        style=${styleMap(this.dropdown.style)}
        @change=${(e: CustomEvent) => this.handleChange(e)}
        .items=${this.dropdown.source}
        .icon=${this.dropdown.icon}
        .disabled="${this.dropdown.disabled}"
        .active=${this.dropdown.isActive(this._state)}
        .selected=${this._state}>
      </mh-dropdown-base>
    `;
  }

  // Same as mh-button: derive `_state` before the render that needs it, rather
  // than asking for another render afterwards.
  override willUpdate(changedProps: PropertyValues) {
    if (changedProps.has('dropdown')) {
      this._state =
        this.dropdown.state !== undefined && this.dropdown.state !== null
          ? this.dropdown.state.toString()
          : '';

      clearTimeout(this.timer);
    }
  }

  static override get styles() {
    return [
      sharedStyle,
      css`
      :host {
        position: relative;
        box-sizing: border-box;
        margin: 0;
        overflow: hidden;
        transition: background .5s;
        --mh-dropdown-unit: var(--mh-unit);
      }
      :host([color]) {
        background: var(--mh-active-color);
        transition: background .25s;
        opacity: 1;
      }
      :host([disabled]) {
        opacity: .25;
        pointer-events: none;
      }
    `,
    ];
  }
}

define('mh-dropdown', HumidifierDropDown);
