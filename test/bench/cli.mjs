// node test/bench/cli.mjs up|setup|down|status
//
// `up` and `down` drive docker compose and need docker on this machine.
// Everything else talks to whatever BENCH_URL points at, which is how a bench
// running on another host is used from here.
import { execFileSync } from 'node:child_process';
import { cp, rm, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { BASE } from './auth.mjs';
import { DASHBOARD, prepare } from './setup.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const compose = (...args) =>
  execFileSync('docker', ['compose', ...args], { cwd: here, stdio: 'inherit' });

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const waitForHomeAssistant = async () => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const res = await fetch(`${BASE}/api/onboarding`);
      if (res.ok) return;
    } catch {
      // Not up yet.
    }
    await wait(2000);
  }
  throw new Error(`${BASE} did not answer`);
};

const up = async ({ fresh }) => {
  const config = join(here, 'config');

  // A fresh instance means a fresh config: the entity registry, the dashboards
  // and the onboarding state all live in there, and a bench that keeps them
  // between runs is a bench whose state nobody can name.
  if (fresh) {
    await rm(config, { recursive: true, force: true });
    await mkdir(config, { recursive: true });
    await cp(join(here, 'config-seed'), config, { recursive: true });
  }

  compose('up', '-d');
  await waitForHomeAssistant();
};

// One picture per card on the dashboard, plus the dashboard itself. This is
// the other half of what the bench is for: an answer to "the layout is off"
// that is a screenshot rather than a paragraph.
const shot = async () => {
  const { open } = await import('./browser.mjs');
  const { mkdir } = await import('node:fs/promises');
  const directory = process.env.BENCH_SHOTS || 'test/e2e/shots';

  await mkdir(directory, { recursive: true });
  const ready = await prepare();

  // Wide enough that the masonry view settles on its widest column, which is
  // what makes a card picture the same size whatever else is on the view. At
  // the 900 the scenarios use, the column narrows as cards are added - adding
  // a sixth card to the answers view took its cards from 492px to 310px and
  // clipped the card names, so a picture regenerated after an unrelated change
  // no longer matched the ones beside it in the documentation.
  const session = await open(ready.tokens, { viewport: { width: 1400, height: 1000 } });

  let taken = 0;

  // Every view the manifest describes, not just the first: a manifest holding
  // a reporter's card usually puts it beside the ones already there.
  for (let view = 0; view < ready.manifest.views.length; view += 1) {
    await session.page.goto(`${BASE}/${DASHBOARD}/${view}`, { waitUntil: 'load' });
    await session.page.waitForSelector('mini-humidifier', { timeout: 60000 });
    await session.page.waitForTimeout(1500);

    await session.page.screenshot({ path: `${directory}/view-${view}.png` });
    taken += 1;

    const all = session.page.locator('mini-humidifier');
    const count = await all.count();

    // Named after the card rather than by its position, so a picture keeps its
    // name when the view gains a card above it - which matters as soon as one
    // of these is committed and pointed at from the documentation.
    const named = ready.manifest.views[view].cards.map((card, index) => {
      const slug = String(card.name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      return slug || `card-${index + 1}`;
    });

    for (let index = 0; index < count; index += 1) {
      const name = named[index] || `card-${index + 1}`;
      await all.nth(index).screenshot({ path: `${directory}/view-${view}-${name}.png` });
      taken += 1;
    }
  }
  await session.browser.close();

  console.log(`${taken} screenshots in ${directory}`);
  if (session.errors.length) console.log(`page errors: ${JSON.stringify(session.errors)}`);
};

// The pictures the documentation points at, and which card each one is.
//
// They used to be screenshots of somebody's dashboard: two of the three on the
// first page were taken on a Russian Home Assistant, so the card said `АВТО`
// where the reader's says `Auto`, and both showed a device with an empty tank
// and a stopped motor (#277). These are taken here instead - one view per page,
// so the cards on it come out the same width, and a browser whose language is
// pinned to English in `browser.mjs`.
//
// The views are the manifest's and their cards are the YAML the pages show, in
// the order the pages show them. Change one and the other has to follow, which
// is why they sit next to each other here rather than being described twice.
const DOCS_PAGES = [
  {
    view: 4,
    title: 'Documentation',
    into: 'docs/images',
    images: ['default.png', 'model-humidifier.png', 'custom-indicators.png'],
  },
  // The gallery in docs/models.md: one picture per preset rather than per
  // `model:` id, because three ids share the cb1 configuration and three more
  // share deerma's, and six copies of one card answer nothing (#279).
  {
    view: 3,
    title: 'Models',
    into: 'docs/images/models',
    images: ['cb1.png', 'jsq.png', 'ma2.png', 'va2.png', 'humidifier.png', 'none.png'],
  },
  // The same page's second table, for syssi's component. One `fan` entity
  // carrying every attribute those six presets read, which is all a picture
  // needs: the stub services #266 left undone are for pressing things (#281).
  {
    view: 5,
    title: 'Models (third-party)',
    into: 'docs/images/models',
    images: [
      'airpurifier-cb1.png',
      'airpurifier-ca4.png',
      'airpurifier-mb3.png',
      'airpurifier-va2.png',
      'airpurifier-mjjsq.png',
      // Rendered, not saved: jsq5 differs from mjjsq only in the slider's
      // range, so a second picture of it would be the same card. `null` keeps
      // the card on the view - it is still one the bench draws - without
      // putting a duplicate on the page.
      null,
    ],
  },
];

const docs = async () => {
  const { open } = await import('./browser.mjs');
  const { mkdir } = await import('node:fs/promises');
  const ready = await prepare();

  // The same width `shot` uses, and for the same reason: at the width the
  // scenarios run, the masonry column narrows as cards are added.
  const session = await open(ready.tokens, { viewport: { width: 1400, height: 1000 } });
  let taken = 0;

  for (const page of DOCS_PAGES) {
    const view = ready.manifest.views[page.view];

    if (!view || view.title !== page.title) {
      throw new Error(`view ${page.view} of the manifest is not "${page.title}"`);
    }
    if (view.cards.length !== page.images.length) {
      throw new Error(
        `"${page.title}" has ${view.cards.length} cards and there are ` +
          `${page.images.length} names for them`,
      );
    }

    await mkdir(page.into, { recursive: true });
    await session.page.goto(`${BASE}/${DASHBOARD}/${page.view}`, { waitUntil: 'load' });
    await session.page.waitForSelector('mini-humidifier', { timeout: 60000 });
    await session.page.waitForTimeout(2000);

    const all = session.page.locator('mini-humidifier');
    const count = await all.count();

    if (count !== page.images.length) {
      throw new Error(`"${page.title}" rendered ${count} cards, ${page.images.length} expected`);
    }

    // Equal widths are the point of taking a page's pictures together, so they
    // are checked rather than hoped for: one card 310px wide beside two of 492
    // is what an unnoticed extra card on the view looks like.
    const widths = await all.evaluateAll(cards =>
      cards.map(
        card => +card.shadowRoot.querySelector('ha-card').getBoundingClientRect().width.toFixed(1),
      ),
    );
    if (new Set(widths).size !== 1) {
      throw new Error(`"${page.title}" came out ${widths.join(', ')} wide`);
    }

    let saved = 0;
    for (let index = 0; index < count; index += 1) {
      if (!page.images[index]) continue;

      await all.nth(index).screenshot({ path: `${page.into}/${page.images[index]}` });
      saved += 1;
      taken += 1;
    }
    console.log(`${saved} images in ${page.into}, ${widths[0]}px wide`);
  }
  await session.browser.close();

  console.log(`${taken} documentation images`);
  if (session.errors.length) console.log(`page errors: ${JSON.stringify(session.errors)}`);
};

const command = process.argv[2] || 'status';

if (command === 'up') {
  await up({ fresh: process.argv.includes('--keep') === false });
  const ready = await prepare();
  console.log(`bench ready: ${ready.dashboard}`);
  console.log(`entities: ${JSON.stringify(ready.ids)}`);
} else if (command === 'setup') {
  const ready = await prepare();
  console.log(`bench ready: ${ready.dashboard}`);
  console.log(`entities: ${JSON.stringify(ready.ids)}`);
} else if (command === 'shot') {
  await shot();
} else if (command === 'docs') {
  await docs();
} else if (command === 'down') {
  compose('down', '-v');
} else if (command === 'status') {
  const res = await fetch(`${BASE}/api/onboarding`).catch(() => null);
  console.log(res && res.ok ? `${BASE} is up` : `${BASE} is not answering`);
} else {
  console.error(`unknown command: ${command}`);
  process.exit(1);
}
