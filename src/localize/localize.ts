import * as en from './languages/en.json';
import * as ru from './languages/ru.json';

const languages = {
  en: en,
  ru: ru,
};

export function localize(string: string, lang: string, fallback = 'unknown'): string {
  const section = string.split('.')[0];
  const key = string.split('.')[1];

  let translated: string;

  try {
    translated = languages[lang][section][key];
  } catch (e) {
    return fallback;
  }

  if (translated === undefined) return fallback;

  return translated;
}
