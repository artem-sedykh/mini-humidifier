// A `hass` object with the four things the card touches: `states`, `localize`,
// `callService` and `language`.
//
// Service calls are recorded rather than sent. Counting them is the point of
// more than one test here: a mode picked once must reach the device once, and
// the two times this card was blamed for repeating a command, the argument
// that settled it was a count and not a reading of the code.

const MODES = ['auto', 'silent', 'medium', 'high'];

const ENTITY_ID = 'humidifier.bedroom';

// Home Assistant's own translations, of which the card asks for exactly one
// key. `hass.localize` returns an empty string for anything it does not know,
// and `getLabel` falls back when it does.
const TRANSLATIONS = {
  'state.default.unavailable': 'Unavailable',
};

export const createHass = ({ state = 'on', attributes = {} } = {}) => {
  const calls = [];
  const stamp = new Date('2026-01-01T00:00:00Z').toISOString();

  const entity = {
    entity_id: ENTITY_ID,
    state,
    last_changed: stamp,
    last_updated: stamp,
    attributes: {
      friendly_name: 'Bedroom humidifier',
      mode: 'auto',
      available_modes: MODES,
      humidity: 50,
      ...attributes,
    },
  };

  const sensor = (id, value, unit) => [
    `sensor.bedroom_${id}`,
    {
      entity_id: `sensor.bedroom_${id}`,
      state: value,
      last_changed: stamp,
      last_updated: stamp,
      attributes: { unit_of_measurement: unit },
    },
  ];

  const toggle = id => [
    `switch.bedroom_${id}`,
    {
      entity_id: `switch.bedroom_${id}`,
      state: 'off',
      last_changed: stamp,
      last_updated: stamp,
      attributes: {},
    },
  ];

  return {
    calls,
    language: 'en',
    localize: key => TRANSLATIONS[key] || '',
    callService: (domain, service, options) => {
      calls.push({ domain, service, options });
      return Promise.resolve();
    },
    states: Object.fromEntries([
      [ENTITY_ID, entity],
      sensor('water_level', '80', '%'),
      sensor('temperature', '21.5', '°C'),
      sensor('humidity', '45', '%'),
      sensor('motor_speed', '300', 'rpm'),
      toggle('dry_mode'),
      toggle('buzzer'),
      toggle('child_lock'),
      [
        'select.bedroom_led_brightness',
        {
          entity_id: 'select.bedroom_led_brightness',
          state: 'dim',
          last_changed: stamp,
          last_updated: stamp,
          attributes: { options: ['bright', 'dim', 'off'] },
        },
      ],
    ]),
  };
};

export { ENTITY_ID };
