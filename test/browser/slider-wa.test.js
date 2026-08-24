import { expect } from '@open-wc/testing';
import { WebAwesomeSlider } from './helpers/sliders.js';
import { mountTargetHumidity } from './helpers/slider.js';

// HA 2025.10 and newer.
describe('a WebAwesome ha-slider', () => {
  it('gets the layout that centres the track in the row', async () => {
    const { row, slider } = await mountTargetHumidity(WebAwesomeSlider);

    // Laid out like the older two, the 4px track packs to the top of the column
    // and lands on the entity name instead of in the middle of the row.
    expect(row.classList.contains('wa')).to.be.true;
    expect(row.classList.contains('legacy')).to.be.false;

    // paper-slider's attributes are not passed on: they mean nothing here, and
    // the value has to stay a property, because on this element the `value`
    // attribute sets `defaultValue` and stops moving the thumb once it has been
    // dragged.
    expect(slider.hasAttribute('pin')).to.be.false;
    expect(slider.hasAttribute('ignore-bar-touch')).to.be.false;
    expect(slider.hasAttribute('value')).to.be.false;
    expect(slider.value).to.equal(50);
  });
});
