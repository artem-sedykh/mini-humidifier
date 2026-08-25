// @vitest-environment jsdom
//
// The configuration a card ends up with is the user's YAML merged over the
// defaults of the model they named. Nothing about that merge is visible until
// the card runs, and an unrecognised `model:` produces a working but wrong card
// rather than an error, so it is worth pinning down.
//
// jsdom is enough here: setConfig only reads and merges. Rendering is never
// triggered, because the element is not connected to the document.
import { beforeAll, describe, expect, it } from 'vitest';

import HUMIDIFIERS from '../src/humidifiers';

const DEFAULT_MODEL = 'zhimi.humidifier.cb1';

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

describe('getStubConfig', () => {
  // What Home Assistant calls to fill in a config when the card is added from
  // the dashboard picker. Whatever it returns is what the user is dropped into
  // the editor with, so an entity it fails to find is a card that throws before
  // anything has been typed.
  const stub = (unused, all = unused) => MiniHumidifier.getStubConfig({}, unused, all);

  it('prefers an entity no other card is using', () => {
    expect(stub(['fan.spare'], ['fan.taken', 'fan.spare']).entity).toBe('fan.spare');
  });

  it('takes one already in use when nothing is spare', () => {
    expect(stub([], ['fan.taken']).entity).toBe('fan.taken');
  });

  it('offers a humidifier when there is no fan', () => {
    // A generic hygrostat, an MQTT humidifier, anything that is not one of the
    // Xiaomi integrations, is a `humidifier` entity. Until #176 the picker
    // looked for `fan` alone and returned nothing at all on such a setup.
    expect(stub(['humidifier.bedroom']).entity).toBe('humidifier.bedroom');
  });

  it('prefers a fan when both domains are present', () => {
    expect(stub(['humidifier.bedroom', 'fan.bedroom']).entity).toBe('fan.bedroom');
  });

  it('offers nothing when no supported entity exists', () => {
    expect(stub(['light.bedroom']).entity).toBeUndefined();
  });
});

describe('setConfig', () => {
  it('accepts the supported domains', () => {
    expect(() => card({ entity: 'humidifier.bedroom' })).not.toThrow();
    expect(() => card({ entity: 'fan.bedroom' })).not.toThrow();
  });

  it('rejects an entity from any other domain', () => {
    expect(() => card({ entity: 'light.bedroom' })).toThrow(/fan ,humidifier/);
    expect(() => card({ entity: undefined })).toThrow(/fan ,humidifier/);
  });

  it('configures every model in the registry', () => {
    for (const model of Object.keys(HUMIDIFIERS)) {
      const element = card({ model });

      expect(element.config.buttons.length, model).toBeGreaterThan(0);
      expect(element.config.indicators.length, model).toBeGreaterThan(0);
      expect(element.config.power.toggle_action, model).toBeTypeOf('function');
    }
  });

  it('falls back to the default model without complaining', () => {
    // Deliberate, and the reason a typo in `model:` is so hard to spot: the
    // card renders, and only the controls behave like another device.
    const typo = card({ model: 'zhimi.humidifier.cb11' });
    const fallback = card({ model: DEFAULT_MODEL });

    expect(typo.config.buttons.map(item => item.id)).toEqual(
      fallback.config.buttons.map(item => item.id),
    );
    expect(typo.config.indicators.map(item => item.id)).toEqual(
      fallback.config.indicators.map(item => item.id),
    );

    // The unknown id is kept as the user wrote it, so it can still be read back
    // out of the configuration.
    expect(typo.config.model).toBe('zhimi.humidifier.cb11');
  });

  it('defaults the model when the YAML names none', () => {
    expect(card({}).config.model).toBe(DEFAULT_MODEL);
  });

  it('keeps two cards on the same page independent', () => {
    // getIndicatorsConfig writes into the object the model factory returns.
    // Sharing it would carry one card's options over to the next.
    const hidden = card({ indicators: { temperature: { hide: true } } });
    const plain = card({});

    expect(indicator(hidden, 'temperature')).toBeUndefined();
    expect(indicator(plain, 'temperature')).toBeDefined();
  });
});

describe('getPowerConfig', () => {
  it('merges the YAML over the model defaults', () => {
    const element = card({ power: { icon: 'mdi:power-plug' } });

    expect(element.config.power.icon).toBe('mdi:power-plug');
    // Everything the user did not mention still comes from the model.
    expect(element.config.power.type).toBe('button');
    expect(element.config.power.toggle_action).toBeTypeOf('function');
  });

  it('compiles an action the YAML overrides', () => {
    const calls = [];
    const element = card({
      power: { toggle_action: '() => this.call_service("humidifier", "toggle", {})' },
    });
    element._hass = { callService: (...args) => calls.push(args) };

    element.config.power.functions.toggle_action();

    expect(calls).toEqual([['humidifier', 'toggle', {}]]);
  });

  it('lets the YAML hide the power button', () => {
    expect(card({ power: { hide: true } }).config.power.hide).toBe(true);
    expect(card({}).config.power.hide).toBe(false);
  });
});

describe('getTargetHumidityConfig', () => {
  it('merges the YAML over the model defaults', () => {
    const element = card({ target_humidity: { min: 40, max: 60 } });

    expect(element.config.target_humidity.min).toBe(40);
    expect(element.config.target_humidity.max).toBe(60);
    // Untouched by the YAML, so still the model default.
    expect(element.config.target_humidity.step).toBe(10);
  });

  it('compiles the templates the model carries', () => {
    const { functions } = card({}).config.target_humidity;

    expect(functions.change_action).toBeTypeOf('function');
    expect(functions.disabled).toBeTypeOf('function');
    expect(functions.state.mapper).toBeTypeOf('function');
    expect(functions.unit.template).toBeTypeOf('function');
  });
});

describe('getIndicatorsConfig', () => {
  it('keeps the model indicators when the YAML adds none', () => {
    expect(card({}).config.indicators.map(item => item.id)).toEqual([
      'water_level',
      'temperature',
      'humidity',
      'motor_speed',
    ]);
  });

  it('merges an override into one indicator without touching the rest', () => {
    const element = card({ indicators: { temperature: { icon: 'mdi:test' } } });

    expect(indicator(element, 'temperature').icon).toBe('mdi:test');
    expect(indicator(element, 'temperature').round).toBe(1);
    expect(indicator(element, 'humidity').icon).toBe('mdi:water');
  });

  it('drops a hidden indicator', () => {
    const element = card({ indicators: { water_level: { hide: true } } });

    expect(element.config.indicators.map(item => item.id)).toEqual([
      'temperature',
      'humidity',
      'motor_speed',
    ]);
  });

  it('adds an indicator the model does not define', () => {
    const element = card({
      indicators: { power: { icon: 'mdi:flash', source: { entity: 'sensor.power' } } },
    });

    expect(indicator(element, 'power').source.entity).toBe('sensor.power');
  });

  it('normalises a tap_action written as a string', () => {
    const element = card({ indicators: { humidity: { tap_action: 'more-info' } } });

    expect(indicator(element, 'humidity').tap_action).toEqual({ action: 'more-info' });
  });

  it('defaults an indicator with no tap_action to none', () => {
    const element = card({ indicators: { power: { source: { entity: 'sensor.power' } } } });

    expect(indicator(element, 'power').tap_action).toEqual({ action: 'none' });
  });

  it('compiles the templates an indicator carries', () => {
    const { functions } = indicator(card({}), 'water_level');

    expect(functions.mapper).toBeTypeOf('function');
    expect(functions.icon.template).toBeTypeOf('function');
    expect(functions.unit.template).toBeTypeOf('function');
  });

  it('gives a compiled template the localize helper, in the hass language', () => {
    const element = card({});
    element._hass = { language: 'en' };

    expect(indicator(element, 'water_level').functions.unit.template('50')).toBe('%');
  });
});

describe('getButtonsConfig', () => {
  it('keeps the model buttons when the YAML adds none', () => {
    expect(card({}).config.buttons.map(item => item.id)).toEqual([
      'dry',
      'mode',
      'led',
      'buzzer',
      'child_lock',
    ]);
  });

  it('merges an override into one button without touching the rest', () => {
    const element = card({ buttons: { buzzer: { icon: 'mdi:test' } } });

    expect(button(element, 'buzzer').icon).toBe('mdi:test');
    expect(button(element, 'buzzer').toggle_action).toBeTypeOf('function');
    expect(button(element, 'child_lock').icon).toBe('mdi:lock');
  });

  it('keeps the order the model gives a button', () => {
    expect(card({}).config.buttons.map(item => item.order)).toEqual([0, 1, 2, 3, 4]);
  });

  it('orders a button the YAML adds after the model ones', () => {
    // No explicit order, so it falls back to its position in the merged object.
    const element = card({ buttons: { clean: { icon: 'mdi:broom' } } });

    expect(button(element, 'clean').order).toBe(6);
  });

  it('respects an explicit order from the YAML', () => {
    expect(button(card({ buttons: { buzzer: { order: 99 } } }), 'buzzer').order).toBe(99);
  });

  it('defaults a button with no type to a plain button', () => {
    const element = card({ buttons: { clean: { icon: 'mdi:broom' } } });

    expect(button(element, 'clean').type).toBe('button');
    expect(button(element, 'mode').type).toBe('dropdown');
  });

  it('compiles the templates a dropdown carries', () => {
    const { functions } = button(card({}), 'mode');

    expect(functions.source.__init).toBeTypeOf('function');
    expect(functions.active).toBeTypeOf('function');
    expect(functions.change_action).toBeTypeOf('function');
  });

  it('calls the service the change_action names, once', () => {
    const calls = [];
    const element = card({});
    element._hass = { callService: (...args) => calls.push(args) };

    button(element, 'mode').functions.change_action('auto', 'off', {
      entity_id: 'humidifier.bedroom',
    });

    expect(calls).toEqual([
      ['humidifier', 'set_mode', { entity_id: 'humidifier.bedroom', mode: 'auto' }],
    ]);
  });
});

describe('secondary_info', () => {
  it('defaults to the mode', () => {
    expect(card({}).config.secondary_info).toEqual({ type: 'mode' });
  });

  it('accepts a bare string', () => {
    expect(card({ secondary_info: 'last-changed' }).config.secondary_info).toEqual({
      type: 'last-changed',
    });
  });
});
