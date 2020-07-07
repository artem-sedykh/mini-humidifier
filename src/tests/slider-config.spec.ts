import { Config } from '../models/config';
import { assert, expect } from 'chai';
import { ACTION_TIMEOUT } from '../const';
import { ExecutionContext, Primitive } from '../types';
import { anyString, anything, instance, mock, verify, when } from 'ts-mockito';

describe('slider-config', () => {
  const sliderMinMaxStepTestSource = [
    { slider: { min: 10, step: 10, max: 90 }, expected: { min: 10, step: 10, max: 90 } },
    { slider: { min: 40, step: 10, max: 90 }, expected: { min: 40, step: 10, max: 90 } },
    { slider: { min: '40', step: 10, max: 90 }, expected: { min: 30, step: 10, max: 90 } },
    { slider: { min: '40', step: '20', max: 'test' }, expected: { min: 30, step: 10, max: 80 } },
    { slider: {}, expected: { min: 30, step: 10, max: 80 } },
  ];

  sliderMinMaxStepTestSource.forEach(function(test) {
    it('slider[min, max, step]:', () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        slider: test.slider,
      };

      const config = new Config(rawConfig);
      const sliderConfig = config.slider;
      assert.isDefined(sliderConfig);

      expect({
        min: sliderConfig.min,
        max: sliderConfig.max,
        step: sliderConfig.step,
      }).to.deep.equal(test.expected);
    });
  });

  const sliderStateTestSource = [
    { entity: 'fan.t', slider: {}, expected: { entity: 'fan.t', attribute: undefined } },
    {
      entity: 'fan.t',
      slider: { state: 'fan.t2' },
      expected: { entity: 'fan.t2', attribute: undefined },
    },
    {
      entity: 'fan.t',
      slider: { state: 'attribute' },
      expected: { entity: 'fan.t', attribute: 'attribute' },
    },
    {
      entity: 'fan.t',
      slider: { state: { entity: 'fan.t2' } },
      expected: { entity: 'fan.t2', attribute: undefined },
    },
    {
      entity: 'fan.t',
      slider: { state: { attribute: 'temperature' } },
      expected: { entity: 'fan.t', attribute: 'temperature' },
    },
  ];

  sliderStateTestSource.forEach(function(test) {
    it(`slider.state: ${JSON.stringify(test.slider)}`, () => {
      const rawConfig = {
        entity: test.entity,
        model: 'empty',
        slider: test.slider,
      };

      const config = new Config(rawConfig);

      expect(config.slider?.state).to.deep.equals(test.expected);
    });
  });

  const sliderActionTimeoutTestSource = [
    { slider: {}, expected: ACTION_TIMEOUT },
    { slider: { action_timeout: 1 }, expected: 1 },
    { slider: { action_timeout: 0 }, expected: 0 },
    { slider: { action_timeout: true }, expected: ACTION_TIMEOUT },
    { slider: { action_timeout: 'string' }, expected: ACTION_TIMEOUT },
    { slider: { action_timeout: -1 }, expected: ACTION_TIMEOUT },
  ];

  sliderActionTimeoutTestSource.forEach(function(test) {
    it(`slider.action_timeout: ${JSON.stringify(test.slider)}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        slider: test.slider,
      };

      const config = new Config(rawConfig);
      const slider = config.slider;
      if (!slider) assert.fail('button not set');
      expect(slider.actionTimeout).to.equal(test.expected);
    });
  });

  const sliderHideTestSource = [
    { slider: {}, expected: false },
    { slider: { hide: true }, expected: true },
    { slider: { hide: false }, expected: false },
    { slider: { hide: 1 }, expected: true },
    { slider: { hide: 'string' }, expected: true },
    { slider: { hide: 0 }, expected: false },
  ];

  sliderHideTestSource.forEach(function(test) {
    it(`slider.hide: ${JSON.stringify(test.slider)}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        slider: test.slider,
      };

      const config = new Config(rawConfig);
      const slider = config.slider;
      if (!slider) assert.fail('button not set');
      expect(slider.hide).to.equal(test.expected);
    });
  });

  const sliderDisabledTestSource = [
    { slider: {}, expected: false },
    {
      slider: {
        disabled: (): boolean => true,
      },
      expected: true,
    },
    {
      slider: {
        disabled: '() => true',
      },
      expected: true,
    },
    {
      state: 10,
      slider: {
        disabled: (state): boolean => state > 10,
      },
      expected: false,
    },
    {
      state: 10,
      slider: {
        disabled: '(state) => state > 10',
      },
      expected: false,
    },
    {
      state: 11,
      slider: {
        disabled: (state): boolean => state > 10,
      },
      expected: true,
    },
    {
      state: 11,
      slider: {
        disabled: '(state) => state > 10',
      },
      expected: true,
    },
  ];

  sliderDisabledTestSource.forEach(function(test) {
    it(`slider.disabled: ${JSON.stringify(test.slider.disabled?.toString())}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        slider: test.slider,
      };

      const config = new Config(rawConfig);
      const slider = config.slider;
      if (!slider) assert.fail('button not set');

      const contextMock: ExecutionContext = mock<ExecutionContext>();
      const context: ExecutionContext = instance(contextMock);

      const disabled = slider.disabled(test.state, context);
      expect(disabled).to.equal(test.expected);
    });
  });

  const sliderStateMapperTestSource = [
    { state: 10, slider: {}, expected: 10 },
    { state: 1, slider: {}, expected: 1 },
    {
      state: 30,
      slider: {
        state: {
          mapper: (state): number => state,
        },
      },
      expected: 30,
    },
    {
      state: 30,
      slider: {
        state: {
          mapper: (state): number => state + 20,
        },
      },
      expected: 50,
    },
    {
      state: 30,
      slider: {
        state: {
          mapper: '(state) => state + 20',
        },
      },
      expected: 50,
    },
  ];

  sliderStateMapperTestSource.forEach(function(test) {
    it(`slider.state.mapper: ${JSON.stringify(test.slider?.state?.mapper?.toString())}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        slider: test.slider,
      };

      const config = new Config(rawConfig);
      const slider = config.slider;
      if (!slider) assert.fail('button not set');

      const contextMock: ExecutionContext = mock<ExecutionContext>();
      const context: ExecutionContext = instance(contextMock);

      const state = slider.stateMapper(test.state, context);
      expect(state).to.equal(test.expected);
    });
  });

  it('slider.change_action', () => {
    const rawConfig = {
      entity: 'fan.xiaomi_miio_device',
      model: 'empty',
      slider: {
        change_action: (_state: Primitive, context: ExecutionContext): Promise<void> => {
          return context.call_service('test_domain', 'test_service');
        },
      },
    };

    const config = new Config(rawConfig);
    const slider = config.slider;
    if (!slider) assert.fail('button not set');

    const contextMock: ExecutionContext = mock<ExecutionContext>();
    when(contextMock.call_service(anyString(), anyString(), anything())).thenReturn(
      new Promise<void>(() => {
        return;
      }),
    );

    const context: ExecutionContext = instance(contextMock);

    slider.change(10, context);

    verify(contextMock.call_service('test_domain', 'test_service')).once();
  });
});
