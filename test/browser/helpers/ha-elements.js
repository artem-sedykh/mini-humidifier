// Stand-ins for the Home Assistant elements the card renders.
//
// None of `ha-card`, `ha-icon`, `ha-icon-button`, `ha-relative-time` or
// `ha-entity-toggle` exists outside a running Home Assistant frontend, and the
// card only ever passes properties into them and reads nothing back. What the
// tests need from them is that they exist: `buildElementDefinitions` looks each
// one up in the global registry, and a component whose definitions are still
// pending renders an empty template instead of its own markup.
//
// `ha-slider` is the one that is not interchangeable - the card lays the row
// out differently depending on which generation is registered - so it is a
// parameter. The slider tests pass each generation in turn; everything else
// takes the current one.

import { WebAwesomeSlider } from './sliders.js';

const define = (name, element) => {
  if (!customElements.get(name)) customElements.define(name, element);
};

// The real elements bring their own `display`, and the card's styles size them
// on the strength of it - an inline stand-in collapses, and anything that
// measures the layout then measures nothing.
const shadow = (element, styles) => {
  if (!element.shadowRoot)
    element.attachShadow({ mode: 'open' }).innerHTML = `<style>${styles}</style><slot></slot>`;
};

class HaCard extends HTMLElement {
  connectedCallback() {
    shadow(this, ':host { display: block; }');
  }
}

class HaIcon extends HTMLElement {
  connectedCallback() {
    shadow(this, ':host { display: inline-block; }');
  }
}

class HaIconButton extends HTMLElement {
  connectedCallback() {
    shadow(this, ':host { display: inline-flex; align-items: center; justify-content: center; }');
    // The real one wraps a <button>, so it takes focus. Without this the card
    // can hand focus back to it and nothing happens, which is a difference
    // worth not having in a test.
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
  }
}

class HaRelativeTime extends HTMLElement {}

class HaEntityToggle extends HTMLElement {}

export const defineHaElements = ({ slider = WebAwesomeSlider } = {}) => {
  define('ha-slider', slider);
  define('ha-card', HaCard);
  define('ha-icon', HaIcon);
  define('ha-icon-button', HaIconButton);
  define('ha-relative-time', HaRelativeTime);
  define('ha-entity-toggle', HaEntityToggle);
};
