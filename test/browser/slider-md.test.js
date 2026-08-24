import { expect } from '@open-wc/testing';
import { MdSlider } from './helpers/sliders.js';
import { mountTargetHumidity } from './helpers/slider.js';

// HA 2023.11 - 2025.9.
describe('a @material/web ha-slider', () => {
  it('gets the same layout as paper-slider', async () => {
    const { row } = await mountTargetHumidity(MdSlider);

    // The middle generation is the reason the detection asks about WebAwesome's
    // own properties rather than about paper-slider's: MdSlider has neither,
    // and sizes itself the same way its predecessor did.
    expect(row.classList.contains('legacy')).to.be.true;
    expect(row.classList.contains('wa')).to.be.false;
  });
});
