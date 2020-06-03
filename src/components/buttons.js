import { LitElement, html, css } from 'lit-element';
import { styleMap } from 'lit-html/directives/style-map';
import sharedStyle from '../sharedStyle';
import './dropdown';
import './button';

class HumidifierButtons extends LitElement {
  static get properties() {
    return {
      buttons: {},
    };
  }

  renderButton(button) {
    if (button.isUnavailable)
      return '';

    return html`
       <mh-button
         .button=${button}>
        </mh-button>
    `;
  }

  renderDropdown(dropdown) {
    let selected = '';
    if (dropdown.state !== null && dropdown.state !== undefined)
      selected = dropdown.state.toString();

    return html`
      <mh-dropdown
        style=${styleMap(dropdown.style)}
        @change=${e => dropdown.handleChange(e)}
        .items=${dropdown.source}
        .icon=${dropdown.icon}
        .disabled="${dropdown.disabled}"
        .active=${dropdown.isActive}
        .selected=${selected}>
      </mh-dropdown>
    `;
  }

  renderInternal(button) {
    if (button.type === 'dropdown')
      return this.renderDropdown(button);

    return this.renderButton(button);
  }

  render() {
    const context = this;
    return html`${Object.entries(this.buttons)
      .map(b => b[1])
      .filter(b => !b.hide)
      .sort((a, b) => ((a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0)))
      .map(button => context.renderInternal(button))}`;
  }

  static get styles() {
    return [
      sharedStyle,
      css`
      :host {
        position: relative;
        box-sizing: border-box;
        margin: 0;
        overflow: hidden;
        transition: background .5s;
        --paper-item-min-height: var(--mh-unit);
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
    `];
  }
}

customElements.define('mh-buttons', HumidifierButtons);
