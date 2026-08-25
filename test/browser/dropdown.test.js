import { aTimeout, expect } from '@open-wc/testing';
import { components, mountCard, settle } from './helpers/card.js';
import { ENTITY_ID } from './helpers/hass.js';

const base = (card, id) => {
  const dropdown = components(card).find(
    component => component.localName === 'mh-dropdown' && component.dropdown.id === id,
  );

  return dropdown.shadowRoot.querySelector('mh-dropdown-base');
};

const items = element => [...element.shadowRoot.querySelectorAll('.mh-dropdown__item')];

const values = element => items(element).map(option => option.dataset.value);

// What the menu says has focus. Compared by value rather than by element,
// because a failed assertion on a DOM node has to be serialised back to the
// test runner, and a DOM node is a circular structure: the run hangs instead of
// reporting the failure.
const focused = element => {
  const option = element.shadowRoot.activeElement;

  if (!option) return null;

  return option.dataset.value || option.localName;
};

// Opens the buttons panel and one dropdown's menu, and hands back both.
const openDropdown = async (card, id) => {
  card.toggle = true;
  await settle(card);

  const element = base(card, id);

  element.shadowRoot.querySelector('ha-icon-button').click();
  await element.updateComplete;

  return { base: element, items: items(element) };
};

const pick = async (options, value) => {
  options.find(option => option.dataset.value === value).click();
  await aTimeout(50);
};

describe('picking an item from a dropdown', () => {
  it('sends the command once', async () => {
    // Counted, not reasoned about. The card has twice been blamed for sending a
    // command more than once - a humidifier that beeped three times per mode
    // change - and both explanations argued from the code were wrong. See
    // "Counting service calls" in AGENTS.md.
    const { card, hass } = await mountCard();
    const { base: element, items: options } = await openDropdown(card, 'mode');

    let changes = 0;
    element.addEventListener('change', () => {
      changes += 1;
    });

    await pick(options, 'silent');

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
    const { items: options } = await openDropdown(card, 'mode');

    await pick(options, 'auto');

    expect(hass.calls).to.be.empty;
  });

  it('sends the command of the dropdown it was picked from', async () => {
    // The two dropdowns of this model act on different entities through
    // different services, and the same component renders both.
    const { card, hass } = await mountCard();
    const { items: options } = await openDropdown(card, 'led');

    await pick(options, 'off');

    expect(hass.calls).to.deep.equal([
      {
        domain: 'select',
        service: 'select_option',
        options: { entity_id: 'select.bedroom_led_brightness', option: 'off' },
      },
    ]);
  });

  it('closes the menu behind it', async () => {
    const { card } = await mountCard();
    const { base: element, items: options } = await openDropdown(card, 'mode');

    await pick(options, 'silent');

    expect(values(element)).to.be.empty;
  });
});

describe('the dropdown menu', () => {
  it('is not in the page until it is opened', async () => {
    const { card } = await mountCard();

    card.toggle = true;
    await settle(card);

    const element = base(card, 'mode');

    expect(values(element)).to.be.empty;

    element.shadowRoot.querySelector('ha-icon-button').click();
    await element.updateComplete;

    expect(values(element)).to.deep.equal(['auto', 'silent', 'medium', 'high']);
  });

  it('marks the current option and opens on it', async () => {
    const { card } = await mountCard();
    const { base: element, items: options } = await openDropdown(card, 'mode');
    const selected = options
      .filter(option => option.getAttribute('aria-selected') === 'true')
      .map(option => option.dataset.value);

    // The entity is in auto, so that is the option the keyboard starts on.
    expect(selected).to.deep.equal(['auto']);
    expect(focused(element)).to.equal('auto');
  });

  it('closes on escape and gives the button back the focus', async () => {
    const { card } = await mountCard();
    const { base: element } = await openDropdown(card, 'mode');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await element.updateComplete;

    expect(values(element)).to.be.empty;
    expect(focused(element)).to.equal('ha-icon-button');
  });

  it('closes when something else on the page is pressed', async () => {
    const { card } = await mountCard();
    const { base: element } = await openDropdown(card, 'mode');

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await element.updateComplete;

    expect(values(element)).to.be.empty;
  });

  it('stays open when the press was inside it', async () => {
    const { card } = await mountCard();
    const { base: element, items: options } = await openDropdown(card, 'mode');

    options[1].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    await element.updateComplete;

    expect(values(element)).to.have.lengthOf(4);
  });

  it('moves the focus with the arrow keys', async () => {
    const { card } = await mountCard();
    const { base: element } = await openDropdown(card, 'mode');

    // Asserted rather than assumed, because everything below reads through
    // `shadowRoot.activeElement`: a browser that never landed the focus would
    // otherwise fail somewhere further down, as whatever that read happens to
    // produce, instead of here as the thing that actually went wrong.
    expect(focused(element), 'no option had the focus when the menu opened').to.equal('auto');

    // `handleKeydown` moves the focus synchronously, so there is nothing to
    // wait for between presses. Waiting a frame each time made this the slowest
    // test in the file for no reason.
    const press = key =>
      element.shadowRoot.activeElement.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, composed: true }),
      );

    press('ArrowDown');
    expect(focused(element)).to.equal('silent');

    press('ArrowUp');
    expect(focused(element)).to.equal('auto');

    // Off the top and round to the bottom. Four modes make that cheap; a list
    // of forty makes it necessary.
    press('ArrowUp');
    expect(focused(element)).to.equal('high');

    press('Home');
    expect(focused(element)).to.equal('auto');

    press('End');
    expect(focused(element)).to.equal('high');
  });

  it('stays usable when the browser refuses to show it as a popover', async () => {
    // `popover="manual"` is on the menu from the moment it renders, and an
    // engine that honours the attribute keeps such an element `display: none`
    // until `showPopover` puts it in the top layer. So a refused call does not
    // leave the menu un-layered, it leaves it invisible - and an uncaught throw
    // took the positioning and the dismissal handlers with it.
    //
    // Both halves are asserted here: that the menu can still be seen, and that
    // escape still closes it.
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'showPopover');
    Object.defineProperty(HTMLElement.prototype, 'showPopover', {
      configurable: true,
      writable: true,
      value() {
        throw new DOMException('refused', 'InvalidStateError');
      },
    });

    try {
      const { card } = await mountCard();
      const { base: element } = await openDropdown(card, 'mode');
      const menu = element.shadowRoot.getElementById('menu');
      const anchor = element.shadowRoot.querySelector('ha-icon-button').getBoundingClientRect();
      const box = menu.getBoundingClientRect();

      expect(menu.hasAttribute('popover'), 'kept claiming to be a popover').to.be.false;
      expect(box.width, 'the menu was not visible').to.be.greaterThan(0);
      expect(Math.round(box.right)).to.equal(Math.round(anchor.right));

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await element.updateComplete;

      expect(values(element), 'escape did not close it').to.be.empty;
    } finally {
      if (original) Object.defineProperty(HTMLElement.prototype, 'showPopover', original);
      else delete HTMLElement.prototype.showPopover;
    }
  });

  it('opens with its right edge on the button', async () => {
    // The card clips its own overflow, so the menu is positioned by hand
    // against the button rather than laid out under it.
    const { card } = await mountCard();
    const { base: element } = await openDropdown(card, 'mode');
    const anchor = element.shadowRoot.querySelector('ha-icon-button').getBoundingClientRect();
    const menu = element.shadowRoot.getElementById('menu').getBoundingClientRect();

    expect(Math.round(menu.right)).to.equal(Math.round(anchor.right));
    expect(Math.round(menu.top)).to.equal(Math.round(anchor.top));
    expect(menu.bottom).to.be.at.most(window.innerHeight);
  });

  it('flips above the button when there is no room below it', async () => {
    const { card } = await mountCard();
    const { base: element } = await openDropdown(card, 'mode');

    // Measure first, then put the button that far from the bottom of the
    // window: a menu of four modes is taller than what is left below it.
    const height = element.shadowRoot.getElementById('menu').getBoundingClientRect().height;
    const anchor = element.shadowRoot.querySelector('ha-icon-button').getBoundingClientRect();

    element.close();
    await element.updateComplete;

    card.style.marginTop = `${window.innerHeight - anchor.bottom - height / 2}px`;

    element.shadowRoot.querySelector('ha-icon-button').click();
    await element.updateComplete;

    const moved = element.shadowRoot.querySelector('ha-icon-button').getBoundingClientRect();
    const menu = element.shadowRoot.getElementById('menu').getBoundingClientRect();

    expect(Math.round(menu.bottom)).to.equal(Math.round(moved.bottom));
    expect(menu.top).to.be.lessThan(moved.top);
    expect(menu.top).to.be.at.least(0);
  });

  it('sends nothing when it is dismissed rather than used', async () => {
    const { card, hass } = await mountCard();
    const { base: element } = await openDropdown(card, 'mode');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await element.updateComplete;

    expect(hass.calls).to.be.empty;
  });
});
