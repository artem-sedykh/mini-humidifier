import { fixture, nextFrame } from '@open-wc/testing';
import { defineHaElements } from './ha-elements.js';
import { createHass, ENTITY_ID } from './hass.js';
import '../../../src/main.js';

// The card as Home Assistant builds it: `setConfig` with the YAML, then `hass`,
// then into the document. Both orders matter - the `hass` setter reads
// `config.entity`, and the element definitions are looked up the first time an
// instance is created, so the stubs have to be registered before that.
export const mountCard = async ({ config = {}, ...state } = {}) => {
  defineHaElements();

  const hass = createHass(state);
  const element = document.createElement('mini-humidifier');

  element.setConfig({ entity: ENTITY_ID, model: 'zhimi.humidifier.cb1', ...config });
  element.hass = hass;

  const card = await fixture(element);
  await card.updateComplete;

  return { card, hass };
};

// Every `mh-*` element the card has rendered, wherever it sits in the nested
// shadow roots.
export const components = root => {
  const found = [];
  const walk = node => {
    for (const child of node.querySelectorAll('*')) {
      if (child.localName.startsWith('mh-')) found.push(child);
      if (child.shadowRoot) walk(child.shadowRoot);
    }
  };

  walk(root.shadowRoot || root);
  return found;
};

// Everything the card and its components scheduled has finished: the card's own
// update, and the updates its render started in the components below it.
export const settle = async card => {
  await card.updateComplete;
  await nextFrame();
};

// Counts render passes per element, by shadowing `render` on the instance.
//
// The alternative is `await el.updateComplete`, which lit resolves to `false`
// when an update was requested from inside the update cycle. That reads well,
// but it only answers for the cycle running at the moment it is asked, and by
// the time a walk of the shadow trees reaches a component two levels down, that
// component's cycle - second pass and all - is over. A counter does not care
// when it is read.
export const countRenders = elements => {
  const counts = new Map();

  for (const element of elements) {
    counts.set(element, 0);
    const render = element.render.bind(element);

    element.render = () => {
      counts.set(element, counts.get(element) + 1);
      return render();
    };
  }

  return counts;
};
