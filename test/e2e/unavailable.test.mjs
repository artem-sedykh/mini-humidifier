// A card whose entity is not in `hass.states` (#263).
//
// An entity leaves for real: it is renamed, its integration is removed, or the
// `entity:` in the YAML has a typo `setConfig` cannot catch, because it only
// checks the domain. Until the bench there was nowhere to see what the card did
// about it - the fake `hass` in test/browser/ is written by the test that needs
// it, so an entity is missing there only when somebody remembers to leave it
// out.
//
// What it did was throw: the model stayed the `{}` the constructor puts there,
// `computeClasses()` read `isActive` off it, and `render()` gave up before an
// `ha-card` existed. A blank space on the dashboard, and a TypeError on every
// state update - with the text in the console, where somebody looking at a
// blank space has no reason to look.
//
// Needs a bench: `npm run bench up`, or BENCH_URL pointing at one.
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { open } from '../bench/browser.mjs';
import { DASHBOARD, prepare } from '../bench/setup.mjs';
import { BASE } from '../bench/auth.mjs';

// The card in the manifest that points at an entity nobody created.
const MISSING = 'Missing entity';

describe('a card whose entity does not exist', () => {
  let bench;
  let session;
  let card;

  before(async () => {
    bench = await prepare();
    session = await open(bench.tokens);

    await session.page.goto(`${BASE}/${DASHBOARD}/0`, { waitUntil: 'load' });
    await session.page.waitForSelector('mini-humidifier', { timeout: 60000 });
    await session.page.waitForTimeout(1500);

    card = await session.page.evaluate(name => {
      const walk = root => {
        for (const element of root.querySelectorAll('*')) {
          if (element.localName === 'mini-humidifier' && element.config?.name === name) {
            const host = element.shadowRoot.querySelector('ha-card');

            return {
              rendered: !!host,
              text: host ? host.textContent.replace(/\s+/g, ' ').trim() : null,
              height: host ? +host.getBoundingClientRect().height.toFixed(1) : 0,
              classes: host ? host.className.trim() : null,
              components: host
                ? [...element.shadowRoot.querySelectorAll('*')]
                    .map(node => node.localName)
                    .filter(local => local.startsWith('mh-'))
                : null,
            };
          }
          if (element.shadowRoot) {
            const hit = walk(element.shadowRoot);
            if (hit) return hit;
          }
        }
        return null;
      };
      return walk(document);
    }, MISSING);
  });

  after(async () => {
    if (session) await session.close();
  });

  it('renders a card at all', () => {
    assert.ok(card, `no card named "${MISSING}" on the dashboard`);
    assert.ok(card.rendered, 'the card rendered no ha-card');
    assert.ok(card.height > 0, 'the card has no height');
  });

  it('says it is unavailable, where a person can see it', () => {
    assert.match(card.text, /Unavailable/i, card.text);
  });

  it('draws none of the controls', () => {
    // Every render path already asks `isUnavailable`; this is what that answers
    // to when the entity is not there at all.
    assert.ok(
      !card.components.includes('mh-target-humidity'),
      `slider drawn: ${card.components.join(', ')}`,
    );
    assert.ok(!card.components.includes('mh-power'), `power drawn: ${card.components.join(', ')}`);
  });

  it('throws nothing while doing it', () => {
    // The regression this file exists for. Every card on the view is on the
    // page, so a throw from any of them lands here too.
    assert.deepEqual(session.errors, []);
  });
});
