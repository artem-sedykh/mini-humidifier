import { HomeAssistant } from 'custom-card-helpers/dist';
import { ExecutionContext, Primitive, SliderConfig } from '../types';
import { HassEntity } from 'home-assistant-js-websocket';
import { SliderIndicator } from './slider-indicator';
import { localize } from '../localize/localize';

export class Slider {
  private readonly _hass: HomeAssistant;
  private readonly _config: SliderConfig;
  private readonly _cardEntity: HassEntity;
  private readonly _entity: HassEntity;
  private readonly _indicator: SliderIndicator;

  constructor(hass: HomeAssistant, config: SliderConfig, cardEntity: HassEntity) {
    this._hass = hass;
    this._config = config;
    this._cardEntity = cardEntity;
    this._entity = hass.states[config.state.entity];
    this._indicator = new SliderIndicator(hass, config.indicator, cardEntity);
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

  public get state(): number {
    let state = this._state();
    const context = this._getExecutionContext();
    state = this._config.stateMapper(state, context);
    return state;
  }

  public get indicator(): SliderIndicator {
    return this._indicator;
  }

  private _state(): Primitive {
    if (this._config.state.attribute) return this.entity.attributes[this._config.state.attribute];
    return this.entity.state;
  }

  public change(selected: number): Promise<void> {
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
