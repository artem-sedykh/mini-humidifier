import { expect } from '@open-wc/testing';
import { components, mountCard, settle } from './helpers/card.js';
import HUMIDIFIERS from '../../src/humidifiers.ts';

// The union of what the bundled configurations read off the entity. A model
// whose configuration reaches for an attribute that is not here renders the
// same way it would against a device that does not report it.
const ATTRIBUTES = {
  mode: 'auto',
  available_modes: ['auto', 'silent', 'medium', 'high'],
  preset_mode: 'auto',
  preset_modes: ['auto', 'silent', 'medium', 'high'],
  clean_mode: 'off',
  depth: 60,
  water_level: 40,
  humidity: 50,
  target_humidity: 50,
  led_brightness: 1,
  dry: false,
  buzzer: false,
  child_lock: false,
};

// `default` is an alias for one of the others, and `humidifiers.test.js`
// already pins down which.
const MODELS = Object.keys(HUMIDIFIERS).filter(model => model !== 'default');

describe('every model in the registry', () => {
  // A model configuration is a file of callbacks that run against the entity:
  // `entity.attributes.mode.toUpperCase()` and the like. Nothing calls them
  // until the card renders, so a model can be merged, configured and counted by
  // the layers above while still throwing the moment it is put on a dashboard.
  for (const model of MODELS) {
    it(`${model} renders`, async () => {
      const { card } = await mountCard({ config: { model }, attributes: ATTRIBUTES });

      // Open the buttons panel: half of each configuration is behind it.
      card.toggle = true;
      await settle(card);

      expect(card.shadowRoot.querySelector('ha-card')).to.exist;

      for (const component of components(card)) {
        expect(component.shadowRoot.childElementCount, component.localName).to.be.greaterThan(0);
      }
    });
  }
});
