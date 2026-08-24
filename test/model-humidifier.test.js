import { describe, expect, it } from 'vitest';

import HumidifierObject from '../src/models/humidifier';

// The wrapper the whole card asks about the device: whether it is on, whether
// it can be reached, and what to call it. Everything it answers comes out of
// one entity object, and the states it has to tell apart are Home Assistant's,
// not this card's.
const entity = (state, attributes = {}) => ({
  entity_id: 'humidifier.bedroom',
  state,
  last_changed: '2026-01-01T00:00:00Z',
  last_updated: '2026-01-01T00:00:00Z',
  attributes: { friendly_name: 'Bedroom humidifier', ...attributes },
});

const humidifier = (state, attributes) => new HumidifierObject({}, {}, entity(state, attributes));

describe('HumidifierObject', () => {
  it('reads the entity id, name and icon', () => {
    const model = humidifier('on', { icon: 'mdi:air-humidifier' });

    expect(model.id).toBe('humidifier.bedroom');
    expect(model.name).toBe('Bedroom humidifier');
    expect(model.icon).toBe('mdi:air-humidifier');
  });

  it('has an empty name when the entity has none', () => {
    // The card falls back to its own configured name only when this is falsy.
    expect(new HumidifierObject({}, {}, entity('on', { friendly_name: undefined })).name).toBe('');
  });

  it('fills in the attributes the card renders unconditionally', () => {
    // A device that reports none of these still renders: the indicators read
    // zeroes and empty strings rather than throwing on undefined.
    const model = humidifier('on');

    expect(model.attr.depth).toBe(0);
    expect(model.attr.target_humidity).toBe(0);
    expect(model.attr.mode).toBe('');
    expect(model.attr.dry).toBe(false);
  });

  it.each([
    ['on', { isOn: true, isOff: false, isActive: true, isUnavailable: false }],
    ['off', { isOn: false, isOff: true, isActive: false, isUnavailable: false }],
    ['unavailable', { isOn: false, isOff: false, isActive: false, isUnavailable: true }],
    ['unknown', { isOn: false, isOff: false, isActive: false, isUnavailable: true }],
  ])('reports %s correctly', (state, expected) => {
    const model = humidifier(state);

    expect({
      isOn: model.isOn,
      isOff: model.isOff,
      isActive: model.isActive,
      isUnavailable: model.isUnavailable,
    }).toEqual(expected);
  });

  it('treats an unavailable entity as neither on nor off', () => {
    // Worth stating on its own: `unavailable` is not `off`, and the card draws
    // it differently - no controls at all rather than inactive ones.
    const model = humidifier('unavailable');

    expect(model.isOff).toBe(false);
    expect(model.isActive).toBe(false);
  });

  it('notices a change by either timestamp', () => {
    const model = humidifier('on');

    expect(model.changed(entity('on'))).toBe(false);
    expect(model.changed({ ...entity('on'), last_updated: '2026-01-01T00:01:00Z' })).toBe(true);
    expect(model.changed({ ...entity('off'), last_changed: '2026-01-01T00:01:00Z' })).toBe(true);

    // The state itself is not part of the comparison: Home Assistant stamps
    // both timestamps on every state change, and an attribute-only change
    // moves `last_updated` alone.
    expect(model.changed(entity('off'))).toBe(false);
  });

  it('calls services through hass', () => {
    const calls = [];
    const hass = {
      callService: (domain, service, options) => calls.push([domain, service, options]),
    };
    const model = new HumidifierObject(hass, {}, entity('on'));

    model.callService('humidifier', 'turn_off', { entity_id: 'humidifier.bedroom' });

    expect(calls).toEqual([['humidifier', 'turn_off', { entity_id: 'humidifier.bedroom' }]]);
  });
});
