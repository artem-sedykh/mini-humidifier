import { expect } from 'chai';
import { localize } from '../localize/localize';

describe('localize', () => {
  it('get_led_brightness', () => {
    const translatedEn = localize('zhimi_humidifier_cb1.led_brightness.0', 'en', 'fallback');
    const translatedRu = localize('zhimi_humidifier_cb1.led_brightness.0', 'ru', 'fallback');

    expect(translatedEn).to.equal('Bright');
    expect(translatedRu).to.equal('Ярко');
  });

  it('fallback', () => {
    expect(localize('zhimi_humidifier_cb1.led_brightness.0', 'test_len', 'fallback')).to.equal('fallback');
    expect(localize('zhimi_humidifier_cb1.led_brightness', 'en', 'fallback')).to.equal('fallback');
    expect(localize('zhimi_humidifier_cb1.led_brightness.10', 'en', 'fallback')).to.equal('fallback');
    expect(localize('zhimi_humidifier_cb1.led_brightness.10', 'en')).to.equal('unknown');
  });
});
