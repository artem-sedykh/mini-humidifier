import { ICON } from '../../const';

const DEERMA_HUMIDIFIER_JSQ = () => ({
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
    unit: {
      template: (val) => {
        if (val === '')
          return '';
        return '%';
      },
    },
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
          return '';
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
    water_tank_empty: {
      tap_action: 'more-info',
      order: 0,
      hide: false,
      full_icon: ICON.WATERLEVEL,
      empty_icon: ICON.WATERLEVEL,
      detached_icon: ICON.WATERTANKDETACHED,
      empty: undefined,
      filled: undefined,
      icon: {
        template: (_, entity) => {
          if (entity.state === 'on') {
            return this.empty_icon;
          }
          if (entity.state === 'off') {
            return this.full_icon;
          }
          return this.detached_icon;
        },
      },
      unit: {
        // eslint-disable-next-line no-unused-vars
        template: val => '',
      },
      source: {
        entity: 'binary_sensor.{entity_id}_water_tank_empty',
        mapper: (val) => {
          if (val === 'on') {
            if (this.empty !== undefined)
              return this.empty;
            return this.localize('deerma_humidifier_jsq.water_tank_empty.empty', 'empty');
          }
          if (val === 'off') {
            if (this.filled !== undefined)
              return this.filled;
            return this.localize('deerma_humidifier_jsq.water_tank_empty.filled', 'filled');
          }
          return '';
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
  },
  buttons: {
    mode: {
      icon: ICON.FAN,
      type: 'dropdown',
      hide: false,
      order: 1,
      source: {
        __init: (entity) => {
          const modes = entity.attributes.available_modes || [];
          return modes.map(mode => ({ id: mode, name: this.localize(`deerma_humidifier_jsq.mode.${mode}`, mode) }));
        },
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
  },
});

export default DEERMA_HUMIDIFIER_JSQ;
