import { expect } from '@open-wc/testing';
import { PaperSlider } from './helpers/sliders.js';
import { mountTargetHumidity } from './helpers/slider.js';

// HA 2022.11 - 2023.10.
describe('a paper-slider ha-slider', () => {
  it('gets the layout the two older generations need', async () => {
    const { row, slider } = await mountTargetHumidity(PaperSlider);

    expect(row.classList.contains('legacy')).to.be.true;
    expect(row.classList.contains('wa')).to.be.false;

    // paper-slider's own attributes: a value bubble on the thumb, and touches
    // on the bar ignored so a drag does not jump.
    expect(slider.hasAttribute('pin')).to.be.true;
    expect(slider.hasAttribute('ignore-bar-touch')).to.be.true;
  });
});
