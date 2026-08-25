import { afterEach, describe, expect, it, vi } from 'vitest';

import { byOrder, compileTemplate, getEntityValue, round, toggleState } from '../src/utils/utils';

describe('round', () => {
  it('rounds to the requested number of decimals', () => {
    expect(round(12.3456, 2)).toBe(12.35);
    expect(round(12.3456, 0)).toBe(12);
    expect(round(12.3456, 1)).toBe(12.3);
  });

  it('rounds halves up rather than to the nearest float', () => {
    // The exponent shift is the reason this function exists: 1.005 is stored
    // slightly below 1.005, so `Math.round(1.005 * 100) / 100` gives 1.
    expect(round(1.005, 2)).toBe(1.01);
    expect(round(2.675, 2)).toBe(2.68);
  });

  it('returns a number, not a string', () => {
    expect(round('42.4', 0)).toBe(42);
  });
});

describe('toggleState', () => {
  it('flips a state that is on or off', () => {
    expect(toggleState('on')).toBe('off');
    expect(toggleState('off')).toBe('on');
  });

  it('treats closed and locked as off', () => {
    expect(toggleState('closed')).toBe('on');
    expect(toggleState('locked')).toBe('on');
  });

  it('leaves an unavailable entity alone', () => {
    expect(toggleState('unavailable')).toBe('unavailable');
    expect(toggleState('unknown')).toBe('unknown');
  });

  it('passes a missing state straight through', () => {
    expect(toggleState(undefined)).toBeUndefined();
    expect(toggleState('')).toBe('');
  });
});

describe('getEntityValue', () => {
  const entity = { state: 'on', attributes: { humidity: 45, mode: 'auto' } };

  it('returns undefined without an entity', () => {
    expect(getEntityValue(undefined, { attribute: 'humidity' })).toBeUndefined();
  });

  it('returns the state without a config', () => {
    expect(getEntityValue(entity)).toBe('on');
  });

  it('returns the state when the config names no attribute', () => {
    expect(getEntityValue(entity, {})).toBe('on');
  });

  it('returns the named attribute', () => {
    expect(getEntityValue(entity, { attribute: 'humidity' })).toBe(45);
  });

  it('returns undefined for an attribute the entity does not have', () => {
    expect(getEntityValue(entity, { attribute: 'water_level' })).toBeUndefined();
  });
});

describe('compileTemplate', () => {
  it('compiles a function passed as source', () => {
    const compiled = compileTemplate(value => value * 2, {});

    expect(compiled(21)).toBe(42);
  });

  it('binds the context as `this`', () => {
    // This is what every model configuration relies on: the arrow functions in
    // src/configurations are compiled with the card's context, not module scope.
    const compiled = compileTemplate('() => this.unit', { unit: '%' });

    expect(compiled()).toBe('%');
  });

  it('exposes the context helpers the configurations call', () => {
    const calls = [];
    const context = {
      call_service: (domain, service, options) => calls.push([domain, service, options]),
    };

    const compiled = compileTemplate(
      '(entity) => this.call_service("humidifier", "turn_on", { entity_id: entity })',
      context,
    );
    compiled('humidifier.bedroom');

    expect(calls).toEqual([['humidifier', 'turn_on', { entity_id: 'humidifier.bedroom' }]]);
  });

  it('tolerates a missing context', () => {
    expect(compileTemplate('() => 1')()).toBe(1);
  });

  it('reports the source it could not compile', () => {
    expect(() => compileTemplate('=> not a function', {})).toThrow(/COMPILE ERROR/);
    expect(() => compileTemplate('=> not a function', {})).toThrow(/=> not a function/);
  });
});

describe('a template that throws', () => {
  // The card configuration is JavaScript the user wrote, and a template runs
  // inside a component's own render - so an unguarded throw leaves that
  // component with an empty shadow root while the card renders around it. A
  // control that disappeared, with the reason in the console and nothing on
  // screen. #211.
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('answers undefined rather than throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const compiled = compileTemplate('() => undefined.nope', {}, 'indicators.humidity.icon.style');

    expect(compiled()).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('indicators.humidity.icon.style');
    expect(warn.mock.calls[0][0]).toContain('TypeError');
  });

  it('says it once, however often it is called', () => {
    // `hass` arrives on every state change in the installation, and each one
    // renders. A warning per call would bury the console it is meant to help.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const compiled = compileTemplate('() => undefined.nope', {}, 'buttons.led.state.mapper');

    for (let i = 0; i < 20; i += 1) compiled();

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('warns again for a template compiled again', () => {
    // setConfig compiles fresh functions, so a corrected configuration - or a
    // second card - is not silenced by the first one's warning.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    compileTemplate('() => undefined.nope', {}, 'power.toggle_action')();
    compileTemplate('() => undefined.nope', {}, 'power.toggle_action')();

    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('leaves a template that works alone, `this` and all', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const compiled = compileTemplate('(value) => value + this.unit', { unit: '%' }, 'x');

    expect(compiled(50)).toBe('50%');
    expect(warn).not.toHaveBeenCalled();
  });

  it('hands back an option that is a plain value unchanged', () => {
    // `disabled: true` compiles to `true`, not to a function. Wrapping it
    // would change what the caller is given.
    expect(compileTemplate('true', {}, 'target_humidity.disabled')).toBe(true);
  });
});

describe('byOrder', () => {
  it('sorts by the number', () => {
    expect([3, 1, 2].sort(byOrder)).toEqual([1, 2, 3]);
  });

  it('treats a missing order as equal to anything', () => {
    // Both panels rely on that: an entry the configuration does not number
    // keeps the place a stable sort leaves it in, rather than being flung to
    // one end by a comparison against undefined.
    expect(byOrder(undefined, 5)).toBe(0);
    expect(byOrder(5, undefined)).toBe(0);
    expect(byOrder(undefined, undefined)).toBe(0);
  });
});
