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
  filter_hours_used: 402,
  dry: false,
  buzzer: false,
  child_lock: false,
};

// What a plain Home Assistant humidifier reports and no more: a target, a
// reading, and no modes at all - an MQTT humidifier, a `generic_hygrostat`.
// The keys are present and undefined rather than absent, because `createHass`
// spreads over its own defaults; what a template reads through them is the
// same either way.
const BASICS = {
  mode: undefined,
  available_modes: undefined,
  preset_mode: undefined,
  preset_modes: undefined,
  humidity: 50,
  current_humidity: 45,
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

      // `none` brings no controls at all - that is the whole of it (#186), so
      // its `mh-indicators` and `mh-buttons` are empty by design. They are also
      // zero pixels high, measured, so nothing is left holding space on the
      // card. What still matters for it is the assertion above, that it renders
      // at all: that is what caught `renderSecondaryInfo` reaching for a `mode`
      // button which a configuration without one does not have.
      if (model === 'none') return;

      for (const component of components(card)) {
        expect(component.shadowRoot.childElementCount, component.localName).to.be.greaterThan(0);
      }
    });
  }
});

// The same models against a device that reports none of what they were written
// for. A preset is free to render nothing useful there - it was written for
// somebody else's hardware - but it may not take a control down: these
// callbacks run inside a component's render, so a throw leaves that component
// empty and the card around it intact, which is a control that vanished with
// the reason in the console and nothing on screen. That is #70, which sat open
// for four years.
describe('every model against a device that reports only the basics', () => {
  for (const model of MODELS) {
    it(`${model} survives`, async () => {
      const { card } = await mountCard({ config: { model }, attributes: BASICS });

      card.toggle = true;
      await settle(card);

      expect(card.shadowRoot.querySelector('ha-card')).to.exist;

      if (model === 'none') return;

      for (const component of components(card)) {
        expect(component.shadowRoot.childElementCount, component.localName).to.be.greaterThan(0);
      }
    });
  }

  // The configuration from #70, in the shape it was reported: an MQTT
  // humidifier with no modes and no `model:` at all, which lands on the
  // default preset.
  it('the slider is there on a humidifier with no modes and no model', async () => {
    const { card } = await mountCard({ attributes: BASICS, config: { model: undefined } });

    const target = components(card).find(c => c.localName === 'mh-target-humidity');

    expect(target).to.exist;
    expect(target.shadowRoot.querySelector('ha-slider')).to.exist;
  });
});
