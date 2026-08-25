import { expect } from '@open-wc/testing';
import { components, mountCard, settle } from './helpers/card.js';

// What the card says about the parts of a configuration it cannot use. Both
// cases used to be silent, and both look identical from the dashboard: a
// control that is simply not there. #211.
const collectWarnings = () => {
  const original = console.warn;
  const seen = [];

  console.warn = (...args) => {
    seen.push(args.join(' '));
  };

  return {
    seen,
    restore: () => {
      console.warn = original;
    },
  };
};

describe('a control that cannot be built', () => {
  let warnings;

  beforeEach(() => {
    warnings = collectWarnings();
  });

  afterEach(() => {
    warnings.restore();
  });

  const missing = () => warnings.seen.filter(line => line.includes('does not exist'));

  it('names the entity that does not exist', async () => {
    await mountCard({
      config: { indicators: { humidity: { source: { entity: 'sensor.bedroom_2_humidity' } } } },
    });

    expect(missing()).to.have.lengthOf(1);
    expect(missing()[0]).to.contain("indicator 'humidity'");
    expect(missing()[0]).to.contain('sensor.bedroom_2_humidity');
  });

  it('says it once, not once per state change', async () => {
    // The card rebuilds its indicators whenever `hass` is set, which in a real
    // installation is every state change in the house.
    const { card, hass } = await mountCard({
      config: { buttons: { buzzer: { state: { entity: 'switch.bedroom_2_buzzer' } } } },
    });

    for (let i = 0; i < 5; i += 1) {
      card.hass = { ...hass };
      await settle(card);
    }

    expect(missing()).to.have.lengthOf(1);
    expect(missing()[0]).to.contain("button 'buzzer'");
  });

  it('says nothing about a card whose entities are all there', async () => {
    await mountCard();

    expect(missing()).to.be.empty;
  });
});

describe('a template that throws', () => {
  let warnings;

  beforeEach(() => {
    warnings = collectWarnings();
  });

  afterEach(() => {
    warnings.restore();
  });

  it('leaves the control on the card and names the option', async () => {
    // Before #211 this emptied `mh-indicators` entirely - the throw happens
    // inside that component's own render - so the card lost every indicator
    // because one template was wrong.
    const { card } = await mountCard({
      config: {
        indicators: {
          humidity: { icon: { template: '(value) => value.nope.nope' } },
        },
      },
    });

    const indicators = components(card).find(c => c.localName === 'mh-indicators');

    expect(indicators.shadowRoot.childElementCount).to.be.greaterThan(0);
    expect(indicators.shadowRoot.querySelectorAll('.state').length).to.be.greaterThan(0);

    const thrown = warnings.seen.filter(line => line.includes('threw'));

    expect(thrown).to.have.lengthOf(1);
    expect(thrown[0]).to.contain('indicators.humidity.icon.template');
  });
});
