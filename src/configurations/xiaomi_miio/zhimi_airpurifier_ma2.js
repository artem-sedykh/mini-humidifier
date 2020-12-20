import ICON from '../../const';

const ZHIMI_AIRPURIFIER_MA2 = () => ({
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
    unit: '',
    min: 0,
    max: 14,
    step: 1,
    state: { attribute: 'favorite_level' },
    change_action: (selected, state, entity) => {
      const options = { entity_id: entity.entity_id, level: selected };
      return this.call_service('xiaomi_miio', 'fan_set_favorite_level', options);
    },
  },
  indicators: {
    aqi: {
      icon: ICON.AQI,
      unit: 'μg/m³',
      source: { attribute: 'aqi' },
    },
    temperature: {
      icon: ICON.TEMPERATURE,
      unit: '°C',
      round: 1,
      source: { attribute: 'temperature' },
    },
    humidity: {
      icon: ICON.HUMIDITY,
      unit: '%',
      round: 1,
      source: { attribute: 'humidity' },
    },
    motor_speed: {
      icon: ICON.RPM,
      unit: 'rpm',
      source: { attribute: 'motor_speed' },
    },
  },
  buttons: {
    mode: {
      icon: ICON.FAN,
      type: 'dropdown',
      source: {
        auto: 'auto',
        silent: 'silent',
        favorite: 'favorite',
      },
      active: (state, entity) => (entity.state !== 'off'),
      state: { attribute: 'mode' },
      change_action: (selected, state, entity) => {
        const options = { entity_id: entity.entity_id, speed: selected };
        return this.call_service('fan', 'set_speed', options);
      },
    },
    led: {
      icon: ICON.LEDBUTTON,
      state: { attribute: 'led', mapper: state => (state ? 'on' : 'off') },
      toggle_action: (state, entity) => {
        const service = state === 'on' ? 'fan_set_led_off' : 'fan_set_led_on';
        const options = { entity_id: entity.entity_id };
        return this.call_service('xiaomi_miio', service, options);
      },
    },
    buzzer: {
      icon: ICON.BUZZER,
      hide: false,
      order: 3,
      state: { attribute: 'buzzer', mapper: state => (state ? 'on' : 'off') },
      toggle_action: (state, entity) => {
        const service = state === 'on' ? 'fan_set_buzzer_off' : 'fan_set_buzzer_on';
        const options = { entity_id: entity.entity_id };
        return this.call_service('xiaomi_miio', service, options);
      },
    },
    child_lock: {
      icon: ICON.CHILDLOCK,
      hide: false,
      order: 4,
      state: { attribute: 'child_lock', mapper: state => (state ? 'on' : 'off') },
      toggle_action: (state, entity) => {
        const service = state === 'on' ? 'fan_set_child_lock_off' : 'fan_set_child_lock_on';
        const options = { entity_id: entity.entity_id };
        return this.call_service('xiaomi_miio', service, options);
      },
    },
  },
});

export default ZHIMI_AIRPURIFIER_MA2;
