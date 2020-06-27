import ICON from '../const';

const ZHIMI_HUMIDIFIER_CB1 = () => ({
  power: {
    icon: ICON.POWER,
    type: 'button',
    hide: false,
    toggle_action: (_state, entity) => {
      const options = { entity_id: entity.entity_id };
      return this.call_service('fan', 'toggle', options);
    },
  },
  target_humidity: {
    indicator: {
      icon: ICON.HUMIDITY,
      unit: '%',
      hide: false,
    },
    min: 30,
    max: 80,
    step: 10,
    hide: false,
    state: { attribute: 'target_humidity' },
    change_action: (selected, _state, entity) => {
      const options = { entity_id: entity.entity_id, humidity: selected };
      return this.call_service('xiaomi_miio', 'fan_set_target_humidity', options);
    },
  },
  indicators: {
    depth: {
      unit: '%',
      round: 0,
      order: 0,
      max_value: 120,
      cover_removed_value: 127,
      volume: 4,
      type: 'percent',
      hide: false,
      cover_removed_view_value: '--',
      cover_removed_icon: ICON.COVER_REMOVED,
      enough_water_icon: ICON.DEPTH,
      shortage_water_icon: ICON.SHORTAGE_WATER,
      shortage_water_value: 12,
      icon: {
        template: (val, entity) => {
          const depth = entity.attributes.depth;
          if (depth === this.cover_removed_value)
            return this.cover_removed_icon;

          if (depth !== -1 && depth < this.shortage_water_value)
            return this.shortage_water_icon;

          return this.enough_water_icon;
        },
      },
      source: {
        attribute: 'depth',
        mapper: (depth) => {
          if (depth > this.max_value) {
            if (depth === this.cover_removed_value)
              return this.cover_removed_view_value;
            depth = this.max_value;
          } else if (depth === -1)
            depth = 0;

          const percent = depth / this.max_value * 100;

          if (this.type === 'liters')
            return (this.volume * percent) / 100;

          return percent;
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
        return this.call_service('xiaomi_miio', service, options);
      },
    },
    mode: {
      icon: ICON.FAN,
      type: 'dropdown',
      hide: false,
      order: 1,
      source: {
        auto: 'auto',
        silent: 'silent',
        medium: 'medium',
        high: 'high',
        __filter: (source) => {
          return source.map(item => {
            item.name = this.localize('mode.' + item.id, item.name);
            return item;
          })
        }
      },
      active: (state, entity) => (entity.state !== 'off'),
      disabled: (state, entity) => (entity.attributes.depth === 0),
      state: { attribute: 'mode' },
      call_service: function() { },
      change_action: (selected, state, entity) => {
        const options = { entity_id: entity.entity_id, speed: selected };
        return this.call_service('fan', 'set_speed', options);
      },
    },
    led: {
      icon: ICON.LED,
      type: 'dropdown',
      hide: false,
      order: 2,
      active: state => (state !== 2 && state !== '2'),
      source: {
        0: 'Bright',
        1: 'Dim',
        2: 'Off',
        __filter: (source) => {
          return source.map(item => {
            item.name = this.localize('led.' + item.id, item.name);
            return item;
          })
        }
      },
      state: { attribute: 'led_brightness' },
      change_action: (selected, state, entity) => {
        const options = { entity_id: entity.entity_id, brightness: selected };
        return this.call_service('xiaomi_miio', 'fan_set_led_brightness', options);
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
      icon: ICON.CHILD_LOCK,
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

export default ZHIMI_HUMIDIFIER_CB1;
