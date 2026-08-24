// Reads a string out of Home Assistant's own translations.
//
// This used to go through `hass.resources[lang][label]`. That object is gone
// from the frontend's hass, so the lookup threw `Cannot read properties of
// undefined` the moment anything asked for a label - which in practice meant
// every render of an unavailable entity. `hass.localize` is the supported way
// in, and it returns an empty string for a key it does not know.
//
// Same fix as artem-sedykh/mini-climate-card#176.
const getLabel = (hass, label, fallback = 'unknown') => {
  if (!hass || typeof hass.localize !== 'function') return fallback;

  return hass.localize(label) || fallback;
};

export default getLabel;
