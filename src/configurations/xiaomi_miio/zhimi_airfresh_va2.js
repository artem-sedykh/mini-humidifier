import { ICON } from '../../const';

const ZHIMI_AIRFRESH_VA2 = () => ({
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
    unit: '%',
    min: 1,
    max: 100,
    step: 1,
    state: { attribute: 'percentage' },
    change_action: (selected, state, entity) => {
      const options = { entity_id: entity.entity_id, percentage: selected };
      return this.call_service('fan', 'set_percentage', options);
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
      source: { entity: 'sensor.{entity_id}_pm2_5' },
    },
    temperature: {
      icon: ICON.TEMPERATURE,
      unit: '°C',
      round: 1,
      order: 1,
      hide: false,
      source: { entity: 'sensor.{entity_id}_temperature' },
    },
    humidity: {
      icon: ICON.HUMIDITY,
      unit: '%',
      round: 1,
      order: 2,
      hide: false,
      source: { entity: 'sensor.{entity_id}_humidity' },
    },
    motor_speed: {
      icon: ICON.RPM,
      unit: 'rpm',
      round: 0,
      order: 3,
      hide: true,
      source: { attribute: 'motor_speed' },
    },
    co2: {
      icon: ICON.CO2,
      unit: 'ppm',
      round: 0,
      order: 4,
      hide: false,
      source: { entity: 'sensor.{entity_id}_carbon_dioxide' },
    },
    filter_use: {
      icon: ICON.CLOCK,
      unit: 'h',
      round: 0,
      order: 5,
      hide: false,
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
        __init: entity => entity.attributes.speed_list.map(mode => ({ id: mode, name: mode })),
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
      type: 'dropdown',
      hide: false,
      order: 1,
      source: { bright: 'Bright', dim: 'Dim', off: 'Off' },
      state: { entity: 'select.{entity_id}_led_brightness' },
      change_action: (selected, state, entity) => {
        const options = { entity_id: entity.entity_id, option: selected };
        return this.call_service('select', 'select_option', options);
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

export default ZHIMI_AIRFRESH_VA2;
