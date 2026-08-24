// The three `ha-slider` implementations Home Assistant has shipped, as far as
// `src/components/targetHumidity.js` can tell them apart: it asks the
// registered class whether `defaultValue` or `withTooltip` is on its prototype,
// because those two are WebAwesome's and exist on neither predecessor.
//
// Only the shape matters here, so each stub carries the accessors of the real
// element, plus the `display` it brings with it - the card sizes the slider in
// its own styles, and an inline stand-in would take no space at all.

const display = element => {
  if (!element.shadowRoot)
    element.attachShadow({ mode: 'open' }).innerHTML =
      '<style>:host { display: block; min-height: 4px; }</style>';
};

// HA 2022.11 - 2023.10, @polymer/paper-slider.
export class PaperSlider extends HTMLElement {
  connectedCallback() {
    display(this);
  }

  get pin() {
    return this.hasAttribute('pin');
  }

  get ignoreBarTouch() {
    return this.hasAttribute('ignore-bar-touch');
  }
}

// HA 2023.11 - 2025.9, @material/web MdSlider.
export class MdSlider extends HTMLElement {
  connectedCallback() {
    display(this);
  }

  get labeled() {
    return this.hasAttribute('labeled');
  }

  get valueLabel() {
    return '';
  }
}

// HA 2025.10 and newer, the WebAwesome slider.
export class WebAwesomeSlider extends HTMLElement {
  connectedCallback() {
    display(this);
  }

  get defaultValue() {
    return 0;
  }

  get withTooltip() {
    return false;
  }
}
