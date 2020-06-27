import ICON from '../const';
import { DefaultModelConfig, Primitive } from '../types';

export const DEERMA_HUMIDIFIER_MJJSQ = (): DefaultModelConfig => ({
  power: {
    icon: ICON.POWER,
    type: 'button',
    toggle_action: (_state, context): Promise<void> => {
      const options = { entity_id: context.entity.entity_id };
      return context.call_service('fan', 'toggle', options);
    },
  },
  target_humidity: {
    indicator: { icon: ICON.HUMIDITY, unit: '%' },
    min: 30,
    max: 80,
    step: 1,
    state: { attribute: 'target_humidity' },
    change_action: (selected, context): Promise<void> => {
      const options = { entity_id: context.entity.entity_id, humidity: selected };
      return context.call_service('fan', 'xiaomi_miio_set_target_humidity', options);
    },
  },
  indicators: {
    temperature: {
      icon: ICON.TEMPERATURE,
      unit: '°C',
      round: 1,
      state: { attribute: 'temperature' },
    },
    humidity: {
      icon: ICON.HUMIDITY,
      unit: '%',
      round: 1,
      state: { attribute: 'humidity' },
    },
    status: {
      icon: ICON.TANK,
      order: 3,
      empty: 'Empty',
      filled: 'Filled',
      source: {
        attribute: 'no_water',
        mapper: (state, context): Primitive => {
          const config = context.config;
          return state ? config.empty : config.filled;
        },
      },
    },
  },
  buttons: {
    mode: {
      icon: ICON.FAN,
      type: 'dropdown',
      state: { attribute: 'mode' },
      source: {
        humidity: 'auto',
        low: 'low',
        medium: 'medium',
        high: 'high',
      },
      active: (_state, context): boolean => {
        return context.entity.state !== 'off';
      },
      change_action: (selected, context): Promise<void> => {
        const options = { entity_id: context.entity.entity_id, speed: selected };
        return context.call_service('fan', 'set_speed', options);
      },
    },
    led: {
      icon: ICON.LED,
      type: 'button',
      state: {
        attribute: 'led',
        mapper: (state): Primitive => (state ? 'on' : 'off'),
      },
      toggle_action: (state, context): Promise<void> => {
        const service = state === 'on' ? 'xiaomi_miio_set_led_off' : 'xiaomi_miio_set_led_on';
        const options = { entity_id: context.entity.entity_id };
        return context.call_service('fan', service, options);
      },
    },
    buzzer: {
      icon: ICON.BUZZER,
      type: 'button',
      state: {
        attribute: 'buzzer',
        mapper: (state): Primitive => (state ? 'on' : 'off'),
      },
      toggle_action: (state, context): Promise<void> => {
        const service = state === 'on' ? 'xiaomi_miio_set_buzzer_off' : 'xiaomi_miio_set_buzzer_on';
        const options = { entity_id: context.entity.entity_id };
        return context.call_service('fan', service, options);
      },
    },
  },
});
