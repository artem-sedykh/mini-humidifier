const ICON = {
  DEFAULT: 'mdi:air-filter',
  FAN: 'mdi:fan',
  HUMIDITY: 'mdi:water',
  TEMPERATURE: 'mdi:thermometer-low',
  DEPTH: 'mdi:tray-full',
  COVER_REMOVED: 'mdi:tray-remove',
  SHORTAGE_WATER: 'mdi:tray-minus',
  DRY: 'mdi:weather-sunny',
  BUZZER: 'mdi:bell-outline',
  LED: 'mdi:lightbulb-on-outline',
  CHILD_LOCK: 'mdi:lock',
  TOGGLE: 'mdi:dots-horizontal',
  POWER: 'mdi:power',
};

export default ICON;
export const STATES_OFF = ['closed', 'locked', 'off'];
export const UNAVAILABLE = 'unavailable';
export const UNKNOWN = 'unknown';
export const UNAVAILABLE_STATES = [UNAVAILABLE, UNKNOWN];
export const ACTION_TIMEOUT = 3500;
export const TAP_ACTIONS = ['more-info', 'navigate', 'call-service', 'url'];
