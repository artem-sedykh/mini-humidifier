if (!customElements.get('ha-slider')) {
  customElements.define(
    'ha-slider',
    class extends customElements.get('paper-slider') {},
  );
}

export default class HumidifierSlider extends customElements.get('ha-slider') {
  static get defineId() { return 'ha-slider'; }
}
