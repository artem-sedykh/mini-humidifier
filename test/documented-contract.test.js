// @vitest-environment jsdom
//
// The contract in docs/custom-device.md, held to the code.
//
// That page tells a person - or the AI assistant they asked - what the card's
// configuration language is, and every claim in it was checked against `src/`
// once. This file is what keeps them checked: each test here is one sentence
// from that page, written the way a user writes it, as YAML text rather than as
// a JavaScript function, because that is the only form the documentation can
// show.
//
// jsdom for the same reason as config.test.js: `setConfig` only reads and
// merges, and the element is never connected, so nothing renders.
import { beforeAll, describe, expect, it } from 'vitest';

let MiniHumidifier;

const card = config => {
  const element = new MiniHumidifier();
  element.setConfig({ entity: 'humidifier.bedroom', ...config });
  return element;
};

const indicator = (element, id) => element.config.indicators.find(item => item.id === id);
const button = (element, id) => element.config.buttons.find(item => item.id === id);

beforeAll(async () => {
  await import('../src/main.ts');
  MiniHumidifier = customElements.get('mini-humidifier');
  expect(MiniHumidifier).toBeTypeOf('function');
});

describe('"a dropdown built from the entity"', () => {
  // `source: __init` is how the domain preset turns `available_modes` into a
  // list, and it was undocumented until #220 - which meant an assistant
  // configuring an unknown device had no way to offer the modes a device
  // reports rather than a list guessed in advance.
  const modes = {
    model: 'none',
    buttons: {
      mode: {
        type: 'dropdown',
        state: { attribute: 'mode' },
        source: {
          __init:
            '(entity) => (entity.attributes.available_modes || []).map(mode => ({ id: mode, name: mode }))',
        },
      },
    },
  };

  it('builds the items from the entity', () => {
    const { functions } = button(card(modes), 'mode');

    expect(functions.source.__init({ attributes: { available_modes: ['auto', 'sleep'] } })).toEqual(
      [
        { id: 'auto', name: 'auto' },
        { id: 'sleep', name: 'sleep' },
      ],
    );
  });

  it('answers an empty list for a device with no modes', () => {
    // A generic_hygrostat reports none, and the documented `|| []` is what
    // stands between that and a dropdown that throws inside a render.
    const { functions } = button(card(modes), 'mode');

    expect(functions.source.__init({ attributes: {} })).toEqual([]);
  });
});

describe('"unit also takes an object with a template"', () => {
  it('compiles for an indicator', () => {
    const element = card({
      model: 'none',
      indicators: { humidity: { unit: { template: "(value) => (value === '' ? '' : '%')" } } },
    });

    expect(indicator(element, 'humidity').functions.unit.template(52)).toBe('%');
  });
});

describe('"call_service is on the controls that act"', () => {
  // An indicator is read-only by construction, and the page says so. Both
  // halves are asserted, because the interesting failure is the second one
  // quietly becoming true.
  it('a button has it and an indicator does not', () => {
    const element = card({
      model: 'none',
      indicators: { reading: { source: { mapper: '() => typeof this.call_service' } } },
      buttons: { light: { disabled: '() => typeof this.call_service' } },
    });

    expect(indicator(element, 'reading').functions.mapper()).toBe('undefined');
    expect(button(element, 'light').functions.disabled()).toBe('function');
  });
});

describe('"what the card refuses"', () => {
  it('refuses an entity outside the supported domains', () => {
    expect(() => card({ entity: 'sensor.humidity' })).toThrow(/domains/);
  });

  it('refuses a template that does not parse', () => {
    // The one place a mistake inside a template is fatal: there is no value to
    // fall back to when the text never becomes a function. Documented as such
    // because on a dashboard it is a red rectangle with the reason in the
    // console and nowhere else.
    expect(() =>
      card({
        model: 'none',
        indicators: { x: { source: { mapper: '(value) => { return value' } } },
      }),
    ).toThrow();
  });

  it('carries on when a template throws at call time', () => {
    const element = card({
      model: 'none',
      indicators: { x: { source: { mapper: '(value) => value.missing.deeper' } } },
    });

    expect(indicator(element, 'x').functions.mapper(undefined)).toBeUndefined();
  });
});
