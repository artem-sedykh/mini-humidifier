import { Config } from '../models/config';
import { assert, expect } from 'chai';
import { StyleInfo } from 'lit-html/directives/style-map';
import { ExecutionContext } from '../types';
import { instance, mock } from 'ts-mockito';

describe('power-button-config', () => {
  it('id', () => {
    const rawConfig = {
      entity: 'fan.xiaomi_miio_device',
      model: 'empty',
    };
    const config = new Config(rawConfig);

    expect(config.power.id).to.equal('power');
  });

  const powerButtonIconTestSource = [
    { state: 10, power: {}, expected: { icon: undefined, style: {} } },
    { state: undefined, power: { icon: 'mdi:t' }, expected: { icon: 'mdi:t', style: {} } },
    {
      state: 'test_state',
      power: {
        icon: {
          template: (state): string | undefined => state?.toString(),
        },
      },
      expected: { icon: 'test_state', style: {} },
    },
    {
      state: 'test_state',
      power: {
        icon: {
          template: '(state) => state',
        },
      },
      expected: { icon: 'test_state', style: {} },
    },
    {
      state: undefined,
      power: {
        icon: {
          template: (state): string | undefined => state?.toString(),
        },
      },
      expected: { icon: undefined, style: {} },
    },
    {
      state: undefined,
      power: {
        icon: {
          template: '(state) => state',
        },
      },
      expected: { icon: undefined, style: {} },
    },
    {
      state: undefined,
      power: {
        icon: {
          style: (state): StyleInfo => ({ state: state?.toString() }),
        },
      },
      expected: { icon: undefined, style: { state: undefined } },
    },
    {
      state: 'test_state',
      power: {
        icon: {
          style: (state): StyleInfo => ({ state: state?.toString() }),
        },
      },
      expected: { icon: undefined, style: { state: 'test_state' } },
    },
  ];

  powerButtonIconTestSource.forEach(function(test) {
    it('icon:', () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        power: test.power,
      };

      const config = new Config(rawConfig);
      const button = config.power;
      if (!button) assert.fail('button not set');
      assert.isDefined(button.icon);

      const contextMock: ExecutionContext = mock<ExecutionContext>();
      const context: ExecutionContext = instance(contextMock);
      const icon = button.icon.template(test.state, context);
      const style = button.icon.style(test.state, context);

      expect(icon).to.equals(test.expected.icon);
      expect(style).to.deep.equals(test.expected.style);
    });
  });

  const powerButtonTypeTestSource = [
    { power: {}, expected: 'button' },
    { power: { type: 'button' }, expected: 'button' },
    { power: { type: 'test' }, expected: 'button' },
    { power: 'button', expected: 'button' },
    { power: 'any', expected: 'button' },
    { power: 'toggle', expected: 'toggle' },
    { power: { type: 'toggle' }, expected: 'toggle' },
  ];

  powerButtonTypeTestSource.forEach(function(test) {
    it('type:', () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        power: test.power,
      };
      const config = new Config(rawConfig);
      expect(config.power.type).to.deep.equals(test.expected);
    });
  });
});
