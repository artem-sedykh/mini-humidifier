import { expect } from '@open-wc/testing';
import { mountCard } from './helpers/card.js';

// The readings along the bottom of the card, and the option that says in which
// order they go. It did nothing at all until #171: `mh-indicators` sorted by a
// property `IndicatorObject` did not have, so every pair compared equal.
const rendered = card =>
  [...card.shadowRoot.querySelector('mh-indicators').shadowRoot.querySelectorAll('.state')].map(
    state => state.textContent.replace(/\s+/g, ' ').trim(),
  );

describe('the indicators', () => {
  it('follow the order the model declares', async () => {
    const { card } = await mountCard();

    // zhimi.humidifier.cb1: water level, temperature, humidity, motor speed.
    expect(rendered(card)).to.deep.equal(['80 %', '21.5 °C', '45 %', '300 rpm']);
  });

  it('follow the order the YAML asks for', async () => {
    const { card } = await mountCard({
      config: { indicators: { temperature: { order: 0 }, water_level: { order: 9 } } },
    });

    // Temperature to the front, water level to the back; the two the YAML does
    // not mention keep the model's numbers and stay between them.
    expect(rendered(card)).to.deep.equal(['21.5 °C', '45 %', '300 rpm', '80 %']);
  });

  it('put an indicator the configuration does not number where it was added', async () => {
    const { card } = await mountCard({
      config: {
        indicators: {
          bedroom_pressure: {
            icon: 'mdi:gauge',
            unit: 'hPa',
            source: { entity: 'sensor.bedroom_temperature' },
          },
        },
      },
    });

    // No `order` of its own, so it takes its position - which is the end,
    // because that is where merging the YAML over the model's defaults put it.
    expect(rendered(card)).to.have.lengthOf(5);
    expect(rendered(card)[4]).to.equal('21.5 hPa');
  });

  it('leaves a hidden indicator out without disturbing the rest', async () => {
    const { card } = await mountCard({
      config: { indicators: { temperature: { hide: true } } },
    });

    expect(rendered(card)).to.deep.equal(['80 %', '45 %', '300 rpm']);
  });
});
