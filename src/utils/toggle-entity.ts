import { STATES_OFF } from '../const';
import { computeDomain } from './compute-domain';
import { HassEntity } from 'home-assistant-js-websocket';

export const toggleEntity = (
  entity: HassEntity,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callService: (domain: string, service: string, serviceData?: { [key: string]: any }) => Promise<void>,
): Promise<void> => {
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

  return callService(serviceDomain, service, { entity_id: entityId });
};
