import { Button } from './button';
import { HomeAssistant } from 'custom-card-helpers/dist';
import { PowerButtonConfig } from '../types';
import { HassEntity } from 'home-assistant-js-websocket';

export class PowerButton extends Button {
  private readonly _powerButtonConfig: PowerButtonConfig;
  constructor(hass: HomeAssistant, config: PowerButtonConfig, humidifierEntity: HassEntity) {
    super(hass, config, humidifierEntity);
    this._powerButtonConfig = config;
  }

  get type(): string {
    return this._powerButtonConfig.type;
  }
}
