import ICON from '../const';

const DEERMA_HUMIDIFIER_MJJSQ = () => ({
  power: {
    icon: ICON.POWER,
    type: 'button',
    hide: false,
    toggle_action: (state, entity) => {
      const service = state === 'on' ? 'turn_off' : 'turn_on';
      const options = { entity_id: entity.entity_id };
      return this.call_service('fan', service, options);
    },
  },
  target_humidity: {
    icon: ICON.HUMIDITY,
    unit: '%',
    min: 30,
    max: 80,
    step: 1,
    hide: false,
    hide_indicator: false,
    state: { attribute: 'target_humidity' },
    change_action: (selected, state, entity) => {
      const options = { entity_id: entity.entity_id, humidity: selected };
      return this.call_service('fan', 'xiaomi_miio_set_target_humidity', options);
    },
  },
  indicators: {
    depth: {
      hide: true,
    },
    temperature: {
      icon: ICON.TEMPERATURE,
      unit: '°C',
      round: 1,
      order: 1,
      hide: false,
      source: { attribute: 'temperature' },
    },
    humidity: {
      icon: ICON.HUMIDITY,
      unit: '%',
      round: 1,
      order: 2,
      hide: false,
      source: { attribute: 'humidity' },
    },
    status: {
      icon: ICON.TANK,
      order: 3,
      source: { attribute: 'no_water', mapper: '(val) => (val ? "Empty" : "Filled")' },
      unit: '',
    },
  },
  buttons: {
    dry: {
      hide: true,
    },
    mode: {
      icon: ICON.FAN,
      type: 'dropdown',
      hide: false,
      order: 1,
      source: {
        humidity: 'auto',
        low: 'low',
        medium: 'medium',
        high: 'high',
      },
      active: (state, entity) => (entity.state !== 'off'),
      disabled: (state, entity) => (entity.attributes.depth === 0),
      state: { attribute: 'mode' },
      change_action: (selected, state, entity) => {
        const options = { entity_id: entity.entity_id, speed: selected };
        return this.call_service('fan', 'set_speed', options);
      },
    },
    led: {
      icon: ICON.LEDBUTTON,
      type: 'toggle',
      hide: false,
      order: 2,
      active: state => (state !== 2 && state !== '2'),
      source: { true: 'On', false: 'Off' },
      state: { attribute: 'led', mapper: state => (state ? 'on' : 'off') },
      toggle_action: (state, entity) => {
        const service = state === 'on' ? 'xiaomi_miio_set_led_off' : 'xiaomi_miio_set_led_on';
        const options = { entity_id: entity.entity_id };
        return this.call_service('fan', service, options);
      },
    },
    buzzer: {
      icon: ICON.BUZZER,
      hide: false,
      order: 3,
      state: { attribute: 'buzzer', mapper: state => (state ? 'on' : 'off') },
      toggle_action: (state, entity) => {
        const service = state === 'on' ? 'xiaomi_miio_set_buzzer_off' : 'xiaomi_miio_set_buzzer_on';
        const options = { entity_id: entity.entity_id };
        return this.call_service('fan', service, options);
      },
    },
    child_lock: {
      hide: true,
      order: 4,
    },
  },
});

export default DEERMA_HUMIDIFIER_MJJSQ;
