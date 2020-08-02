import { HomeAssistant } from 'custom-card-helpers/dist';
import { TapAction, TapActionConfig } from '../types';
import { fireEvent } from './fire-event';
import { navigate } from './navigate';
import { toggleEntity } from './toggle-entity';
import { forwardHaptic } from './haptic';

export const handleClick = (node: HTMLElement, hass: HomeAssistant, config: TapActionConfig): void => {
  switch (config.action) {
    case TapAction.None:
      break;
    case TapAction.MoreInfo:
      fireEvent(node, 'hass-more-info', { entityId: config.entity });
      break;
    case TapAction.Navigate:
      if (config.navigationPath) navigate(node, config.navigationPath);
      break;
    case TapAction.Url:
      if (config.url) window.open(config.url);
      break;
    case TapAction.Toggle:
      if (config.entity) {
        const entity = hass.states[config.entity];
        toggleEntity(entity, hass.callService).then();
        forwardHaptic('success');
      }
      break;
    case TapAction.CallService: {
      if (!config.service) {
        forwardHaptic('failure');
        return;
      }
      const [domain, service] = config.service.split('.', 2);
      hass.callService(domain, service, config.serviceData).then();
      forwardHaptic('success');
    }
  }
};
