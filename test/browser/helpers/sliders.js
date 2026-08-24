// The three `ha-slider` implementations Home Assistant has shipped, as far as
// `src/components/targetHumidity.js` can tell them apart: it asks the
// registered class whether `defaultValue` or `withTooltip` is on its prototype,
// because those two are WebAwesome's and exist on neither predecessor.
//
// Only the shape matters here, so each stub carries the accessors of the real
// element and nothing else.

// HA 2022.11 - 2023.10, @polymer/paper-slider.
export class PaperSlider extends HTMLElement {
  get pin() {
    return this.hasAttribute('pin');
  }

  get ignoreBarTouch() {
    return this.hasAttribute('ignore-bar-touch');
  }
}

// HA 2023.11 - 2025.9, @material/web MdSlider.
export class MdSlider extends HTMLElement {
  get labeled() {
    return this.hasAttribute('labeled');
  }

  get valueLabel() {
    return '';
  }
}

// HA 2025.10 and newer, the WebAwesome slider.
export class WebAwesomeSlider extends HTMLElement {
  get defaultValue() {
    return 0;
  }

  get withTooltip() {
    return false;
  }
}
