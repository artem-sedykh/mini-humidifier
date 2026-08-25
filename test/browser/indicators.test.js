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

describe('styling a reading', () => {
  // `value: { style }` colours the number and its unit; `icon: { style }` keeps
  // the icon. Two options rather than one widened to cover both, because an
  // icon style carries geometry - the AQI indicator of zhimi.airpurifier.ma2
  // sets --mdc-icon-size and a margin in it - which on the row would resize and
  // shift what it landed on. #213.
  const styled = async () => {
    const { card } = await mountCard({
      config: {
        model: 'none',
        indicators: {
          humidity: {
            unit: '%',
            source: { entity: 'sensor.bedroom_humidity' },
            icon: {
              template: "() => 'mdi:water'",
              style: "() => ({ '--mdc-icon-size': '17px', color: 'blue' })",
            },
            value: { style: '(value) => ({ color: Number(value) > 40 ? "red" : "green" })' },
          },
        },
      },
    });

    const indicators = card.shadowRoot.querySelector('mh-indicators').shadowRoot;

    return {
      row: indicators.querySelector('.state'),
      icon: indicators.querySelector('ha-icon'),
      value: indicators.querySelector('.state__value'),
      unit: indicators.querySelector('.state__uom'),
    };
  };

  it('colours the number and its unit', async () => {
    const { value, unit } = await styled();

    // 45 in the fixture, so the template's red branch.
    expect(value.style.color).to.equal('red');
    expect(unit.style.color).to.equal('red');
  });

  it('leaves the icon its own style', async () => {
    const { icon } = await styled();

    expect(icon.style.color).to.equal('blue');
    expect(icon.style.getPropertyValue('--mdc-icon-size')).to.equal('17px');
  });

  it('puts neither style on the row', async () => {
    // Where the discarded design would have put both.
    const { row } = await styled();

    expect(row.getAttribute('style')).to.not.exist;
  });
});
