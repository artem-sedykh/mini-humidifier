import { LitElement, html, css } from 'lit';
import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import sharedStyle from '../sharedStyle';
import HumidifierButton from './button';
import HumidifierDropDown from './dropdown';
import buildElementDefinitions from '../utils/buildElementDefinitions';

export default class HumidifierButtons extends ScopedRegistryHost(LitElement) {
  static get defineId() { return 'mh-buttons'; }

  static get elementDefinitions() {
    return buildElementDefinitions([HumidifierDropDown, HumidifierButton], HumidifierButtons);
  }

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
         class="custom-button"
         .button=${button}>
        </mh-button>
    `;
  }

  renderDropdown(dropdown) {
    return html`
      <mh-dropdown
        .dropdown=${dropdown}>
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
