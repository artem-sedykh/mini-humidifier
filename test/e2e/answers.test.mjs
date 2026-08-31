// The answers people were given, as tests.
//
// Every card on the last view of the manifest is a configuration somebody was
// handed once and other people have copied since: the `deerma.humidifier.jsq2w`
// card written out in [#112](https://github.com/artem-sedykh/mini-humidifier/issues/112),
// the Levoit Classic 300S recipe that `docs/custom-device.md` is built around
// (#124), and the `tap_action` snippets of `docs/examples.md`. The three
// complete cards that page shows are on the Documentation view, where the
// pictures in it are taken, and they are checked here too.
//
// They are here rather than only in a thread or a page because an answer that
// lives in a comment is one nobody notices breaking. `documented-contract.test.js`
// covers the neighbouring thing and covers it well - the claims
// `custom-device.md` makes about the contract, as sentences turned into tests -
// but it renders none of that YAML, and a recipe can be right about the
// contract and still draw nothing.
//
// Each scenario asserts what its answer promised, so the assertions are about
// values and presses rather than pixels: the indicator exists and reads what it
// was pointed at, the button reaches the entity it named, the action does what
// it is called.
//
// Needs a bench: `npm run bench up`, or BENCH_URL pointing at one.
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { callService, dialogs, entity, open, until } from '../bench/browser.mjs';
import { DASHBOARD, prepare } from '../bench/setup.mjs';
import { BASE } from '../bench/auth.mjs';

// Named rather than searched for: a view that moved should fail here and not
// halfway through a scenario.
const ANSWERS = 6;
const DOCS = 4;

/**
 * Everything one card drew, read out of its shadow roots.
 *
 * Which card is said as a piece of its configuration - `{name: 'Bedroom'}`,
 * `{model: 'humidifier'}`, `null` for a key the card must not have at all -
 * rather than as a position: a masonry view distributes its cards into columns,
 * and the order they end up in the document is not the order the manifest lists
 * them in.
 */
const look = (page, want) =>
  page.evaluate(wanted => {
    const deep = (root, tag, found = []) => {
      for (const element of root.querySelectorAll('*')) {
        if (element.localName === tag) found.push(element);
        if (element.shadowRoot) deep(element.shadowRoot, tag, found);
      }
      return found;
    };

    const card = deep(document, 'mini-humidifier').find(one =>
      Object.entries(wanted).every(([key, value]) =>
        value === null ? one.config?.[key] === undefined : one.config?.[key] === value,
      ),
    );
    if (!card) return null;

    const root = card.shadowRoot;
    const indicators = root.querySelector('mh-indicators');
    const buttons = root.querySelector('mh-buttons');
    const slider = root.querySelector('mh-target-humidity');

    // The readings as a person reads them, each next to the id it came from.
    // `mh-indicators` draws no id, so the pairing is the sort it renders by:
    // the objects it was given, minus the hidden ones, in order.
    const objects = Object.values(indicators?.indicators || {})
      .filter(one => !one.hide)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const states = indicators ? [...indicators.shadowRoot.querySelectorAll('.state')] : [];

    const drawn = buttons ? [...buttons.shadowRoot.querySelectorAll('mh-button, mh-dropdown')] : [];

    return {
      entity: card.config.entity,
      height: +root.querySelector('ha-card').getBoundingClientRect().height.toFixed(1),
      name: root.querySelector('.entity__info__name')?.textContent.trim() ?? null,
      secondary: root.querySelector('.entity__secondary_info__name')?.textContent.trim() ?? null,
      secondaryIcon: root.querySelector('.entity__secondary_info_icon')?.icon ?? null,
      // The class that says the card answers a click at all, which is the
      // visible half of `tap_action`.
      clickable: root.querySelector('ha-card').classList.contains('--more-info'),
      // The ids that survived the way in: an indicator or a button whose
      // entity is missing is dropped there, so a list that matches is a list
      // of entities that all lined up.
      indicators: objects.map(one => one.id),
      readings: states.map((state, index) => ({
        id: objects[index]?.id ?? null,
        value: state.querySelector('.state__value')?.textContent.trim() ?? '',
        unit: state.querySelector('.state__uom')?.textContent.trim() ?? '',
        icon: state.querySelector('ha-icon')?.icon ?? null,
      })),
      buttons: drawn.map(element => ({
        tag: element.localName,
        id: (element.button ?? element.dropdown)?.id ?? null,
        icon: (element.button ?? element.dropdown)?.icon ?? null,
        options: element.dropdown ? element.dropdown.source.map(item => item.name) : null,
        selected: element.dropdown ? (element.dropdown.selected?.name ?? null) : null,
      })),
      power: !!root.querySelector('mh-power'),
      // The range a person can actually drag through, off the element the
      // frontend ships rather than off the card's own object. The card binds
      // these as properties rather than attributes, so they are read as
      // properties - all three slider implementations carry them.
      slider: slider
        ? (() => {
            const control = slider.shadowRoot.querySelector('ha-slider');
            if (!control) return null;
            const number = value =>
              value === null || value === undefined || value === '' ? null : Number(value);
            return {
              min: number(control.min ?? control.getAttribute('min')),
              max: number(control.max ?? control.getAttribute('max')),
            };
          })()
        : null,
    };
  }, want);

/**
 * The more-info dialog, if one is open, as the text a person would see in it.
 *
 * Its presence proves nothing: Home Assistant leaves `ha-more-info-dialog` in
 * the document after it closes, and a closed one differs from an open one only
 * in having an empty shadow root. The text is walked out of the nested roots
 * because that is where the entity's name is, and the name is the only thing
 * that says *which* entity was opened.
 */
const moreInfo = page =>
  page.evaluate(() => {
    const find = root => {
      for (const element of root.querySelectorAll('*')) {
        if (element.localName === 'ha-more-info-dialog') return element;
        if (element.shadowRoot) {
          const hit = find(element.shadowRoot);
          if (hit) return hit;
        }
      }
      return null;
    };

    const text = root => {
      let out = '';
      for (const node of root.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) out += ` ${node.textContent}`;
        else if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.shadowRoot) out += text(node.shadowRoot);
          out += text(node);
        }
      }
      return out;
    };

    const dialog = find(document);
    if (!dialog || (dialog.shadowRoot?.children.length ?? 0) === 0) return null;

    return text(dialog.shadowRoot).replace(/\s+/g, ' ').trim().slice(0, 300);
  });

/**
 * The buttons of a card, which are behind the chevron until somebody presses
 * it.
 *
 * None of these recipes writes `toggle: {default: true}`, and putting it in
 * them to make the assertions easier would be asserting about a card nobody was
 * given. So the panel is opened the way its owner opens it - which also says
 * the chevron is there at all, since it is only drawn when there are buttons
 * behind it.
 */
const openButtons = async (page, want) => {
  const card = await locate(page, want);
  const toggle = card.locator('.toggle-button');

  if ((await toggle.count()) === 0) {
    throw new Error(`no toggle button on the card matching ${JSON.stringify(want)}`);
  }
  if (!(await card.evaluate(element => element.toggle))) await toggle.first().click();

  await card.locator('mh-buttons').first().waitFor({ state: 'attached', timeout: 10000 });
  return card;
};

/** The same card, as something to click. Named the same way as `look`. */
const locate = async (page, want) => {
  for (const card of await page.locator('mini-humidifier').all()) {
    const hit = await card.evaluate(
      (element, wanted) =>
        Object.entries(wanted).every(([key, value]) =>
          value === null ? element.config?.[key] === undefined : element.config?.[key] === value,
        ),
      want,
    );
    if (hit) return card;
  }
  throw new Error(`no card matching ${JSON.stringify(want)} on this view`);
};

describe('the answers people were given', () => {
  let bench;
  let session;
  // What the card said it was leaving out. `warnMissing` says it once per
  // control, and `open()` keeps errors rather than warnings, so it is
  // collected here.
  const warnings = [];

  const go = async view => {
    await session.page.goto(`${BASE}/${DASHBOARD}/${view}`, { waitUntil: 'load' });
    await session.page.waitForSelector('mini-humidifier', { timeout: 60000 });
    await session.page.waitForTimeout(1500);
  };

  before(async () => {
    bench = await prepare();
    session = await open(bench.tokens);

    session.page.on('console', message => {
      if (message.type() === 'warning' && message.text().includes('mini-humidifier')) {
        warnings.push(message.text().slice(0, 300));
      }
    });

    await go(ANSWERS);

    const modal = await dialogs(session.page);
    assert.deepEqual(modal, [], 'something modal is covering the dashboard');
  });

  after(async () => {
    if (session) await session.close();
  });

  it('draws the deerma jsq2w card of #112 as it was written', async () => {
    // Written in 2023 for a device the card has no preset for, posted with a
    // screenshot, and copied since. It names no `model:` at all, so everything
    // it does not write comes from the default Xiaomi preset - which is the
    // arrangement `docs/custom-device.md` describes and AGENTS.md protects.
    await openButtons(session.page, { name: 'Увлажнитель' });
    const card = await look(session.page, { name: 'Увлажнитель' });

    assert.ok(card, 'the card is not on the dashboard');
    assert.ok(card.height > 0, 'the card has no height');

    // The one indicator it wrote, reading a sensor that is not the humidifier.
    // The four the preset brings are not here: they are `sensor.<the fan's
    // own id>_water_level` and friends, which this device does not have.
    assert.deepEqual(card.indicators, ['vlazhnost']);
    assert.deepEqual(card.readings, [
      { id: 'vlazhnost', value: '48.6', unit: '%', icon: 'mdi:water-percent' },
    ]);

    // Its three buttons and nothing else, in the order it numbered them. The
    // preset's `dry` and `child_lock` fall out for the same reason the
    // indicators did.
    assert.deepEqual(
      card.buttons.map(button => [button.tag, button.id]),
      [
        ['mh-dropdown', 'mode'],
        ['mh-button', 'led'],
        ['mh-button', 'buzzer'],
      ],
    );

    // The dropdown offers what the answer wrote, rather than the preset's own
    // modes: the merge replaces a control's `source` whole.
    const [mode] = card.buttons;
    // Four labels for four preset modes, and the fourth is called Auto by the
    // person who wrote the card rather than by the device.
    assert.deepEqual(mode.options, ['Level 1', 'Level 2', 'Level 3', 'Auto']);
    assert.equal(mode.selected, 'Level 2');

    // `secondary_info: {type: mode}`, which is the line under the name.
    assert.equal(card.secondary, 'Level 2');
    assert.equal(card.name, 'Увлажнитель');
    assert.ok(card.power, 'no power button');
  });

  it('says in the console which of the preset entities that device does not have', async () => {
    // The other half of the same story, and the reason a card copied from a
    // three-year-old thread is readable at all: what the preset reached for
    // and did not find is named rather than silently left out (#78, #98, #266).
    const id = bench.ids.deerma_jsq2w_fan_level.split('.')[1];
    const missing = [
      `sensor.${id}_water_level`,
      `sensor.${id}_temperature`,
      `sensor.${id}_humidity`,
      `sensor.${id}_motor_speed`,
      `switch.${id}_dry_mode`,
      `switch.${id}_child_lock`,
    ];

    for (const entityId of missing) {
      await until(() => warnings.some(warning => warning.includes(entityId)) || null, {
        diagnose: () => warnings,
      });
    }
  });

  it('sends the three buttons of #112 through to the three entities beside it', async () => {
    // Each of them points somewhere other than the card's entity, which is the
    // hard half of writing a card for a device with no preset - and the half
    // #124 got wrong. A press has to reach the light, the switch and the fan.
    const card = await openButtons(session.page, { name: 'Увлажнитель' });
    const buttons = card.locator('mh-buttons mh-button');
    const ids = await buttons.evaluateAll(list => list.map(element => element.button?.id));

    const press = async (name, entityId) => {
      const index = ids.indexOf(name);
      assert.ok(index >= 0, `no ${name} button among ${ids.join(', ')}`);

      const before_ = await entity(bench.tokens, entityId);
      await buttons.nth(index).locator('ha-icon-button').first().click();

      const after_ = await until(
        async () => {
          const state = await entity(bench.tokens, entityId);
          return state.state !== before_.state ? state : null;
        },
        { diagnose: () => entity(bench.tokens, entityId) },
      );
      assert.notEqual(after_.state, before_.state, `${name}: ${before_.state} -> ${after_.state}`);

      return { before: before_.state, after: after_.state };
    };

    const led = await press('led', bench.ids.deerma_jsq2w_indicator_light);
    const buzzer = await press('buzzer', bench.ids.deerma_jsq2w_alarm);

    // Back where the scenarios after this one expect them.
    await callService(bench.tokens, 'light', led.before === 'on' ? 'turn_on' : 'turn_off', {
      entity_id: bench.ids.deerma_jsq2w_indicator_light,
    });
    await callService(bench.tokens, 'switch', buzzer.before === 'on' ? 'turn_on' : 'turn_off', {
      entity_id: bench.ids.deerma_jsq2w_alarm,
    });

    // And the dropdown, which drives the fan's preset mode rather than a
    // service of the humidifier's own.
    const id = bench.ids.deerma_jsq2w_fan_level;
    const dropdown = card.locator('mh-buttons mh-dropdown').first();

    await dropdown.locator('ha-icon-button').click();
    await dropdown.locator('.mh-dropdown__item[data-value="Level4"]').click();

    const picked = await until(
      async () => {
        const state = await entity(bench.tokens, id);
        return state.attributes.preset_mode === 'Level4' ? state : null;
      },
      { diagnose: () => entity(bench.tokens, id) },
    );
    assert.equal(picked.attributes.preset_mode, 'Level4');

    await callService(bench.tokens, 'fan', 'set_preset_mode', {
      entity_id: id,
      preset_mode: 'Level2',
    });
  });

  it('opens the sensor its indicator reads, not the humidifier (#112)', async () => {
    // `tap_action` on an indicator, pointed at the entity that indicator was
    // pointed at. The card's own entity is a fan called Увлажнитель, so the
    // name in the dialog says which of the two was opened.
    const card = await locate(session.page, { name: 'Увлажнитель' });
    await card.locator('mh-indicators .state').first().click();

    const text = await until(() => moreInfo(session.page), {
      diagnose: () => dialogs(session.page),
    });
    assert.match(text, /Average humidity/);

    await session.page.keyboard.press('Escape');
    await until(async () => ((await moreInfo(session.page)) === null ? true : null));
  });

  it('draws the Levoit Classic 300S recipe of docs/custom-device.md', async () => {
    // The worked example the page hangs on: a device through VeSync with no
    // bundled preset, written out control by control on top of `model:
    // humidifier`.
    await openButtons(session.page, { name: 'Bedroom' });
    const card = await look(session.page, { name: 'Bedroom' });

    assert.ok(card, 'the card is not on the dashboard');
    assert.equal(card.name, 'Bedroom');

    // The reading points at the sensor beside the humidifier rather than at
    // the humidifier's own `current_humidity`, and the two say different
    // things on purpose: 46 is the sensor, 52 is the attribute the domain
    // preset would have read.
    assert.deepEqual(card.indicators, ['humidity']);
    assert.deepEqual(card.readings, [
      { id: 'humidity', value: '46', unit: '%', icon: 'mdi:water' },
    ]);

    // "Power, the slider with the device's own range, and the modes dropdown
    // are not in there because `model: humidifier` brings them" - the page's
    // own sentence, and the slider is the half of it that is easy to get
    // wrong: the default Xiaomi preset names 30-80 and would win here.
    assert.ok(card.power, 'no power button');
    assert.deepEqual(card.slider, { min: 35, max: 75 });

    const [mode, light] = card.buttons;
    assert.equal(mode.id, 'mode');
    assert.deepEqual(mode.options, ['auto', 'sleep', 'manual'], 'not built from available_modes');
    assert.equal(mode.selected, 'auto');

    // And the one control the recipe writes itself, whose three brightnesses
    // are ids matched against what the light reports.
    assert.equal(light.id, 'night_light');
    assert.equal(light.tag, 'mh-dropdown');
    assert.deepEqual(light.options, ['Off', 'Dim', 'Bright']);
    assert.equal(light.selected, 'Dim', 'the light is at 128 and nothing is selected');
  });

  it('sets the night light brightness that recipe offers', async () => {
    const id = bench.ids.classic_300s_night_light;
    const card = await openButtons(session.page, { name: 'Bedroom' });
    const dropdowns = card.locator('mh-buttons mh-dropdown');
    const ids = await dropdowns.evaluateAll(list => list.map(element => element.dropdown?.id));
    const index = ids.indexOf('night_light');

    assert.ok(index >= 0, `no night_light dropdown among ${ids.join(', ')}`);

    await dropdowns.nth(index).locator('ha-icon-button').click();
    await dropdowns.nth(index).locator('.mh-dropdown__item[data-value="255"]').click();

    const bright = await until(
      async () => {
        const state = await entity(bench.tokens, id);
        return state.attributes.brightness === 255 ? state : null;
      },
      { diagnose: () => entity(bench.tokens, id) },
    );
    assert.equal(bright.attributes.brightness, 255);

    await callService(bench.tokens, 'light', 'turn_on', { entity_id: id, brightness: 128 });
  });

  it('calls the service the call-service snippet names', async () => {
    // `tap_action` is the part of `docs/examples.md` nothing had ever
    // rendered: `handleClick` measured 0% covered when coverage arrived
    // (#197), and its `toggle` branch had been gone for six years while the
    // page still showed it.
    //
    // The service here is `switch.toggle` on a bench fixture rather than the
    // page's `xiaomi_miio.fan_set_led_brightness`: the snippet is about the
    // shape of the action, and a service no integration on this bench provides
    // would fail before the card was tested at all.
    const id = bench.ids.bench_plug;
    const before_ = await entity(bench.tokens, id);

    const card = await locate(session.page, { name: 'call-service' });
    await card.locator('.entity__info__name_wrap').click();

    const after_ = await until(
      async () => {
        const state = await entity(bench.tokens, id);
        return state.state !== before_.state ? state : null;
      },
      { diagnose: () => entity(bench.tokens, id) },
    );
    assert.notEqual(after_.state, before_.state);

    await callService(bench.tokens, 'switch', before_.state === 'on' ? 'turn_on' : 'turn_off', {
      entity_id: id,
    });
  });

  it('opens more-info for the entity the snippet names, not the card', async () => {
    const card = await locate(session.page, { name: 'more-info elsewhere' });
    assert.equal((await look(session.page, { name: 'more-info elsewhere' })).clickable, true);

    await card.locator('.entity__info__name_wrap').click();

    const text = await until(() => moreInfo(session.page), {
      diagnose: () => dialogs(session.page),
    });
    assert.match(text, /Bench room humidity/);

    await session.page.keyboard.press('Escape');
    await until(async () => ((await moreInfo(session.page)) === null ? true : null));
  });

  it('does nothing at all when the snippet says none', async () => {
    // The scenario above is this one's control: it is the same click and the
    // same detector, on a card that does open a dialog. Without it, a broken
    // detector and a working `tap_action: none` look identical.
    const card = await locate(session.page, { name: 'no action' });
    assert.equal(
      (await look(session.page, { name: 'no action' })).clickable,
      false,
      'card looks clickable',
    );

    await card.locator('.entity__info__name_wrap').click();
    await session.page.waitForTimeout(1000);

    assert.equal(await moreInfo(session.page), null, 'a dialog opened anyway');
    assert.deepEqual(await dialogs(session.page), []);
  });

  it('moves the dashboard without reloading it, for navigate', async () => {
    // What separates the two navigating actions: `navigate` is a `pushState`
    // and a `location-changed` event, so the frontend swaps the view and the
    // document survives. The marker is how that is measured rather than
    // assumed.
    await session.page.evaluate(() => {
      window.__answers = 'same document';
    });

    const card = await locate(session.page, { name: 'navigate' });
    await card.locator('.entity__info__name_wrap').click();

    await until(async () => (session.page.url().endsWith(`/${DASHBOARD}/1`) ? true : null), {
      diagnose: () => session.page.url(),
    });
    assert.equal(
      await session.page.evaluate(() => window.__answers ?? null),
      'same document',
      'the page reloaded, so this was not navigate',
    );

    await go(ANSWERS);
  });

  it('leaves the page for the url, for url', async () => {
    // The other half, and the reason the url here is the bench's own dashboard
    // rather than the page's `https://www.google.com/`: what is being pinned
    // is that the action sets `location`, which a scenario can see without
    // leaving the bench - or needing the internet.
    await session.page.evaluate(() => {
      window.__answers = 'same document';
    });

    const card = await locate(session.page, { name: 'url' });
    await Promise.all([
      session.page.waitForURL(`**/${DASHBOARD}/0`, { timeout: 30000 }),
      card.locator('.entity__info__name_wrap').click(),
    ]);
    await session.page.waitForSelector('mini-humidifier', { timeout: 60000 });

    assert.equal(
      await session.page.evaluate(() => window.__answers ?? null),
      null,
      'the document survived, so this was not a url',
    );

    await go(ANSWERS);
  });

  describe('the complete cards in docs/examples.md', () => {
    // The same view the pictures on that page are taken from, so what is
    // asserted here is what the reader is looking at.
    before(() => go(DOCS));

    it('fills the rest in from the default preset, for a card with no options', async () => {
      // The built configuration always names a model - a card that named none
      // is the default one - so this is the docs view's first card, which is the
      // one that names nothing at all.
      const card = await look(session.page, { name: null, model: 'zhimi.humidifier.cb1' });

      assert.ok(card, 'the card is not on the dashboard');
      assert.deepEqual(card.indicators, ['water_level', 'temperature', 'humidity', 'motor_speed']);
      assert.deepEqual(
        card.readings.map(reading => [reading.id, reading.value, reading.unit]),
        [
          ['water_level', '72', '%'],
          ['temperature', '22.6', '°C'],
          ['humidity', '43.8', '%'],
          ['motor_speed', '318', 'rpm'],
        ],
      );
      assert.ok(card.power, 'no power button');
      assert.ok(card.slider, 'no target humidity slider');
      assert.equal(card.name, 'Bedroom humidifier', 'the name did not come from the entity');
    });

    it('reads the domain and nothing else, for model: humidifier', async () => {
      // "reads what Home Assistant guarantees for that domain - `humidity`,
      // `current_humidity`, `available_modes` - and calls `humidifier.*`
      // services". The reading is the entity's own attribute here, where the
      // card above read four sensors beside it.
      await openButtons(session.page, { name: null, model: 'humidifier' });
      const card = await look(session.page, { name: null, model: 'humidifier' });
      const id = bench.ids.bedroom_humidifier;

      assert.deepEqual(card.indicators, ['humidity']);
      assert.deepEqual(card.readings, [
        { id: 'humidity', value: '43', unit: '%', icon: 'mdi:water' },
      ]);

      const [mode] = card.buttons;
      assert.equal(mode.id, 'mode');
      assert.deepEqual(mode.options, ['Silent', 'Medium', 'High', 'Auto']);

      // And the service half of the same sentence.
      const before_ = await entity(bench.tokens, id);
      const target = before_.attributes.mode === 'Silent' ? 'High' : 'Silent';

      const dropdown = (await locate(session.page, { name: null, model: 'humidifier' })).locator(
        'mh-buttons mh-dropdown',
      );
      await dropdown.locator('ha-icon-button').click();
      await dropdown.locator(`.mh-dropdown__item[data-value="${target}"]`).click();

      const picked = await until(
        async () => {
          const state = await entity(bench.tokens, id);
          return state.attributes.mode === target ? state : null;
        },
        { diagnose: () => entity(bench.tokens, id) },
      );
      assert.equal(picked.attributes.mode, target);

      await callService(bench.tokens, 'humidifier', 'set_mode', {
        entity_id: id,
        mode: before_.attributes.mode,
      });
    });

    it('merges its indicators over the preset, for the custom card', async () => {
      // "`indicators` is **merged** over the model's defaults: the bundled
      // indicators the model brings stay on the card, and the ones you write
      // are added (or override an indicator of the same name)."
      //
      // Both halves are in one list here. `humidity` reads 43 rather than
      // 43.8, which is the override: 43.8 is the sensor the preset points at
      // and 43 is the attribute this card asked for instead.
      const card = await look(session.page, { name: 'Bedroom' });

      assert.deepEqual(card.indicators, [
        'water_level',
        'temperature',
        'humidity',
        'motor_speed',
        'room_temp',
        'room_humidity',
      ]);
      assert.deepEqual(
        card.readings.map(reading => [reading.id, reading.value, reading.unit]),
        [
          ['water_level', '72', '%'],
          ['temperature', '22.6', '°C'],
          ['humidity', '43', '%'],
          ['motor_speed', '318', 'rpm'],
          ['room_temp', '21.4', '°C'],
          ['room_humidity', '38.6', '%'],
        ],
      );
      // "`name` overrides the entity name, `secondary_info` puts a line under
      // it". The icon there is the card's; what the line says is the mode,
      // which is what `secondary_info` shows when nothing else is asked for.
      assert.equal(card.name, 'Bedroom');
      assert.equal(card.secondaryIcon, 'mdi:fan');
      assert.ok(card.secondary, 'no secondary info line under the name');
    });
  });

  it('reports nothing to the console while doing it', () => {
    assert.deepEqual(session.errors, []);
  });
});
