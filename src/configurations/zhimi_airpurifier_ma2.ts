import ICON from '../const';
import { DefaultModelConfig, Primitive } from '../types';
import { StyleInfo } from 'lit-html/directives/style-map';

export const ZHIMI_AIRPURIFIER_MA2 = (): DefaultModelConfig => ({
  power: {
    icon: ICON.POWER,
    type: 'button',
    toggle_action: (_state, context): Promise<void> => {
      const options = { entity_id: context.entity.entity_id };
      return context.call_service('fan', 'toggle', options);
    },
  },
  slider: {
    indicator: { icon: ICON.FAN },
    min: 0,
    max: 14,
    step: 1,
    state: { attribute: 'favorite_level' },
    change_action: (level, context): Promise<void> => {
      const options = { entity_id: context.entity.entity_id, level: level };
      return context.call_service('xiaomi_miio', 'fan_set_favorite_level', options);
    },
  },
  indicators: {
    aqi: {
      icon: {
        template: (): string => 'mdi:checkbox-blank-circle',
        style: (state): StyleInfo => {
          const value = Number(state);
          let color = '#1CC09B';
          color = value > 75 ? '#F88B48' : color;
          color = value > 150 ? '#E64650' : color;
          return { color: color, '--mdc-icon-size': '17px', 'margin-top': '1px' };
        },
      },
      unit: 'μg/m³',
      state: { attribute: 'aqi' },
    },
    temperature: {
      icon: ICON.TEMPERATURE,
      unit: '°C',
      round: 1,
      state: 'temperature',
    },
    humidity: {
      icon: ICON.HUMIDITY,
      unit: '%',
      round: 1,
      state: 'humidity',
    },
    motor_speed: {
      icon: ICON.RPM,
      unit: 'rpm',
      state: 'motor_speed',
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
      active: (_state, context): boolean => context.entity.state !== 'off',
      state: 'mode',
      change_action: (speed, context): Promise<void> => {
        const options = { entity_id: context.entity.entity_id, speed: speed };
        return context.call_service('fan', 'set_speed', options);
      },
    },
    led: {
      icon: ICON.LED,
      type: 'button',
      state: {
        attribute: 'led',
        mapper: (state): string => (state ? 'on' : 'off'),
      },
      toggle_action: (state, context): Promise<void> => {
        const service = state === 'on' ? 'remote_set_led_off' : 'remote_set_led_on';
        const options = { entity_id: context.entity.entity_id };
        return context.call_service('xiaomi_miio', service, options);
      },
    },
    buzzer: {
      icon: ICON.BUZZER,
      type: 'button',
      state: {
        attribute: 'buzzer',
        mapper: (state): string => (state ? 'on' : 'off'),
      },
      toggle_action: (state, context): Promise<void> => {
        const service = state === 'on' ? 'fan_set_buzzer_off' : 'fan_set_buzzer_on';
        const options = { entity_id: context.entity.entity_id };
        return context.call_service('xiaomi_miio', service, options);
      },
    },
    child_lock: {
      icon: ICON.CHILD_LOCK,
      type: 'button',
      disabled: (_state, context): boolean =>
        context.entity.state === 'off' || context.entity.attributes.mode === 'sleep',
      state: {
        attribute: 'child_lock',
        mapper: (state): Primitive => (state ? 'on' : 'off'),
      },
      toggle_action: (state, context): Promise<void> => {
        const service = state === 'on' ? 'fan_set_child_lock_off' : 'fan_set_child_lock_on';
        const options = { entity_id: context.entity.entity_id };
        return context.call_service('xiaomi_miio', service, options);
      },
    },
  },
});
