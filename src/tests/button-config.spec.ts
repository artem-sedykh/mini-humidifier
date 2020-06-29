import { Config } from '../models/config';
import { assert, expect } from 'chai';
import { StyleInfo } from 'lit-html/directives/style-map';
import { ElementType, ExecutionContext } from '../types';
import { instance, mock } from 'ts-mockito';
import { ACTION_TIMEOUT } from '../const';

describe('button-config', () => {
  it('button.id', () => {
    const buttonId = 'test_button';
    const rawConfig = {
      entity: 'fan.xiaomi_miio_device',
      model: 'empty',
      buttons: {},
    };
    rawConfig.buttons[buttonId] = {};
    const config = new Config(rawConfig);

    expect(config.buttons.length).to.equal(1);
    expect(config.buttons[0].id).to.equal(buttonId);
  });

  const buttonIconTestSource = [
    { buttonId: 'test', state: 10, button: {}, expected: { icon: undefined, style: {} } },
    { buttonId: 'test', state: undefined, button: { icon: 'mdi:t' }, expected: { icon: 'mdi:t', style: {} } },
    {
      buttonId: 'test',
      state: 'test_state',
      button: {
        icon: {
          template: (state): string | undefined => state?.toString(),
        },
      },
      expected: { icon: 'test_state', style: {} },
    },
    {
      buttonId: 'test',
      state: undefined,
      button: {
        icon: {
          template: (state): string | undefined => state?.toString(),
        },
      },
      expected: { icon: undefined, style: {} },
    },
    {
      buttonId: 'test',
      state: undefined,
      button: {
        icon: {
          style: (state): StyleInfo => ({ state: state?.toString() }),
        },
      },
      expected: { icon: undefined, style: { state: undefined } },
    },
    {
      buttonId: 'test',
      state: 'test_state',
      button: {
        icon: {
          style: (state): StyleInfo => ({ state: state?.toString() }),
        },
      },
      expected: { icon: undefined, style: { state: 'test_state' } },
    },
  ];

  buttonIconTestSource.forEach(function(test) {
    it('button.icon:', () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        buttons: {},
      };

      rawConfig.buttons[test.buttonId] = test.button;

      const config = new Config(rawConfig);
      const button = config.buttons.find(i => i.id === test.buttonId);
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

  const buttonOrderTestSource = [
    { buttons: {}, expected: [] },
    {
      buttons: { test1: {}, test2: {} },
      expected: [
        { id: 'test1', order: 0 },
        { id: 'test2', order: 1 },
      ],
    },
    {
      buttons: { test1: {}, test2: { order: 10 } },
      expected: [
        { id: 'test1', order: 0 },
        { id: 'test2', order: 10 },
      ],
    },
    {
      buttons: { test: { order: '123' } },
      expected: [{ id: 'test', order: 0 }],
    },
    {
      buttons: { test: { order: undefined } },
      expected: [{ id: 'test', order: 0 }],
    },
  ];

  buttonOrderTestSource.forEach(function(test) {
    it(`button.order: ${JSON.stringify(test.buttons)}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        buttons: test.buttons,
      };

      const config = new Config(rawConfig);
      const result = config.buttons.map(i => ({ id: i.id, order: i.order }));

      expect(result).to.deep.equals(test.expected);
    });
  });

  const buttonHideTestSource = [
    { buttonId: 'test', button: {}, expected: { exists: true, hide: false } },
    { buttonId: 'test', button: { hide: 1 }, expected: { exists: false } },
    { buttonId: 'test', button: { hide: 0 }, expected: { exists: true, hide: false } },
    { buttonId: 'test', button: { hide: true }, expected: { exists: false } },
    { buttonId: 'test', button: { hide: false }, expected: { exists: false, hide: false } },
  ];

  buttonHideTestSource.forEach(function(test) {
    it(`button.hide: ${JSON.stringify(test.button.hide)}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        buttons: {},
      };

      rawConfig.buttons[test.buttonId] = test.button;
      const config = new Config(rawConfig);
      const button = config.buttons.find(i => i.id === test.buttonId);

      if (!button) {
        if (test.expected.exists) {
          assert.fail('indicator not set');
        }
      } else {
        expect(button.hide).to.equal(test.expected.hide);
      }
    });
  });

  const buttonActionTimeoutTestSource = [
    { buttonId: 'test', button: {}, expected: ACTION_TIMEOUT },
    { buttonId: 'test', button: { action_timeout: 1 }, expected: 1 },
    { buttonId: 'test', button: { action_timeout: 0 }, expected: 0 },
    { buttonId: 'test', button: { action_timeout: true }, expected: ACTION_TIMEOUT },
    { buttonId: 'test', button: { action_timeout: 'string' }, expected: ACTION_TIMEOUT },
    { buttonId: 'test', button: { action_timeout: -1 }, expected: ACTION_TIMEOUT },
  ];

  buttonActionTimeoutTestSource.forEach(function(test) {
    it(`button.hide: ${JSON.stringify(test.button)}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        buttons: {},
      };

      rawConfig.buttons[test.buttonId] = test.button;
      const config = new Config(rawConfig);
      const button = config.buttons.find(i => i.id === test.buttonId);
      if (!button) assert.fail('button not set');
      expect(button.actionTimeout).to.equal(test.expected);
    });
  });

  const buttonElementTypeTestSource = [
    { buttonId: 'test', button: {}, expected: ElementType.Button },
    { buttonId: 'test', button: { type: 'button' }, expected: ElementType.Button },
    { buttonId: 'test', button: { type: 'unknown' }, expected: ElementType.Button },
    { buttonId: 'test', button: { type: 'dropdown' }, expected: ElementType.Dropdown },
  ];

  buttonElementTypeTestSource.forEach(function(test) {
    it(`button.elementType: ${JSON.stringify(test.button)}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        buttons: {},
      };

      rawConfig.buttons[test.buttonId] = test.button;
      const config = new Config(rawConfig);
      const button = config.buttons.find(i => i.id === test.buttonId);
      expect(button?.elementType).to.equal(test.expected);
    });
  });

  const buttonStateTestSource = [
    { entity: 'fan.t', buttonId: 'test', button: {}, expected: { entity: 'fan.t', attribute: undefined } },
    {
      entity: 'fan.t',
      buttonId: 'test',
      button: { state: 'fan.t2' },
      expected: { entity: 'fan.t2', attribute: undefined },
    },
    {
      entity: 'fan.t',
      buttonId: 'test',
      button: { state: { entity: 'fan.t2' } },
      expected: { entity: 'fan.t2', attribute: undefined },
    },
    {
      entity: 'fan.t',
      buttonId: 'test',
      button: { state: { attribute: 'temperature' } },
      expected: { entity: 'fan.t', attribute: 'temperature' },
    },
  ];

  buttonStateTestSource.forEach(function(test) {
    it(`button.state: ${JSON.stringify(test.button)}`, () => {
      const rawConfig = {
        entity: test.entity,
        model: 'empty',
        buttons: {},
      };

      rawConfig.buttons[test.buttonId] = test.button;

      const config = new Config(rawConfig);
      const button = config.buttons.find(i => i.id === test.buttonId);

      expect(button?.state).to.deep.equals(test.expected);
    });
  });
});
