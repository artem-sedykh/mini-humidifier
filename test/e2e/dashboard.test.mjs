// The fourth layer: the card on a real dashboard, in a real Home Assistant,
// against real ha-* elements. What it is for is the failure the layers below
// cannot see - the ones where Home Assistant changed rather than the card.
// `test/browser/` renders against stand-ins whose only property is a `display`,
// so nothing in them can break the way the real elements have.
//
// It is deliberately thin. Geometry in pixels belongs in test/browser/, which
// is faster, deterministic and needs no container. What belongs here is what
// only a whole Home Assistant can answer.
//
// Needs a bench: `npm run bench up`, or BENCH_URL pointing at one.
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { cards, dialogs, entity, open, until } from '../bench/browser.mjs';
import { DASHBOARD, prepare } from '../bench/setup.mjs';
import { BASE } from '../bench/auth.mjs';

const SHOTS = 'test/e2e/shots';

describe('the card on a dashboard', () => {
  let bench;
  let session;

  before(async () => {
    await mkdir(SHOTS, { recursive: true });
    bench = await prepare();
    session = await open(bench.tokens);

    await session.page.goto(`${BASE}/${DASHBOARD}/0`, { waitUntil: 'load' });
    await session.page.waitForSelector('mini-humidifier', { timeout: 60000 });
    await session.page.waitForTimeout(1500);

    // A modal over the cards makes every click time out with a message about
    // stability that says nothing about the modal. Named here instead.
    const modal = await dialogs(session.page);
    assert.deepEqual(modal, [], 'something modal is covering the dashboard');
  });

  after(async () => {
    if (session) await session.close();
  });

  it('renders every card the manifest asks for', async () => {
    const rendered = await cards(session.page, 'mini-humidifier');
    // The first view only: this scenario looks at the page it opened, and the
    // manifest has views after it for the configurations people actually write.
    const expected = bench.manifest.views[0].cards.length;

    assert.equal(rendered.length, expected);

    const known = new Set(Object.values(bench.ids));

    for (const card of rendered) {
      assert.ok(card.height > 0, `${card.name}: no height`);

      // A card pointed at an entity that does not exist renders the name and
      // none of the controls. Here that only has to not be mistaken for a card
      // that failed to render.
      if (!known.has(card.config.entity)) continue;

      assert.ok(
        card.components.includes('mh-indicators'),
        `${card.name}: ${card.components.join(', ')}`,
      );
    }
    await session.page.screenshot({ path: `${SHOTS}/dashboard.png` });
  });

  it('draws the entity icon at the size Home Assistant gives it', async () => {
    // The shape of the sister card's #188: an icon button kept its own 48px
    // while the card sized the host to 30px, because Home Assistant had moved
    // the knob from --mdc-icon-button-size to --ha-icon-button-size. Nothing
    // below this layer can see it - the stand-in elements have no size.
    const sizes = await session.page.evaluate(() => {
      const found = [];

      // The `button` at the bottom, not the `ha-button` wrapping it. The
      // wrapper is an inline box, so its height is the line height whenever
      // the button is smaller than that, and measuring it reports an overflow
      // for every small button that is drawn perfectly correctly.
      const button = element => {
        let node = element.shadowRoot;
        for (let depth = 0; node && depth < 4; depth += 1) {
          const hit = node.querySelector('button');
          if (hit) return hit;
          node = node.firstElementChild?.shadowRoot;
        }
        return null;
      };

      const walk = root => {
        for (const element of root.querySelectorAll('*')) {
          if (element.localName === 'ha-icon-button') {
            const box = element.getBoundingClientRect();
            const inner = button(element)?.getBoundingClientRect();
            found.push({
              host: [+box.width.toFixed(1), +box.height.toFixed(1)],
              inner: inner ? [+inner.width.toFixed(1), +inner.height.toFixed(1)] : null,
            });
          }
          if (element.shadowRoot) walk(element.shadowRoot);
        }
      };
      walk(document);
      return found;
    });

    assert.ok(sizes.length > 0, 'no ha-icon-button rendered');

    for (const { host, inner } of sizes) {
      if (!inner) continue;
      assert.ok(
        inner[0] <= host[0] + 0.5 && inner[1] <= host[1] + 0.5,
        `button overflows its host: inner ${inner} in host ${host}`,
      );
    }
  });

  it('sends a press on the power button through to the entity', async () => {
    const id = bench.ids.bench_humidifier;
    const before_ = await entity(bench.tokens, id);

    await session.page
      .locator('mini-humidifier')
      .first()
      .locator('mh-power ha-icon-button')
      .first()
      .click();

    // Polled rather than waited out: the press goes to Home Assistant, the
    // state comes back over the websocket, and a fixed sleep in that position
    // is a race whose only symptom is an occasional red run.
    const after_ = await until(
      async () => {
        const state = await entity(bench.tokens, id);
        return state.state !== before_.state ? state : null;
      },
      { diagnose: () => entity(bench.tokens, id) },
    );

    assert.notEqual(after_.state, before_.state, `${before_.state} -> ${after_.state}`);

    // Put it back: a scenario that leaves the fixture off changes what every
    // scenario after it is looking at.
    await session.page
      .locator('mini-humidifier')
      .first()
      .locator('mh-power ha-icon-button')
      .first()
      .click();

    await until(async () => {
      const state = await entity(bench.tokens, id);
      return state.state === before_.state ? state : null;
    });
  });

  it('reports nothing to the console while doing it', async () => {
    assert.deepEqual(session.errors, []);
  });
});
