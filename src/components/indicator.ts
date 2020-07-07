import { css, CSSResult, customElement, html, LitElement, property, TemplateResult } from 'lit-element';
import { Indicator } from '../models/indicator';
import { TapAction } from '../types';
import { styleMap } from 'lit-html/directives/style-map';
import { ActionHandlerEvent } from 'custom-card-helpers/dist';
import { handleClick } from '../utils/utils';

@customElement('mh-indicator')
export class CardIndicator extends LitElement {
  @property() public indicator!: Indicator;

  private _onClick(ev: ActionHandlerEvent): void {
    ev.preventDefault();
    handleClick(this, this.indicator.hass, this.indicator.tapAction);
  }

  private renderIcon(): TemplateResult | void {
    if (!this.indicator.icon) return;
    const style = this.indicator.iconStyle || {};

    return html`
      <ha-icon style=${styleMap(style)} class="state__value_icon" .icon=${this.indicator.icon}> </ha-icon>
    `;
  }

  private renderUnit(): TemplateResult | void {
    if (!this.indicator.unit) return;
    const style = this.indicator.unitStyle || {};

    return html`
      <span style=${styleMap(style)} class="state__uom">${this.indicator.unit}</span>
    `;
  }

  protected render(): TemplateResult | void {
    if (!this.indicator) return html``;
    const cls = this.indicator.tapAction.action !== TapAction.None ? 'pointer' : '';

    return html`
      <div class="state ${cls}" @click=${this._onClick}>
        ${this.renderIcon()}
        <span class="state__value">${this.indicator.state}</span>
        ${this.renderUnit()}
      </div>
    `;
  }

  static get styles(): CSSResult {
    return css`
      :host {
        position: relative;
        box-sizing: border-box;
        font-size: calc(var(--mh-unit) * 0.35);
        line-height: calc(var(--mh-unit) * 0.35);
      }
      .state {
        position: relative;
        display: flex;
        flex-wrap: nowrap;
        margin-right: calc(var(--mh-unit) * 0.1);
      }
      .pointer {
        cursor: pointer;
      }
      .state__value_icon {
        height: calc(var(--mh-unit) * 0.475);
        width: calc(var(--mh-unit) * 0.5);
        color: var(--mh-icon-color);
        --mdc-icon-size: calc(var(--mh-unit) * 0.5);
      }
      .state__value {
        margin: 0 1px;
        font-weight: var(--mh-info-font-weight);
        line-height: calc(var(--mh-unit) * 0.475);
      }
      .state__uom {
        font-size: calc(var(--mh-unit) * 0.275);
        line-height: calc(var(--mh-unit) * 0.525);
        margin-left: 1px;
        height: calc(var(--mh-unit) * 0.475);
        opacity: 0.8;
      }
    `;
  }
}
