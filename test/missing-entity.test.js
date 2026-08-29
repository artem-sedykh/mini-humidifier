// @vitest-environment jsdom
//
// The card when `config.entity` is not in `hass.states` (#263).
//
// It happens for real: an entity is renamed, its integration is removed, or the
// id in the YAML has a typo - which `setConfig` cannot catch, because it only
// checks the domain. What the card did about it was throw. `set hass` built the
// model only when the entity was there, so `this.humidifier` stayed the `{}` the
// constructor puts there; `computeClasses()` reads `isActive` off it, and
// `render()` gave up before an `ha-card` existed. A blank space on the
// dashboard and a TypeError on every state update, with the text in the
// console where nobody looking at a blank space would think to look.
//
// The bench found it (#257) and test/e2e/unavailable.test.mjs reads the label
// off a real dashboard. This is the same fact at the layer that costs
// milliseconds: the model is built, it answers `isUnavailable`, and nothing
// throws on the way.
//
// jsdom, and the element is never connected, so nothing renders here - what is
// asserted is the state the render paths read.
import { beforeAll, describe, expect, it } from 'vitest';

let MiniHumidifier;

const MISSING = 'humidifier.gone';
const PRESENT = 'humidifier.bedroom';

const state = {
  entity_id: PRESENT,
  state: 'on',
  attributes: { friendly_name: 'Bedroom', humidity: 55, current_humidity: 41 },
  last_changed: '2026-08-29T20:00:00.000Z',
  last_updated: '2026-08-29T20:00:00.000Z',
};

const hass = (states = {}) => ({
  states,
  language: 'en',
  selectedLanguage: 'en',
  localize: () => '',
  callService: () => Promise.resolve(),
});

const card = (entity, states) => {
  const element = new MiniHumidifier();
  element.setConfig({ entity, model: 'humidifier' });
  element.hass = hass(states);
  return element;
};

beforeAll(async () => {
  await import('../src/main.ts');
  MiniHumidifier = customElements.get('mini-humidifier');
  expect(MiniHumidifier).toBeTypeOf('function');
});

describe('an entity that is not in hass.states', () => {
  it('still leaves the card a model to render from', () => {
    const element = card(MISSING, {});

    expect(element.humidifier).toBeTruthy();
    expect(element.humidifier.isUnavailable).toBe(true);
    expect(element.humidifier.isActive).toBe(false);
    expect(element.humidifier.isOn).toBe(false);
  });

  it('answers the id that was configured, since there is no entity to ask', () => {
    // The update passes build every other entity id off this one, and a card
    // whose own entity has gone still has to say which one it was looking for.
    expect(card(MISSING, {}).humidifier.id).toBe(MISSING);
  });

  it('renders without throwing', () => {
    const element = card(MISSING, {});

    // `computeClasses` is what threw: it is the first thing `render()` calls.
    expect(() => element.computeClasses()).not.toThrow();
    expect(() => element.render()).not.toThrow();
  });

  it('survives the entity disappearing while the card is on screen', () => {
    const element = card(PRESENT, { [PRESENT]: state });
    expect(element.humidifier.isUnavailable).toBe(false);

    element.hass = hass({});

    expect(element.humidifier.isUnavailable).toBe(true);
    expect(element.entity).toBe(undefined);
    expect(() => element.render()).not.toThrow();
  });

  it('and the entity coming back', () => {
    const element = card(PRESENT, {});
    expect(element.humidifier.isUnavailable).toBe(true);

    element.hass = hass({ [PRESENT]: state });

    expect(element.humidifier.isUnavailable).toBe(false);
    expect(element.humidifier.name).toBe('Bedroom');
  });
});
