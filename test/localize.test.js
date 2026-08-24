import { describe, expect, it } from 'vitest';

import localize from '../src/localize/localize';

describe('localize', () => {
  it('resolves a dotted path in the requested language', () => {
    expect(localize('zhimi_humidifier_cb1.mode.auto', 'en')).toBe('Auto');
    expect(localize('zhimi_humidifier_cb1.led_brightness.bright', 'en')).toBe('Bright');
  });

  it('matches path segments regardless of case', () => {
    // Entity attributes arrive from the device in whatever case it uses, and
    // the configurations feed them straight into a translation key.
    expect(localize('ZHIMI_HUMIDIFIER_CB1.Mode.AUTO', 'en')).toBe('Auto');
  });

  it('translates the same key in every bundled language', () => {
    const key = 'zhimi_humidifier_cb1.mode.auto';

    for (const language of ['en', 'ru', 'uk']) {
      expect(localize(key, language)).not.toBe('unknown');
    }

    expect(localize(key, 'ru')).not.toBe(localize(key, 'en'));
  });

  it('falls back for a key that does not exist', () => {
    expect(localize('zhimi_humidifier_cb1.mode.turbo', 'en')).toBe('unknown');
    expect(localize('nothing.like.this', 'en', '')).toBe('');
  });

  it('falls back for a language that is not bundled', () => {
    expect(localize('zhimi_humidifier_cb1.mode.auto', 'de')).toBe('unknown');
    expect(localize('zhimi_humidifier_cb1.mode.auto', undefined, 'Auto')).toBe('Auto');
  });

  it('falls back when the path stops on an object', () => {
    // Returning the object would put "[object Object]" on the card.
    expect(localize('zhimi_humidifier_cb1.mode', 'en')).toBe('unknown');
  });

  it('falls back for a path that walks through a string', () => {
    expect(localize('zhimi_humidifier_cb1.mode.auto.deeper', 'en')).toBe('unknown');
  });
});
