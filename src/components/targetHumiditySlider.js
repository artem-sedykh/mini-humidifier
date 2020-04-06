import { LitElement, html, css } from 'lit-element';

import { ICON } from '../const';

class MiniHumidifierTargetHumiditySlider extends LitElement {
  static get properties() {
    return {
      humidifier: {},
      hass: {},
    };
  }

  handleTargetHumidityChange(ev) {
    const vol = parseFloat(ev.target.value);
    this.sliderValue = vol;
    this.humidifier.setTargetHumidity(ev, vol);
  }

  render() {
    const sliderValue = this.sliderValue || this.humidifier.targetHumidity;
    return html`
      <div class='mh-target_humidifier --slider flex'>
        <ha-slider
          @change=${this.handleTargetHumidityChange}
          @click=${e => e.stopPropagation()}
          min=${this.humidifier.minTargetHumidity}
          max=${this.humidifier.maxTargetHumidity}
          step=${this.humidifier.targetHumidityStep}
          value=${this.humidifier.targetHumidity}
          dir=${'ltr'}
          ignore-bar-touch pin>
        </ha-slider>
        <div class="mh-target_humidifier__state">
           <iron-icon class='state__value_icon' .icon=${ICON.HUMIDITY}></iron-icon>
           <span class='state__value ellipsis'>${sliderValue}</span>
           <span class='state__uom ellipsis'>%</span>
        </div>
      </div>`;
  }

  static get styles() {
    return css`
     :host {
        position: relative;
        box-sizing: border-box;
        min-width: 0;
        font-weight: 300;
        font-size: 17px;
      }
      .mh-target_humidifier.flex {
        display: flex;
      }
      .mh-target_humidifier ha-slider {
        flex: 1;
        height: calc(var(--mh-unit) * .5);
        margin: 0 -2px 0 -9px;
      }
      .mh-target_humidifier__state {
        position: relative;
        line-height: calc(var(--mh-unit) * .5);
        display: flex;
        flex-wrap: nowrap;
        min-width: 0px;
     }
     .state__value_icon {
        height: calc(var(--mh-unit) * .5);
        width: calc(var(--mh-unit) / 2);
        color: var(--mh-icon-color);
     }
     .state__value {
        display: inline-block;
        margin-right: 2px;
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

customElements.define('mp-target-humidity-slider', MiniHumidifierTargetHumiditySlider);
