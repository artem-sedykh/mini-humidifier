import { describe, expect, it } from 'vitest';

import HUMIDIFIERS from '../src/humidifiers';

const INTEGRATIONS = ['xiaomi_miio_airpurifier'];

const entries = Object.entries(HUMIDIFIERS);

describe('the model registry', () => {
  it('is not empty', () => {
    expect(entries.length).toBeGreaterThan(1);
  });

  it('falls back to the model the README documents as the default', () => {
    expect(HUMIDIFIERS.default).toBe(HUMIDIFIERS['zhimi.humidifier.cb1']);
  });

  it.each(entries)('%s returns the four configuration sections', (id, factory) => {
    expect(factory).toBeTypeOf('function');

    const configuration = factory();

    expect(Object.keys(configuration).sort()).toEqual([
      'buttons',
      'indicators',
      'power',
      'target_humidity',
    ]);
    expect(Object.keys(configuration.buttons).length).toBeGreaterThan(0);
    expect(Object.keys(configuration.indicators).length).toBeGreaterThan(0);
  });

  it.each(entries)('%s builds a fresh configuration on every call', (id, factory) => {
    // getIndicatorsConfig merges the user's YAML into this object in place, so
    // a shared one would leak a card's options into the next card on the page.
    expect(factory()).not.toBe(factory());
    expect(factory().indicators).not.toBe(factory().indicators);
  });

  it.each(entries)('%s can act on the device', (id, factory) => {
    const { power, target_humidity: targetHumidity } = factory();

    expect(power.toggle_action).toBeTypeOf('function');
    expect(targetHumidity.change_action).toBeTypeOf('function');
  });

  it('files third-party models under a known integration prefix', () => {
    // `deerma.humidifier.mjjsq` and
    // `xiaomi_miio_airpurifier:deerma.humidifier.mjjsq` are the same device
    // through two integrations, which expose different services. The prefix is
    // the only thing telling them apart.
    for (const id of Object.keys(HUMIDIFIERS)) {
      if (!id.includes(':')) continue;

      expect(INTEGRATIONS).toContain(id.split(':')[0]);
    }
  });
});
