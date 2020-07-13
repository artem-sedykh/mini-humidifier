import { css, CSSResult, customElement, html, LitElement, property, TemplateResult } from 'lit-element';
import { SecondaryInfo } from '../models/secondary-info';
import { styleMap } from 'lit-html/directives/style-map';

@customElement('mh-secondary-info')
export class CardSecondaryInfo extends LitElement {
  @property() public secondaryInfo!: SecondaryInfo;

  private renderIcon(): TemplateResult | void {
    if (!this.secondaryInfo.icon) return;
    const style = this.secondaryInfo.iconStyle || {};

    return html`
      <ha-icon style=${styleMap(style)} class="icon" .icon=${this.secondaryInfo.icon}> </ha-icon>
    `;
  }

  protected render(): TemplateResult | void {
    if (!this.secondaryInfo) return html``;
    const style = this.secondaryInfo.style || {};

    return html`
      <div class="entity__secondary_info ellipsis">
        ${this.renderIcon()}
        <span style=${styleMap(style)} class="value">${this.secondaryInfo.label}</span>
      </div>
    `;
  }

  static get styles(): CSSResult {
    return css`
      :host {
        position: relative;
        box-sizing: border-box;
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
    `;
  }
}
