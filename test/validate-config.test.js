// What the card is about to ignore, said out loud (#178). The function returns
// its messages rather than printing them, so this file is about which
// configurations produce a message at all - not about the console.
//
// The rule that most of these tests defend is the one that is easy to break by
// making the checking "better": the card's configuration is open at the leaves.
// A key the card does not read inside an indicator or a button is an extension
// point, because the template scope is the option object it was written in.
import { describe, expect, it } from 'vitest';

import validateConfig from '../src/utils/validateConfig';

const CARD = { type: 'custom:mini-humidifier', entity: 'humidifier.bedroom' };

describe('the top level', () => {
  it('says nothing about a configuration that uses every option', () => {
    expect(
      validateConfig({
        ...CARD,
        model: 'zhimi.humidifier.cb1',
        name: 'Bedroom',
        icon: 'mdi:air-humidifier',
        scale: 1,
        group: false,
        tap_action: { action: 'more-info' },
        toggle: { hide: true },
        secondary_info: 'last-changed',
        power: { hide: false },
        target_humidity: { hide: false },
        indicators: { humidity: { icon: 'mdi:water' } },
        buttons: { dry: { icon: 'mdi:hair-dryer' } },
      }),
    ).toEqual([]);
  });

  it('reports a key the card does not read, and points at the options', () => {
    const [warning, ...rest] = validateConfig({ ...CARD, colour: 'red' });

    expect(rest).toEqual([]);
    expect(warning).toContain("'colour'");
    expect(warning).toContain('docs/configuration.md');
  });

  it('names the plural when a singular section was written', () => {
    // The expensive version of this mistake: the section is accepted, ignored,
    // and looks like an option the card never implemented.
    expect(validateConfig({ ...CARD, indicator: { humidity: {} } })[0]).toContain(
      "did you mean 'indicators'",
    );
    expect(validateConfig({ ...CARD, button: { dry: {} } })[0]).toContain("did you mean 'buttons'");
  });

  it('stays quiet about keys the card never put there', () => {
    // Home Assistant writes these from the dashboard editor, and card-mod is on
    // a great many dashboards. The configuration is right and there is nothing
    // for the user to do, so a warning would only be noise.
    expect(
      validateConfig({
        ...CARD,
        view_layout: { position: 'sidebar' },
        grid_options: { columns: 6 },
        layout_options: { grid_columns: 6 },
        visibility: [{ condition: 'user', users: [] }],
        card_mod: { style: 'ha-card { border: none; }' },
      }),
    ).toEqual([]);
  });

  it('reports collapse, which the card read and never acted on', () => {
    // `collapse` put a `--collapse` class on the card and no stylesheet in this
    // repository ever had a rule for it - not since the first commit in April
    // 2020. It was removed rather than implemented, because the behaviour
    // people expect from the name is `toggle: { default: on, hide: on }`, which
    // exists and is documented. This pins the removal: anyone who has the key
    // in their YAML now gets told it does nothing, instead of the silence that
    // hid it for six years.
    expect(validateConfig({ ...CARD, collapse: true })[0]).toContain("'collapse'");
  });

  it('survives being handed something that is not a configuration', () => {
    expect(validateConfig(undefined)).toEqual([]);
    expect(validateConfig('humidifier.bedroom')).toEqual([]);
  });
});

describe('what it deliberately does not check', () => {
  it('says nothing about unknown keys inside an indicator', () => {
    // `getIndicatorConfig` builds the template scope as `{ ...value }`, so
    // `volume` here is readable from this indicator's own templates as
    // `this.volume`. The bundled configurations are written this way - cb1's
    // water_level carries volume, type, default_icon and detached_icon - so a
    // validator that rejected unknown keys here would reject this repository's
    // own presets.
    expect(
      validateConfig({
        ...CARD,
        indicators: {
          water_level: {
            volume: 4,
            type: 'percent',
            default_icon: 'mdi:water',
            whatever_the_user_wants: true,
          },
        },
      }),
    ).toEqual([]);
  });

  it('says nothing about unknown keys inside a button', () => {
    expect(
      validateConfig({ ...CARD, buttons: { dry: { my_own_key: 'read by my own template' } } }),
    ).toEqual([]);
  });
});

describe('tap_action', () => {
  it('accepts every action the card handles', () => {
    for (const action of ['more-info', 'navigate', 'call-service', 'url', 'none']) {
      expect(validateConfig({ ...CARD, tap_action: { action } })).toEqual([]);
    }
  });

  it('reports an action the card does not handle', () => {
    const [warning] = validateConfig({ ...CARD, tap_action: { action: 'toggle' } });

    expect(warning).toContain("'toggle'");
    expect(warning).toContain('more-info, navigate, call-service, url, none');
  });

  it('accepts the string form on the card, which setConfig normalises', () => {
    // Both spellings mean the same thing since #206. Before that, only
    // `tap_action: none` did anything in this form and every other string was
    // a dead click, so this case warned - and the warning is gone because the
    // card was fixed, not because the check was dropped: the next test still
    // reads the action out of the string.
    for (const action of ['more-info', 'navigate', 'call-service', 'url', 'none']) {
      expect(validateConfig({ ...CARD, tap_action: action })).toEqual([]);
    }
  });

  it('still checks which action a string on the card names', () => {
    const [warning] = validateConfig({ ...CARD, tap_action: 'toggle' });

    expect(warning).toContain('tap_action');
    expect(warning).toContain("'toggle'");
  });

  it('accepts the string form on an indicator, where it is normalised', () => {
    // getIndicatorConfig turns `tap_action: more-info` into
    // `{ action: 'more-info' }` before anything reads it, and the bundled model
    // configurations are written exactly that way - cb1 gives three of its
    // indicators `tap_action: 'more-info'`. Warning here would fire on this
    // repository's own presets, which is how this case was found.
    expect(
      validateConfig({ ...CARD, indicators: { humidity: { tap_action: 'more-info' } } }),
    ).toEqual([]);
  });

  it('still checks which action the indicator string names', () => {
    const [warning] = validateConfig({
      ...CARD,
      indicators: { humidity: { tap_action: 'toggle' } },
    });

    expect(warning).toContain('indicators.humidity.tap_action');
    expect(warning).toContain("'toggle'");
  });

  it('checks the tap_action object of an indicator too', () => {
    const [warning] = validateConfig({
      ...CARD,
      indicators: { humidity: { tap_action: { action: 'toggle' } } },
    });

    expect(warning).toContain('indicators.humidity.tap_action.action');
  });
});

describe('order', () => {
  it('accepts a number', () => {
    expect(validateConfig({ ...CARD, indicators: { humidity: { order: 2 } } })).toEqual([]);
    expect(validateConfig({ ...CARD, buttons: { dry: { order: 0 } } })).toEqual([]);
  });

  it('reports anything else, in indicators and in buttons alike', () => {
    // Written as a string the sort is a string comparison, and '10' comes
    // before '9'. Nothing else goes wrong, which is what makes it hard to see:
    // the card renders, in the wrong order.
    expect(validateConfig({ ...CARD, indicators: { humidity: { order: '2' } } })[0]).toContain(
      'indicators.humidity.order',
    );
    expect(validateConfig({ ...CARD, buttons: { dry: { order: true } } })[0]).toContain(
      'buttons.dry.order',
    );
  });
});
