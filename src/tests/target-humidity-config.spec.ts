import { Config } from '../models/config';
import { assert, expect } from 'chai';
import { ACTION_TIMEOUT } from '../const';
import { ExecutionContext, Primitive } from '../types';
import { anyString, anything, instance, mock, verify, when } from 'ts-mockito';

describe('target-humidity-config', () => {
  const targetHumidityMinMaxStepTestSource = [
    { target_humidity: { min: 10, step: 10, max: 90 }, expected: { min: 10, step: 10, max: 90 } },
    { target_humidity: { min: 40, step: 10, max: 90 }, expected: { min: 40, step: 10, max: 90 } },
    { target_humidity: { min: '40', step: 10, max: 90 }, expected: { min: 30, step: 10, max: 90 } },
    { target_humidity: { min: '40', step: '20', max: 'test' }, expected: { min: 30, step: 10, max: 80 } },
    { target_humidity: {}, expected: { min: 30, step: 10, max: 80 } },
  ];

  targetHumidityMinMaxStepTestSource.forEach(function(test) {
    it('target_humidity[min, max, step]:', () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        target_humidity: test.target_humidity,
      };

      const config = new Config(rawConfig);
      const targetHumidityConfig = config.targetHumidity;
      assert.isDefined(targetHumidityConfig);

      expect({
        min: targetHumidityConfig.min,
        max: targetHumidityConfig.max,
        step: targetHumidityConfig.step,
      }).to.deep.equal(test.expected);
    });
  });

  const targetHumidityStateTestSource = [
    { entity: 'fan.t', target_humidity: {}, expected: { entity: 'fan.t', attribute: undefined } },
    {
      entity: 'fan.t',
      target_humidity: { state: 'fan.t2' },
      expected: { entity: 'fan.t2', attribute: undefined },
    },
    {
      entity: 'fan.t',
      target_humidity: { state: { entity: 'fan.t2' } },
      expected: { entity: 'fan.t2', attribute: undefined },
    },
    {
      entity: 'fan.t',
      target_humidity: { state: { attribute: 'temperature' } },
      expected: { entity: 'fan.t', attribute: 'temperature' },
    },
  ];

  targetHumidityStateTestSource.forEach(function(test) {
    it(`target_humidity.state: ${JSON.stringify(test.target_humidity)}`, () => {
      const rawConfig = {
        entity: test.entity,
        model: 'empty',
        target_humidity: test.target_humidity,
      };

      const config = new Config(rawConfig);

      expect(config.targetHumidity?.state).to.deep.equals(test.expected);
    });
  });

  const targetHumidityActionTimeoutTestSource = [
    { target_humidity: {}, expected: ACTION_TIMEOUT },
    { target_humidity: { action_timeout: 1 }, expected: 1 },
    { target_humidity: { action_timeout: 0 }, expected: 0 },
    { target_humidity: { action_timeout: true }, expected: ACTION_TIMEOUT },
    { target_humidity: { action_timeout: 'string' }, expected: ACTION_TIMEOUT },
    { target_humidity: { action_timeout: -1 }, expected: ACTION_TIMEOUT },
  ];

  targetHumidityActionTimeoutTestSource.forEach(function(test) {
    it(`target_humidity.action_timeout: ${JSON.stringify(test.target_humidity)}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        target_humidity: test.target_humidity,
      };

      const config = new Config(rawConfig);
      const targetHumidity = config.targetHumidity;
      if (!targetHumidity) assert.fail('button not set');
      expect(targetHumidity.actionTimeout).to.equal(test.expected);
    });
  });

  const targetHumidityHideTestSource = [
    { target_humidity: {}, expected: false },
    { target_humidity: { hide: true }, expected: true },
    { target_humidity: { hide: false }, expected: false },
    { target_humidity: { hide: 1 }, expected: true },
    { target_humidity: { hide: 'string' }, expected: true },
    { target_humidity: { hide: 0 }, expected: false },
  ];

  targetHumidityHideTestSource.forEach(function(test) {
    it(`target_humidity.hide: ${JSON.stringify(test.target_humidity)}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        target_humidity: test.target_humidity,
      };

      const config = new Config(rawConfig);
      const targetHumidity = config.targetHumidity;
      if (!targetHumidity) assert.fail('button not set');
      expect(targetHumidity.hide).to.equal(test.expected);
    });
  });

  const targetHumidityDisabledTestSource = [
    { target_humidity: {}, expected: false },
    {
      target_humidity: {
        disabled: (): boolean => true,
      },
      expected: true,
    },
    {
      state: 10,
      target_humidity: {
        disabled: (state): boolean => state > 10,
      },
      expected: false,
    },
    {
      state: 11,
      target_humidity: {
        disabled: (state): boolean => state > 10,
      },
      expected: true,
    },
  ];

  targetHumidityDisabledTestSource.forEach(function(test) {
    it(`target_humidity.disabled: ${JSON.stringify(test.target_humidity.disabled?.toString())}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        target_humidity: test.target_humidity,
      };

      const config = new Config(rawConfig);
      const targetHumidity = config.targetHumidity;
      if (!targetHumidity) assert.fail('button not set');

      const contextMock: ExecutionContext = mock<ExecutionContext>();
      const context: ExecutionContext = instance(contextMock);

      const disabled = targetHumidity.disabled(test.state, context);
      expect(disabled).to.equal(test.expected);
    });
  });

  const targetHumidityStateMapperTestSource = [
    { state: 10, target_humidity: {}, expected: 10 },
    { state: 1, target_humidity: {}, expected: 1 },
    {
      state: 30,
      target_humidity: {
        state: {
          mapper: (state): number => state,
        },
      },
      expected: 30,
    },
    {
      state: 30,
      target_humidity: {
        state: {
          mapper: (state): number => state + 20,
        },
      },
      expected: 50,
    },
  ];

  targetHumidityStateMapperTestSource.forEach(function(test) {
    it(`target_humidity.state.mapper: ${JSON.stringify(test.target_humidity?.state?.mapper?.toString())}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        target_humidity: test.target_humidity,
      };

      const config = new Config(rawConfig);
      const targetHumidity = config.targetHumidity;
      if (!targetHumidity) assert.fail('button not set');

      const contextMock: ExecutionContext = mock<ExecutionContext>();
      const context: ExecutionContext = instance(contextMock);

      const state = targetHumidity.stateMapper(test.state, context);
      expect(state).to.equal(test.expected);
    });
  });

  it('target_humidity.change_action', () => {
    const rawConfig = {
      entity: 'fan.xiaomi_miio_device',
      model: 'empty',
      target_humidity: {
        change_action: (_state: Primitive, context: ExecutionContext): Promise<void> => {
          return context.call_service('test_domain', 'test_service');
        },
      },
    };

    const config = new Config(rawConfig);
    const targetHumidity = config.targetHumidity;
    if (!targetHumidity) assert.fail('button not set');

    const contextMock: ExecutionContext = mock<ExecutionContext>();
    when(contextMock.call_service(anyString(), anyString(), anything())).thenReturn(
      new Promise<void>(() => {
        return;
      }),
    );

    const context: ExecutionContext = instance(contextMock);

    targetHumidity.change(10, context);

    verify(contextMock.call_service('test_domain', 'test_service')).once();
  });
});
