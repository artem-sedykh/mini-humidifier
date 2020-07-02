import { HomeAssistant } from 'custom-card-helpers/dist';
import { IndicatorConfig, Primitive } from '../types';
import { HassEntity } from 'home-assistant-js-websocket';
import { Indicator } from './indicator';
import { isNumeric, round } from '../utils/utils';

export class TargetHumidityIndicator extends Indicator {
  constructor(hass: HomeAssistant, config: IndicatorConfig, humidifierEntity: HassEntity) {
    super(hass, config, humidifierEntity);
  }

  public getValue(value: number): Primitive {
    const context = this._getExecutionContext();
    const val = this._config.stateMapper(value, context);

    if (val !== null && val !== undefined && isNumeric(val)) {
      if (this._config.fixed !== undefined && this._config.fixed !== null)
        return parseFloat(val.toString()).toFixed(this._config.fixed);

      if (this._config.round !== undefined && this._config.round !== null) return round(val, this._config.round);
    }

    return val;
  }
}
