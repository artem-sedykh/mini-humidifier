import { LitElement, html, css } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import handleClick from '../utils/handleClick';
import { TAP_ACTIONS } from '../const';
import define from '../utils/define';
import type IndicatorObject from '../models/indicator';

export default class HumidifierIndicators extends LitElement {
  /** The indicators of the model configuration, by id. */
  indicators!: Record<string, IndicatorObject>;

  static override get properties() {
    return {
      indicators: {},
    };
  }

  handlePopup(e: Event, indicator: IndicatorObject) {
    e.stopPropagation();
    handleClick(this, indicator.hass, indicator.config.tap_action, indicator.entity.entity_id);
  }

  renderIcon(indicator: IndicatorObject) {
    const { icon } = indicator;

    if (!icon) return '';

    return html`<ha-icon style=${styleMap(indicator.iconStyle)} class='state__value_icon' .icon=${icon}></ha-icon>`;
  }

  renderUnit(unit: string) {
    if (!unit) return '';

    return html`<span class='state__uom'>${unit}</span>`;
  }

  renderIndicator(indicator: IndicatorObject) {
    if (!indicator) return '';
    const action =
      indicator.config && indicator.config.tap_action && indicator.config.tap_action.action;
    const cls = action && TAP_ACTIONS.includes(action) ? 'pointer' : '';
    // console.log(`render ${indicator.id} value: ${indicator.value}`);

    return html`
       <div class='state ${cls}' @click=${(e: Event) => this.handlePopup(e, indicator)}>
         ${this.renderIcon(indicator)}
         <span class='state__value'>${indicator.value}</span>
         ${this.renderUnit(indicator.unit)}
       </div>
    `;
  }

  // The indicators render in the order the configuration built them. There was
  // a sort by `order` here, but `IndicatorObject` exposes no such property, so
  // the comparator returned 0 for every pair and the option that
  // `docs/indicators.md` documents has never done anything. Removing a sort
  // that cannot sort is a no-op; making the option work is a fix of its own.
  override render() {
    // console.log('render Indicators');

    return html`
     <div class='mh-indicators__container'>
       ${Object.values(this.indicators)
         .filter(i => !i.hide)
         .map(i => this.renderIndicator(i))}
     </div>
    `;
  }

  static override get styles() {
    return css`
     :host {
        position: relative;
        box-sizing: border-box;
        font-size: calc(var(--mh-unit) * .35);
        line-height: calc(var(--mh-unit) * .35);
      }
     .mh-indicators__container {
       display: flex;
       flex-wrap: wrap;
       margin-right: calc(var(--mh-unit) * .075);
     }
     .state {
        position: relative;
        display: flex;
        flex-wrap: nowrap;
        margin-right: calc(var(--mh-unit) * .1);
     }
     .pointer {
        cursor: pointer
     }
     .state__value_icon {
        height: calc(var(--mh-unit) * .475);
        width: calc(var(--mh-unit) * .5);
        color: var(--mh-icon-color);
        --mdc-icon-size: calc(var(--mh-unit) * 0.5);
     }
     .state__value {
        margin: 0 1px;
        font-weight: var(--mh-info-font-weight);
        line-height: calc(var(--mh-unit) * .475);
     }
     .state__uom {
        font-size: calc(var(--mh-unit) * .275);
        line-height: calc(var(--mh-unit) * .525);
        margin-left: 1px;
        height: calc(var(--mh-unit) * .475);
        opacity: 0.8;
     }
    `;
  }
}

define('mh-indicators', HumidifierIndicators);
