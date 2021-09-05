import { ICON } from '../../const';

const XIAOMI_MIIO_AIRPURIFIER_ZHIMI_HUMIDIFIER_CB1 = () => ({
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
    step: 10,
    hide: false,
    hide_indicator: false,
    state: { attribute: 'target_humidity' },
    change_action: (selected, state, entity) => {
      const options = { entity_id: entity.entity_id, humidity: selected };
      return this.call_service('xiaomi_miio_airpurifier', 'fan_set_target_humidity', options);
    },
  },
  indicators: {
    depth: {
      default_icon: ICON.DEPTH,
      detached_icon: ICON.WATERTANKDETACHED,
      icon: {
        template: val => ((val === '') ? this.detached_icon : this.default_icon),
      },
      unit: {
        template: (val) => {
          if (val === '')
            return '';
          const { type } = this;
          return this.localize(`zhimi_humidifier_cb1.water_level.${type}`, '%');
        },
      },
      round: 0,
      order: 0,
      max_value: 125,
      volume: 4,
      type: 'percent',
      hide: false,
      source: {
        attribute: 'depth',
        mapper: (val) => {
          if (val === 127)
            return '';

          const value = (100 * (val || 0)) / this.max_value;
          return this.type === 'liters' ? (value * this.volume) / 100 : value;
        },
      },
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
    dry: {
      icon: ICON.DRY,
      hide: false,
      order: 0,
      state: { attribute: 'dry', mapper: state => (state ? 'on' : 'off') },
      toggle_action: (state, entity) => {
        const service = state === 'on' ? 'fan_set_dry_off' : 'fan_set_dry_on';
        const options = { entity_id: entity.entity_id };
        return this.call_service('xiaomi_miio_airpurifier', service, options);
      },
    },
    mode: {
      icon: ICON.FAN,
      type: 'dropdown',
      hide: false,
      order: 1,
      source: {
        __init: (entity) => {
          const modes = entity.attributes.preset_modes || [];
          return modes.map(mode => ({ id: mode, name: this.localize(`zhimi_humidifier_cb1.mode.${mode}`) }));
        },
      },
      active: (state, entity) => (entity.state !== 'off'),
      disabled: (state, entity) => (entity.attributes.depth === 0),
      state: { attribute: 'preset_mode' },
      change_action: (selected, state, entity) => {
        const options = { entity_id: entity.entity_id, preset_mode: selected };
        return this.call_service('fan', 'set_preset_mode', options);
      },
    },
    led: {
      icon: ICON.LEDBUTTON,
      type: 'dropdown',
      hide: false,
      order: 2,
      active: state => (state !== 2 && state !== '2'),
      source: {
        0: 'Bright',
        1: 'Dim',
        2: 'Off',
        __filter: source => source.map((item) => {
          const name = this.localize(`zhimi_humidifier_cb1.led_brightness.${item.id}`, item.name);
          return { id: item.id, name };
        }),
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
      order: 3,
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
      order: 4,
      state: { attribute: 'child_lock', mapper: state => (state ? 'on' : 'off') },
      toggle_action: (state, entity) => {
        const service = state === 'on' ? 'fan_set_child_lock_off' : 'fan_set_child_lock_on';
        const options = { entity_id: entity.entity_id };
        return this.call_service('xiaomi_miio_airpurifier', service, options);
      },
    },
  },
});

export default XIAOMI_MIIO_AIRPURIFIER_ZHIMI_HUMIDIFIER_CB1;
