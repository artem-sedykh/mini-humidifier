import * as en from './languages/en.json';
import * as ru from './languages/ru.json';
import * as uk from './languages/uk.json';

// The translation files are JSON modules, so their keys are read at runtime by
// path rather than by name.
const languages: Record<string, any> = {
  en,
  ru,
  uk,
};

const getPropertyValue = (obj: any, property: string): any => {
  if (!obj || !property) return undefined;

  const findProperty = property.toUpperCase();

  const result = Object.entries(obj || {}).find(i => i[0].toUpperCase() === findProperty);
  if (!result) return undefined;

  return result[1];
};

const localize = (str: string, lang: string, fallback = 'unknown'): string => {
  const parts = str.split('.');

  let translated;

  try {
    translated = languages[lang];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      translated = getPropertyValue(translated, part);
    }
  } catch {
    return fallback;
  }

  if (translated === undefined) return fallback;

  if (typeof translated === 'string') return translated;

  return fallback;
};

export default localize;
