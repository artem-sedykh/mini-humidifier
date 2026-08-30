// The target humidity slider, against a real `ha-slider`.
//
// This is what the bench was built for. Home Assistant has shipped three
// different sliders under that name - paper-slider, MdSlider, and the
// WebAwesome one since 2025.10 - and `src/components/targetHumidity.ts` picks
// its layout by asking the element which one it is. Every layer below this one
// renders against a stand-in with no layout at all, so the branch that decides
// how the card looks has never been exercised against the thing it is deciding
// about.
//
// Needs a bench: `npm run bench up`, or BENCH_URL pointing at one.
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { entity, open, until } from '../bench/browser.mjs';
import { DASHBOARD, prepare } from '../bench/setup.mjs';
import { BASE } from '../bench/auth.mjs';

describe('the target humidity slider', () => {
  let bench;
  let session;

  before(async () => {
    bench = await prepare();
    session = await open(bench.tokens);

    await session.page.goto(`${BASE}/${DASHBOARD}/0`, { waitUntil: 'load' });
    await session.page.waitForSelector('mini-humidifier', { timeout: 60000 });
    await session.page.waitForTimeout(1500);
  });

  after(async () => {
    if (session) await session.close();
  });

  it('lays the row out for the slider this Home Assistant actually ships', async () => {
    const seen = await session.page.evaluate(() => {
      const ctor = customElements.get('ha-slider');

      // The same question the card asks, asked of the same element: these two
      // properties come from the WebAwesome slider and exist on neither of its
      // predecessors.
      const webAwesome =
        !!ctor && ('defaultValue' in ctor.prototype || 'withTooltip' in ctor.prototype);

      const rows = [];
      const walk = root => {
        for (const element of root.querySelectorAll('*')) {
          if (element.localName === 'mh-target-humidity') {
            const row = element.shadowRoot.querySelector('.mh-target_humidifier');
            if (row) rows.push(row.className);
          }
          if (element.shadowRoot) walk(element.shadowRoot);
        }
      };
      walk(document);

      return { webAwesome, defined: !!ctor, rows };
    });

    assert.ok(seen.defined, 'the frontend did not define ha-slider');
    assert.ok(seen.rows.length > 0, 'no slider row rendered');

    // The assertion is the agreement, not the flavour: which one this Home
    // Assistant ships is its business, and the bench runs against more than
    // one version on purpose.
    const expected = seen.webAwesome ? 'wa' : 'legacy';

    for (const className of seen.rows) {
      assert.ok(
        className.split(/\s+/).includes(expected),
        `frontend is ${expected}, card drew "${className}"`,
      );
    }
  });

  it('keeps the slider inside its row and clear of the entity name', async () => {
    // The failure this is written against: the WebAwesome slider is a column
    // flexbox whose only sized child is the 4px track, packed to the top.
    // Stretched the way the older two are, the track leaves the row it was
    // given and lands over the entity name beside it - visible to a person at
    // a glance, and to nothing else in this repository, because the stand-in
    // `ha-slider` in test/browser/ has no layout to get wrong.
    //
    // The name and the slider are side by side, not stacked: the row is the
    // box to measure against, and the name is what the slider must not reach.
    const boxes = await session.page.evaluate(() => {
      const box = element => {
        const rect = element.getBoundingClientRect();
        return {
          top: +rect.top.toFixed(1),
          bottom: +rect.bottom.toFixed(1),
          left: +rect.left.toFixed(1),
          right: +rect.right.toFixed(1),
          width: +rect.width.toFixed(1),
          height: +rect.height.toFixed(1),
        };
      };
      const found = [];

      const walk = root => {
        for (const element of root.querySelectorAll('*')) {
          if (element.localName === 'mini-humidifier') {
            const card = element.shadowRoot;
            const humidity = card.querySelector('mh-target-humidity');
            const name = card.querySelector('.entity__info__name');
            const slider = humidity?.shadowRoot.querySelector('ha-slider');
            const row = humidity?.shadowRoot.querySelector('.mh-target_humidifier');

            if (slider && row && name) {
              const host = card.querySelector('ha-card');

              found.push({
                name: name.textContent.trim(),
                scale: element.config?.scale ?? 1,
                slider: box(slider),
                row: box(row),
                card: box(host),
                title: box(name),
                // What the card draws past its own edge, which is the honest
                // measure of "it does not fit" - a box comparison at the edge
                // turns a real overflow into a one-pixel argument.
                overflow: host.scrollWidth - host.clientWidth,
              });
            }
          }
          if (element.shadowRoot) walk(element.shadowRoot);
        }
      };
      walk(document);
      return found;
    });

    assert.ok(boxes.length > 0, 'no card rendered a slider');

    for (const it_ of boxes) {
      const where = `${it_.name}: slider ${JSON.stringify(it_.slider)}`;

      assert.ok(it_.slider.width > 20, `${where} is too narrow`);
      assert.ok(it_.slider.height > 0, `${where} has no height`);

      // Inside the row it was given. A tolerance of a pixel, because these are
      // fractional CSS boxes.
      assert.ok(
        it_.slider.top >= it_.row.top - 1 && it_.slider.bottom <= it_.row.bottom + 1,
        `${where} leaves its row ${JSON.stringify(it_.row)}`,
      );
      assert.ok(
        it_.slider.left >= it_.title.right - 1,
        `${where} reaches the entity name ${JSON.stringify(it_.title)}`,
      );

      // And inside the card - except at a scale, where it is not, and that is
      // #265 rather than this scenario's business. Skipped by the card's own
      // `scale` rather than by its name, and the unscaled cards on the same
      // view keep the assertion, which is what makes the exception narrow.
      //
      // Worth knowing how this was found: as a one-pixel difference between
      // this machine and CI on the same commit, which reads exactly like a
      // flaky test. `overflow` is what it actually was - 81px on that card and
      // 0 on every other - so it is what is measured here.
      if (it_.scale !== 1) continue;

      assert.equal(it_.overflow, 0, `${it_.name}: the card draws ${it_.overflow}px past its edge`);
      assert.ok(
        it_.slider.left >= it_.card.left - 1 && it_.slider.right <= it_.card.right + 1,
        `${where} leaves the card ${JSON.stringify(it_.card)}`,
      );
    }
  });

  it('sends a move of the slider through to the entity', async () => {
    const id = bench.ids.bench_humidifier;
    const before_ = await entity(bench.tokens, id);
    const humidity = async () => (await entity(bench.tokens, id)).attributes.humidity;

    // Driven by pointer and keyboard rather than by writing `value`: the point
    // is that the element's own change event reaches the card, and on the
    // WebAwesome slider the `value` attribute means something else again.
    const slider = session.page
      .locator('mini-humidifier')
      .first()
      .locator('mh-target-humidity ha-slider')
      .first();

    // Aimed near the low end rather than at the middle, so the move is one the
    // entity can show: this range is 30 to 80 and the fixture sits at 55, which
    // is where a click in the centre lands anyway.
    const box = await slider.boundingBox();
    await session.page.mouse.click(box.x + box.width * 0.15, box.y + box.height / 2);

    // The card holds a move for `action_timeout` before it sends, so the wait
    // is part of the path under test. Polled, not slept through.
    const clicked = await until(
      async () => {
        const now = await humidity();
        return now !== before_.attributes.humidity ? now : null;
      },
      { timeout: 15000, diagnose: () => entity(bench.tokens, id) },
    );

    // And now the keyboard, from where the click left the focus.
    //
    // `keyboard.press` rather than `slider.press('ArrowRight')`, which is what
    // this scenario used to do and is not the same thing: `ha-slider` has
    // `tabIndex: -1` and its shadow root does not delegate focus, so the
    // `focus()` Playwright calls on the host before pressing cannot land - and
    // the click's focus, which is on a `div` inside the element, is what
    // answers the key. Measured, and #269 is the two red bench runs it cost
    // before it was: the assertion was satisfied by the click while naming the
    // key, so the key going nowhere never showed.
    await session.page.keyboard.press('ArrowRight');

    const after_ = await until(
      async () => {
        const now = await humidity();
        return now !== clicked ? now : null;
      },
      { timeout: 15000, diagnose: () => entity(bench.tokens, id) },
    );

    assert.ok(after_ > clicked, `arrow key moved ${clicked} to ${after_}`);
  });

  it('reports nothing to the console while doing it', async () => {
    assert.deepEqual(session.errors, []);
  });
});
