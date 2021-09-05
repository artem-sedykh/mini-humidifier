import * as en from './languages/en.json';
import * as ru from './languages/ru.json';

const languages = {
  en,
  ru,
};

const getPropertyValue = (obj, property) => {
  if (!obj || !property)
    return undefined;

  const findProperty = property.toUpperCase();

  const result = Object.entries(obj || {}).find(i => i[0].toUpperCase() === findProperty);
  if (!result)
    return undefined;

  return result[1];
};

const localize = (str, lang, fallback = 'unknown') => {
  const parts = str.split('.');

  let translated;

  try {
    translated = languages[lang];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      translated = getPropertyValue(translated, part);
    }
  } catch (e) {
    return fallback;
  }

  if (translated === undefined) return fallback;

  if (typeof translated === 'string') return translated;

  return fallback;
};

export default localize;
