// @vitest-environment jsdom
//
// `handleClick` is the whole of what `tap_action` does - on the card's name
// (`main.ts`) and on every indicator (`components/indicators.ts`) - and it was
// at 0% when coverage was first measured (#182). The browser layer clicks the
// name once, which reaches `more-info`; `navigate`, `call-service` and `url`
// were exercised by nothing at all (#197).
//
// It is worth testing here rather than in the browser layer because none of it
// is rendering: it takes a node, `hass`, the action the user configured and an
// entity id, and each branch has exactly one effect - a dispatched event, a
// `pushState`, a service call, or an assignment to `location.href`.
import { afterEach, describe, expect, it } from 'vitest';

import handleClick from '../src/utils/handleClick';

const ENTITY_ID = 'humidifier.bedroom';

const fakeHass = () => {
  const calls = [];
  return {
    calls,
    callService: (domain, service, data) => calls.push({ domain, service, data }),
  };
};

const node = () => document.createElement('div');

// Each test that listens on `window` takes it off again: the environment is
// shared by every test in the file, and a listener left behind counts the next
// test's events as its own.
const listeners = [];
const listen = (target, type) => {
  const seen = [];
  const handler = event => seen.push(event);
  target.addEventListener(type, handler);
  listeners.push(() => target.removeEventListener(type, handler));
  return seen;
};

afterEach(() => {
  while (listeners.length) listeners.pop()();
});

describe('more-info', () => {
  it('dispatches hass-more-info for the entity the card is for', () => {
    const el = node();
    const seen = listen(el, 'hass-more-info');

    handleClick(el, fakeHass(), { action: 'more-info' }, ENTITY_ID);

    expect(seen).toHaveLength(1);
    expect(seen[0].detail).toEqual({ entityId: ENTITY_ID });
  });

  it('prefers the entity written in the action', () => {
    const el = node();
    const seen = listen(el, 'hass-more-info');

    handleClick(el, fakeHass(), { action: 'more-info', entity: 'sensor.humidity' }, ENTITY_ID);

    expect(seen[0].detail).toEqual({ entityId: 'sensor.humidity' });
  });

  it('composes the event, so it survives the shadow root it is dispatched in', () => {
    // Not decoration: the card dispatches this from inside its own shadow root
    // and Home Assistant listens for it further up. Without `composed` the
    // event stops at the boundary and the dialog never opens.
    const el = node();
    const seen = listen(el, 'hass-more-info');

    handleClick(el, fakeHass(), { action: 'more-info' }, ENTITY_ID);

    expect(seen[0].composed).toBe(true);
  });
});

describe('navigate', () => {
  it('pushes the path and announces the change on window', () => {
    const seen = listen(window, 'location-changed');

    handleClick(
      node(),
      fakeHass(),
      { action: 'navigate', navigation_path: '/lovelace/4' },
      ENTITY_ID,
    );

    expect(window.location.pathname).toBe('/lovelace/4');
    expect(seen).toHaveLength(1);
    expect(seen[0].detail).toEqual({ replace: false });
  });

  it('does nothing without a path', () => {
    const before = window.location.pathname;
    const seen = listen(window, 'location-changed');

    handleClick(node(), fakeHass(), { action: 'navigate' }, ENTITY_ID);

    expect(seen).toHaveLength(0);
    expect(window.location.pathname).toBe(before);
  });
});

describe('call-service', () => {
  it('splits the service into domain and name and passes the data', () => {
    const hass = fakeHass();

    handleClick(
      node(),
      hass,
      {
        action: 'call-service',
        service: 'xiaomi_miio.fan_set_led_brightness',
        service_data: { brightness: 1 },
      },
      ENTITY_ID,
    );

    expect(hass.calls).toEqual([
      { domain: 'xiaomi_miio', service: 'fan_set_led_brightness', data: { brightness: 1 } },
    ]);
  });

  it('passes a copy of service_data, not the configuration object', () => {
    // The configuration belongs to the dashboard and is reused on every click.
    // Handing it over directly would let anything downstream edit the card's
    // own config in place.
    const hass = fakeHass();
    const serviceData = { brightness: 1 };

    handleClick(
      node(),
      hass,
      { action: 'call-service', service: 'a.b', service_data: serviceData },
      ENTITY_ID,
    );

    expect(hass.calls[0].data).toEqual(serviceData);
    expect(hass.calls[0].data).not.toBe(serviceData);
  });

  it('sends nothing without a service', () => {
    const hass = fakeHass();

    handleClick(node(), hass, { action: 'call-service', service_data: { x: 1 } }, ENTITY_ID);

    expect(hass.calls).toHaveLength(0);
  });
});

describe('url', () => {
  // jsdom's `window.location` is a real Location, and assigning to it logs a
  // navigation that never happens. Replacing the property is what makes the
  // assignment observable; the descriptor goes back afterwards so the navigate
  // tests keep a working history.
  const withStubbedLocation = fn => {
    const original = Object.getOwnPropertyDescriptor(window, 'location');
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: 'http://localhost:3000/' },
    });
    try {
      fn();
      return window.location.href;
    } finally {
      Object.defineProperty(window, 'location', original);
    }
  };

  it('sends the browser to the url', () => {
    const href = withStubbedLocation(() =>
      handleClick(node(), fakeHass(), { action: 'url', url: 'https://example.com/' }, ENTITY_ID),
    );

    expect(href).toBe('https://example.com/');
  });

  it('does nothing without a url', () => {
    const href = withStubbedLocation(() =>
      handleClick(node(), fakeHass(), { action: 'url' }, ENTITY_ID),
    );

    expect(href).toBe('http://localhost:3000/');
  });
});

describe('what it refuses to act on', () => {
  const nothingHappens = config => {
    const el = node();
    const hass = fakeHass();
    const onNode = listen(el, 'hass-more-info');
    const onWindow = listen(window, 'location-changed');

    handleClick(el, hass, config, ENTITY_ID);

    expect(onNode).toHaveLength(0);
    expect(onWindow).toHaveLength(0);
    expect(hass.calls).toHaveLength(0);
  };

  it('ignores a missing action config', () => {
    nothingHappens(undefined);
  });

  it('ignores any tap_action written as a string', () => {
    // Nothing hands it one any more: `getIndicatorConfig` has always turned a
    // string into `{ action: <string> }`, and since #206 `setConfig` does the
    // same for the card's own option, so both callers normalise before this is
    // reached. The guard stays because this is what the function does with a
    // shape it cannot act on - and the behaviour it used to produce, a
    // `tap_action: more-info` that did nothing, is now impossible to configure
    // rather than merely unlikely.
    nothingHappens('none');
    nothingHappens('more-info');
  });

  it('ignores an action the card does not implement', () => {
    // `toggle` in particular. It was a real case until 9a234b4 (v2.1.1, June
    // 2020), and `docs/examples.md` went on offering it for six years after it
    // was deleted, which is what #197 was opened about. The example is gone;
    // this is here so its removal cannot quietly turn back into a bug report.
    nothingHappens({ action: 'toggle' });
    nothingHappens({ action: 'fire-dom-event' });
  });
});
