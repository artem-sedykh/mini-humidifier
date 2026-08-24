import { describe, expect, it, vi } from 'vitest';

import ButtonObject from '../src/models/button';

// What a button or a dropdown reads and what it does when pressed. The model
// sits between the entity Home Assistant reports and the callbacks a model
// configuration supplies, and almost everything here has a configured form and
// a default one.
const entity = (state, attributes = {}) => ({
  entity_id: 'switch.bedroom_buzzer',
  state,
  last_changed: '2026-01-01T00:00:00Z',
  last_updated: '2026-01-01T00:00:00Z',
  attributes,
});

const button = (config, state = 'on', attributes) =>
  new ButtonObject(entity(state, attributes), { functions: {}, ...config }, {}, {});

describe('ButtonObject', () => {
  describe('state', () => {
    it('is the entity state by default', () => {
      expect(button({}).state).toBe('on');
    });

    it('is the named attribute when the configuration names one', () => {
      // How the mode dropdown reads `mode` off the humidifier itself rather
      // than off a switch entity of its own.
      expect(button({ state: { attribute: 'mode' } }, 'on', { mode: 'silent' }).state).toBe(
        'silent',
      );
    });

    it('goes through the configured mapper', () => {
      const config = {
        functions: { state: { mapper: value => (value === 'on' ? 'ON!' : value) } },
      };

      expect(button(config).state).toBe('ON!');
    });
  });

  it.each([
    ['on', { isOn: true, isOff: false, isUnavailable: false }],
    ['off', { isOn: false, isOff: true, isUnavailable: false }],
    ['unavailable', { isOn: false, isOff: false, isUnavailable: true }],
    ['unknown', { isOn: false, isOff: false, isUnavailable: true }],
  ])('reports %s correctly', (state, expected) => {
    const model = button({}, state);

    expect({ isOn: model.isOn, isOff: model.isOff, isUnavailable: model.isUnavailable }).toEqual(
      expected,
    );
  });

  describe('source', () => {
    it('turns a plain object of options into a list', () => {
      const model = button({ source: { bright: 'Bright', dim: 'Dim' } });

      expect(model.source).toEqual([
        { id: 'bright', name: 'Bright' },
        { id: 'dim', name: 'Dim' },
      ]);
    });

    it('builds the list from the entity when the configuration says how', () => {
      // The mode dropdown of most models: the options are whatever the device
      // reports it supports, not a list written down in the configuration.
      const config = {
        functions: {
          source: { __init: e => e.attributes.available_modes.map(id => ({ id, name: id })) },
        },
      };

      expect(button(config, 'on', { available_modes: ['auto', 'silent'] }).source).toEqual([
        { id: 'auto', name: 'auto' },
        { id: 'silent', name: 'silent' },
      ]);
    });

    it('passes the list through the configured filter', () => {
      // Where the translated names come from, and the only place a
      // configuration can drop an option the device offers.
      const config = {
        source: { bright: 'Bright', dim: 'Dim' },
        functions: { source: { filter: source => source.filter(item => item.id !== 'dim') } },
      };

      expect(button(config).source).toEqual([{ id: 'bright', name: 'Bright' }]);
    });
  });

  describe('selected', () => {
    const config = { source: { auto: 'Auto', silent: 'Silent' }, state: { attribute: 'mode' } };

    it('finds the option the state names, whatever case it arrives in', () => {
      // Devices report their mode in whatever case they please, and the
      // configurations key their options in lower case.
      expect(button(config, 'on', { mode: 'SILENT' }).selected).toEqual({
        id: 'silent',
        name: 'Silent',
      });
    });

    it('is undefined for a state no option matches', () => {
      // The card then shows the raw state instead, which is how an option a
      // model configuration does not know about still reaches the user.
      expect(button(config, 'on', { mode: 'turbo' }).selected).toBeUndefined();
      expect(button(config, 'on', { mode: undefined }).selected).toBeUndefined();
    });
  });

  describe('the timeout before the entity state wins again', () => {
    it('is the shared default', () => {
      expect(button({}).actionTimeout).toBe(3500);
    });

    it('is what the configuration asks for, including none', () => {
      expect(button({ action_timeout: 100 }).actionTimeout).toBe(100);
      expect(button({ action_timeout: 0 }).actionTimeout).toBe(0);
    });
  });

  describe('acting on the device', () => {
    it('calls the configured toggle action with the state and both entities', () => {
      const toggle_action = vi.fn();
      const humidifierEntity = { entity_id: 'humidifier.bedroom' };
      const model = new ButtonObject(
        entity('on'),
        { functions: { toggle_action } },
        { entity: humidifierEntity },
        {},
      );

      model.handleToggle();

      expect(toggle_action).toHaveBeenCalledWith('on', model.entity, humidifierEntity);
    });

    it('falls back to switch.toggle when the configuration has no toggle action', () => {
      const callService = vi.fn();
      const model = new ButtonObject(entity('on'), { functions: {} }, { callService }, {});

      model.handleToggle();

      expect(callService).toHaveBeenCalledWith('switch', 'toggle', {
        entity_id: 'switch.bedroom_buzzer',
      });
    });

    it('calls the configured change action with what was picked', () => {
      const change_action = vi.fn();
      const model = new ButtonObject(entity('on'), { functions: { change_action } }, {}, {});

      model.handleChange('silent');

      expect(change_action).toHaveBeenCalledWith('silent', 'on', model.entity, undefined);
    });

    it('does nothing when a dropdown has no change action', () => {
      // Not a throw: a configuration that forgets `change_action` produces a
      // dropdown that opens, closes and leaves the device alone.
      expect(button({}).handleChange('silent')).toBeUndefined();
    });
  });

  describe('what a configuration can decide per state', () => {
    it('is inactive, enabled and unstyled unless the configuration says otherwise', () => {
      const model = button({});

      expect(model.isActive('on')).toBe(false);
      expect(model.disabled).toBe(false);
      expect(model.style).toEqual({});
    });

    it('asks the configured callbacks', () => {
      const model = button({
        functions: {
          active: state => state === 'on',
          disabled: state => state === 'on',
          style: () => ({ color: 'red' }),
        },
      });

      expect(model.isActive('on')).toBe(true);
      expect(model.disabled).toBe(true);
      expect(model.style).toEqual({ color: 'red' });
    });

    it('treats a style callback that returns nothing as no style', () => {
      expect(button({ functions: { style: () => undefined } }).style).toEqual({});
    });
  });
});
