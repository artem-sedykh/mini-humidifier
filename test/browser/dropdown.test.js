import { aTimeout, expect, nextFrame } from '@open-wc/testing';
import { components, mountCard, settle } from './helpers/card.js';
import { ENTITY_ID } from './helpers/hass.js';

// Opens the buttons panel and hands back one dropdown, along with the list
// items behind its menu.
const openDropdown = async (card, id) => {
  card.toggle = true;
  await settle(card);

  const dropdown = components(card).find(
    component => component.localName === 'mh-dropdown' && component.dropdown.id === id,
  );
  const base = dropdown.shadowRoot.querySelector('mh-dropdown-base');

  base.shadowRoot.querySelector('ha-icon-button').click();
  await nextFrame();

  return { base, items: [...base.shadowRoot.querySelectorAll('mwc-list-item')] };
};

const pick = async (items, value) => {
  items.find(item => item.getAttribute('value') === value).click();
  await aTimeout(50);
};

describe('picking an item from a dropdown', () => {
  it('sends the command once', async () => {
    // Counted, not reasoned about. The card has twice been blamed for sending a
    // command more than once - a humidifier that beeped three times per mode
    // change - and both explanations argued from the code were wrong. See
    // "Counting service calls" in AGENTS.md.
    const { card, hass } = await mountCard();
    const { base, items } = await openDropdown(card, 'mode');

    let changes = 0;
    base.addEventListener('change', () => {
      changes += 1;
    });

    await pick(items, 'silent');

    expect(changes).to.equal(1);
    expect(hass.calls).to.deep.equal([
      {
        domain: 'humidifier',
        service: 'set_mode',
        options: { entity_id: ENTITY_ID, mode: 'silent' },
      },
    ]);
  });

  it('says nothing when the item picked is the one already selected', async () => {
    const { card, hass } = await mountCard();
    const { items } = await openDropdown(card, 'mode');

    await pick(items, 'auto');

    expect(hass.calls).to.be.empty;
  });

  it('sends the command of the dropdown it was picked from', async () => {
    // The two dropdowns of this model act on different entities through
    // different services, and the same component renders both.
    const { card, hass } = await mountCard();
    const { items } = await openDropdown(card, 'led');

    await pick(items, 'off');

    expect(hass.calls).to.deep.equal([
      {
        domain: 'select',
        service: 'select_option',
        options: { entity_id: 'select.bedroom_led_brightness', option: 'off' },
      },
    ]);
  });
});
