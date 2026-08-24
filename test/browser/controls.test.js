import { aTimeout, expect } from '@open-wc/testing';
import { components, mountCard, settle } from './helpers/card.js';
import { ENTITY_ID } from './helpers/hass.js';

const shadow = (element, selector) => element.shadowRoot.querySelector(selector);

const button = (card, id) =>
  components(card).find(
    component => component.localName === 'mh-button' && component.button.id === id,
  );

// Every control in this card follows the same shape: act, then hold the value
// the user picked for `action_timeout` before letting the entity state win
// again. Each of these counts the service calls one interaction produces,
// because that shape is where a control repeating itself would hide.
describe('the controls', () => {
  it('sends one command when the slider moves', async () => {
    const { card, hass } = await mountCard();
    const targetHumidity = shadow(card, 'mh-target-humidity');
    const slider = shadow(targetHumidity, 'ha-slider');

    slider.value = 60;
    slider.dispatchEvent(new Event('change'));
    await settle(targetHumidity);

    expect(hass.calls).to.deep.equal([
      {
        domain: 'humidifier',
        service: 'set_humidity',
        options: { entity_id: ENTITY_ID, humidity: 60 },
      },
    ]);

    // The card shows the humidity that was picked, not the one the entity still
    // reports: the state will not come back for as long as the device takes.
    expect(shadow(targetHumidity, '.state__value').textContent.trim()).to.equal('60');
  });

  it('sends one command when the power button is pressed', async () => {
    const { card, hass } = await mountCard();

    shadow(shadow(shadow(card, 'mh-power'), 'mh-button'), 'ha-icon-button').click();
    await aTimeout(50);

    // The entity is on, so the button turns it off.
    expect(hass.calls).to.deep.equal([
      { domain: 'humidifier', service: 'turn_off', options: { entity_id: ENTITY_ID } },
    ]);
  });

  it('sends one command when a toggle button is pressed', async () => {
    const { card, hass } = await mountCard();

    card.toggle = true;
    await settle(card);

    // The buzzer is a switch entity of its own, off, so the button turns it on.
    shadow(button(card, 'buzzer'), 'ha-icon-button').click();
    await aTimeout(50);

    expect(hass.calls).to.deep.equal([
      { domain: 'switch', service: 'turn_on', options: { entity_id: 'switch.bedroom_buzzer' } },
    ]);
  });

  it('opens more-info when the name is clicked', async () => {
    const { card, hass } = await mountCard();

    let events = 0;
    let entityId;

    card.addEventListener('hass-more-info', event => {
      events += 1;
      entityId = event.detail.entityId;
    });

    shadow(card, '.entity__info__name_wrap').click();
    await settle(card);

    expect(events).to.equal(1);
    expect(entityId).to.equal(ENTITY_ID);
    expect(hass.calls).to.be.empty;
  });
});
