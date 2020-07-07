import { LitElement, html, css, customElement, property, TemplateResult, CSSResult } from 'lit-element';
import sharedStyle from '../sharedStyle';
import { DropdownItem } from '../types';
import { StyleInfo, styleMap } from 'lit-html/directives/style-map';

@customElement('mh-dropdown-base')
export class HumidifierDropdownBase extends LitElement {
  @property() icon!: string;
  @property() active!: boolean;
  @property() disabled!: boolean;
  @property() selected!: string;
  @property() items!: DropdownItem[];
  @property() customStyle!: StyleInfo;

  get selectedIndex(): number {
    return this.items.map(item => item.id).indexOf(this.selected);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private onChange(e: any): void {
    const id = e.target.selected;
    if (id !== this.selectedIndex && this.items[id]) {
      this.dispatchEvent(
        new CustomEvent<DropdownItem>('change', {
          detail: this.items[id],
        }),
      );
      e.target.selected = -1;
    }
  }

  private _calcIcon(): string {
    const item = this.items[this.selectedIndex];
    if (item && item.icon) return item.icon.toString();

    return this.icon;
  }

  protected render(): TemplateResult | void {
    return html`
      <paper-menu-button
        class="mh-dropdown"
        noink
        no-animations
        .horizontalAlign=${'right'}
        .verticalAlign=${'top'}
        .verticalOffset=${44}
        .dynamicAlign=${true}
        ?disabled=${this.disabled}
        @click=${(e: Event): void => e.stopPropagation()}
      >
        <ha-icon-button
          style=${styleMap(this.customStyle)}
          class="mh-dropdown__button icon"
          slot="dropdown-trigger"
          .icon=${this._calcIcon()}
          ?disabled=${this.disabled}
          ?color=${this.active}
        >
        </ha-icon-button>
        <paper-listbox slot="dropdown-content" .selected=${this.selectedIndex} @iron-select=${this.onChange}>
          ${this.items.map(
            item => html`
              <paper-item value=${item.id || item.name}>
                <span class="mh-dropdown__item__label">${item.name}</span>
              </paper-item>
            `,
          )}
        </paper-listbox>
      </paper-menu-button>
    `;
  }

  static get styles(): CSSResult[] {
    return [
      sharedStyle,
      css`
        :host {
          position: relative;
          overflow: hidden;
          --paper-item-min-height: 40px;
        }
        paper-menu-button :host([disabled]) {
          opacity: 0.25;
          pointer-events: none;
        }
        :host([faded]) {
          opacity: 0.75;
        }
        .mh-dropdown {
          padding: 0;
          display: block;
        }
        ha-icon-button[disabled] {
          opacity: 0.5;
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
        paper-item > *:nth-child(2) {
          margin-left: 4px;
        }
        paper-menu-button[focused] ha-icon-button {
          color: var(--mh-accent-color);
        }
        paper-menu-button[focused] ha-icon-button[focused] {
          color: var(--mh-text-color);
          transform: rotate(0deg);
        }
        ha-icon-button[color] {
          color: var(--mh-icon-active-color);
          opacity: 1;
        }
      `,
    ];
  }
}
