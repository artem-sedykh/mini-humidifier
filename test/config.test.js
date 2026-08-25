// @vitest-environment jsdom
//
// The configuration a card ends up with is the user's YAML merged over the
// defaults of the model they named. Nothing about that merge is visible until
// the card runs, and a model the card does not ship for is a supported way to
// use it rather than an error, so it is worth pinning down.
//
// jsdom is enough here: setConfig only reads and merges. Rendering is never
// triggered, because the element is not connected to the document.
import { beforeAll, describe, expect, it, vi } from 'vitest';

import HUMIDIFIERS from '../src/humidifiers';

const DEFAULT_MODEL = 'zhimi.humidifier.cb1';

// `default` is the key the registry falls back to rather than a device id, so
// it is not one of the models a configuration is offered.
const KNOWN_MODELS = Object.keys(HUMIDIFIERS).filter(id => id !== 'default');

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

  it('starts a humidifier entity on the preset for its domain', () => {
    // Rather than on `zhimi.humidifier.cb1`, which is what an absent `model:`
    // means and which reads sensors and calls services a plain humidifier does
    // not have. #214.
    expect(stub(['humidifier.bedroom'])).toEqual({
      entity: 'humidifier.bedroom',
      model: 'humidifier',
    });
  });

  it('names no model for a fan, where the default is the better answer', () => {
    // Every device-specific preset here is written against a `fan` entity, and
    // the domain preset calls `humidifier.*` services.
    expect(stub(['fan.bedroom'])).toEqual({ entity: 'fan.bedroom' });
  });

  it('names no model when it found no entity', () => {
    expect(stub(['light.bedroom'])).toEqual({ entity: undefined });
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
    // `none` is in the registry and is not a device - it is the empty preset,
    // and the assertions below are about describing a humidifier. It has its
    // own tests, in `humidifiers.test.js` and further down this file.
    for (const model of KNOWN_MODELS.filter(id => id !== 'none')) {
      const element = card({ model });

      expect(element.config.buttons.length, model).toBeGreaterThan(0);
      expect(element.config.indicators.length, model).toBeGreaterThan(0);
      expect(element.config.power.toggle_action, model).toBeTypeOf('function');
    }
  });

  it('builds a card for a model it does not ship for', () => {
    // Not an error, and not a typo either: the card is described in YAML end to
    // end precisely because nobody knows every humidifier on the market, so a
    // configuration that names its own device and writes out its own controls
    // is the card being used as intended. Issue #112 is a working one for a
    // `deerma.humidifier.jsq2w`. Refusing these would break dashboards.
    const own = card({ model: 'deerma.humidifier.jsq2w' });
    const fallback = card({ model: DEFAULT_MODEL });

    expect(own.config.buttons.map(item => item.id)).toEqual(
      fallback.config.buttons.map(item => item.id),
    );
    // The id is kept as it was written, so it can be read back out again.
    expect(own.config.model).toBe('deerma.humidifier.jsq2w');
  });

  it('says in the console that it fell back, rather than falling back in silence', () => {
    // The half of #177 that was a real complaint. `deerma.humidifier.mjjsq` and
    // `xiaomi_miio_airpurifier:deerma.humidifier.mjjsq` are one device through
    // two integrations calling different services, so a typo between them hands
    // someone another device's defaults with nothing to show for it.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      card({ model: 'zhimi.humidifier.cb11' });

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain("'zhimi.humidifier.cb11'");
      // And the way back: every id the build actually carries.
      expect(warn.mock.calls[0][0]).toContain(KNOWN_MODELS.join(', '));
    } finally {
      warn.mockRestore();
    }
  });

  it('stays quiet for a model it does ship for, and for none at all', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      card({ model: DEFAULT_MODEL });
      card({ model: 'xiaomi_miio_airpurifier:deerma.humidifier.jsq5' });
      card({});
      // `default` is the key the registry falls back to. Writing it is asking
      // for the default set out loud, which is not something to warn about.
      card({ model: 'default' });

      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('gives the blank preset nothing to start from', () => {
    // The point of `model: none`: a card that describes its own controls no
    // longer has to hide nine it never asked for. Without it, this same YAML
    // comes out carrying the whole `zhimi.humidifier.cb1` set.
    const own = card({
      model: 'none',
      indicators: { humid: { icon: 'mdi:water-percent', source: { attribute: 'humidity' } } },
      buttons: { led: { icon: 'mdi:lightbulb', type: 'button' } },
    });

    expect(own.config.indicators.map(item => item.id)).toEqual(['humid']);
    expect(own.config.buttons.map(item => item.id)).toEqual(['led']);
  });

  it('hides the power and humidity controls the blank preset cannot fill in', () => {
    // Both are single controls rather than collections: an empty one would be
    // a button that does nothing when pressed. Hidden until asked for.
    const blank = card({ model: 'none' });

    expect(blank.config.power.hide).toBe(true);
    expect(blank.config.target_humidity.hide).toBe(true);

    // And asking is `hide: false` - writing a `power` block is not enough on
    // its own, which is the one sharp edge of starting from nothing.
    const asked = card({ model: 'none', power: { hide: false, type: 'button' } });

    expect(asked.config.power.hide).toBe(false);
  });

  it('defaults the model when the YAML names none', () => {
    expect(card({}).config.model).toBe(DEFAULT_MODEL);
  });

  it('normalises a tap_action written as a string', () => {
    // The documented `tap_action: none`, and every other action written the
    // same way. Before #206 the string replaced the default object wholesale
    // and reached `handleClick`, which returns on a string - so `none` worked
    // by accident and `more-info` was a dead click.
    expect(card({ tap_action: 'none' }).config.tap_action).toEqual({ action: 'none' });
    expect(card({ tap_action: 'more-info' }).config.tap_action).toEqual({ action: 'more-info' });
  });

  it('leaves a tap_action written as an object alone', () => {
    const written = { action: 'navigate', navigation_path: '/lovelace/4' };

    expect(card({ tap_action: written }).config.tap_action).toEqual(written);
  });

  it('defaults tap_action to more-info', () => {
    expect(card({}).config.tap_action.action).toBe('more-info');
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

  it('gives an indicator with no source of its own an empty one', () => {
    // Not decoration. `updateIndicators` reads `config.source.entity` to decide
    // which entity the indicator watches, and falls back to the card's own when
    // there is none - so the object has to exist even when the configuration
    // never mentioned it, or that read throws. Until #187 it was seeded with
    // three keys that were all `undefined` and one of which was spelled
    // `enitity`; what mattered was only that something was there.
    const own = indicator(card({ indicators: { plain: { icon: 'mdi:flash' } } }), 'plain');

    expect(own.source).toBeTypeOf('object');
    expect(own.source.entity).toBeUndefined();
    expect(own.source.attribute).toBeUndefined();
  });

  it('normalises a tap_action written as a string', () => {
    const element = card({ indicators: { humidity: { tap_action: 'more-info' } } });

    expect(indicator(element, 'humidity').tap_action).toEqual({ action: 'more-info' });
  });

  it('defaults an indicator with no tap_action to none', () => {
    const element = card({ indicators: { power: { source: { entity: 'sensor.power' } } } });

    expect(indicator(element, 'power').tap_action).toEqual({ action: 'none' });
  });

  it('compiles the style of the reading itself', () => {
    // Beside the icon's style rather than instead of it. #213.
    const element = card({
      indicators: { humidity: { value: { style: '() => ({ color: "red" })' } } },
    });

    expect(indicator(element, 'humidity').functions.value.style).toBeTypeOf('function');
    expect(indicator(element, 'humidity').functions.value.style()).toEqual({ color: 'red' });
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

describe('what the card leaves out', () => {
  // A control whose entity is not in `hass.states` is skipped rather than
  // rendered, which is right - and used to be the whole of what happened. The
  // id is usually computed from `{entity_id}`, so what is missing is a name
  // nobody typed. #211.
  const ENTITY_ID = 'humidifier.bedroom';

  const hass = () => ({
    language: 'en',
    localize: () => '',
    callService: () => undefined,
    states: {
      [ENTITY_ID]: {
        entity_id: ENTITY_ID,
        state: 'on',
        last_changed: '2026-01-01T00:00:00Z',
        last_updated: '2026-01-01T00:00:00Z',
        attributes: { mode: 'auto', available_modes: ['auto'], humidity: 50 },
      },
    },
  });

  const missing = warn =>
    warn.mock.calls.map(([line]) => line).filter(l => l.includes('not exist'));

  it('names an indicator whose entity is not there', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // `model: none` so that the only control on the card is the broken one -
    // the default preset reads half a dozen sensor entities of its own, and
    // this fake installation has none of them.
    const element = card({
      model: 'none',
      indicators: { humidity: { source: { entity: 'sensor.bedroom_2_humidity' } } },
    });

    element.hass = hass();

    expect(missing(warn)).toHaveLength(1);
    expect(missing(warn)[0]).toContain("indicator 'humidity'");
    expect(missing(warn)[0]).toContain('sensor.bedroom_2_humidity');

    warn.mockRestore();
  });

  it('names a button whose entity is not there', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const element = card({
      model: 'none',
      buttons: { extra: { state: { entity: 'switch.does_not_exist' } } },
    });

    element.hass = hass();

    expect(missing(warn)).toHaveLength(1);
    expect(missing(warn)[0]).toContain("button 'extra'");

    warn.mockRestore();
  });

  it('says it once, however many times hass arrives', () => {
    // `hass` is assigned on every state change in the installation.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const element = card({
      model: 'none',
      indicators: { humidity: { source: { entity: 'sensor.nope' } } },
    });

    for (let i = 0; i < 5; i += 1) element.hass = hass();

    expect(missing(warn)).toHaveLength(1);

    // A new configuration is a new chance to be told.
    element.setConfig({
      entity: ENTITY_ID,
      model: 'none',
      indicators: { humidity: { source: { entity: 'sensor.nope' } } },
    });
    element.hass = hass();

    expect(missing(warn)).toHaveLength(2);

    warn.mockRestore();
  });

  it('says nothing when every entity is there', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const element = card({ model: 'none' });

    element.hass = hass();

    expect(missing(warn)).toHaveLength(0);

    warn.mockRestore();
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
