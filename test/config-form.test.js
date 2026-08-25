// The visual editor is a schema (#179), so it is a value, and everything worth
// asserting about it can be asserted here. What cannot: that Home Assistant
// renders it. That stays a check by hand, like everything else in this card
// that meets an `ha-*` element.
import { describe, expect, it } from 'vitest';

import configForm from '../src/configForm';
import HUMIDIFIERS from '../src/humidifiers';
import { SUPPORTED_DOMAINS } from '../src/const';

const field = name => configForm().schema.find(item => item.name === name);

describe('the schema', () => {
  it('offers the flat options and nothing else', () => {
    // Deliberately the whole list rather than a subset: an option added here
    // without a thought about the round-trip is the failure this test exists
    // for. Indicators and buttons are absent on purpose - `getConfigForm` is
    // static, so the schema cannot depend on the card being edited, and which
    // of those a card has depends on its model and on ids the user chose.
    expect(configForm().schema.map(item => item.name)).toEqual([
      'entity',
      'model',
      'name',
      'icon',
      'scale',
      'group',
    ]);
  });

  it('restricts the entity picker to the domains the card accepts', () => {
    expect(field('entity').selector.entity.domain).toEqual([...SUPPORTED_DOMAINS]);
    expect(field('entity').required).toBe(true);
  });
});

describe('the model field', () => {
  it('offers every bundled model, and none as well', () => {
    const { options } = field('model').selector.select;

    expect(options).toEqual(Object.keys(HUMIDIFIERS).filter(id => id !== 'default'));
    expect(options).toContain('none');
    expect(options.length).toBeGreaterThan(1);
  });

  it('does not offer `default`, which is the fallback rather than a device', () => {
    expect(field('model').selector.select.options).not.toContain('default');
  });

  it('accepts a model the registry does not know', () => {
    // The card is written so that a device nobody here has heard of can be put
    // on a dashboard without a pull request. A closed list here would be the
    // editor contradicting that.
    expect(field('model').selector.select.custom_value).toBe(true);
  });
});

describe('what the editor must not do to a hand-written card', () => {
  // Home Assistant owns this merge - `ha-form` does
  // `this.data = { ...this.data, ...newValue }` and hands the result back as
  // the new config - so this test pins an assumption rather than our code. It
  // was verified against the real elements on Home Assistant 2026.8.3 before
  // being written down. If this card ever moves to an editor element of its
  // own, the merge becomes ours and this is the contract it has to meet.
  const edit = (config, change) => ({ ...config, ...change });

  const handWritten = {
    type: 'custom:mini-humidifier',
    entity: 'humidifier.bedroom',
    model: 'deerma.humidifier.jsq2w',
    indicators: {
      water_level: {
        icon: { template: 'val => (val === "" ? this.detached_icon : this.default_icon)' },
        volume: 4,
      },
    },
    buttons: {
      dry: { icon: 'mdi:hair-dryer', change_action: 'value => this.call_service("fan", "x")' },
    },
    tap_action: 'none',
  };

  it('keeps every option the schema does not mention', () => {
    const after = edit(handWritten, { name: 'Bedroom humidifier' });

    expect(after.indicators).toEqual(handWritten.indicators);
    expect(after.buttons).toEqual(handWritten.buttons);
    expect(after.tap_action).toBe('none');
    expect(after.name).toBe('Bedroom humidifier');
  });

  it('keeps a model the schema cannot offer as an option', () => {
    expect(edit(handWritten, { name: 'x' }).model).toBe('deerma.humidifier.jsq2w');
  });

  it('leaves the templates as the source text they have to stay', () => {
    // These are compiled by `compileTemplate` from their own text. A round trip
    // that turned them into anything else - a function, a quoted copy - would
    // break the card at the moment the control is touched, which is exactly the
    // damage that is invisible in an editor.
    const after = edit(handWritten, { scale: 1.2 });

    expect(typeof after.indicators.water_level.icon.template).toBe('string');
    expect(after.buttons.dry.change_action).toBe(handWritten.buttons.dry.change_action);
  });
});
