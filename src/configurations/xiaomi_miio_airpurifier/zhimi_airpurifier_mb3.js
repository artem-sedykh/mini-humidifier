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
    state: { entity: 'number.{entity_id}_favorite_level' },
    change_action: (selected, state, entity) => {
      const options = { entity_id: entity.entity_id, value: selected };
      return this.call_service('number', 'set_value', options);
    },
  },
  indicators: {
    aqi: {
      hide: false,
      order: 0,
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
      round: 0,
      source: { entity: 'sensor.{entity_id}_pm2_5' },
    },
    temperature: {
      icon: ICON.TEMPERATURE,
      hide: false,
      order: 1,
      unit: '°C',
      round: 1,
      source: { entity: 'sensor.{entity_id}_temperature' },
    },
    humidity: {
      icon: ICON.HUMIDITY,
      hide: false,
      order: 2,
      unit: '%',
      round: 1,
      source: { entity: 'sensor.{entity_id}_humidity' },
    },
    motor_speed: {
      icon: ICON.RPM,
      hide: false,
      order: 3,
      unit: 'rpm',
      round: 0,
      source: { entity: 'sensor.{entity_id}_motor_speed' },
    },
    filter_use: {
      icon: ICON.CLOCK,
      hide: false,
      order: 4,
      unit: 'h',
      round: 0,
      source: { entity: 'sensor.{entity_id}_filter_use' },
    },
  },
  buttons: {
    mode: {
      icon: ICON.FAN,
      type: 'dropdown',
      hide: false,
      order: 0,
      source: {
        __init: (entity) => {
          const modes = entity.attributes.preset_modes || [];
          return modes.map(mode => ({ id: mode, name: mode }));
        },
      },
      active: (state, entity) => (entity.state !== 'off'),
      state: { attribute: 'preset_mode' },
      change_action: (selected, state, entity) => {
        const options = { entity_id: entity.entity_id, preset_mode: selected };
        return this.call_service('fan', 'set_preset_mode', options);
      },
    },
    led: {
      icon: ICON.LEDBUTTON,
      hide: false,
      order: 1,
      state: { entity: 'switch.{entity_id}_led' },
      toggle_action: (state, entity) => {
        const service = state === 'on' ? 'turn_off' : 'turn_on';
        const options = { entity_id: entity.entity_id };
        return this.call_service('switch', service, options);
      },
    },
    buzzer: {
      icon: ICON.BUZZER,
      hide: false,
      order: 2,
      state: { entity: 'switch.{entity_id}_buzzer' },
      toggle_action: (state, entity) => {
        const service = state === 'on' ? 'turn_off' : 'turn_on';
        const options = { entity_id: entity.entity_id };
        return this.call_service('switch', service, options);
      },
    },
    child_lock: {
      icon: ICON.CHILDLOCK,
      hide: false,
      order: 3,
      state: { entity: 'switch.{entity_id}_child_lock' },
      toggle_action: (state, entity) => {
        const service = state === 'on' ? 'turn_off' : 'turn_on';
        const options = { entity_id: entity.entity_id };
        return this.call_service('switch', service, options);
      },
    },
  },
});

export default XIAOMI_MIIO_AIRPURIFIER_ZHIMI_AIRPURIFIER_MB3;
