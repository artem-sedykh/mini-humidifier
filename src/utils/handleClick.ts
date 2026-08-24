import type { HomeAssistant, TapAction } from '../types';

// The event carries its payload on `detail`, which `Event` has no room for -
// Home Assistant reads it there all the same, and a `CustomEvent` is not what
// the frontend listens for.
type EventWithDetail = Event & { detail?: Record<string, unknown> };

export default (
  node: HTMLElement,
  hass: HomeAssistant,
  config: TapAction | string | undefined,
  entityId: string,
): void => {
  let e: EventWithDetail;
  if (!config || typeof config === 'string') return;

  switch (config.action) {
    case 'more-info': {
      e = new Event('hass-more-info', { composed: true });
      e.detail = {
        entityId: config.entity || entityId,
      };
      node.dispatchEvent(e);
      break;
    }
    case 'navigate': {
      if (!config.navigation_path) return;
      window.history.pushState(null, '', config.navigation_path);
      e = new Event('location-changed', { composed: true });
      e.detail = { replace: false };
      window.dispatchEvent(e);
      break;
    }
    case 'call-service': {
      if (!config.service) return;
      const [domain, service] = config.service.split('.', 2);
      const serviceData = { ...config.service_data };
      hass.callService(domain, service, serviceData);
      break;
    }
    case 'url': {
      if (!config.url) return;
      window.location.href = config.url;
    }
  }
};
