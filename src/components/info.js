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
    return html`
       <div class='state depth'>
         <iron-icon class='state__value_icon' .icon=${context.config.depth.icon}></iron-icon>
         <span class='state__value'>${context.humidifier.depth}</span>
         <span class='state__uom'>${context.config.depth.unit}</span>
       </div>
    `;
  }

  renderTemperature(context) {
    return html`
       <div class='state temperature'>
         <iron-icon class='state__value_icon' .icon=${context.config.temperature.icon}></iron-icon>
         <span class='state__value'>${context.humidifier.temperature}</span>
         <span class='state__uom'>${context.config.temperature.unit}</span>
       </div>
    `;
  }

  renderHumidity(context) {
    return html`
       <div class='state humidity'>
         <iron-icon class='state__value_icon' .icon=${context.config.humidity.icon}></iron-icon>
         <span class='state__value'>${context.humidifier.humidity}</span>
         <span class='state__uom'>${context.config.humidity.unit}</span>
       </div>
    `;
  }

  render() {
    const context = this;
    const temperatureConf = this.config.temperature;
    const humidityConf = this.config.humidity;
    const depthConf = this.config.depth;

    const source = [
      { hide: humidityConf.hide, order: humidityConf.order, render: this.renderHumidity },
      { hide: depthConf.hide, order: depthConf.order, render: this.renderDepth },
      { hide: temperatureConf.hide, order: temperatureConf.order, render: this.renderTemperature }]
      .filter(i => !i.hide)
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
        min-width: 0;
        overflow: hidden;
        font-size: calc(var(--mh-unit) * .325);
        line-height: calc(var(--mh-unit) / 2);
      }
     .mh-humidifier-state__container {
       display: flex;
     }
     .state {
        position: relative;
        display: flex;
        flex-wrap: nowrap;
        margin-right: calc(var(--mh-unit) * .1);
     }
     .state__value_icon {
        height: calc(var(--mh-unit) * .475);
        width: calc(var(--mh-unit) * .425);
        color: var(--mh-icon-color);
     }
     .state__value {
        margin: 0 1px;
        font-weight: var(--mh-info-font-weight);
     }
     .state__uom {
        font-size: calc(var(--mh-unit) * .275);
        line-height: calc(var(--mh-unit) * .55);
        height: calc(var(--mh-unit) * .475);
        opacity: 0.8;
     }
     .humidity .state__value {
        margin: 0;
     }
    `;
  }
}

customElements.define('mp-humidifier-state', MiniHumidifierInfo);
