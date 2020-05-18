import { LitElement, html, css } from 'lit-element';

class MiniHumidifierTargetHumiditySlider extends LitElement {
  static get properties() {
    return {
      humidifier: {},
      hass: {},
      config: {},
    };
  }

  handleTargetHumidityChange(ev) {
    const val = parseFloat(ev.target.value);
    this.sliderValue = val;
    this.humidifier.setTargetHumidity(ev, val);
  }

  renderTargetHumidifierState(sliderValue) {
    if (this.config.target_humidity.hide)
      return html`<div class="mh-target_humidifier__state"></div>`;

    return html`
        <div class="mh-target_humidifier__state">
           <ha-icon class='state__value_icon' .icon=${this.config.target_humidity.icon}></ha-icon>
           <span class='state__value ellipsis'>${sliderValue}</span>
           <span class='state__uom ellipsis'>${this.config.target_humidity.unit}</span>
        </div>
    `;
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
        ${this.renderTargetHumidifierState(sliderValue)}
      </div>`;
  }

  static get styles() {
    return css`
     :host {
        position: relative;
        box-sizing: border-box;
        min-width: 0;
        font-weight: var(--mh-info-font-weight);
      }
      .mh-target_humidifier.flex {
        display: flex;
        flex-direction: column-reverse;
        align-items: center;
        height: var(--mh-unit);
      }
      .mh-target_humidifier ha-slider {
        flex: 1;
        width: 100%;
        margin-top: calc(var(--mh-unit) * -.35);
        line-height: normal;
      }
      .mh-target_humidifier__state {
        position: relative;
        display: flex;
        flex-wrap: nowrap;
        margin-top: calc(var(--mh-unit) * -.1);
        height: calc(var(--mh-unit) * .45);
     }
     .state__value_icon {
        height: calc(var(--mh-unit) * .475);
        width: calc(var(--mh-unit) * .425);
        --mdc-icon-size: calc(var(--mh-unit) * .425);
        color: var(--mh-icon-color);
     }
     .state__value {
        font-size: calc(var(--mh-unit) * .325);
        line-height: calc(var(--mh-unit) / 2);
     }
     .state__uom {
        font-size: calc(var(--mh-unit) * .275);
        line-height: calc(var(--mh-unit) * .55);
        height: calc(var(--mh-unit) * .475);
        opacity: 0.8;
     }
    `;
  }
}

customElements.define('mp-target-humidity-slider', MiniHumidifierTargetHumiditySlider);
