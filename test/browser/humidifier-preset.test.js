import { aTimeout, expect } from '@open-wc/testing';
import { components, mountCard, settle } from './helpers/card.js';
import { ENTITY_ID } from './helpers/hass.js';

const shadow = (element, selector) => element.shadowRoot.querySelector(selector);

const dropdown = (card, id) =>
  components(card).find(
    component => component.localName === 'mh-dropdown' && component.dropdown.id === id,
  );

// `model: humidifier` is the preset for the domain rather than for a device
// (#207), so what it is checked against here is a device that reports nothing
// but the domain: no sensor entities beside it, no Xiaomi services, and in the
// first half not even a mode.
const PLAIN = {
  mode: undefined,
  available_modes: undefined,
  humidity: 50,
  current_humidity: 45,
  min_humidity: 20,
  max_humidity: 60,
};

const plainCard = (attributes = {}) =>
  mountCard({ config: { model: 'humidifier' }, attributes: { ...PLAIN, ...attributes } });

describe('the humidifier preset', () => {
  it('takes the slider range from the entity, which is the only place it exists', async () => {
    const { card } = await plainCard();
    const targetHumidity = shadow(card, 'mh-target-humidity');
    const slider = shadow(targetHumidity, 'ha-slider');

    // Not 30-80, which is the Xiaomi range every device-specific preset here
    // carries, and not 0-100, which is what the component falls back to.
    expect([slider.min, slider.max]).to.deep.equal([20, 60]);
  });

  it('shows the reading the domain puts on the entity itself', async () => {
    const { card } = await plainCard();
    const indicators = shadow(card, 'mh-indicators');

    expect(indicators.shadowRoot.querySelector('.state__value').textContent.trim()).to.equal('45');
    expect(indicators.shadowRoot.querySelector('.state__uom').textContent.trim()).to.equal('%');
  });

  it('leaves the slot empty rather than showing NaN when there is no reading', async () => {
    const { card } = await plainCard({ current_humidity: undefined });
    const indicators = shadow(card, 'mh-indicators');

    expect(indicators.shadowRoot.querySelector('.state__value').textContent.trim()).to.equal('');
    expect(indicators.shadowRoot.querySelector('.state__uom')).to.not.exist;
  });

  it('calls the domain service to turn the device off', async () => {
    const { card, hass } = await plainCard();

    shadow(shadow(shadow(card, 'mh-power'), 'mh-button'), 'ha-icon-button').click();
    await aTimeout(50);

    expect(hass.calls).to.deep.equal([
      { domain: 'humidifier', service: 'turn_off', options: { entity_id: ENTITY_ID } },
    ]);
  });

  it('calls the domain service to set the humidity', async () => {
    const { card, hass } = await plainCard();
    const targetHumidity = shadow(card, 'mh-target-humidity');
    const slider = shadow(targetHumidity, 'ha-slider');

    slider.value = 55;
    slider.dispatchEvent(new Event('change'));
    await settle(targetHumidity);

    expect(hass.calls).to.deep.equal([
      {
        domain: 'humidifier',
        service: 'set_humidity',
        options: { entity_id: ENTITY_ID, humidity: 55 },
      },
    ]);
  });

  it('disables the mode dropdown on a device with no modes', async () => {
    // A generic_hygrostat has none. Disabled rather than absent, because `hide`
    // is not a template and a device that gains modes should get its dropdown
    // back without the configuration changing.
    const { card } = await plainCard();

    card.toggle = true;
    await settle(card);

    expect(dropdown(card, 'mode').dropdown.disabled).to.be.true;
  });

  it('offers the modes the device reports and sets the one picked', async () => {
    const { card, hass } = await plainCard({ mode: 'normal', available_modes: ['normal', 'eco'] });

    card.toggle = true;
    await settle(card);

    const mode = dropdown(card, 'mode');

    expect(mode.dropdown.disabled).to.be.false;
    expect(mode.dropdown.source.map(item => item.id)).to.deep.equal(['normal', 'eco']);

    const base = mode.shadowRoot.querySelector('mh-dropdown-base');
    base.shadowRoot.querySelector('ha-icon-button').click();
    await base.updateComplete;
    base.shadowRoot.querySelector('.mh-dropdown__item[data-value="eco"]').click();
    await aTimeout(50);

    expect(hass.calls).to.deep.equal([
      {
        domain: 'humidifier',
        service: 'set_mode',
        options: { entity_id: ENTITY_ID, mode: 'eco' },
      },
    ]);
  });
});
