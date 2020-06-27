import { IndicatorConfig, TapActionConfig } from '../types';
import { HomeAssistant } from 'custom-card-helpers/dist';
import { HassEntity } from 'home-assistant-js-websocket';
import { round } from '../utils/utils';

export class Indicator {
  protected readonly _config: IndicatorConfig;
  private readonly _hass: HomeAssistant;
  protected readonly _humidifierEntity: HassEntity;
  private readonly _entity: HassEntity;

  constructor(hass: HomeAssistant, config: IndicatorConfig, humidifierEntity: HassEntity) {
    this._config = config;
    this._hass = hass;
    this._humidifierEntity = humidifierEntity;
    this._entity = hass.states[config.state.entity];
  }

  get id(): string {
    return this._config.id;
  }

  get hass(): HomeAssistant {
    return this._hass;
  }

  get entity(): HassEntity {
    return this._entity;
  }

  get tapAction(): TapActionConfig {
    return this._config.tapAction;
  }

  get unit(): string | undefined {
    return this._config.unit;
  }

  get hide(): boolean {
    return this._config.hide;
  }

  get order(): number {
    return this._config.order;
  }

  get icon(): string {
    return this._config.icon.template(this.value, this.entity, this._humidifierEntity);
  }

  get iconStyle(): object {
    return this._config.icon.style(this.value, this.entity, this._humidifierEntity);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get value(): any {
    let value = this._value();
    value = this._config.stateMapper(value, this.entity, this._humidifierEntity);

    if (this._config.round != undefined && !isNaN(value)) value = round(value, this._config.round);

    return value;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _value(): any {
    if (this._config.state.attribute) return this.entity.attributes[this._config.state.attribute];
    return this.entity.state;
  }
}
