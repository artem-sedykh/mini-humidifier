import { TapAction, TapActionConfig } from '../types';
import { HomeAssistant } from 'custom-card-helpers/dist';
import { fireEvent } from './fire-event';
import { navigate } from './navigate';
import { forwardHaptic } from './haptic';
import { toggleEntity } from './toggle-entity';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function compileTemplate(template: string | Function): any {
  try {
    return new Function('', `return ${template}`).call({});
  } catch (e) {
    throw new Error(`\n[COMPILE ERROR]: [${e.toString()}]\n[SOURCE]: ${template}\n`);
  }
}

export function findTapAction(value: string): TapAction | undefined {
  const item = Object.entries(TapAction).find(s => s[1] === value);
  if (item) return TapAction[item[0]];

  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function round(value: any, decimals: number): number {
  return Number(`${Math.round(Number(`${value}e${decimals}`))}e-${decimals}`);
}

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
        toggleEntity(hass, config.entity).then();
        forwardHaptic('success');
      }
      break;
    case TapAction.callService: {
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
