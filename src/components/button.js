import { LitElement, html, css } from 'lit-element';
import { styleMap } from 'lit-html/directives/style-map';
import sharedStyle from '../sharedStyle';

class HumidifierButton extends LitElement {
  constructor() {
    super();
    this._isOn = false;
    this.timer = undefined;
  }

  static get properties() {
    return {
      button: { type: Object },
    };
  }

  handleToggle(e) {
    e.stopPropagation();

    this._isOn = !this._isOn;
    const { lastChanged } = this.button;
    const { lastUpdated } = this.button;

    this.button.handleToggle();

    clearTimeout(this.timer);

    const context = this;
    this.timer = setTimeout(async () => {
      const { button } = context;
      const changed = lastChanged !== button.lastChanged || lastUpdated !== button.lastUpdated;

      if (changed === false) {
        this._isOn = this.button.isOn;
        return this.requestUpdate('_isOn');
      }
    }, this.button.actionTimeout);

    return this.requestUpdate('_isOn');
  }

  render() {
    clearTimeout(this.timer);

    return html`
       <ha-icon-button
         style=${styleMap(this.button.style)}
         .icon=${this.button.icon}
         @click=${e => this.handleToggle(e)}
         ?disabled="${this.button.disabled || this.button.isUnavailable}"
         ?color=${this._isOn}>
        </ha-icon-button>
    `;
  }

  updated(changedProps) {
    if (changedProps.has('button')) {
      this._isOn = this.button.isOn;

      clearTimeout(this.timer);

      return this.requestUpdate('_isOn');
    }
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

customElements.define('mh-button', HumidifierButton);
