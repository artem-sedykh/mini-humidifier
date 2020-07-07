import ICON from '../const';
import { DefaultModelConfig, Primitive } from '../types';
import { StyleInfo } from 'lit-html/directives/style-map';

export const AIRDOG_AIRPURIFIER_X5 = (): DefaultModelConfig => ({
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
    min: 1,
    max: 4,
    step: 1,
    state: { attribute: 'speed' },
    change_action: (speed, context): Promise<void> => {
      const options = { entity_id: context.entity.entity_id, speed: speed };
      return context.call_service('fan', 'set_speed', options);
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
  },
  buttons: {
    auto: {
      icon: ICON.AUTO,
      type: 'button',
      disabled: (_state, context): boolean => context.entity.state === 'off',
      state: {
        attribute: 'mode',
        mapper: (state): Primitive => (state === 'auto' ? 'on' : 'off'),
      },
      toggle_action: (state, context): Promise<void> => {
        const mode = state === 'on' ? 'manual' : 'auto';
        const options = { entity_id: context.entity.entity_id, mode: mode };
        return context.call_service('xiaomi_miio', 'fan_set_mode', options);
      },
    },
    sleep: {
      icon: ICON.SLEEP,
      type: 'button',
      disabled: (_state, context): boolean => context.entity.state === 'off',
      state: {
        attribute: 'mode',
        mapper: (state): Primitive => (state === 'sleep' ? 'on' : 'off'),
      },
      toggle_action: (state, context): Promise<void> => {
        const mode = state === 'on' ? 'manual' : 'sleep';
        const options = { entity_id: context.entity.entity_id, mode: mode };
        return context.call_service('xiaomi_miio', 'fan_set_mode', options);
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
