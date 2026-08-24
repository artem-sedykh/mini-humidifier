import { css, html, LitElement } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import buildElementDefinitions from '../utils/buildElementDefinitions';

// Home Assistant has shipped three different `ha-slider` implementations across
// the versions this card supports, and they do not lay out alike:
//
//   HA 2022.11 - 2023.10   @polymer/paper-slider
//   HA 2023.11 - 2025.9    @material/web MdSlider
//   HA 2025.10 and newer   WebAwesome Slider
//
// The first two bring their own height, and the row squeezes them into place.
// The WebAwesome one is a column flexbox whose only sized child is the 4px
// track, packed to the top: stretched the same way, the track lands on top of
// the entity name instead of in the middle of the row.
//
// Detected from the element class rather than from the Home Assistant version,
// because it is the element that changed. `defaultValue` and `withTooltip` come
// from the WebAwesome slider and exist on neither predecessor. If Home
// Assistant ever renames both, this falls back to the legacy layout - wrong,
// but not broken.
let isWebAwesome = null;

const usesWebAwesomeSlider = () => {
  if (isWebAwesome === null) {
    const ctor = customElements.get('ha-slider');
    // Not defined yet: do not answer, and do not cache the guess.
    if (!ctor) return false;
    isWebAwesome = 'defaultValue' in ctor.prototype || 'withTooltip' in ctor.prototype;
  }
  return isWebAwesome;
};

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

    // min/max/step/value are bound as properties, not attributes, on every
    // flavour. On the WebAwesome slider the `value` attribute maps to
    // `defaultValue`, so once the user has dragged the thumb, writing the
    // attribute stops moving it and the card drifts away from the entity state.
    // `pin` and `ignore-bar-touch` belong to paper-slider and are inert on the
    // other two.
    const webAwesome = usesWebAwesomeSlider();

    return html`
      <div class='mh-target_humidifier --slider flex ${webAwesome ? 'wa' : 'legacy'}'>
        <ha-slider
          @change=${e => this.handleChange(e)}
          @click=${e => e.stopPropagation()}
          ?disabled="${this.targetHumidity.disabled}"
          ?pin=${!webAwesome}
          ?ignore-bar-touch=${!webAwesome}
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
        align-items: center;
        height: var(--mh-unit);
        width: 100%;
      }
      .mh-target_humidifier ha-slider {
        width: 100%;
        line-height: normal;
      }
      /* paper-slider and MdSlider size themselves, so the row lets the slider
         take the space the state row leaves and pulls it back up over it. */
      .mh-target_humidifier.legacy ha-slider {
        flex: 1;
        margin-top: calc(var(--mh-unit) * -.35);
      }
      .mh-target_humidifier.legacy .mh-target_humidifier__state {
        margin-top: calc(var(--mh-unit) * -.1);
      }
      /* The WebAwesome slider has no height of its own, so the row sets one and
         centres the track inside it. */
      .mh-target_humidifier.wa {
        justify-content: center;
      }
      .mh-target_humidifier.wa ha-slider {
        flex: 0 0 auto;
        box-sizing: border-box;
        min-width: 0;
        height: calc(var(--mh-unit) * .5);
        /* half a thumb on each side, so it is not clipped at min/max */
        padding: 0 8px;
        justify-content: center;
        margin: 0;
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
