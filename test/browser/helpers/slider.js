import { fixture } from '@open-wc/testing';
import { defineHaElements } from './ha-elements.js';
import HumidifierTargetHumidity from '../../../src/components/targetHumidity.js';

// One generation of `ha-slider` per test file, because the answer is cached in
// the module and a custom element name can only be registered once - a page
// that has seen `ha-slider` cannot be asked about another flavour of it.
export const mountTargetHumidity = async slider => {
  defineHaElements({ slider });
  if (!customElements.get('mh-target-humidity'))
    customElements.define('mh-target-humidity', HumidifierTargetHumidity);

  const element = document.createElement('mh-target-humidity');
  element.targetHumidity = {
    value: 50,
    min: 30,
    max: 80,
    step: 10,
    unit: '%',
    icon: 'mdi:water-percent',
    iconStyle: {},
    disabled: false,
    hideIndicator: false,
  };

  const mounted = await fixture(element);
  await mounted.updateComplete;

  return {
    row: mounted.shadowRoot.querySelector('.mh-target_humidifier'),
    slider: mounted.shadowRoot.querySelector('ha-slider'),
  };
};
