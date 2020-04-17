import { LitElement, html, css } from 'lit-element';

import sharedStyle from '../sharedStyle';
import './button';

class MiniHumidifierDropdown extends LitElement {
  static get properties() {
    return {
      humidifier: {},
      items: [],
      label: String,
      selected: String,
      icon: String,
      active: Boolean,
      disabled: Boolean,
    };
  }

  get selectedId() {
    return this.items.map(item => item.id).indexOf(this.selected);
  }

  onChange(e) {
    const id = e.target.selected;
    if (id !== this.selectedId && this.items[id]) {
      this.dispatchEvent(new CustomEvent('change', {
        detail: this.items[id],
      }));
      e.target.selected = -1;
    }
  }

  render() {
    return html`
      <paper-menu-button
        class='mh-dropdown'
        noink no-animations
        .horizontalAlign=${'right'}
        .verticalAlign=${'top'}
        .verticalOffset=${44}
        .dynamicAlign=${true}
        ?disabled=${this.disabled}
        @click=${e => e.stopPropagation()}>
        <mh-button class='mh-dropdown__button' slot='dropdown-trigger' ?disabled=${this.disabled}>
          <div>
            <iron-icon ?color=${this.active} class='mh-dropdown__icon' .icon=${this.icon}></iron-icon>
            ${this.renderLabel()}
          </div>
        </mh-button>
        <paper-listbox slot="dropdown-content" .selected=${this.selectedId} @iron-select=${this.onChange}>
          ${this.items.map(item => html`
            <paper-item value=${item.id || item.name}>
              ${item.icon ? html`<iron-icon .icon=${item.icon}></iron-icon>` : ''}
              ${item.name ? html`<span class='mh-dropdown__item__label'>${item.name}</span>` : ''}
            </paper-item>`)}
        </paper-listbox>
      </paper-menu-button>
    `;
  }

  renderLabel() {
    if (this.label)
      return html`
        <span class='mh-dropdown__label ellipsis'>
                ${this.label}
         </span>
      `;
    return '';
  }

  static get styles() {
    return [
      sharedStyle,
      css`
        :host {
          position: relative;
          overflow: hidden;
        }
        paper-menu-button
        :host([disabled]) {
          opacity: .25;
          pointer-events: none;
        }
        :host([faded]) {
          opacity: .75;
        }
        .mh-dropdown {
          padding: 0;
          display: block;
        }
        .mh-dropdown__button {
          display: flex;
          font-size: 1em;
          justify-content: space-between;
          align-items: center;
          height: calc(var(--mh-unit) - 4px);
          margin: 2px 0;
        }
        .mh-dropdown__button.icon {
          height: var(--mh-unit);
          margin: 0;
        }
        .mh-dropdown__button > div {
          display: flex;
          flex: 1;
          justify-content: left;
          align-items: center;
          height: calc(var(--mh-unit) - 4px);
          max-width: 100%;
        }
        .mh-dropdown__label {
          text-align: left;
          text-transform: none;
          padding-left: 5px;
          font-weight: 300;
        }
        .mh-dropdown__icon {
          height: calc(var(--mh-unit) * .6);
          width: calc(var(--mh-unit) * .6);
          min-width: calc(var(--mh-unit) * .6);
          
        }
        iron-icon[color].mh-dropdown__icon {
          color: var(--mh-icon-active-color) !important;
          transition: background .25s;
          opacity: 1;
        }
        paper-item > *:nth-child(2) {
          margin-left: 4px;
        }
        paper-menu-button[focused] mh-button iron-icon {
          color: var(--mh-accent-color);
        }
        paper-menu-button[focused] paper-icon-button {
          color: var(--mh-accent-color);
          transform: rotate(180deg);
        }
        paper-menu-button[focused] paper-icon-button[focused] {
          color: var(--mh-text-color);
          transform: rotate(0deg);
        }
      `,
    ];
  }
}

customElements.define('mh-dropdown', MiniHumidifierDropdown);
