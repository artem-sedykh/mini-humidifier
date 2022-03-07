import { LitElement, html, css } from 'lit';
import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import { styleMap } from 'lit/directives/style-map';
import handleClick from '../utils/handleClick';
import { TAP_ACTIONS } from '../const';
import HumidifierIcon from './ha/icon';
import buildElementDefinitions from '../utils/buildElementDefinitions';


export default class HumidifierIndicators extends ScopedRegistryHost(LitElement) {
  static get defineId() { return 'mh-indicators'; }

  static get elementDefinitions() {
    return buildElementDefinitions([HumidifierIcon]);
  }

  static get properties() {
    return {
      indicators: {},
    };
  }

  handlePopup(e, indicator) {
    e.stopPropagation();
    handleClick(this, indicator.hass, indicator.config.tap_action, indicator.entity.entity_id);
  }

  renderIcon(indicator) {
    const { icon } = indicator;

    if (!icon)
      return '';

    return html`<ha-icon style=${styleMap(indicator.iconStyle)} class='state__value_icon' .icon=${icon}></ha-icon>`;
  }

  renderUnit(unit) {
    if (!unit)
      return '';

    return html`<span class='state__uom'>${unit}</span>`;
  }

  renderIndicator(indicator) {
    if (!indicator)
      return '';
    const action = indicator.config && indicator.config.tap_action
      && indicator.config.tap_action.action;
    const cls = action && TAP_ACTIONS.includes(action) ? 'pointer' : '';
    // console.log(`render ${indicator.id} value: ${indicator.value}`);

    return html`
       <div class='state ${cls}' @click=${e => this.handlePopup(e, indicator)}>
         ${this.renderIcon(indicator)}
         <span class='state__value'>${indicator.value}</span>
         ${this.renderUnit(indicator.unit)}
       </div>
    `;
  }

  render() {
    const context = this;
    // console.log('render Indicators');

    return html`
     <div class='mh-indicators__container'>
       ${Object.entries(this.indicators)
    .map(i => i[1])
    .filter(i => !i.hide)
    .sort((a, b) => ((a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0)))
    .map(i => context.renderIndicator(i))}
     </div>
    `;
  }

  static get styles() {
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
