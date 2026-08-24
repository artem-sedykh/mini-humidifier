import { getEntityValue } from '../utils/utils';
import { ACTION_TIMEOUT } from '../const';
import type { CardConfig, HassEntity } from '../types';
import type HumidifierObject from './humidifier';

export default class TargetHumidityObject {
  entity: HassEntity;

  config: CardConfig;

  humidifier: HumidifierObject;

  constructor(entity: HassEntity, config: CardConfig, humidifier: HumidifierObject) {
    this.entity = entity || ({} as HassEntity);
    this.config = config;
    this.humidifier = humidifier;
  }

  get min(): number | undefined {
    return this.config.target_humidity.min;
  }

  get max(): number | undefined {
    return this.config.target_humidity.max;
  }

  get step(): number | undefined {
    return this.config.target_humidity.step;
  }

  // The reading the slider shows: what the entity holds, then what the model
  // configuration makes of it. The user owns both ends of that.
  get originalValue(): any {
    return getEntityValue(this.entity, this.config.target_humidity.state);
  }

  get value(): any {
    const value = this.originalValue;

    if (
      this.config.target_humidity.functions.state &&
      this.config.target_humidity.functions.state.mapper
    ) {
      return this.config.target_humidity.functions.state.mapper(
        value,
        this.entity,
        this.humidifier.entity,
      );
    }

    return value;
  }

  get icon(): string {
    const config = this.config.target_humidity;

    if (config.functions.icon.template) {
      return config.functions.icon.template(this.value, this.entity, this.humidifier.entity);
    } else if (config.icon && typeof config.icon === 'string') {
      return config.icon;
    }

    return '';
  }

  get iconStyle(): Record<string, string> {
    const config = this.config.target_humidity;

    if (config.functions.icon && config.functions.icon.style)
      return config.functions.icon.style(this.value, this.entity, this.humidifier.entity) || {};

    return {};
  }

  get hide(): boolean | undefined {
    return this.config.target_humidity.hide;
  }

  get hideIndicator(): boolean | undefined {
    return this.config.target_humidity.hide_indicator;
  }

  get unit(): string {
    const config = this.config.target_humidity;
    if (config.functions.unit && config.functions.unit.template) {
      return config.functions.unit.template(this.value, this.entity, this.humidifier.entity);
    } else if (config.unit && typeof config.unit === 'string') {
      return config.unit;
    }

    return '';
  }

  get actionTimeout(): number {
    if ('action_timeout' in this.config.target_humidity)
      return this.config.target_humidity.action_timeout as number;

    return ACTION_TIMEOUT;
  }

  get disabled(): boolean {
    if (this.config.target_humidity.functions.disabled) {
      // `value`, not `state`: this class has no `state`, so the callback used
      // to be handed undefined where its documented signature promises the
      // current reading. See #163.
      return this.config.target_humidity.functions.disabled(
        this.value,
        this.entity,
        this.humidifier.entity,
      );
    }

    return false;
  }

  handleChange(value: unknown): unknown {
    if (this.config.target_humidity.functions.change_action) {
      return this.config.target_humidity.functions.change_action(
        value,
        this.value,
        this.entity,
        this.humidifier.entity,
      );
    }

    return undefined;
  }
}
