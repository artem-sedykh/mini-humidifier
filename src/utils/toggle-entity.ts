import { HomeAssistant } from 'custom-card-helpers/dist';
import { STATES_OFF } from '../const';
import { turnOnOffEntity } from './turn-on-off-entity';
import { ExecutionContext } from '../types';
import { computeDomain } from './compute-domain';

export const toggleEntity = (hass: HomeAssistant, entityId: string): Promise<void> => {
  const turnOn = STATES_OFF.includes(hass.states[entityId].state);
  return turnOnOffEntity(hass, entityId, turnOn);
};

export const toggle = (context: ExecutionContext): Promise<void> => {
  const entity = context.entity;
  const entityId = entity.entity_id;
  const turnOn = STATES_OFF.includes(entity.state);
  const stateDomain = computeDomain(entityId);
  const serviceDomain = stateDomain === 'group' ? 'homeassistant' : stateDomain;

  let service;
  switch (stateDomain) {
    case 'lock':
      service = turnOn ? 'unlock' : 'lock';
      break;
    case 'cover':
      service = turnOn ? 'open_cover' : 'close_cover';
      break;
    default:
      service = turnOn ? 'turn_on' : 'turn_off';
  }

  return context.call_service(serviceDomain, service, { entity_id: entityId });
};
