import { LitElement, html, css } from 'lit-element';

class MiniHumidifierInfo extends LitElement {
  static get properties() {
    return {
      humidifier: {},
      hass: {},
      config: {},
    };
  }

  renderDepth(context) {
    if (context.config.depth.hide)
      return '';

    return html`
       <div class='state depth'>
         <iron-icon class='state__value_icon' .icon=${context.config.depth.icon}></iron-icon>
         <span class='state__value ellipsis'>${context.humidifier.depth}</span>
         <span class='state__uom ellipsis'>${context.config.depth.unit}</span>
       </div>
    `;
  }

  renderTemperature(context) {
    if (context.config.temperature.hide)
      return '';

    return html`
       <div class='state temperature'>
         <iron-icon class='state__value_icon' .icon=${context.config.temperature.icon}></iron-icon>
         <span class='state__value ellipsis'>${context.humidifier.temperature}</span>
         <span class='state__uom ellipsis'>${context.config.temperature.unit}</span>
       </div>
    `;
  }

  renderHumidity(context) {
    if (context.config.humidity.hide)
      return '';

    return html`
       <div class='state humidity'>
         <iron-icon class='state__value_icon' .icon=${context.config.humidity.icon}></iron-icon>
         <span class='state__value ellipsis'>${context.humidifier.humidity}</span>
         <span class='state__uom ellipsis'>${context.config.humidity.unit}</span>
       </div>
    `;
  }

  render() {
    const conf = this.config;
    const context = this;

    const source = [
      { order: conf.humidity.order, render: this.renderHumidity },
      { order: conf.depth.order, render: this.renderDepth },
      { order: conf.temperature.order, render: this.renderTemperature }]
      .sort((a, b) => ((a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0)));

    return html`
     <div class='mh-humidifier-state__container'>
       ${source.map(item => item.render(context))}
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
