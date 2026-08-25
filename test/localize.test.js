import { describe, expect, it } from 'vitest';

import localize from '../src/localize/localize';
import en from '../src/localize/languages/en.json';
import ru from '../src/localize/languages/ru.json';
import uk from '../src/localize/languages/uk.json';

const LANGUAGES = { en, ru, uk };

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

describe('the bundled language files', () => {
  // They are written by hand, one per language, and nothing in lint, typecheck
  // or format:check notices a key that only one of them has: a missing
  // property is still valid JSON. They had already drifted by the time this
  // was written - `zhimi_airfresh_va2.mode.silent` existed in Russian alone,
  // so that mode read as "Ночной" in one language and fell back in the other
  // two. #227.
  const paths = (value, prefix = '', found = []) => {
    for (const [key, nested] of Object.entries(value)) {
      const path = prefix ? `${prefix}.${key}` : key;

      if (nested && typeof nested === 'object' && !Array.isArray(nested))
        paths(nested, path, found);
      else found.push(path);
    }

    return found;
  };

  const keys = language => new Set(paths(LANGUAGES[language]));

  it('describe the same set of keys', () => {
    const [first, ...rest] = Object.keys(LANGUAGES);

    for (const language of rest) {
      // Named both ways round, because "en is missing a key ru has" and "ru
      // carries a key en does not" send whoever reads the failure to different
      // files.
      expect({ [language]: [...keys(language)].sort() }).toEqual({
        [language]: [...keys(first)].sort(),
      });
    }
  });
});
