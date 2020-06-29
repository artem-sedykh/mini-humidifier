import { Config } from '../models/config';
import { assert, expect } from 'chai';
import { Indicator } from '../models/indicator';
import { instance, mock, when } from 'ts-mockito';
import { HomeAssistant } from 'custom-card-helpers/dist';
import { HassEntity } from 'home-assistant-js-websocket';

describe('indicator-model', () => {
  const indicatorStateTestSource = [
    { indicator: {}, entity_state: 'test', expected: 'test' },
    { indicator: { round: 1 }, entity_state: '1.123', expected: 1.1 },
    { indicator: { round: 1 }, entity_state: '1.163', expected: 1.2 },
    { indicator: { fixed: 1 }, entity_state: '1.163', expected: '1.2' },
    { indicator: { fixed: 2 }, entity_state: '1.163', expected: '1.16' },
    { indicator: { fixed: 2 }, entity_state: '1', expected: '1.00' },
    { indicator: { fixed: 2 }, entity_state: 'on', expected: 'on' },
  ];

  indicatorStateTestSource.forEach(function(test) {
    it('indicator.state', () => {
      const indicatorId = 'test';
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        indicators: {},
      };
      rawConfig.indicators[indicatorId] = test.indicator;
      const config = new Config(rawConfig);

      assert.isTrue(config.indicators.length === 1);
      const indicator = config.indicators.find(i => i.id === indicatorId);
      if (!indicator) assert.fail('indicator not set');
      const entityId = config.entity;

      const entityMock: HassEntity = mock<HassEntity>();
      when(entityMock.state).thenReturn(test.entity_state?.toString());
      when(entityMock.entity_id).thenReturn(entityId);
      const entity: HassEntity = instance(entityMock);

      const states = {};
      states[entityId] = entity;
      const hassMock: HomeAssistant = mock<HomeAssistant>();
      when(hassMock.states).thenReturn(states);
      const hass: HomeAssistant = instance(hassMock);

      expect(hass.states[entityId]).to.deep.equal(entity);
      const model = new Indicator(hass, indicator, entity);
      expect(model.state).to.equal(test.expected);
    });
  });
});
