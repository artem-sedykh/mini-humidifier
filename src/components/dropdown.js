import { LitElement, html, css } from 'lit-element';

import sharedStyle from '../sharedStyle';

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
        <paper-icon-button class='mh-dropdown__button icon' slot='dropdown-trigger'
          .icon=${this.icon}
          ?disabled=${this.disabled}
          ?color=${this.active}>
        </paper-icon-button>
        <paper-listbox slot="dropdown-content" .selected=${this.selectedId} @iron-select=${this.onChange}>
          ${this.items.map(item => html`
            <paper-item value=${item.id || item.name}>
              <span class='mh-dropdown__item__label'>${item.name}</span>
            </paper-item>`)}
        </paper-listbox>
      </paper-menu-button>
    `;
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
        paper-icon-button[disabled] {
          opacity: .25;
          pointer-events: none;
        }
        .mh-dropdown__button.icon {
          height: var(--mh-unit);
          margin: 0;
        }
        paper-item > *:nth-child(2) {
          margin-left: 4px;
        }
        paper-menu-button[focused] paper-icon-button {
          color: var(--mh-accent-color);
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
