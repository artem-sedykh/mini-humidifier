import { css, html, LitElement } from 'lit';
import { styleMap } from 'lit/directives/style-map';
import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import buildElementDefinitions from '../utils/buildElementDefinitions';

export default class HumidifierTargetHumidity extends ScopedRegistryHost(LitElement) {
  static get defineId() {
    return 'mh-target-humidity';
  }

  static get elementDefinitions() {
    return buildElementDefinitions(['ha-slider', 'ha-icon'], HumidifierTargetHumidity);
  }

  static get properties() {
    return {
      targetHumidity: { type: Object },
      sliderValue: { type: Number },
    };
  }

  constructor() {
    super();
    this.targetHumidity = {};
    this.timer = undefined;
  }

  handleChange(e) {
    e.stopPropagation();
    this.sliderValue = e.target.value;
    const { entity } = this.targetHumidity;
    this.targetHumidity.handleChange(this.sliderValue);

    if (this.timer) clearTimeout(this.timer);

    this.timer = setTimeout(async () => {
      if (this.targetHumidity.entity === entity) {
        this.sliderValue = this.targetHumidity.value;
        this.requestUpdate('sliderValue');
      }
    }, this.targetHumidity.actionTimeout);

    this.requestUpdate('sliderValue');
  }

  get sliderMin() {
    const { min } = this.targetHumidity;
    return typeof min === 'number' ? min : 0;
  }

  get sliderMax() {
    const { max } = this.targetHumidity;
    return typeof max === 'number' ? max : 100;
  }

  get sliderStep() {
    const { step } = this.targetHumidity;
    return typeof step === 'number' ? step : 1;
  }

  renderState() {
    if (this.targetHumidity.hideIndicator)
      return html`<div class="mh-target_humidifier__state"></div>`;

    return html`
        <div class="mh-target_humidifier__state">
           <ha-icon
             class='state__value_icon'
             style=${styleMap(this.targetHumidity.iconStyle)}
             .icon=${this.targetHumidity.icon}>
           </ha-icon>
           <span class='state__value ellipsis'>${this.sliderValue}</span>
           <span class='state__uom ellipsis'>${this.targetHumidity.unit}</span>
        </div>
    `;
  }

  render() {
    if (!HumidifierTargetHumidity.elementDefinitionsLoaded) {
      return html``;
    }

    return html`
      <div class='mh-target_humidifier --slider flex'>
        <ha-slider
          @change=${e => this.handleChange(e)}
          @click=${e => e.stopPropagation()}
          ?disabled="${this.targetHumidity.disabled}"
          .min=${this.sliderMin}
          .max=${this.sliderMax}
          .step=${this.sliderStep}
          .value=${Number(this.sliderValue) || this.sliderMin}
          dir=${'ltr'}>
        </ha-slider>
        ${this.renderState(this.sliderValue)}
      </div>`;
  }

  updated(changedProps) {
    if (changedProps.has('targetHumidity')) {
      this.sliderValue = this.targetHumidity.value;
    }
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
        justify-content: center;
        align-items: center;
        height: var(--mh-unit);
        width: 100%;
      }
      /* ha-slider has no intrinsic height of its own: it is a column flexbox
         whose only sized child is the 4px track, packed to the top. So the row
         must set the height and do the centering itself - stretching the slider
         with flex:1 pins the track to the top of the row instead. */
      .mh-target_humidifier ha-slider {
        flex: 0 0 auto;
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        height: calc(var(--mh-unit) * .5);
        /* half a thumb on each side, so it is not clipped at min/max */
        padding: 0 8px;
        justify-content: center;
        margin: 0;
        line-height: normal;
      }
      .mh-target_humidifier__state {
        position: relative;
        display: flex;
        flex-wrap: nowrap;
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
