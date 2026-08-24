import { describe, expect, it } from 'vitest';

import IndicatorObject from '../src/models/indicator';

// The small readings along the bottom of the card - water level, temperature,
// humidity, motor speed. Each one takes a value from some entity and decides
// how to round it, what unit to put after it and which icon to draw.
const entity = (state, attributes = {}) => ({
  entity_id: 'sensor.bedroom_humidity',
  state,
  last_changed: '2026-01-01T00:00:00Z',
  last_updated: '2026-01-01T00:00:00Z',
  attributes,
});

const indicator = (config, state = '45.678', attributes) =>
  new IndicatorObject(entity(state, attributes), { functions: {}, ...config }, {}, {});

describe('IndicatorObject', () => {
  describe('value', () => {
    it('is the entity state by default', () => {
      expect(indicator({}).value).toBe('45.678');
    });

    it('is the named attribute when the configuration names one', () => {
      expect(indicator({ source: { attribute: 'depth' } }, '45', { depth: 60 }).value).toBe(60);
    });

    it('goes through the mapper before it is rounded', () => {
      // How water level becomes litres: the mapper turns a percentage into a
      // volume, and the rounding then applies to the volume.
      const config = {
        round: 1,
        functions: { mapper: value => (Number(value) * 4) / 100 },
      };

      expect(indicator(config, '55').value).toBe(2.2);
    });

    it.each([
      [0, 46],
      [1, 45.7],
      [2, 45.68],
    ])('rounds to %i decimals', (round, expected) => {
      expect(indicator({ round }).value).toBe(expected);
    });

    it('leaves a value the mapper emptied alone', () => {
      // A sensor that reports nothing renders as nothing. Rounding an empty
      // string would put a 0 on the card where the device said it did not know.
      const config = { round: 1, functions: { mapper: () => '' } };

      expect(indicator(config).value).toBe('');
    });
  });

  describe('unit', () => {
    it('is the configured string', () => {
      expect(indicator({ unit: '%' }).unit).toBe('%');
    });

    it('is what the template returns, and the template sees the value', () => {
      // Water level again: the unit depends on whether the reading was
      // converted to litres, so it cannot be a constant.
      const config = { functions: { unit: { template: value => (value === '' ? '' : 'L') } } };

      expect(indicator(config).unit).toBe('L');
      expect(
        indicator({ ...config, functions: { ...config.functions, mapper: () => '' } }).unit,
      ).toBe('');
    });

    it('is empty when the configuration has neither', () => {
      expect(indicator({}).unit).toBe('');
    });
  });

  describe('icon', () => {
    it('is the configured string', () => {
      expect(indicator({ icon: 'mdi:water' }).icon).toBe('mdi:water');
    });

    it('is what the template returns', () => {
      // This is how a detached water tank gets its own icon rather than an
      // empty reading with the usual one.
      const config = {
        functions: { icon: { template: value => (value === '' ? 'mdi:tray-remove' : 'mdi:tray') } },
      };

      expect(indicator(config).icon).toBe('mdi:tray');
      expect(
        indicator({ ...config, functions: { ...config.functions, mapper: () => '' } }).icon,
      ).toBe('mdi:tray-remove');
    });

    it('is empty when the configuration has neither', () => {
      expect(indicator({}).icon).toBe('');
    });
  });

  describe('iconStyle', () => {
    it('is what the style function returns', () => {
      const config = { functions: { icon: { style: () => ({ color: 'red' }) } } };

      expect(indicator(config).iconStyle).toEqual({ color: 'red' });
    });

    it('is an empty object when there is no style function, or it returns none', () => {
      // styleMap is what receives this, and it throws on undefined - which is
      // how an unavailable entity used to take the card down.
      expect(indicator({}).iconStyle).toEqual({});
      expect(indicator({ functions: { icon: { style: () => undefined } } }).iconStyle).toEqual({});
    });
  });

  it('reports the order the configuration gave it', () => {
    // What `mh-indicators` sorts by. There was no such getter until #171, so
    // the sort compared `undefined` against `undefined` and did nothing.
    expect(indicator({ order: 2 }).order).toBe(2);
    expect(indicator({}).order).toBeUndefined();
  });

  describe('changed', () => {
    it('says no when the same entity comes back', () => {
      const model = indicator({});

      expect(model.changed(entity('45.678'))).toBe(false);
    });

    it('says no even when the entity was updated after it last changed', () => {
      // The case that made this worth a test: `last_changed` and `last_updated`
      // are equal only until the first attribute-only update, and comparing one
      // against the other then reports a change on every single assignment of
      // `hass` - which the frontend does on every state change in the whole
      // installation. See #162.
      const stale = {
        ...entity('45.678'),
        last_changed: '2026-01-01T00:00:00Z',
        last_updated: '2026-01-01T00:00:30Z',
      };
      const model = new IndicatorObject(stale, { functions: {} }, {}, {});

      expect(model.changed(stale)).toBe(false);
    });

    it('says yes when either timestamp moves', () => {
      const model = indicator({});

      expect(model.changed({ ...entity('50'), last_changed: '2026-01-01T00:01:00Z' })).toBe(true);
      expect(model.changed({ ...entity('45.678'), last_updated: '2026-01-01T00:01:00Z' })).toBe(
        true,
      );
    });
  });
});
