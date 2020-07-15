import { Config } from '../models/config';
import { assert, expect } from 'chai';
import { ExecutionContext, Primitive, TapAction } from '../types';
import { instance, mock } from 'ts-mockito';
import { StyleInfo } from 'lit-html/directives/style-map';

describe('indicator-config', () => {
  it('indicator.id', () => {
    const indicatorId = 'test_indicator';
    const rawConfig = {
      entity: 'fan.xiaomi_miio_device',
      model: 'empty',
      indicators: {},
    };
    rawConfig.indicators[indicatorId] = {};
    const config = new Config(rawConfig);

    assert.isTrue(config.indicators.length === 1);
    expect(config.indicators[0].id).to.equal(indicatorId);
  });

  const indicatorRoundSource = [
    { indicatorId: 'test', indicator: {}, expected: undefined },
    { indicatorId: 'test', indicator: { round: 1 }, expected: 1 },
    { indicatorId: 'test', indicator: { round: 0 }, expected: 0 },
    { indicatorId: 'test', indicator: { round: -1 }, expected: undefined },
    { indicatorId: 'test', indicator: { round: '1' }, expected: undefined },
  ];

  indicatorRoundSource.forEach(function(test) {
    it(`indicator.round: ${JSON.stringify(test.indicator.round)}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        indicators: {},
      };

      rawConfig.indicators[test.indicatorId] = test.indicator;
      const config = new Config(rawConfig);
      const indicator = config.indicators.find(i => i.id === test.indicatorId);
      if (!indicator) assert.fail('indicator not set');

      expect(indicator.round).to.equal(test.expected);
    });
  });

  const indicatorFixedSource = [
    { indicatorId: 'test', indicator: {}, expected: undefined },
    { indicatorId: 'test', indicator: { fixed: 1 }, expected: 1 },
    { indicatorId: 'test', indicator: { fixed: 0 }, expected: 0 },
    { indicatorId: 'test', indicator: { fixed: -1 }, expected: undefined },
    { indicatorId: 'test', indicator: { fixed: '1' }, expected: undefined },
  ];

  indicatorFixedSource.forEach(function(test) {
    it(`indicator.fixed: ${JSON.stringify(test.indicator.fixed)}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        indicators: {},
      };

      rawConfig.indicators[test.indicatorId] = test.indicator;
      const config = new Config(rawConfig);
      const indicator = config.indicators.find(i => i.id === test.indicatorId);
      if (!indicator) assert.fail('indicator not set');

      expect(indicator.fixed).to.equal(test.expected);
    });
  });

  const indicatorHideSource = [
    { indicatorId: 'test', indicator: {}, expected: { exists: true, hide: false } },
    { indicatorId: 'test', indicator: { hide: 1 }, expected: { exists: false } },
    { indicatorId: 'test', indicator: { hide: 0 }, expected: { exists: true, hide: false } },
    { indicatorId: 'test', indicator: { hide: true }, expected: { exists: false } },
    { indicatorId: 'test', indicator: { hide: false }, expected: { exists: false, hide: false } },
  ];

  indicatorHideSource.forEach(function(test) {
    it(`indicator.hide: ${JSON.stringify(test.indicator.hide)}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        indicators: {},
      };

      rawConfig.indicators[test.indicatorId] = test.indicator;
      const config = new Config(rawConfig);
      const indicator = config.indicators.find(i => i.id === test.indicatorId);

      if (!indicator) {
        if (test.expected.exists) {
          assert.fail('indicator not set');
        }
      } else {
        expect(indicator.hide).to.equal(test.expected.hide);
      }
    });
  });

  const indicatorOrderSource = [
    { indicators: {}, expected: [] },
    {
      indicators: { test1: {}, test2: {} },
      expected: [
        { id: 'test1', order: 0 },
        { id: 'test2', order: 1 },
      ],
    },
    {
      indicators: { test1: {}, test2: { order: 10 } },
      expected: [
        { id: 'test1', order: 0 },
        { id: 'test2', order: 10 },
      ],
    },
    {
      indicators: { test: { order: '123' } },
      expected: [{ id: 'test', order: 0 }],
    },
    {
      indicators: { test: { order: undefined } },
      expected: [{ id: 'test', order: 0 }],
    },
  ];

  indicatorOrderSource.forEach(function(test) {
    it(`indicator.order: ${JSON.stringify(test.indicators)}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        indicators: test.indicators,
      };

      const config = new Config(rawConfig);
      const result = config.indicators.map(i => ({ id: i.id, order: i.order }));

      expect(result).to.deep.equals(test.expected);
    });
  });

  const indicatorRawSource = [
    { indicatorId: 'test', indicator: {} },
    { indicatorId: 'test', indicator: { hide: false, order: 10, test_prop: 12 } },
    { indicatorId: 'test', indicator: { hide: false, round: 1, order: 2 } },
  ];

  indicatorRawSource.forEach(function(test) {
    it(`indicator.raw: ${JSON.stringify(test.indicator)}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        indicators: {},
      };

      rawConfig.indicators[test.indicatorId] = test.indicator;

      const config = new Config(rawConfig);
      const indicator = config.indicators.find(i => i.id === test.indicatorId);

      expect(indicator?.raw).to.deep.equals(test.indicator);
    });
  });

  const indicatorUnitSource = [
    { indicatorId: 'test', state: 10, indicator: {}, expected: { unit: undefined, style: {} } },
    { indicatorId: 'test', state: undefined, indicator: { unit: '°C' }, expected: { unit: '°C', style: {} } },
    {
      indicatorId: 'test',
      state: 'test_state',
      indicator: {
        unit: {
          template: (state): string | undefined => state?.toString(),
        },
      },
      expected: { unit: 'test_state', style: {} },
    },
    {
      indicatorId: 'test',
      state: undefined,
      indicator: {
        unit: {
          template: (state): string | undefined => state?.toString(),
        },
      },
      expected: { unit: undefined, style: {} },
    },
    {
      indicatorId: 'test',
      state: undefined,
      indicator: {
        unit: {
          style: (state): StyleInfo => ({ state: state?.toString() }),
        },
      },
      expected: { unit: undefined, style: { state: undefined } },
    },
    {
      indicatorId: 'test',
      state: 'test_state',
      indicator: {
        unit: {
          style: (state): StyleInfo => ({ state: state?.toString() }),
        },
      },
      expected: { unit: undefined, style: { state: 'test_state' } },
    },
  ];

  indicatorUnitSource.forEach(function(test) {
    it(`indicator.unit: ${JSON.stringify(test.indicator)}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        indicators: {},
      };

      rawConfig.indicators[test.indicatorId] = test.indicator;

      const config = new Config(rawConfig);
      const indicator = config.indicators.find(i => i.id === test.indicatorId);
      if (!indicator) assert.fail('indicator not set');
      assert.isDefined(indicator.unit);

      const contextMock: ExecutionContext = mock<ExecutionContext>();
      const context: ExecutionContext = instance(contextMock);
      const unit = indicator.unit.template(test.state, context);
      const style = indicator.unit.style(test.state, context);

      expect(unit).to.equals(test.expected.unit);
      expect(style).to.deep.equals(test.expected.style);
    });
  });

  const indicatorIconSource = [
    { indicatorId: 'test', state: 10, indicator: {}, expected: { icon: undefined, style: {} } },
    { indicatorId: 'test', state: undefined, indicator: { icon: 'mdi:t' }, expected: { icon: 'mdi:t', style: {} } },
    {
      indicatorId: 'test',
      state: 'test_state',
      indicator: {
        icon: {
          template: (state): string | undefined => state?.toString(),
        },
      },
      expected: { icon: 'test_state', style: {} },
    },
    {
      indicatorId: 'test',
      state: undefined,
      indicator: {
        icon: {
          template: (state): string | undefined => state?.toString(),
        },
      },
      expected: { icon: undefined, style: {} },
    },
    {
      indicatorId: 'test',
      state: undefined,
      indicator: {
        icon: {
          style: (state): StyleInfo => ({ state: state?.toString() }),
        },
      },
      expected: { icon: undefined, style: { state: undefined } },
    },
    {
      indicatorId: 'test',
      state: 'test_state',
      indicator: {
        icon: {
          style: (state): StyleInfo => ({ state: state?.toString() }),
        },
      },
      expected: { icon: undefined, style: { state: 'test_state' } },
    },
  ];

  indicatorIconSource.forEach(function(test) {
    it('indicator.icon:', () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        indicators: {},
      };

      rawConfig.indicators[test.indicatorId] = test.indicator;

      const config = new Config(rawConfig);
      const indicator = config.indicators.find(i => i.id === test.indicatorId);
      if (!indicator) assert.fail('indicator not set');
      assert.isDefined(indicator.icon);

      const contextMock: ExecutionContext = mock<ExecutionContext>();
      const context: ExecutionContext = instance(contextMock);
      const icon = indicator.icon.template(test.state, context);
      const style = indicator.icon.style(test.state, context);

      expect(icon).to.equals(test.expected.icon);
      expect(style).to.deep.equals(test.expected.style);
    });
  });

  const indicatorStateSource = [
    { entity: 'fan.t', indicatorId: 'test', indicator: {}, expected: { entity: 'fan.t', attribute: undefined } },
    {
      entity: 'fan.t',
      indicatorId: 'test',
      indicator: { state: 'fan.t2' },
      expected: { entity: 'fan.t2', attribute: undefined },
    },
    {
      entity: 'fan.t',
      indicatorId: 'test',
      indicator: { state: 'aqi' },
      expected: { entity: 'fan.t', attribute: 'aqi' },
    },
    {
      entity: 'fan.t',
      indicatorId: 'test',
      indicator: { state: { entity: 'fan.t2' } },
      expected: { entity: 'fan.t2', attribute: undefined },
    },
    {
      entity: 'fan.t',
      indicatorId: 'test',
      indicator: { state: { attribute: 'temperature' } },
      expected: { entity: 'fan.t', attribute: 'temperature' },
    },
  ];

  indicatorStateSource.forEach(function(test) {
    it(`indicator.state: ${JSON.stringify(test.indicator)}`, () => {
      const rawConfig = {
        entity: test.entity,
        model: 'empty',
        indicators: {},
      };

      rawConfig.indicators[test.indicatorId] = test.indicator;

      const config = new Config(rawConfig);
      const indicator = config.indicators.find(i => i.id === test.indicatorId);

      expect(indicator?.state).to.deep.equals(test.expected);
    });
  });

  const indicatorStateMapperSource = [
    {
      indicatorId: 'test',
      state: 'current_state',
      indicator: {},
      expected: 'current_state',
    },
    {
      indicatorId: 'test',
      state: undefined,
      indicator: {
        state: {
          mapper: (): Primitive => 10,
        },
      },
      expected: 10,
    },
    {
      indicatorId: 'test',
      state: 10,
      indicator: {
        state: {
          mapper: (): Primitive => 'custom_data',
        },
      },
      expected: 'custom_data',
    },
  ];

  indicatorStateMapperSource.forEach(function(test) {
    it('indicator.state.mapper', () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        indicators: {},
      };

      rawConfig.indicators[test.indicatorId] = test.indicator;
      const config = new Config(rawConfig);
      const indicator = config.indicators.find(i => i.id === test.indicatorId);
      if (!indicator) assert.fail('indicator not set');

      const contextMock: ExecutionContext = mock<ExecutionContext>();
      const context: ExecutionContext = instance(contextMock);

      assert.isDefined(indicator.stateMapper);

      const result = indicator.stateMapper(test.state, context);

      expect(result).to.equal(test.expected);
    });
  });

  const indicatorTapActionSource = [
    { entity: 'fan.t', indicatorId: 'test', indicator: {}, expected: { entity: 'fan.t', action: TapAction.None } },
    {
      entity: 'fan.t',
      indicatorId: 'test',
      indicator: { tap_action: 'unknown' },
      expected: { entity: 'fan.t', action: TapAction.None },
    },
    {
      entity: 'fan.t',
      indicatorId: 'test',
      indicator: { tap_action: 'more-info' },
      expected: { entity: 'fan.t', action: TapAction.MoreInfo },
    },
    {
      entity: 'fan.t',
      indicatorId: 'test',
      indicator: { state: 'sensor.temperature', tap_action: 'more-info' },
      expected: { entity: 'sensor.temperature', action: TapAction.MoreInfo },
    },
    {
      entity: 'fan.t',
      indicatorId: 'test',
      indicator: {
        state: 'sensor.temperature',
        tap_action: {
          action: 'more-info',
        },
      },
      expected: { entity: 'sensor.temperature', action: TapAction.MoreInfo },
    },
    {
      entity: 'fan.t',
      indicatorId: 'test',
      indicator: {
        state: 'sensor.temperature',
        tap_action: {
          action: 'navigate',
          navigation_path: '/lovelace/5',
        },
      },
      expected: { entity: 'sensor.temperature', action: TapAction.Navigate, navigationPath: '/lovelace/5' },
    },
  ];

  indicatorTapActionSource.forEach(function(test) {
    it('indicator.tap_action', () => {
      const rawConfig = {
        entity: test.entity,
        model: 'empty',
        indicators: {},
      };

      rawConfig.indicators[test.indicatorId] = test.indicator;
      const config = new Config(rawConfig);
      const indicator = config.indicators.find(i => i.id === test.indicatorId);
      if (!indicator) assert.fail('indicator not set');

      expect(indicator.tapAction).to.deep.equal(test.expected);
    });
  });

  it('empty indicator', () => {
    const rawConfig = {
      entity: 'fan.t',
      model: 'empty',
      indicators: {
        undefined_indicator: undefined,
        null_indicator: null,
        number_indicator: 10,
        string_indicator: 'indicator',
      },
    };

    const config = new Config(rawConfig);
    expect(config.indicators.length).to.equal(0);
  });
});
