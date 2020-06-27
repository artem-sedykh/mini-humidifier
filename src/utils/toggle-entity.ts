import { HomeAssistant } from 'custom-card-helpers/dist';
import { STATES_OFF } from '../const';
import { turnOnOffEntity } from './turn-on-off-entity';

export const toggleEntity = (hass: HomeAssistant, entityId: string): Promise<void> => {
  const turnOn = STATES_OFF.includes(hass.states[entityId].state);
  return turnOnOffEntity(hass, entityId, turnOn);
};
