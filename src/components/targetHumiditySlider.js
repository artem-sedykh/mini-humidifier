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
    const sliderValue = this.sliderValue || this.humidifier.targetHumidity.value;
    return html`
      <div class='mh-target_humidifier --slider flex'>
        <ha-slider
          @change=${this.handleTargetHumidityChange}
          @click=${e => e.stopPropagation()}
          min=${this.humidifier.targetHumidity.min}
          max=${this.humidifier.targetHumidity.max}
          step=${this.humidifier.targetHumidity.step}
          value=${this.humidifier.targetHumidity.value}
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
        flex-direction: column-reverse;
        align-items: center;
      }
      .mh-target_humidifier ha-slider {
        height: calc(var(--mh-unit) - 15);
        flex: 1;
        width: 100%;
        margin-top: -10px;
        line-height: normal;
      }
      .mh-target_humidifier__state {
        position: relative;
        display: flex;
        flex-wrap: nowrap;
        min-width: 0px;
        height: calc(var(--mh-unit) * .375);
        line-height: calc(var(--mh-unit) * .375);
     }
     .state__value_icon {
        height: 17px;
        width: 17px;
        margin-top: -2px;
        color: var(--mh-icon-color);
        margin-right: -2px;
     }
     .state__value {
        font-size: 13px;
        display: inline-block;
        margin-right: 2px;
     }
     .state__uom {
        align-self: flex-end;
        display: inline-block;
        font-size: 11px;
        line-height: 13px;
        font-weight: 400;
        opacity: 0.8;
        vertical-align: bottom;
        flex: 1 1 0%;
     }
    `;
  }
}

customElements.define('mp-target-humidity-slider', MiniHumidifierTargetHumiditySlider);
