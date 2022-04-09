import { ICON } from '../../const';

const XIAOMI_MIIO_AIRPURIFIER_ZHIMI_AIRPURIFIER_MB3 = () => ({
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
    state: { entity: 'input_number.{entity_id}_favorite_level' },
    change_action: (selected, state, entity) => {
      const options = { entity_id: entity.entity_id, value: selected };
      return this.call_service('input_number', 'set_value', options);
    },
  },
  indicators: {
    aqi: {
      round: 0,
      order: 0,
      hide: false,
      levels: {
        good: { min: 0, max: 50, color: '#1CC09B' },
        moderate: { min: 51, max: 100, color: '#FFDE33' },
        unhealthy_sensitive_groups: { min: 101, max: 150, color: '#F88B48' },
        unhealthy: { min: 151, max: 200, color: '#E64650' },
        very_unhealthy: { min: 201, max: 300, color: '#660099' },
        hazardous: { min: 301, max: 100000, color: '#7E0023' },
      },
      icon: {
        template: () => 'mdi:checkbox-blank-circle',
        style: (state) => {
          const style = { '--mdc-icon-size': '17px', 'margin-top': '1px' };
          const value = Number(state);
          const entries = Object.entries(this.levels || {});
          for (let i = 0; i < entries.length; i += 1) {
            const level = entries[i][1] || {};
            if (value >= level.min && value <= level.max) {
              style.color = level.color;
            }
          }
          return style;
        },
      },
      unit: 'μg/m³',
      source: { attribute: 'aqi' },
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
    motor_speed: {
      icon: ICON.MOTORSPEED,
      unit: 'rpm',
      round: 0,
      order: 3,
      hide: false,
      source: { attribute: 'motor_speed' },
    },
  },
  buttons: {
    mode: {
      icon: ICON.FAN,
      type: 'dropdown',
      hide: false,
      order: 1,
      source: {
        __init: (entity) => {
          const modes = entity.attributes.preset_modes || [];
          return modes.map(mode => ({ id: mode, name: mode }));
        },
      },
      active: (state, entity) => (entity.state !== 'off'),
      disabled: false,
      state: { attribute: 'preset_mode' },
      change_action: (selected, state, entity) => {
        const options = { entity_id: entity.entity_id, preset_mode: selected };
        return this.call_service('fan', 'set_preset_mode', options);
      },
    },
    fan_level: {
      icon: ICON.FAN,
      type: 'dropdown',
      hide: false,
      order: 2,
      source: {
        1: 'Low',
        2: 'Medium',
        3: 'High',
      },
      state: { attribute: 'fan_level' },
      change_action: (selected, state, entity) => {
        const options = { entity_id: entity.entity_id, level: selected };
        return this.call_service('xiaomi_miio_airpurifier', 'fan_set_fan_level', options);
      },
    },
    led: {
      icon: ICON.LEDBUTTON,
      type: 'dropdown',
      hide: false,
      order: 3,
      active: state => (state !== 2 && state !== '2'),
      source: {
        0: 'Bright',
        1: 'Dim',
        2: 'Off',
      },
      state: { attribute: 'led_brightness' },
      change_action: (selected, state, entity) => {
        const options = { entity_id: entity.entity_id, brightness: selected };
        return this.call_service('xiaomi_miio_airpurifier', 'fan_set_led_brightness', options);
      },
    },
    buzzer: {
      icon: ICON.BUZZER,
      hide: false,
      order: 4,
      state: { attribute: 'buzzer', mapper: state => (state ? 'on' : 'off') },
      toggle_action: (state, entity) => {
        const service = state === 'on' ? 'fan_set_buzzer_off' : 'fan_set_buzzer_on';
        const options = { entity_id: entity.entity_id };
        return this.call_service('xiaomi_miio_airpurifier', service, options);
      },
    },
    child_lock: {
      icon: ICON.CHILDLOCK,
      hide: false,
      order: 5,
      state: { attribute: 'child_lock', mapper: state => (state ? 'on' : 'off') },
      toggle_action: (state, entity) => {
        const service = state === 'on' ? 'fan_set_child_lock_off' : 'fan_set_child_lock_on';
        const options = { entity_id: entity.entity_id };
        return this.call_service('xiaomi_miio_airpurifier', service, options);
      },
    },
  },
});

export default XIAOMI_MIIO_AIRPURIFIER_ZHIMI_AIRPURIFIER_MB3;
