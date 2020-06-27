import { HomeAssistant } from 'custom-card-helpers/dist';
import { IndicatorConfig } from '../types';
import { HassEntity } from 'home-assistant-js-websocket';
import { Indicator } from './indicator';
import { round } from '../utils/utils';

export class TargetHumidityIndicator extends Indicator {
  constructor(hass: HomeAssistant, config: IndicatorConfig, humidifierEntity: HassEntity) {
    super(hass, config, humidifierEntity);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getValue(value: number): any {
    let val = this._config.stateMapper(value, this.entity, this._humidifierEntity);

    if (this._config.round != undefined && !isNaN(val)) val = round(val, this._config.round);

    return val;
  }
}
