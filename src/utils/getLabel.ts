import { HomeAssistant } from 'custom-card-helpers/dist';

export const getLabel = (hass: HomeAssistant, label: string, fallback = 'unknown'): string => {
  const lang = hass.selectedLanguage || hass.language;
  const resources = hass.resources[lang];
  return resources && resources[label] ? resources[label] : fallback;
};
