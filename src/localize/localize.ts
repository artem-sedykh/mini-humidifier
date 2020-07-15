import * as en from './languages/en.json';
import * as ru from './languages/ru.json';

const languages = {
  en: en,
  ru: ru,
};

export function localize(string: string, lang: string, fallback = 'unknown'): string {
  const parts = string.split('.');

  let translated: string | object;

  try {
    translated = languages[lang];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      translated = translated[part];
    }
  } catch (e) {
    return fallback;
  }

  if (translated === undefined) return fallback;

  if (typeof translated === 'string') return translated;

  return fallback;
}
