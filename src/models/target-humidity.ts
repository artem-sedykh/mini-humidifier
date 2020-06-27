import { HomeAssistant } from 'custom-card-helpers/dist';
import { TargetHumidityConfig } from '../types';
import { HassEntity } from 'home-assistant-js-websocket';
import { TargetHumidityIndicator } from './target-humidity-indicator';

export class TargetHumidity {
  private readonly _hass: HomeAssistant;
  private readonly _config: TargetHumidityConfig;
  private readonly _humidifierEntity: HassEntity;
  private readonly _entity: HassEntity;
  private readonly _indicator: TargetHumidityIndicator;

  constructor(hass: HomeAssistant, config: TargetHumidityConfig, humidifierEntity: HassEntity) {
    this._hass = hass;
    this._config = config;
    this._humidifierEntity = humidifierEntity;
    this._entity = hass.states[config.state.entity];
    this._indicator = new TargetHumidityIndicator(hass, config.indicator, humidifierEntity);
  }

  get hass(): HomeAssistant {
    return this._hass;
  }

  get entity(): HassEntity {
    return this._entity;
  }

  get hide(): boolean {
    return this._config.hide;
  }

  get actionTimeout(): number {
    return this._config.actionTimeout;
  }

  get min(): number {
    return this._config.min;
  }

  get max(): number {
    return this._config.max;
  }

  get step(): number {
    return this._config.step;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public get state(): any {
    let value = this._state();
    value = this._config.stateMapper(value, this.entity, this._humidifierEntity);
    return value;
  }

  public get indicator(): TargetHumidityIndicator {
    return this._indicator;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _state(): any {
    if (this._config.state.attribute) return this.entity.attributes[this._config.state.attribute];
    return this.entity.state;
  }

  public change(selected: number): Promise<void> {
    return this._config.change(this.hass, selected, this.state, this.entity, this._humidifierEntity);
  }
}
