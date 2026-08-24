import { expect } from '@open-wc/testing';
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
