import { LitElement, html, css } from 'lit-element';

import { ICON } from '../const';

class MiniHumidifierInfo extends LitElement {
  static get properties() {
    return {
      humidifier: {},
      hass: {},
      config: {},
    };
  }

  render() {
    return html`
     <div class='mh-humidifier-state__container'>
       <div class='state first'>
         <span class='state__value ellipsis'>${this.humidifier.temperature}</span>
         <span class='state__uom ellipsis'>°C</span>
       </div>
       <div class='state'>
         <iron-icon class='state__value_icon' .icon=${ICON.HUMIDITY}></iron-icon>
         <span class='state__value ellipsis'>${this.humidifier.humidity}</span>
         <span class='state__uom ellipsis'>%</span>
       </div>
       <div class='state last'>
         <iron-icon class='state__value_icon' .icon=${ICON.DEPTH}></iron-icon>
         <span class='state__value ellipsis'>${this.humidifier.depth}</span>
         <span class='state__uom ellipsis'>%</span>
       </div>
     </div>
    `;
  }

  static get styles() {
    return css`
     :host {
        position: relative;
        box-sizing: border-box;
        margin: 4px;
        min-width: 0;
        overflow: hidden;
        transition: background .5s;
        font-size: 17px;
        font-weight: 300;
      }
     .mh-humidifier-state__container {
       display: flex;
       font-weight: 300;
     }
     .state {
        position: relative;
        display: flex;
        flex-wrap: nowrap;
        max-width: 100%;
        min-width: 0px;
        width: 52px;
     }
     .state.first {
        width: 49px;
     }
     .state.last {
        margin-right: 0;
        width: 62px;
     }
     .last .state__value {
        margin-left: 2px;
     }
     .state__value_icon {
        height: calc(var(--mh-unit) - 10);
        width: calc(var(--mh-unit) / 2);
        color: var(--mh-icon-color);
     }
     .state__value {
        display: inline-block;
        line-height: calc(var(--mh-unit) / 2);
     }
     .state__uom {
        align-self: flex-end;
        display: inline-block;
        font-size: 12px;
        font-weight: 400;
        line-height: calc(var(--mh-unit) * .4);
        margin-top: 1px;
        opacity: 0.6;
        vertical-align: bottom;
        flex: 1 1 0%;
     }
    `;
  }
}

customElements.define('mp-humidifier-state', MiniHumidifierInfo);
