import { HomeAssistant } from 'custom-card-helpers/dist';
import { IndicatorConfig, Primitive } from '../types';
import { HassEntity } from 'home-assistant-js-websocket';
import { Indicator } from './indicator';
import { round } from '../utils/utils';

export class TargetHumidityIndicator extends Indicator {
  constructor(hass: HomeAssistant, config: IndicatorConfig, humidifierEntity: HassEntity) {
    super(hass, config, humidifierEntity);
  }

  public getValue(value: number): Primitive {
    const context = this._getExecutionContext();
    const val = this._config.stateMapper(value, context);
    if (this._config.round !== undefined && typeof val === 'number') return round(val, this._config.round);
    return val;
  }
}
