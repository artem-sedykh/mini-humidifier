import { LitElement, html, css } from 'lit';
import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import sharedStyle from '../sharedStyle';
import HumidifierMenu from './mwc/menu';
import HumidifierListItem from './mwc/list-item';
import buildElementDefinitions from '../utils/buildElementDefinitions';
import globalElementLoader from '../utils/globalElementLoader';

export default class HumidifierDropdownBase extends ScopedRegistryHost(LitElement) {
  static get defineId() { return 'mh-dropdown-base'; }

  static get elementDefinitions() {
    return buildElementDefinitions([
      globalElementLoader('ha-icon'),
      globalElementLoader('ha-icon-button'),
      HumidifierMenu,
      HumidifierListItem,
    ], HumidifierDropdownBase);
  }

  static get properties() {
    return {
      items: [],
      label: String,
      selected: String,
      icon: String,
      active: Boolean,
      disabled: Boolean,
    };
  }

  get selectedId() {
    return this.items.map(item => item.id.toString().toUpperCase())
      .indexOf(this.selected.toString().toUpperCase());
  }

  onChange(e) {
    const { index } = e.detail;
    if (index !== this.selectedId && this.items[index]) {
      this.dispatchEvent(new CustomEvent('change', {
        detail: this.items[index],
      }));
      e.detail.index = -1;
    }
  }

  handleClick() {
    const menu = this.shadowRoot.querySelector('#menu');
    menu.anchor = this.shadowRoot.querySelector('#button');
    menu.show();
  }

  render() {
    return html`
      <div class='mh-dropdown'>
        <ha-icon-button class='mh-dropdown__button icon'
                        id=${'button'}
                        @click=${this.handleClick}
                        ?disabled=${this.disabled}
                        ?color=${this.active}>
          <ha-icon .icon=${this.icon}></ha-icon>
        </ha-icon-button>
        <mwc-menu fixed
                  id=${'menu'}
                  ?quick=${true}
                  .menuCorner=${'END'}
                  .corner=${'TOP_RIGHT'}
                  @selected=${this.onChange}>
          ${this.items.map(item => html`
            <mwc-list-item value=${item.id || item.name} ?selected=${this.selected === item.id}>
              <span class='mh-dropdown__item__label'>${item.name}</span>
            </mwc-list-item>`)}
        </mwc-menu>
      </div>
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
        .mh-dropdown
        :host([disabled]) {
          opacity: .25;
          pointer-events: none;
        }
        :host([faded]) {
          opacity: .75;
        }
        .mh-dropdown {
          padding: 0;
        }
        ha-icon-button[disabled] {
          opacity: .25;
          pointer-events: none;
        }
        .mh-dropdown__button.icon {
          margin: 0;
        }
        ha-icon-button {
          width: calc(var(--mh-dropdown-unit));
          height: calc(var(--mh-dropdown-unit));
          --mdc-icon-button-size: calc(var(--mh-dropdown-unit));
        }
        mwc-item > *:nth-child(2) {
          margin-left: 4px;
        }
        .mh-dropdown[focused] ha-icon-button {
          color: var(--mh-accent-color);
        }
        .mh-dropdown[focused] ha-icon-button[focused] {
          color: var(--mh-text-color);
          transform: rotate(0deg);
        }
      `,
    ];
  }
}
