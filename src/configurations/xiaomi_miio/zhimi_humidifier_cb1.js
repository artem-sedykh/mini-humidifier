import { ICON } from '../../const';

const ZHIMI_HUMIDIFIER_CB1 = () => ({
  power: {
    icon: ICON.POWER,
    type: 'button',
    hide: false,
    toggle_action: (state, entity) => {
      const service = state === 'on' ? 'turn_off' : 'turn_on';
      const options = { entity_id: entity.entity_id };
      return this.call_service('humidifier', service, options);
    },
  },
  target_humidity: {
    icon: ICON.HUMIDITY,
    unit: '%',
    min: 30,
    max: 80,
    step: 10,
    hide: false,
    hide_indicator: false,
    state: {
      attribute: 'humidity',
      mapper: (val) => {
        // eslint-disable-next-line use-isnan
        if (val === NaN || val === undefined || val === 'unknown') {
          return 100;
        }
        return val;
      },
    },
    change_action: (selected, state, entity) => {
      const options = { entity_id: entity.entity_id, humidity: selected };
      return this.call_service('humidifier', 'set_humidity', options);
    },
  },
  indicators: {
    water_level: {
      tap_action: 'more-info',
      icon: {
        // eslint-disable-next-line max-len,use-isnan
        template: val => ((val === '') ? 'mdi:tray-remove' : 'mdi:tray-full'),
      },
      unit: {
        template: val => ((val === '') ? '' : '%'),
      },
      round: 0,
      order: 0,
      volume: 4,
      type: 'percent',
      hide: false,
      source: {
        entity: 'sensor.{entity_id}_water_level',
        mapper: (val) => {
          // eslint-disable-next-line use-isnan
          if (val === NaN || val === undefined || val === 'unknown') {
            return '';
          }
          return this.type === 'liters' ? (val * this.volume) / 100 : val;
        },
      },
    },
    temperature: {
      tap_action: 'more-info',
      icon: ICON.TEMPERATURE,
      unit: '°C',
      round: 1,
      order: 1,
      hide: false,
      source: { entity: 'sensor.{entity_id}_temperature' },
    },
    humidity: {
      tap_action: 'more-info',
      icon: ICON.HUMIDITY,
      unit: '%',
      round: 1,
      order: 2,
      hide: false,
      source: { entity: 'sensor.{entity_id}_humidity' },
    },
    motor_speed: {
      tap_action: 'more-info',
      icon: ICON.MOTORSPEED,
      unit: 'rpm',
      round: 1,
      order: 3,
      hide: false,
      source: { entity: 'sensor.{entity_id}_motor_speed' },
    },
  },
  buttons: {
    dry: {
      icon: ICON.DRY,
      hide: false,
      order: 0,
      state: { entity: 'switch.{entity_id}_dry_mode' },
      toggle_action: (state, entity) => {
        const service = state === 'on' ? 'turn_off' : 'turn_on';
        const options = { entity_id: entity.entity_id };
        return this.call_service('switch', service, options);
      },
    },
    mode: {
      icon: ICON.FAN,
      type: 'dropdown',
      hide: false,
      order: 1,
      source: {
        Auto: 'auto',
        Silent: 'silent',
        Medium: 'medium',
        High: 'high',
      },
      active: (state, entity) => (entity.state !== 'off'),
      state: { attribute: 'mode' },
      change_action: (selected, state, entity) => {
        const options = { entity_id: entity.entity_id, mode: selected };
        return this.call_service('humidifier', 'set_mode', options);
      },
    },
    led: {
      icon: ICON.LEDBUTTON,
      type: 'dropdown',
      hide: false,
      order: 2,
      active: state => state !== 'off',
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
      order: 3,
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
      order: 4,
      state: { entity: 'switch.{entity_id}_child_lock' },
      toggle_action: (state, entity) => {
        const service = state === 'on' ? 'turn_off' : 'turn_on';
        const options = { entity_id: entity.entity_id };
        return this.call_service('switch', service, options);
      },
    },
  },
});

export default ZHIMI_HUMIDIFIER_CB1;
