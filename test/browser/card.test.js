import { aTimeout, expect } from '@open-wc/testing';
import { components, countRenders, mountCard, settle } from './helpers/card.js';
import { ENTITY_ID } from './helpers/hass.js';

describe('the card in a browser', () => {
  it('renders the humidifier and its components', async () => {
    const { card } = await mountCard();

    expect(card.shadowRoot.querySelector('ha-card')).to.exist;
    expect(card.shadowRoot.querySelector('.entity__info__name').textContent.trim()).to.equal(
      'Bedroom humidifier',
    );

    const rendered = components(card).map(component => component.localName);

    expect(rendered).to.include.members(['mh-target-humidity', 'mh-power', 'mh-indicators']);

    // A component whose element definitions never resolve renders an empty
    // template and says nothing about it, which is the failure this asserts
    // against: the card would still be there, only hollow.
    for (const component of components(card)) {
      expect(component.shadowRoot.childElementCount, component.localName).to.be.greaterThan(0);
    }
  });

  it('names the current mode under the entity name', async () => {
    const { card } = await mountCard();

    // The default `secondary_info`. It reads the label out of the dropdown's
    // own source list rather than the raw attribute, so this is also the one
    // place a card shows a translated mode without a dropdown being open.
    expect(
      card.shadowRoot.querySelector('.entity__secondary_info__name').textContent.trim(),
    ).to.equal('Auto');
  });

  it('says nothing there when the configuration has no mode button', async () => {
    // `secondary_info` defaults to the mode, and the mode is read off the
    // button that offers the modes. Every bundled model has one, so this read
    // went unguarded for years; `model: none` is the first configuration that
    // can legitimately arrive without it, and an unguarded read threw before
    // the card had rendered anything at all.
    const { card } = await mountCard({ config: { model: 'none' } });

    expect(card.shadowRoot.querySelector('ha-card')).to.exist;
    expect(card.shadowRoot.querySelector('.entity__info__name').textContent.trim()).to.equal(
      'Bedroom humidifier',
    );
    expect(card.shadowRoot.querySelector('.entity__secondary_info__name')).to.not.exist;
  });

  it('hands the timestamp to ha-relative-time for last-changed', async () => {
    const { card, hass } = await mountCard({ config: { secondary_info: 'last-changed' } });
    const relative = card.shadowRoot.querySelector('ha-relative-time');

    // The only element the card renders that it also has to keep fed: it needs
    // `hass` to know the language and `datetime` to count from.
    expect(relative).to.exist;
    expect(relative.datetime).to.equal(hass.states[ENTITY_ID].last_changed);
    expect(relative.hass).to.equal(hass);
  });

  it('renders an unavailable entity instead of throwing', async () => {
    // What broke when the frontend dropped `hass.resources`: the label lookup
    // for this one state threw, so an entity going unavailable took the whole
    // card down with it.
    const { card } = await mountCard({ state: 'unavailable' });

    expect(card.shadowRoot.querySelector('ha-card').className).to.contain('--unavailable');
    expect(card.shadowRoot.querySelector('.label.unavailable').textContent.trim()).to.equal(
      'Unavailable',
    );

    // The slider and the power button are the two controls that would otherwise
    // act on an entity that cannot be acted on.
    expect(card.shadowRoot.querySelector('mh-target-humidity')).to.not.exist;
    expect(card.shadowRoot.querySelector('mh-power')).to.not.exist;
  });

  it('falls back when Home Assistant has no translation for the state', async () => {
    const { card } = await mountCard({ state: 'unavailable' });

    card.hass = { ...card.hass, localize: () => '' };
    await settle(card);

    expect(card.shadowRoot.querySelector('.label.unavailable').textContent.trim()).to.equal(
      'Unavailable',
    );
  });

  it('renders nothing again when the same state comes back', async () => {
    // Home Assistant assigns `hass` on every state change anywhere in the
    // installation, not just on this card's entities, so an assignment that
    // carries no news has to cost nothing. The indicators are where that went
    // wrong: they compared `last_changed` against `last_updated`, which differ
    // on any entity that has been updated since it last changed state, so every
    // assignment looked like news and asked for a render 500ms later.
    const { card, hass } = await mountCard();

    card.toggle = true;
    await settle(card);

    // The card asks for one more render 500ms after it first sees state, by
    // design - `updateIndicators` debounces. Let that one pass before counting,
    // or it lands in the middle of the wait below and is mistaken for churn.
    await aTimeout(600);
    await settle(card);

    const counts = countRenders([card, ...components(card)]);

    card.hass = hass;
    await aTimeout(600);
    await settle(card);

    for (const [element, renders] of counts) {
      expect(renders, element.localName).to.equal(0);
    }
  });

  it('offers the pointer only when the click does something', async () => {
    // Both spellings of "do nothing": the documented string, and the object
    // Home Assistant's own editors write. Before #250 the name carried
    // `cursor: pointer` whatever the configuration said, and the `--more-info`
    // class that was meant to decide it was read by no stylesheet.
    const cursorOf = card =>
      getComputedStyle(card.shadowRoot.querySelector('.entity__info__name_wrap')).cursor;

    expect(cursorOf((await mountCard()).card)).to.equal('pointer');
    expect(cursorOf((await mountCard({ config: { tap_action: 'none' } })).card)).to.not.equal(
      'pointer',
    );
    expect(
      cursorOf((await mountCard({ config: { tap_action: { action: 'none' } } })).card),
    ).to.not.equal('pointer');
  });

  it('costs one render pass per component when the entity changes', async () => {
    const { card, hass } = await mountCard();

    // The buttons sit behind the toggle, so open it: a component that is not
    // rendered cannot be counted.
    card.toggle = true;
    await settle(card);

    const counts = countRenders([card, ...components(card)]);
    const entity = hass.states[ENTITY_ID];

    hass.states[ENTITY_ID] = {
      ...entity,
      last_updated: new Date('2026-01-01T00:01:00Z').toISOString(),
      attributes: { ...entity.attributes, mode: 'silent', humidity: 60 },
    };

    card.hass = hass;

    // lit resolves this to `false` when an update was requested from inside the
    // update cycle.
    expect(await card.updateComplete).to.be.true;
    await settle(card);

    // Deriving state in `updated()` rather than in `willUpdate()` asks for a
    // second pass over a value that was already known when the first one
    // started. Three components did that until #160, and neither of the two
    // test layers that existed then could say so.
    for (const [element, renders] of counts) {
      expect(renders, element.localName).to.be.at.most(1);
    }
  });
});
