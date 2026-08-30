// The bundled model presets, against the devices they were written for.
//
// A preset is not a card configuration so much as an agreement with an
// integration: the humidifier or fan itself, plus the sensors, switches,
// selects and numbers created beside it, which the card finds by name - it
// builds `sensor.<the humidifier's own id>_water_level` out of `{entity_id}`
// and hopes.
//
// Nothing in this repository had those entities. `test/browser/helpers/hass.js`
// carries one companion set, the one `zhimi.humidifier.cb1` reads, so three of
// the four presets below had never rendered an indicator with a value in any
// test: their entities were absent, the card skipped every control that needed
// one, and what was left still looked like a card. See #266.
//
// The fixtures are plain MQTT, because that is all it takes. The card never
// talks to xiaomi_miio: it talks to entity ids and to services in core domains,
// so a device is emulated by giving Home Assistant entities with the right
// names.
//
// Needs a bench: `npm run bench up`, or BENCH_URL pointing at one.
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { callService, entity, open, until } from '../bench/browser.mjs';
import { DASHBOARD, prepare } from '../bench/setup.mjs';
import { BASE } from '../bench/auth.mjs';

const SHOTS = 'test/e2e/shots';

// The manifest view holding one card per model. Named rather than searched for,
// because a view that moved should fail here and not halfway through a scenario.
const VIEW = 3;

// What each preset draws when the device it was written for is there.
//
// `indicators` and `buttons` are the ids the card ended up with, which is the
// interesting number: an indicator whose entity is missing is dropped on the
// way in, so a list that matches is a list of entities that all lined up.
// `drawn` is how many of the indicators reach the screen - the difference is
// the ones a preset ships hidden.
const MODELS = [
  {
    model: 'zhimi.humidifier.cb1',
    fixture: 'bedroom_humidifier',
    indicators: ['water_level', 'temperature', 'humidity', 'motor_speed'],
    drawn: 4,
    buttons: ['dry', 'mode', 'led', 'buzzer', 'child_lock'],
    dropdowns: ['mode', 'led'],
  },
  {
    model: 'deerma.humidifier.jsq',
    fixture: 'bench_jsq',
    indicators: ['water_tank_empty', 'temperature', 'humidity'],
    drawn: 3,
    buttons: ['mode', 'led', 'buzzer'],
    dropdowns: ['mode'],
  },
  {
    model: 'zhimi.airpurifier.ma2',
    fixture: 'bench_ma2',
    indicators: ['aqi', 'temperature', 'humidity', 'motor_speed', 'filter_use'],
    drawn: 5,
    buttons: ['mode', 'led', 'buzzer', 'child_lock'],
    dropdowns: ['mode'],
  },
  {
    model: 'zhimi.airfresh.va2',
    fixture: 'bench_va2',
    // The preset also defines `motor_speed`, `hide: true`. It is absent here
    // rather than present-and-not-drawn: `buildConfig` drops a hidden
    // indicator while the configuration is being built, so it never reaches
    // the card at all.
    indicators: ['aqi', 'temperature', 'humidity', 'co2', 'filter_use'],
    drawn: 5,
    buttons: ['mode', 'led', 'buzzer', 'child_lock'],
    dropdowns: ['mode', 'led'],
  },
];

/** Everything one model's card rendered, read out of its shadow roots. */
const readCard = (page, model) =>
  page.evaluate(wanted => {
    const walk = root => {
      for (const element of root.querySelectorAll('*')) {
        if (element.localName === 'mini-humidifier' && element.config?.model === wanted) {
          return element;
        }
        if (element.shadowRoot) {
          const hit = walk(element.shadowRoot);
          if (hit) return hit;
        }
      }
      return null;
    };

    const card = walk(document);
    if (!card) return null;

    const root = card.shadowRoot;
    const indicators = root.querySelector('mh-indicators');
    const buttons = root.querySelector('mh-buttons');
    const states = indicators ? [...indicators.shadowRoot.querySelectorAll('.state')] : [];
    const drawn = buttons ? [...buttons.shadowRoot.querySelectorAll('mh-button, mh-dropdown')] : [];

    return {
      entity: card.config.entity,
      height: +root.querySelector('ha-card').getBoundingClientRect().height.toFixed(1),
      indicators: Object.keys(indicators?.indicators || {}),
      buttons: Object.keys(buttons?.buttons || {}),
      // The values as a person reads them, so an empty slot and a `NaN` are
      // both visible in the failure rather than hidden behind a count.
      readings: states.map(state => ({
        value: state.querySelector('.state__value')?.textContent.trim() ?? '',
        unit: state.querySelector('.state__uom')?.textContent.trim() ?? '',
        icon: !!state.querySelector('ha-icon'),
      })),
      drawn: drawn.map(element => element.localName),
      dropdowns: drawn.filter(e => e.localName === 'mh-dropdown').map(e => e.dropdown?.id),
      slider: !!root.querySelector('mh-target-humidity'),
    };
  }, model);

/** The card of one model, as something to click and photograph. */
const locate = async (page, model) => {
  const cards = await page.locator('mini-humidifier').all();

  for (const card of cards) {
    if ((await card.evaluate(element => element.config?.model)) === model) return card;
  }
  throw new Error(`no card for model ${model}`);
};

describe('the bundled model presets, against their own devices', () => {
  let bench;
  let session;
  // `warnMissing` says exactly this when a computed companion id is not in
  // `hass.states`, and says it once per control. It is the card's own account
  // of whether the naming convention held, so it is collected and asserted
  // rather than left in the log - `open()` keeps errors, not warnings.
  const warnings = [];
  const seen = new Map();

  before(async () => {
    await mkdir(SHOTS, { recursive: true });
    bench = await prepare();
    session = await open(bench.tokens);

    session.page.on('console', message => {
      if (message.type() === 'warning' && message.text().includes('mini-humidifier')) {
        warnings.push(message.text().slice(0, 300));
      }
    });

    await session.page.goto(`${BASE}/${DASHBOARD}/${VIEW}`, { waitUntil: 'load' });
    await session.page.waitForSelector('mini-humidifier', { timeout: 60000 });
    await session.page.waitForTimeout(2000);

    for (const spec of MODELS) seen.set(spec.model, await readCard(session.page, spec.model));
  });

  after(async () => {
    if (session) await session.close();
  });

  it('gives every fixture the entity id its preset will compute', () => {
    // The assumption the whole file rests on, and the one that breaks in the
    // field: Home Assistant appends `_2` to the second device of a kind, and a
    // preset that computes `sensor.<id>_water_level` stops finding anything.
    // The manifest asks for each id explicitly, so this is checking that it got
    // what it asked for - see #78 and #98.
    for (const fixture of bench.manifest.entities) {
      assert.equal(
        bench.ids[fixture.id],
        `${fixture.domain}.${fixture.id}`,
        `fixture ${fixture.id} was registered as ${bench.ids[fixture.id]}`,
      );
    }
  });

  for (const spec of MODELS) {
    describe(spec.model, () => {
      it('finds every entity its preset reads', () => {
        const card = seen.get(spec.model);

        assert.ok(card, `no card for ${spec.model} on view ${VIEW}`);
        assert.ok(card.height > 0, 'the card has no height');
        assert.deepEqual(card.indicators.sort(), [...spec.indicators].sort());
        assert.deepEqual(card.buttons.sort(), [...spec.buttons].sort());
      });

      it('draws its indicators with something in them', () => {
        const card = seen.get(spec.model);

        assert.equal(card.readings.length, spec.drawn, JSON.stringify(card.readings));

        for (const reading of card.readings) {
          assert.notEqual(reading.value, '', JSON.stringify(card.readings));
          assert.ok(!/^(NaN|undefined|null|unknown)$/i.test(reading.value), reading.value);
          assert.ok(reading.icon, `no icon beside ${reading.value}`);
        }
      });

      it('draws every button its preset defines', () => {
        // A button whose companion switch is missing renders nothing at all, so
        // the count is the assertion: five configured buttons and three drawn
        // is a card with holes in it, which is what this looked like before.
        const card = seen.get(spec.model);

        assert.equal(card.drawn.length, spec.buttons.length, card.drawn.join(', '));
        assert.deepEqual(card.dropdowns, spec.dropdowns);
        assert.ok(card.slider, 'no target humidity control');
      });

      it('photographs', async () => {
        const card = await locate(session.page, spec.model);
        await card.screenshot({ path: `${SHOTS}/model-${spec.fixture.replace('bench_', '')}.png` });
      });
    });
  }

  it('sends a dropdown pick through to the select entity behind it', async () => {
    // `select.select_option` from a card, which nothing else here does: the
    // LED brightness of the cb1 preset is a `select` entity, and the only
    // dropdowns the other scenarios press are backed by an attribute.
    const id = bench.ids.bedroom_humidifier_led_brightness;
    const before_ = await entity(bench.tokens, id);
    assert.equal(before_.state, 'dim');

    const card = await locate(session.page, 'zhimi.humidifier.cb1');
    const dropdowns = card.locator('mh-buttons mh-dropdown');
    const ids = await dropdowns.evaluateAll(list => list.map(element => element.dropdown?.id));
    const index = ids.indexOf('led');

    assert.ok(index >= 0, `no led dropdown among ${ids.join(', ')}`);

    await dropdowns.nth(index).locator('ha-icon-button').click();
    await dropdowns.nth(index).locator('.mh-dropdown__item[data-value="off"]').click();

    const after_ = await until(
      async () => {
        const state = await entity(bench.tokens, id);
        return state.state === 'off' ? state : null;
      },
      { diagnose: () => entity(bench.tokens, id) },
    );
    assert.equal(after_.state, 'off');

    // Back where the other scenarios expect it.
    await callService(bench.tokens, 'select', 'select_option', { entity_id: id, option: 'dim' });
  });

  it('sends a press on a switch-backed button through to the switch', async () => {
    const id = bench.ids.bedroom_humidifier_dry_mode;
    const before_ = await entity(bench.tokens, id);

    const card = await locate(session.page, 'zhimi.humidifier.cb1');
    const buttons = card.locator('mh-buttons mh-button');
    const ids = await buttons.evaluateAll(list => list.map(element => element.button?.id));
    const index = ids.indexOf('dry');

    assert.ok(index >= 0, `no dry button among ${ids.join(', ')}`);

    await buttons.nth(index).locator('ha-icon-button').click();

    const after_ = await until(
      async () => {
        const state = await entity(bench.tokens, id);
        return state.state !== before_.state ? state : null;
      },
      { diagnose: () => entity(bench.tokens, id) },
    );
    assert.notEqual(after_.state, before_.state, `${before_.state} -> ${after_.state}`);

    await callService(bench.tokens, 'switch', 'turn_off', { entity_id: id });
  });

  it('sends a move of the slider through to the number entity behind it', async () => {
    // The ma2 preset points its target humidity control at
    // `number.{entity_id}_favorite_level` - a control that writes with
    // `number.set_value` rather than to the humidifier, and the only preset
    // that does.
    const id = bench.ids.bench_ma2_favorite_level;
    const card = await locate(session.page, 'zhimi.airpurifier.ma2');
    const slider = card.locator('mh-target-humidity ha-slider').first();

    // One click of the pointer, and it lands at whichever end of the slider is
    // furthest from where the value sits now - so the move is large, and no
    // rounding of a fraction to a step can land it back where it started.
    //
    // One gesture rather than two, and the entity polled rather than slept at,
    // because two bench runs went red here on gestures that were fine (#269).
    // Neither was a Home Assistant difference - both legs run the same image -
    // and neither was the card: one used `slider.press('ArrowRight')`, which
    // cannot focus an `ha-slider` and so depends on the click's focus
    // surviving, and the other read the entity after a fixed wait that a
    // loaded runner outran. What this scenario is about is that the ma2
    // preset's target humidity control writes to a `number` entity with
    // `number.set_value`, so it asks for that and nothing else.
    const before_ = await entity(bench.tokens, id);
    const from = Number(before_.state);
    const middle = (Number(before_.attributes.min) + Number(before_.attributes.max)) / 2;
    const towards = from > middle ? 0.15 : 0.85;

    const box = await slider.boundingBox();
    await session.page.mouse.click(box.x + box.width * towards, box.y + box.height / 2);

    // The card holds a move for `action_timeout` before it sends, so the wait
    // is part of the path under test. Polled, not slept through.
    const after_ = await until(
      async () => {
        const state = await entity(bench.tokens, id);
        return state.state !== before_.state ? state : null;
      },
      { timeout: 15000, diagnose: () => entity(bench.tokens, id) },
    );

    const to = Number(after_.state);
    assert.ok(Number.isFinite(to), `not a number: ${after_.state}`);
    assert.ok(
      towards < 0.5 ? to < from : to > from,
      `clicked at ${towards} of the slider and the value went ${from} -> ${to}`,
    );

    await callService(bench.tokens, 'number', 'set_value', { entity_id: id, value: 8 });
  });

  it('leaves no control unaccounted for, and nothing in the console', () => {
    // The warning is the card saying a computed entity id was not there. On
    // this view every one of them exists, so any warning at all means the
    // convention and the fixtures disagree - which is the whole subject.
    assert.deepEqual(warnings, []);
    assert.deepEqual(session.errors, []);
  });
});
