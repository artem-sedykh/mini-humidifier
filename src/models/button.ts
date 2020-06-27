import { HomeAssistant } from 'custom-card-helpers/dist';
import { ButtonConfig, ElementType } from '../types';
import { StyleInfo } from 'lit-html/directives/style-map';
import { HassEntity } from 'home-assistant-js-websocket';
import { STATES_OFF, UNAVAILABLE_STATES } from '../const';

export class Button {
  private readonly _hass: HomeAssistant;
  private readonly _config: ButtonConfig;
  private readonly _humidifierEntity: HassEntity;
  private readonly _entity: HassEntity;

  constructor(hass: HomeAssistant, config: ButtonConfig, humidifierEntity: HassEntity) {
    this._hass = hass;
    this._config = config;
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

  get isOn(): boolean {
    return this.entity !== undefined && !STATES_OFF.includes(this.state) && !UNAVAILABLE_STATES.includes(this.state);
  }

  get hide(): boolean {
    return this._config.hide;
  }

  get order(): number {
    return this._config.order;
  }

  get elementType(): ElementType {
    return this._config.elementType;
  }

  get actionTimeout(): number {
    return this._config.actionTimeout;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public get state(): any {
    let value = this._state();
    value = this._config.stateMapper(value, this.entity, this._humidifierEntity);
    return value;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _state(): any {
    if (this._config.state.attribute) return this.entity.attributes[this._config.state.attribute];
    return this.entity.state;
  }

  get icon(): string {
    return this._config.icon || '';
  }

  get disabled(): boolean {
    return this._config.disabled(this.state, this.entity, this._humidifierEntity);
  }

  get isUnavailable(): boolean {
    return this.entity === undefined || UNAVAILABLE_STATES.includes(this.state);
  }

  get style(): StyleInfo {
    return this._config.style(this.state, this.entity, this._humidifierEntity);
  }

  public toggle(): Promise<void> {
    return this._config.toggleAction(this.hass, this.state, this.entity, this._humidifierEntity);
  }
}
