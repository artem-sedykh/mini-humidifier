import { LitElement, html, css } from 'lit-element';

class MiniHumidifierInfo extends LitElement {
  static get properties() {
    return {
      humidifier: {},
      hass: {},
      config: {},
    };
  }

  renderDepth(config, humidifier) {
    if (config.depth.hide)
      return '';

    return html`
       <div class='state depth'>
         <iron-icon class='state__value_icon' .icon=${config.depth.icon}></iron-icon>
         <span class='state__value ellipsis'>${humidifier.depth}</span>
         <span class='state__uom ellipsis'>${config.depth.unit}</span>
       </div>
    `;
  }

  renderTemperature(config, humidifier) {
    if (config.temperature.hide)
      return '';

    return html`
       <div class='state temperature'>
         <iron-icon class='state__value_icon' .icon=${config.temperature.icon}></iron-icon>
         <span class='state__value ellipsis'>${humidifier.temperature}</span>
         <span class='state__uom ellipsis'>${config.temperature.unit}</span>
       </div>
    `;
  }

  renderHumidity(config, humidifier) {
    if (config.humidity.hide)
      return '';

    return html`
       <div class='state humidity'>
         <iron-icon class='state__value_icon' .icon=${config.humidity.icon}></iron-icon>
         <span class='state__value ellipsis'>${humidifier.humidity}</span>
         <span class='state__uom ellipsis'>${config.humidity.unit}</span>
       </div>
    `;
  }

  render() {
    const source = [
      { order: this.config.humidity.order, render: this.renderHumidity },
      { order: this.config.depth.order, render: this.renderDepth },
      { order: this.config.temperature.order, render: this.renderTemperature }]
      .sort((a, b) => ((a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0)));

    const conf = this.config;
    const h = this.humidifier;

    return html`
     <div class='mh-humidifier-state__container'>
       ${source.map(item => item.render(conf, h))}
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
       min-height: 10px;
     }
     .state {
        position: relative;
        display: flex;
        flex-wrap: nowrap;
        max-width: 100%;
        min-width: 0px;
        margin-right: 4px;
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
