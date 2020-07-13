import { css, CSSResult, customElement, html, LitElement, property, TemplateResult } from 'lit-element';
import { SecondaryInfo } from '../models/secondary-info';
import sharedStyle from '../sharedStyle';
import { PropertyValues } from 'lit-element/src/lib/updating-element';
import { styleMap } from 'lit-html/directives/style-map';

@customElement('mh-secondary-info-dropdown')
export class CardSecondaryInfoDropdown extends LitElement {
  private _timer: NodeJS.Timeout | undefined;
  private _state: string | undefined;

  @property() public secondaryInfo!: SecondaryInfo;

  constructor() {
    super();
    this._timer = undefined;
    this._state = undefined;
  }

  get selectedIndex(): number {
    return this.secondaryInfo.source.map(item => item.id).indexOf(this._state || '');
  }

  private _renderState(): TemplateResult {
    const item = this.secondaryInfo.source.find(i => i.id === this._state);
    const label = item ? item.name : this.secondaryInfo.state;
    const icon = this.secondaryInfo.icon ? this.secondaryInfo.icon : item?.icon;

    return html`
      <ha-icon class="icon" .icon=${icon}></ha-icon>
      <span class="value">${label}</span>
    `;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _handleChange(e: any): Promise<unknown> {
    const index = e.target.selected;

    if (index === this.selectedIndex || !this.secondaryInfo.source[index]) {
      return new Promise<unknown>(() => undefined);
    }
    const selected = this.secondaryInfo.source[index].id;

    const { entity } = this.secondaryInfo;
    this._state = selected;

    this.secondaryInfo.change(selected).then();

    if (this._timer) clearTimeout(this._timer);

    this._timer = setTimeout(async () => {
      if (this.secondaryInfo.entity === entity) {
        this._state = this.secondaryInfo.state?.toString() || '';

        return this.requestUpdate('_state');
      }
    }, this.secondaryInfo.actionTimeout);

    return this.requestUpdate('_state');
  }

  protected render(): TemplateResult | void {
    if (!this.secondaryInfo) return html``;
    const style = this.secondaryInfo.style || {};

    return html`
      <div class="entity__secondary_info ellipsis">
        <paper-menu-button
          class="mc-dropdown"
          active=${this.secondaryInfo.isActive(this._state)}
          style=${styleMap(style)}
          noink
          no-animations
          .horizontalAlign=${'right'}
          .verticalAlign=${'top'}
          .verticalOffset=${44}
          ?disabled=${this.secondaryInfo.disabled}
          .dynamicAlign=${true}
        >
          <div class="wrap" slot="dropdown-trigger">
            ${this._renderState()}
          </div>
          <paper-listbox slot="dropdown-content" .selected=${this.selectedIndex} @iron-select=${this._handleChange}>
            ${this.secondaryInfo.source.map(
              item => html`
                <paper-item value=${item.id || item.name}>
                  <span class="mh-dropdown__item__label">${item.name}</span>
                </paper-item>
              `,
            )}
          </paper-listbox>
        </paper-menu-button>
      </div>
    `;
  }

  protected updated(changedProps: PropertyValues): void {
    if (changedProps.has('secondaryInfo')) {
      this._state = this.secondaryInfo.state?.toString() || '';

      if (this._timer) clearTimeout(this._timer);

      this.requestUpdate('_state').then();
    }
  }

  static get styles(): CSSResult[] {
    return [
      sharedStyle,
      css`
        :host {
          position: relative;
          box-sizing: border-box;
        }
        paper-menu-button {
          padding: 0;
        }
        .ellipsis {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .entity__secondary_info {
          margin-top: -2px;
        }
        .icon {
          color: var(--mh-icon-color);
          height: calc(var(--mh-unit) * 0.5);
          width: calc(var(--mh-unit) * 0.5);
          min-width: calc(var(--mh-unit) * 0.5);
          --mdc-icon-size: calc(var(--mh-unit) * 0.5);
        }
        .value {
          overflow: hidden;
          text-overflow: ellipsis;
          vertical-align: middle;
          white-space: nowrap;
          line-height: calc(var(--mh-unit) * 0.525);
          color: var(--mh-text-color);
          font-weight: var(--mh-info-font-weight);
        }
      `,
    ];
  }
}
