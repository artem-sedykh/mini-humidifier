import { fireEvent } from './fire-event';

declare global {
  // for fire event
  interface HASSDomEvents {
    'location-changed': {
      replace: boolean;
    };
  }
}

export const navigate = (_node: HTMLElement, path: string, replace = false): void => {
  if (replace) {
    history.replaceState(null, '', path);
  } else {
    history.pushState(null, '', path);
  }
  fireEvent(window, 'location-changed', {
    replace,
  });
};
