import { describe, expect, it } from 'vitest';

import getLabel from '../src/utils/getLabel';

describe('getLabel', () => {
  it('returns what hass.localize resolves', () => {
    const hass = { localize: key => (key === 'state.default.unavailable' ? 'Unavailable' : '') };

    expect(getLabel(hass, 'state.default.unavailable')).toBe('Unavailable');
  });

  it('falls back when hass.localize does not know the key', () => {
    // hass.localize returns an empty string rather than throwing, and an empty
    // label renders as a blank gap on the card.
    const hass = { localize: () => '' };

    expect(getLabel(hass, 'state.default.unavailable', 'Unavailable')).toBe('Unavailable');
    expect(getLabel(hass, 'state.default.unavailable')).toBe('unknown');
  });

  it('falls back without a hass object', () => {
    expect(getLabel(undefined, 'state.default.unavailable', 'Unavailable')).toBe('Unavailable');
  });

  it('falls back when hass carries no localize', () => {
    // The regression this guard exists for: the frontend dropped
    // hass.resources, and every render of an unavailable entity threw.
    expect(getLabel({ resources: {} }, 'state.default.unavailable', 'Unavailable')).toBe(
      'Unavailable',
    );
  });
});
