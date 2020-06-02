import { css, html, LitElement } from 'lit-element';

class TargetHumidity extends LitElement {
  static get properties() {
    return {
      targetHumidity: { type: Object },
      sliderValue: { type: Number },
    };
  }

  constructor() {
    super();
    this.targetHumidity = {};
  }

  handleChange(e) {
    e.stopPropagation();
    this.sliderValue = e.target.value;
    this.targetHumidity.handleChange(this.sliderValue);
    return this.requestUpdate('sliderValue');
  }

  renderState() {
    if (this.targetHumidity.hide)
      return html`<div class="mh-target_humidifier__state"></div>`;

    return html`
        <div class="mh-target_humidifier__state">
           <ha-icon class='state__value_icon' .icon=${this.targetHumidity.icon}></ha-icon>
           <span class='state__value ellipsis'>${this.sliderValue}</span>
           <span class='state__uom ellipsis'>${this.targetHumidity.unit}</span>
        </div>
    `;
  }

  render() {
    this.sliderValue = this.sliderValue || this.targetHumidity.value;
    return html`
      <div class='mh-target_humidifier --slider flex'>
        <ha-slider
          @change=${e => this.handleChange(e)}
          @click=${e => e.stopPropagation()}
          min=${this.targetHumidity.min}
          max=${this.targetHumidity.max}
          step=${this.targetHumidity.step}
          value=${this.targetHumidity.value}
          dir=${'ltr'}
          ignore-bar-touch pin>
        </ha-slider>
        ${this.renderState(this.sliderValue)}
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
        width: calc(var(--mh-unit) * .5);
        color: var(--mh-icon-color);
        --mdc-icon-size: calc(var(--mh-unit) * 0.5);
     }
     .state__value {
        font-size: calc(var(--mh-unit) * .35);
        line-height: calc(var(--mh-unit) * .475);
        margin: 0px 1px;
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

customElements.define('mh-target-humidity', TargetHumidity);
