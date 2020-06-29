import { assert, expect } from 'chai';
import { instance, mock, when } from 'ts-mockito';
import { HomeAssistant } from 'custom-card-helpers/dist';
import { HassEntity } from 'home-assistant-js-websocket';
import ICON from '../../const';
import { Config } from '../../models/config';
import { Indicator } from '../../models/indicator';

describe('zhimi.humidifier.cb1 indicators', () => {
  const depthTestSource = [
    {
      entityAttrs: { depth: 120 },
      depthConfig: {},
      lng: 'en',
      state: 'on',
      expected: { state: 100, icon: ICON.DEPTH, unit: '%', order: 0 },
    },
    {
      entityAttrs: { depth: 60 },
      depthConfig: {},
      lng: 'en',
      state: 'on',
      expected: { state: 50, icon: ICON.DEPTH, unit: '%', order: 0 },
    },
    {
      entityAttrs: { depth: 300 },
      depthConfig: {},
      lng: 'en',
      state: 'on',
      expected: { state: 100, icon: ICON.DEPTH, unit: '%', order: 0 },
    },
    {
      entityAttrs: { depth: 127 },
      depthConfig: {},
      lng: 'en',
      state: 'on',
      expected: { state: '', icon: ICON.COVER_REMOVED, unit: '', order: 0 },
    },
    {
      entityAttrs: { depth: 11 },
      depthConfig: {},
      lng: 'en',
      state: 'on',
      expected: { state: 9.2, icon: ICON.SHORTAGE_WATER, unit: '%', order: 0 },
    },

    {
      entityAttrs: { depth: 120 },
      depthConfig: { type: 'liters' },
      lng: 'en',
      state: 'on',
      expected: { state: 4, icon: ICON.DEPTH, unit: 'L', order: 0 },
    },
    {
      entityAttrs: { depth: 60 },
      depthConfig: { type: 'liters' },
      lng: 'en',
      state: 'on',
      expected: { state: 2, icon: ICON.DEPTH, unit: 'L', order: 0 },
    },
    {
      entityAttrs: { depth: 300 },
      depthConfig: { type: 'liters' },
      lng: 'en',
      state: 'on',
      expected: { state: 4, icon: ICON.DEPTH, unit: 'L', order: 0 },
    },
    {
      entityAttrs: { depth: 127 },
      depthConfig: { type: 'liters' },
      lng: 'en',
      state: 'on',
      expected: { state: '', icon: ICON.COVER_REMOVED, unit: '', order: 0 },
    },
    {
      entityAttrs: { depth: 11 },
      depthConfig: { type: 'liters' },
      lng: 'en',
      state: 'on',
      expected: { state: 0.4, icon: ICON.SHORTAGE_WATER, unit: 'L', order: 0 },
    },
  ];

  depthTestSource.forEach(function(test) {
    it(`depth: ${
      test.entityAttrs.depth
    }, type: ${test.depthConfig.type}, expected: ${JSON.stringify(test.expected)}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'zhimi.humidifier.cb1',
        indicators: { depth: test.depthConfig },
      };
      const config = new Config(rawConfig);

      const indicator = config.indicators.find(i => i.id === 'depth');

      if (!indicator) assert.fail('indicator not set');
      const entityId = config.entity;

      const entityMock: HassEntity = mock<HassEntity>();
      when(entityMock.state).thenReturn(test.state?.toString());
      when(entityMock.entity_id).thenReturn(entityId);
      when(entityMock.attributes).thenReturn(test.entityAttrs);
      const entity: HassEntity = instance(entityMock);

      const states = {};
      states[entityId] = entity;
      const hassMock: HomeAssistant = mock<HomeAssistant>();
      when(hassMock.states).thenReturn(states);
      when(hassMock.selectedLanguage).thenReturn(test.lng);
      const hass: HomeAssistant = instance(hassMock);

      expect(hass.states[entityId]).to.deep.equal(entity);
      const model = new Indicator(hass, indicator, entity);
      const result = { state: model.state, icon: model.icon, unit: model.unit, order: model.order };

      expect(result).to.deep.equal(test.expected);
    });
  });

  const temperatureTestSource = [
    {
      entityAttrs: { temperature: 10 },
      state: 'on',
      expected: { state: 10, icon: ICON.TEMPERATURE, unit: '°C', order: 1 },
    },
    {
      entityAttrs: { temperature: 24.123 },
      state: 'on',
      expected: { state: 24.1, icon: ICON.TEMPERATURE, unit: '°C', order: 1 },
    },
  ];

  temperatureTestSource.forEach(function(test) {
    it(`temperature: ${test.entityAttrs.temperature}, expected: ${JSON.stringify(test.expected)}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'zhimi.humidifier.cb1',
      };
      const config = new Config(rawConfig);

      const indicator = config.indicators.find(i => i.id === 'temperature');

      if (!indicator) assert.fail('indicator not set');
      const entityId = config.entity;

      const entityMock: HassEntity = mock<HassEntity>();
      when(entityMock.state).thenReturn(test.state?.toString());
      when(entityMock.entity_id).thenReturn(entityId);
      when(entityMock.attributes).thenReturn(test.entityAttrs);
      const entity: HassEntity = instance(entityMock);

      const states = {};
      states[entityId] = entity;
      const hassMock: HomeAssistant = mock<HomeAssistant>();
      when(hassMock.states).thenReturn(states);
      when(hassMock.selectedLanguage).thenReturn('en');
      const hass: HomeAssistant = instance(hassMock);

      expect(hass.states[entityId]).to.deep.equal(entity);
      const model = new Indicator(hass, indicator, entity);
      const result = { state: model.state, icon: model.icon, unit: model.unit, order: model.order };

      expect(result).to.deep.equal(test.expected);
    });
  });

  const humidityTestSource = [
    {
      entityAttrs: { humidity: 10 },
      state: 'on',
      expected: { state: 10, icon: ICON.HUMIDITY, unit: '%', order: 2 },
    },
    {
      entityAttrs: { humidity: 24.123 },
      state: 'on',
      expected: { state: 24.1, icon: ICON.HUMIDITY, unit: '%', order: 2 },
    },
  ];

  humidityTestSource.forEach(function(test) {
    it(`humidity: ${test.entityAttrs.humidity}, expected: ${JSON.stringify(test.expected)}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'zhimi.humidifier.cb1',
      };
      const config = new Config(rawConfig);

      const indicator = config.indicators.find(i => i.id === 'humidity');

      if (!indicator) assert.fail('indicator not set');
      const entityId = config.entity;

      const entityMock: HassEntity = mock<HassEntity>();
      when(entityMock.state).thenReturn(test.state?.toString());
      when(entityMock.entity_id).thenReturn(entityId);
      when(entityMock.attributes).thenReturn(test.entityAttrs);
      const entity: HassEntity = instance(entityMock);

      const states = {};
      states[entityId] = entity;
      const hassMock: HomeAssistant = mock<HomeAssistant>();
      when(hassMock.states).thenReturn(states);
      when(hassMock.selectedLanguage).thenReturn('en');
      const hass: HomeAssistant = instance(hassMock);

      expect(hass.states[entityId]).to.deep.equal(entity);
      const model = new Indicator(hass, indicator, entity);
      const result = { state: model.state, icon: model.icon, unit: model.unit, order: model.order };

      expect(result).to.deep.equal(test.expected);
    });
  });
});
