import { LitElement, html, css } from 'lit';
import type { PropertyValues } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import sharedStyle from '../sharedStyle';
import define from '../utils/define';
import type ButtonObject from '../models/button';

export default class HumidifierButton extends LitElement {
  // Set by mh-buttons and mh-power, never by an attribute.
  button!: ButtonObject;

  private _isOn: boolean;

  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    super();
    this._isOn = false;
    this.timer = undefined;
  }

  static override get properties() {
    return {
      button: { type: Object },
    };
  }

  handleToggle(e: Event) {
    e.stopPropagation();

    this._isOn = !this._isOn;
    const { lastChanged } = this.button;
    const { lastUpdated } = this.button;

    this.button.handleToggle();

    clearTimeout(this.timer);

    this.timer = setTimeout(async () => {
      const { button } = this;
      const changed = lastChanged !== button.lastChanged || lastUpdated !== button.lastUpdated;

      if (changed === false) {
        this._isOn = this.button.isOn;
        this.requestUpdate('_isOn');
      }
    }, this.button.actionTimeout);

    this.requestUpdate('_isOn');
  }

  override render() {
    clearTimeout(this.timer);

    return html`
       <ha-icon-button
         style=${styleMap(this.button.style)}
         @click=${(e: Event) => this.handleToggle(e)}
         ?disabled="${this.button.disabled || this.button.isUnavailable}"
         ?color=${this._isOn}>
         <ha-icon icon="${this.button.icon}"></ha-icon>
        </ha-icon-button>
    `;
  }

  // See the note in targetHumidity.js: deriving state from a changed property
  // belongs in `willUpdate`. `_isOn` is not a reactive property, which is why
  // this had to ask for the update by hand - and that request, arriving after
  // the update it was made from had completed, is what lit warned about. From
  // here the value is simply picked up by the render that is already coming.
  override willUpdate(changedProps: PropertyValues) {
    if (changedProps.has('button')) {
      this._isOn = this.button.isOn;

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

define('mh-button', HumidifierButton);
