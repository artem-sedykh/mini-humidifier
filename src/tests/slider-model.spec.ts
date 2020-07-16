import { Config } from '../models/config';
import { HassEntity } from 'home-assistant-js-websocket';
import { instance, mock, when } from 'ts-mockito';
import { HomeAssistant } from 'custom-card-helpers/dist';
import { expect, assert } from 'chai';
import { Slider } from '../models/slider';
import { ACTION_TIMEOUT } from '../const';
import { Primitive } from '../types';

describe('slider-model', () => {
  const sliderTestSource = [
    {
      slider: {
        min: 30,
        max: 80,
        step: 10,
      },
      state: 50,
      attributes: {},
      selectedLanguage: '',
      language: '',
      expected: {
        hide: false,
        actionTimeout: ACTION_TIMEOUT,
        min: 30,
        max: 80,
        step: 10,
        state: 50,
        disabled: false,
      },
    },
    {
      slider: {
        min: 30,
        max: 80,
        step: 10,
        disabled: (): boolean => true,
        state: {
          mapper: (state, context): Primitive => {
            return context.localize(`test_${state}`, state);
          },
        },
      },
      state: 50,
      attributes: {},
      selectedLanguage: '',
      language: '',
      expected: {
        hide: false,
        actionTimeout: ACTION_TIMEOUT,
        min: 30,
        max: 80,
        step: 10,
        state: 50,
        disabled: true,
      },
    },
  ];

  sliderTestSource.forEach(function(test) {
    it('slider', () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        slider: {},
      };
      rawConfig.slider = test.slider;

      const config = new Config(rawConfig);

      const entityId = config.entity;
      const entityMock: HassEntity = mock<HassEntity>();
      when(entityMock.state).thenReturn(test.state?.toString() || '');
      when(entityMock.entity_id).thenReturn(entityId);
      when(entityMock.attributes).thenReturn(test.attributes);
      const entity: HassEntity = instance(entityMock);

      const states = {};
      states[entityId] = entity;
      const hassMock: HomeAssistant = mock<HomeAssistant>();
      when(hassMock.states).thenReturn(states);
      when(hassMock.selectedLanguage).thenReturn(test.selectedLanguage || '');
      when(hassMock.language).thenReturn(test.language || '');
      const hass: HomeAssistant = instance(hassMock);

      const sliderConfig = config.slider;
      const slider = new Slider(hass, sliderConfig, entity);

      expect(slider.hass).to.equal(hass);
      expect(slider.entity).to.equal(entity);
      expect(slider.hide).to.equal(test.expected.hide);
      expect(slider.actionTimeout).to.equal(test.expected.actionTimeout);
      expect(slider.min).to.equal(test.expected.min);
      expect(slider.max).to.equal(test.expected.max);
      expect(slider.step).to.equal(test.expected.step);
      expect(slider.state).to.equal(test.expected.state);
      expect(slider.disabled).to.equal(test.expected.disabled);
      assert.isDefined(slider.indicator);
      assert.isFunction(slider.change);
    });
  });
});
