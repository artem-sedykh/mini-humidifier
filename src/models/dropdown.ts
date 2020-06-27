import { HomeAssistant } from 'custom-card-helpers/dist';
import { DropdownConfig, DropdownItem, ElementType } from '../types';
import { StyleInfo } from 'lit-html/directives/style-map';
import { HassEntity } from 'home-assistant-js-websocket';

export class Dropdown {
  private readonly _hass: HomeAssistant;
  private readonly _config: DropdownConfig;
  private readonly _humidifierEntity: HassEntity;
  private readonly _entity: HassEntity;

  constructor(hass: HomeAssistant, config: DropdownConfig, humidifierEntity: HassEntity) {
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

  get style(): StyleInfo {
    return this._config.style(this.state, this.entity, this._humidifierEntity);
  }

  get source(): DropdownItem[] {
    const source = this._config.source;
    return this._config.sourceFilter(this.hass, source, this.state, this.entity, this._humidifierEntity);
  }

  get selected(): DropdownItem | undefined {
    return this.source.find(s => s.id === this.state?.toString());
  }

  public isActive(state: string | undefined): boolean {
    return this._config.active(state, this.entity, this._humidifierEntity);
  }

  public change(selected: string): Promise<void> {
    return this._config.change(this.hass, selected, this.state, this.entity, this._humidifierEntity);
  }
}
