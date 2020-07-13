import { HomeAssistant } from 'custom-card-helpers/dist';
import { GenericFanConfig, TapActionConfig } from '../types';
import { HassEntity } from 'home-assistant-js-websocket';
import ICON, { STATES_OFF, UNAVAILABLE_STATES } from '../const';

export class GenericFan {
  private readonly _hass: HomeAssistant;
  private readonly _config: GenericFanConfig;
  private readonly _entity: HassEntity;

  constructor(hass: HomeAssistant, config: GenericFanConfig) {
    this._hass = hass;
    this._config = config;
    this._entity = hass.states[config.entity];
  }

  get hass(): HomeAssistant {
    return this._hass;
  }

  get state(): string {
    return this.entity.state;
  }

  get name(): string {
    return this._config.name || this.entity.attributes.friendly_name || '';
  }

  get icon(): string {
    return this._config.icon ? this._config.icon : this.entity.attributes.icon || ICON.DEFAULT;
  }

  get isOff(): boolean {
    return this.entity !== undefined && STATES_OFF.includes(this.state) && !UNAVAILABLE_STATES.includes(this.state);
  }

  get isUnavailable(): boolean {
    return this.entity === undefined || UNAVAILABLE_STATES.includes(this.state);
  }

  get isActive(): boolean {
    return (!this.isOff && !this.isUnavailable) || false;
  }

  get entity(): HassEntity {
    return this._entity;
  }

  get tapAction(): TapActionConfig {
    return this._config.tapAction;
  }
}
