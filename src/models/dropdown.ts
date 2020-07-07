import { HomeAssistant } from 'custom-card-helpers/dist';
import { DropdownConfig, DropdownItem, ElementType, ExecutionContext, Primitive } from '../types';
import { StyleInfo } from 'lit-html/directives/style-map';
import { HassEntity } from 'home-assistant-js-websocket';
import { localize } from '../localize/localize';

export class Dropdown {
  private readonly _hass: HomeAssistant;
  private readonly _config: DropdownConfig;
  private readonly _cardEntity: HassEntity;
  private readonly _entity: HassEntity;

  constructor(hass: HomeAssistant, config: DropdownConfig, cardEntity: HassEntity) {
    this._hass = hass;
    this._config = config;
    this._cardEntity = cardEntity;
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

  get label(): string | undefined {
    const context = this._getExecutionContext();
    return this._config.label(this.state, context);
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

  public get state(): Primitive {
    let state = this._state();
    const context = this._getExecutionContext();
    state = this._config.stateMapper(state, context);
    return state;
  }

  private _state(): Primitive {
    if (this._config.state.attribute) return this.entity.attributes[this._config.state.attribute];
    return this.entity.state;
  }

  get icon(): string | undefined {
    const context = this._getExecutionContext();
    return this._config.icon.template(this.state, context);
  }

  get disabled(): boolean {
    const context = this._getExecutionContext();
    return this._config.disabled(this.state, context);
  }

  get style(): StyleInfo {
    const context = this._getExecutionContext();
    return this._config.style(this.state, context);
  }

  get source(): DropdownItem[] {
    const source = this._config.source;
    const context = this._getExecutionContext();
    return this._config.sourceFilter(source, context);
  }

  get selected(): DropdownItem | undefined {
    return this.source.find(s => s.id === this.state?.toString());
  }

  public isActive(state: string | undefined): boolean {
    const context = this._getExecutionContext();
    return this._config.active(state, context);
  }

  public change(selected: string): Promise<void> {
    const context = this._getExecutionContext();
    return this._config.change(selected, context);
  }

  protected _getExecutionContext(): ExecutionContext {
    return {
      call_service: this._hass.callService,
      entity: this._entity,
      cardEntity: this._cardEntity,
      config: this._config.raw,
      localize: (string: string, fallback: string): string => {
        const lang = this.hass?.selectedLanguage || this.hass?.language || 'en';
        return localize(string, lang, fallback);
      },
    };
  }
}
