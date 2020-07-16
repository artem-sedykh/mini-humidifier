import { Config } from '../models/config';
import { SliderIndicator } from '../models/slider-indicator';
import { HassEntity } from 'home-assistant-js-websocket';
import { instance, mock, when } from 'ts-mockito';
import { HomeAssistant } from 'custom-card-helpers/dist';
import { expect } from 'chai';

describe('slider-indicator-model', () => {
  const sliderIndicatorTestSource = [
    {
      slider: {
        indicator: {},
      },
      state: 10,
      value: 10,
      attributes: {},
      selectedLanguage: '',
      language: '',
      expected: {
        getValue: 10,
      },
    },
    {
      slider: {
        indicator: {
          fixed: 2,
        },
      },
      state: 10,
      value: 10.1111,
      attributes: {},
      selectedLanguage: '',
      language: '',
      expected: {
        getValue: '10.11',
      },
    },
    {
      slider: {
        indicator: {
          round: 2,
        },
      },
      state: 10,
      value: 10.1111,
      attributes: {},
      selectedLanguage: '',
      language: '',
      expected: {
        getValue: 10.11,
      },
    },
    {
      slider: {
        indicator: {
          round: 2,
        },
      },
      state: 10,
      value: undefined,
      attributes: {},
      selectedLanguage: '',
      language: '',
      expected: {
        getValue: undefined,
      },
    },
    {
      slider: {
        indicator: {
          round: 2,
        },
      },
      state: 10,
      value: null,
      attributes: {},
      selectedLanguage: '',
      language: '',
      expected: {
        getValue: null,
      },
    },
    {
      slider: {
        indicator: {
          round: 2,
        },
      },
      state: 10,
      value: 'test',
      attributes: {},
      selectedLanguage: '',
      language: '',
      expected: {
        getValue: 'test',
      },
    },
  ];

  sliderIndicatorTestSource.forEach(function(test) {
    it('slider-indicator', () => {
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
      const sliderIndicator = new SliderIndicator(hass, sliderConfig.indicator, entity);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const val: any = test.value;
      expect(sliderIndicator.getValue(val)).to.equal(test.expected.getValue, 'getValue not equals');
    });
  });
});
