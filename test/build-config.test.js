// The merge layer on its own, with no card and no DOM.
//
// `test/config.test.js` covers the same ground through a constructed element
// and a jsdom docblock, because until #233 that was the only way in - the
// methods lived on the card. It stays as it is: what it asserts is what the
// merge has always done, and a test that had to be rewritten to accommodate
// the move would have meant something moved that should not have.
//
// This file is the other half: the same layer called directly, in the node
// environment, which is what the extraction was for. It covers what a card
// cannot easily be asked - the exact shape of the template scope, and the
// options a bundled preset never exercises.
import { describe, expect, it, vi } from 'vitest';

import buildCardConfig from '../src/config/buildConfig';
import HUMIDIFIERS from '../src/humidifiers';

const runtime = () => ({
  callService: vi.fn(),
  localize: vi.fn((key, fallback) => fallback ?? 'unknown'),
});

const build = (raw, model = 'none', rt = runtime()) =>
  buildCardConfig({ entity: 'humidifier.bedroom', ...raw }, HUMIDIFIERS[model](), rt);

const indicator = (config, id) => config.indicators.find(item => item.id === id);
const button = (config, id) => config.buttons.find(item => item.id === id);

describe('buildCardConfig', () => {
  it('answers a configuration without an element existing', () => {
    // The point of the extraction, asserted rather than described: no DOM, no
    // lit, no hass - and this file has no `@vitest-environment` docblock, so
    // `document` is not even defined here.
    expect(typeof document).toBe('undefined');

    const config = build({ name: 'Bedroom' });

    expect(config.entity).toBe('humidifier.bedroom');
    expect(config.name).toBe('Bedroom');
    expect(config.toggle).toEqual({ icon: 'mdi:dots-horizontal', hide: false, default: false });
  });

  it('merges the user over the model, per section', () => {
    const config = build({ indicators: { humidity: { round: 2 } } }, 'humidifier');
    const humidity = indicator(config, 'humidity');

    // `round` is the user's, `source.attribute` is the preset's.
    expect(humidity.round).toBe(2);
    expect(humidity.source.attribute).toBe('current_humidity');
  });

  it('carries through a key it does not read, into the template scope', () => {
    // The extension point the bundled presets are built on, and the reason
    // validateConfig stops at the top level.
    const config = build({
      indicators: {
        tank: { volume: 4, source: { mapper: '(value) => value * this.volume' } },
      },
    });

    const tank = indicator(config, 'tank');
    expect(tank.volume).toBe(4);
    expect(tank.functions.mapper(2)).toBe(8);
  });

  it('gives an acting control call_service and a reading one none', () => {
    const rt = runtime();
    const config = build(
      {
        indicators: { reading: { source: { mapper: '() => typeof this.call_service' } } },
        buttons: { light: { disabled: '() => typeof this.call_service' } },
      },
      'none',
      rt,
    );

    expect(indicator(config, 'reading').functions.mapper()).toBe('undefined');
    expect(button(config, 'light').functions.disabled()).toBe('function');
  });

  it('routes a template call through the runtime it was given', () => {
    const rt = runtime();
    const config = build(
      {
        buttons: {
          light: {
            toggle_action: "() => this.call_service('light', 'toggle', { entity_id: 'light.x' })",
          },
        },
      },
      'none',
      rt,
    );

    button(config, 'light').functions.toggle_action();

    expect(rt.callService).toHaveBeenCalledWith('light', 'toggle', { entity_id: 'light.x' });
  });

  it('hands the whole raw configuration to a template as entity_config', () => {
    const config = build({
      scale: 2,
      indicators: { x: { source: { mapper: '() => this.entity_config.scale' } } },
    });

    expect(indicator(config, 'x').functions.mapper()).toBe(2);
  });

  it('compiles the target humidity icon template and style', () => {
    // Neither is set by any bundled preset, so nothing else reaches them.
    const config = build({
      target_humidity: {
        icon: {
          template: "() => 'mdi:water-percent'",
          style: "() => ({ color: 'red' })",
        },
      },
    });

    expect(config.target_humidity.functions.icon.template()).toBe('mdi:water-percent');
    expect(config.target_humidity.functions.icon.style()).toEqual({ color: 'red' });
  });

  it('normalises both spellings of tap_action', () => {
    expect(build({ tap_action: 'more-info' }).tap_action).toEqual({ action: 'more-info' });
    expect(build({ tap_action: { action: 'none' } }).tap_action.action).toBe('none');
    // Left alone, the default object survives whole - handleClick reads more
    // than `action` off it.
    expect(build({}).tap_action).toMatchObject({ action: 'more-info', url: '' });
  });

  it('numbers what the configuration did not number, and drops what is hidden', () => {
    const config = build({
      indicators: { a: {}, b: { order: 0 }, c: { hide: true } },
    });

    expect(indicator(config, 'a').order).toBe(0);
    expect(indicator(config, 'b').order).toBe(0);
    expect(indicator(config, 'c')).toBeUndefined();
  });

  it('reads secondary_info in both of its shapes', () => {
    expect(build({ secondary_info: 'last-changed' }).secondary_info).toEqual({
      type: 'last-changed',
    });
    expect(build({}).secondary_info).toEqual({ type: 'mode' });
  });
});
