import { describe, expect, it, vi } from 'vitest';

import TargetHumidityObject from '../src/models/targetHumidity';

// The slider: where its bounds come from, what number it shows, and what it
// calls when it is moved. Unlike the other models this one reads its whole
// configuration out of the card's `target_humidity` section.
const entity = (state, attributes = {}) => ({
  entity_id: 'humidifier.bedroom',
  state,
  last_changed: '2026-01-01T00:00:00Z',
  last_updated: '2026-01-01T00:00:00Z',
  attributes,
});

const targetHumidity = (target_humidity, attributes = { humidity: 50 }) =>
  new TargetHumidityObject(
    entity('on', attributes),
    { target_humidity: { functions: { icon: {} }, ...target_humidity } },
    { entity: entity('on', attributes) },
  );

describe('TargetHumidityObject', () => {
  it('takes its bounds from the model configuration', () => {
    // These are the device's, not the card's: a humidifier that only goes down
    // to 30% must not offer 0.
    const model = targetHumidity({ min: 30, max: 80, step: 10 });

    expect([model.min, model.max, model.step]).toEqual([30, 80, 10]);
  });

  describe('value', () => {
    it('is the named attribute', () => {
      expect(targetHumidity({ state: { attribute: 'humidity' } }).value).toBe(50);
    });

    it('goes through the mapper', () => {
      // The bundled configurations use this to turn a reading the device does
      // not have into an empty slider rather than a zero.
      const config = {
        state: { attribute: 'humidity' },
        functions: { icon: {}, state: { mapper: value => (value === 'unknown' ? '' : value) } },
      };

      expect(targetHumidity(config, { humidity: 'unknown' }).value).toBe('');
    });
  });

  describe('unit and icon', () => {
    it('are the configured strings', () => {
      const model = targetHumidity({ unit: '%', icon: 'mdi:water' });

      expect([model.unit, model.icon]).toEqual(['%', 'mdi:water']);
    });

    it('are what the templates return', () => {
      const model = targetHumidity({
        state: { attribute: 'humidity' },
        functions: {
          icon: { template: value => (value > 40 ? 'mdi:water' : 'mdi:water-off') },
          unit: { template: value => (value === '' ? '' : '%') },
        },
      });

      expect([model.unit, model.icon]).toEqual(['%', 'mdi:water']);
    });

    it('are empty when the configuration has neither', () => {
      const model = targetHumidity({});

      expect([model.unit, model.icon]).toEqual(['', '']);
    });

    it('has no icon style unless one is configured', () => {
      // styleMap receives this on every render of the slider's own indicator.
      expect(targetHumidity({}).iconStyle).toEqual({});
      expect(
        targetHumidity({ functions: { icon: { style: () => ({ color: 'red' }) } } }).iconStyle,
      ).toEqual({ color: 'red' });
    });
  });

  it('reports what the configuration hides', () => {
    const model = targetHumidity({ hide: true, hide_indicator: true });

    expect([model.hide, model.hideIndicator]).toEqual([true, true]);
  });

  describe('the timeout before the entity state wins again', () => {
    it('is the shared default', () => {
      expect(targetHumidity({}).actionTimeout).toBe(3500);
    });

    it('is what the configuration asks for, including none', () => {
      expect(targetHumidity({ action_timeout: 100 }).actionTimeout).toBe(100);
      expect(targetHumidity({ action_timeout: 0 }).actionTimeout).toBe(0);
    });
  });

  it('is enabled unless the configuration decides otherwise', () => {
    // Every bundled configuration decides from the entity - the cb1 slider is
    // disabled outside auto mode, because the device ignores it there. The
    // first argument this callback is handed is not the current value, and no
    // configuration reads it.
    expect(targetHumidity({}).disabled).toBe(false);

    const disabled = targetHumidity({
      functions: {
        icon: {},
        disabled: (state, e, humidifier) => humidifier.attributes.mode !== 'auto',
      },
    });

    expect(disabled.disabled).toBe(true);
  });

  describe('moving the slider', () => {
    it('calls the change action with the new value and the old one', () => {
      const change_action = vi.fn();
      const model = targetHumidity({
        state: { attribute: 'humidity' },
        functions: { icon: {}, change_action },
      });

      model.handleChange(60);

      expect(change_action).toHaveBeenCalledWith(60, 50, model.entity, model.humidifier.entity);
    });

    it('does nothing when the configuration has no change action', () => {
      expect(targetHumidity({}).handleChange(60)).toBeUndefined();
    });
  });
});
