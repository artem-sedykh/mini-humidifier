import ICON from '../const';
import { DefaultModelConfig, DropdownItem, ExecutionContext, Primitive } from '../types';
import { StyleInfo } from 'lit-html/directives/style-map';

export const ZHIMI_HUMIDIFIER_CB1 = (): DefaultModelConfig => ({
  power: {
    icon: ICON.POWER,
    type: 'button',
    toggle_action: (_state, context): Promise<void> => {
      const options = { entity_id: context.entity.entity_id };
      return context.call_service('fan', 'toggle', options);
    },
  },
  slider: {
    indicator: { icon: ICON.HUMIDITY, unit: '%' },
    min: 30,
    max: 80,
    step: 10,
    state: { attribute: 'target_humidity' },
    change_action: (selected, context): Promise<void> => {
      const options = { entity_id: context.entity.entity_id, humidity: selected };
      return context.call_service('xiaomi_miio', 'fan_set_target_humidity', options);
    },
  },
  indicators: {
    depth: {
      round: 1,
      type: 'percent',
      icon_cover_removed: ICON.COVER_REMOVED,
      icon_water_enough: ICON.DEPTH,
      icon_water_shortage: ICON.SHORTAGE_WATER,
      icon: {
        template: (_state, context): string => {
          const entity = context.entity;
          const config = context.config;
          const depth = entity.attributes.depth;
          if (depth === 127) return config.icon_cover_removed;
          if (depth < 12) return config.icon_water_shortage;
          return config.icon_water_enough;
        },
      },
      unit: {
        template: (_state, context): string => {
          const entity = context.entity;
          const type = context.config.type;
          const depth = entity.attributes.depth;
          if (depth === 127) return '';
          return context.localize('zhimi_humidifier_cb1.depth.' + type, '%');
        },
      },
      state: {
        attribute: 'depth',
        mapper: (state, context): Primitive => {
          let depth = Number(state);
          const config = context.config;

          if (depth > 120) {
            if (depth === 127) return '';
            depth = 120;
          }

          if (config.type === 'liters') return (4 * depth) / 120;

          return (depth / 120) * 100;
        },
      },
    },
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
  },
  buttons: {
    dry: {
      icon: ICON.DRY,
      type: 'button',
      state: {
        attribute: 'dry',
        mapper: (state): Primitive => (state ? 'on' : 'off'),
      },
      toggle_action: (state, context): Promise<void> => {
        const service = state === 'on' ? 'fan_set_dry_off' : 'fan_set_dry_on';
        const options = { entity_id: context.entity.entity_id };
        return context.call_service('xiaomi_miio', service, options);
      },
    },
    mode: {
      icon: ICON.FAN,
      type: 'dropdown',
      state: 'mode',
      source: {
        auto: 'auto',
        silent: 'silent',
        medium: 'medium',
        high: 'high',
        __filter: (source: DropdownItem[], context: ExecutionContext): DropdownItem[] => {
          return source.map(item => {
            item.name = context.localize('zhimi_humidifier_cb1.mode.' + item.id, item.name);
            return item;
          });
        },
      },
      active: (_state, context): boolean => {
        return context.entity.state !== 'off';
      },
      disabled: (_state, context): boolean => {
        const depth = context.entity.attributes.depth;
        return depth < 12;
      },
      change_action: (selected, context): Promise<void> => {
        const options = { entity_id: context.entity.entity_id, speed: selected };
        return context.call_service('fan', 'set_speed', options);
      },
    },
    led: {
      icon: ICON.LED,
      type: 'dropdown',
      state: {
        attribute: 'led_brightness',
        mapper: (state): string | undefined => state?.toString(),
      },
      source: {
        0: 'Bright',
        1: 'Dim',
        2: 'Off',
        __filter: (source: DropdownItem[], context: ExecutionContext): DropdownItem[] => {
          return source.map(item => {
            item.name = context.localize('zhimi_humidifier_cb1.led_brightness.' + item.id, item.name);
            return item;
          });
        },
      },
      style: (state): StyleInfo => {
        return state === '1' ? { opacity: '0.6' } : {};
      },
      active: (state): boolean => {
        return state !== '2';
      },
      change_action: (selected, context): Promise<void> => {
        const options = { entity_id: context.entity.entity_id, brightness: selected };
        return context.call_service('xiaomi_miio', 'fan_set_led_brightness', options);
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
        const service = state === 'on' ? 'fan_set_buzzer_off' : 'fan_set_buzzer_on';
        const options = { entity_id: context.entity.entity_id };
        return context.call_service('xiaomi_miio', service, options);
      },
    },
    child_lock: {
      icon: ICON.CHILD_LOCK,
      type: 'button',
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
  secondary_info: 'mode',
  supported_secondary_infos: {
    none: { type: 'none' },
    'last-changed': { type: 'last-changed' },
    mode: { type: 'custom', inheritance_button_id: 'mode' },
    'mode-dropdown': { type: 'custom-dropdown', inheritance_button_id: 'mode', icon: ICON.FAN },
  },
});
