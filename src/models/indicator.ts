import { ExecutionContext, IndicatorConfig, Primitive, TapActionConfig } from '../types';
import { HomeAssistant } from 'custom-card-helpers/dist';
import { HassEntity } from 'home-assistant-js-websocket';
import { isNumeric, round } from '../utils/utils';
import { localize } from '../localize/localize';
import { StyleInfo } from 'lit-html/directives/style-map';

export class Indicator {
  protected readonly _config: IndicatorConfig;
  private readonly _hass: HomeAssistant;
  protected readonly _cardEntity: HassEntity;
  private readonly _entity: HassEntity;

  constructor(hass: HomeAssistant, config: IndicatorConfig, cardEntity: HassEntity) {
    this._config = config;
    this._hass = hass;
    this._cardEntity = cardEntity;
    this._entity = hass.states[config.state.entity];
  }

  public get id(): string {
    return this._config.id;
  }

  public get hass(): HomeAssistant {
    return this._hass;
  }

  public get entity(): HassEntity {
    return this._entity;
  }

  public get tapAction(): TapActionConfig {
    return this._config.tapAction;
  }

  public get unit(): string | undefined {
    const context = this._getExecutionContext();
    return this._config.unit.template(this.state, context);
  }

  public get unitStyle(): StyleInfo {
    const context = this._getExecutionContext();
    return this._config.unit.style(this.state, context);
  }

  public get hide(): boolean {
    return this._config.hide;
  }

  public get order(): number {
    return this._config.order;
  }

  public get icon(): string | undefined {
    const context = this._getExecutionContext();
    return this._config.icon.template(this.state, context);
  }

  public get iconStyle(): StyleInfo {
    const context = this._getExecutionContext();
    return this._config.icon.style(this.state, context);
  }

  public get state(): Primitive {
    let state = this._state();
    const context = this._getExecutionContext();
    state = this._config.stateMapper(state, context);

    if (state !== null && state !== undefined && isNumeric(state)) {
      if (this._config.fixed !== undefined && this._config.fixed !== null) {
        return parseFloat(state.toString()).toFixed(this._config.fixed);
      }

      if (this._config.round !== undefined && this._config.round !== null) {
        return round(state, this._config.round);
      }
    }

    return state;
  }

  private _state(): Primitive {
    if (this._config.state.attribute) return this.entity.attributes[this._config.state.attribute];
    return this.entity.state;
  }

  protected _getExecutionContext(): ExecutionContext {
    return {
      call_service: this.hass.callService,
      entity: this._entity,
      cardEntity: this._cardEntity,
      config: this._config.raw,
      localize: (string: string, fallback: string): string => {
        const lang = this.hass.selectedLanguage || this.hass.language || 'en';
        return localize(string, lang, fallback);
      },
    };
  }
}
