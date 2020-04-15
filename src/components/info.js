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
       <div class='state depth'>
         <iron-icon class='state__value_icon' .icon=${ICON.DEPTH}></iron-icon>
         <span class='state__value ellipsis'>${this.humidifier.depth}</span>
         <span class='state__uom ellipsis'>${this.config.depth.unit}</span>
       </div>
       <div class='state temperature'>
         <iron-icon class='state__value_icon' .icon=${ICON.TEMPERATURE}></iron-icon>
         <span class='state__value ellipsis'>${this.humidifier.temperature}</span>
         <span class='state__uom ellipsis'>°C</span>
       </div>
       <div class='state humidity'>
         <iron-icon class='state__value_icon' .icon=${ICON.HUMIDITY}></iron-icon>
         <span class='state__value ellipsis'>${this.humidifier.humidity}</span>
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
     }
     .state {
        position: relative;
        display: flex;
        flex-wrap: nowrap;
        max-width: 100%;
        min-width: 0px;
        margin-left: 4px;
     }
     .depth {
        margin-left: 0;
     }
     .depth .state__value_icon {
        margin-right: 2px;
     }
     .humidity iron-icon {
        margin-right: -3px;
     }
     .state__value_icon {
        height: 17px;
        width: 17px;
        color: var(--mh-icon-color);
     }
     .state__value {
        font-size: 13px;
        display: inline-block;
        line-height: calc(var(--mh-unit) / 2);
     }
     .state__uom {
        font-size: 11px;
        align-self: flex-end;
        display: inline-block;
        line-height: 20px;
        font-weight: 400;
        margin-top: 1px;
        margin-left: 1px;
        opacity: 0.8;
        vertical-align: bottom;
        flex: 1 1 0%;
     }
    `;
  }
}

customElements.define('mp-humidifier-state', MiniHumidifierInfo);
