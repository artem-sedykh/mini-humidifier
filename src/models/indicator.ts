import { getEntityValue, round } from '../utils/utils';
import type { HassEntity, HomeAssistant, IndicatorConfig } from '../types';
import type HumidifierObject from './humidifier';

export default class IndicatorObject {
  config: IndicatorConfig;

  entity: HassEntity;

  humidifier: HumidifierObject;

  private _hass: HomeAssistant;

  private _last_changed: string | undefined;

  private _last_updated: string | undefined;

  constructor(
    entity: HassEntity,
    config: IndicatorConfig,
    humidifier: HumidifierObject,
    hass: HomeAssistant,
  ) {
    this.config = config || ({} as IndicatorConfig);
    this.entity = entity || ({} as HassEntity);
    this.humidifier = humidifier || ({} as HumidifierObject);
    this._hass = hass;

    if (entity) {
      this._last_changed = entity.last_changed;
      this._last_updated = entity.last_updated;
    }
  }

  get lastChanged(): string | undefined {
    return this._last_changed;
  }

  get lastUpdated(): string | undefined {
    return this._last_updated;
  }

  // Like for like: `last_changed` against `last_changed`. Crossed over - which
  // is how this read until #162 - the comparison reports a change for any
  // entity whose two stamps differ, and they differ on every entity that has
  // been updated since it last changed state. Home Assistant assigns `hass` on
  // every state change in the installation, so the card was rebuilding its
  // indicators and asking for a render half a second later, over and over,
  // whether or not anything it shows had moved.
  changed(entity: HassEntity): boolean {
    const e = entity || ({} as HassEntity);

    return this.lastChanged !== e.last_changed || this.lastUpdated !== e.last_updated;
  }

  get id(): string {
    return this.config.id;
  }

  get hass(): HomeAssistant {
    return this._hass;
  }

  // The reading itself: whatever the entity or attribute holds, then whatever
  // the model configuration makes of it. Both ends are the user's, so this is
  // as narrow as it honestly gets.
  get originalValue(): any {
    return getEntityValue(this.entity, this.config.source);
  }

  get value(): any {
    let value = this.originalValue;

    if (this.config.functions.mapper) {
      value = this.config.functions.mapper(value, this.entity, this.humidifier.entity);
    }

    if ('round' in this.config && Number.isNaN(value) === false && value !== '')
      value = round(value, this.config.round);

    return value;
  }

  get unit(): string {
    if (this.config.functions.unit && this.config.functions.unit.template) {
      return this.config.functions.unit.template(this.value, this.entity, this.humidifier.entity);
    } else if (this.config.unit && typeof this.config.unit === 'string') {
      return this.config.unit;
    }

    return '';
  }

  get hide(): boolean | undefined {
    return this.config.hide;
  }

  get icon(): string {
    if (this.config.functions.icon && this.config.functions.icon.template) {
      return this.config.functions.icon.template(this.value, this.entity, this.humidifier.entity);
    } else if (this.config.icon && typeof this.config.icon === 'string') {
      return this.config.icon;
    }

    return '';
  }

  get iconStyle(): Record<string, string> {
    if (this.config.functions.icon && this.config.functions.icon.style)
      return (
        this.config.functions.icon.style(this.value, this.entity, this.humidifier.entity) || {}
      );

    return {};
  }
}
