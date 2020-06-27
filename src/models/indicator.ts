import { ExecutionContext, IndicatorConfig, Primitive, TapActionConfig } from '../types';
import { HomeAssistant } from 'custom-card-helpers/dist';
import { HassEntity } from 'home-assistant-js-websocket';
import { round } from '../utils/utils';
import { localize } from '../localize/localize';
import { StyleInfo } from 'lit-html/directives/style-map';

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
    const context = this._getExecutionContext(this.state);
    return this._config.unit.template(this.state, context);
  }

  get unitStyle(): StyleInfo {
    const context = this._getExecutionContext(this.state);
    return this._config.unit.style(this.state, context);
  }

  get hide(): boolean {
    return this._config.hide;
  }

  get order(): number {
    return this._config.order;
  }

  get icon(): string {
    const context = this._getExecutionContext(this.state);
    return this._config.icon.template(this.state, context);
  }

  get iconStyle(): StyleInfo {
    const context = this._getExecutionContext(this.state);
    return this._config.icon.style(this.state, context);
  }

  get state(): Primitive {
    let state = this._state();
    const context = this._getExecutionContext(state);
    state = this._config.stateMapper(state, context);

    if (this._config.round != undefined && typeof state === 'number') return round(state, this._config.round);

    return state;
  }

  private _state(): Primitive {
    if (this._config.state.attribute) return this.entity.attributes[this._config.state.attribute];
    return this.entity.state;
  }

  protected _getExecutionContext(state: Primitive): ExecutionContext {
    return {
      call_service: this._hass.callService,
      entity: this._entity,
      humidifierEntity: this._humidifierEntity,
      config: this._config.raw,
      state: state,
      localize: (string: string, fallback: string): string => {
        const lang = this.hass?.selectedLanguage || this.hass?.language || 'en';
        return localize(string, lang, fallback);
      },
    };
  }
}
