import { LitElement, html, css } from 'lit';
import sharedStyle from '../sharedStyle';
import './button';
import './dropdown';
import define from '../utils/define';
import type ButtonObject from '../models/button';

// Two buttons without an order compare as equal, which is what
// `undefined > undefined` did before this was typed.
const byOrder = (a: number | undefined, b: number | undefined): number => {
  if (a === undefined || b === undefined) return 0;

  return a > b ? 1 : b > a ? -1 : 0;
};

export default class HumidifierButtons extends LitElement {
  /** The buttons of the model configuration, by id. */
  buttons!: Record<string, ButtonObject>;

  static override get properties() {
    return {
      buttons: {},
    };
  }

  renderButton(button: ButtonObject) {
    if (button.isUnavailable) return '';
    return html`
       <mh-button
         class="custom-button"
         .button=${button}>
        </mh-button>
    `;
  }

  renderDropdown(dropdown: ButtonObject) {
    return html`
      <mh-dropdown
        .dropdown=${dropdown}>
      </mh-dropdown>
    `;
  }

  renderInternal(button: ButtonObject) {
    if (button.type === 'dropdown') return this.renderDropdown(button);

    return this.renderButton(button);
  }

  override render() {
    return html`${Object.values(this.buttons)
      .filter(b => !b.hide)
      .sort((a, b) => byOrder(a.order, b.order))
      .map(button => this.renderInternal(button))}`;
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

define('mh-buttons', HumidifierButtons);
