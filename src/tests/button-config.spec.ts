import { Config } from '../models/config';
import { assert, expect } from 'chai';
import { StyleInfo } from 'lit-html/directives/style-map';
import { DropdownConfig, DropdownItem, ElementType, ExecutionContext, Primitive } from '../types';
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
      state: 'test_state',
      button: {
        icon: {
          template: '(state) => state',
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
          template: '(state) => state',
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

    { buttonId: 'test', button: { type: 'dropdown' }, expected: { exists: true, hide: false } },
    { buttonId: 'test', button: { type: 'dropdown', hide: 1 }, expected: { exists: false } },
    { buttonId: 'test', button: { type: 'dropdown', hide: 0 }, expected: { exists: true, hide: false } },
    { buttonId: 'test', button: { type: 'dropdown', hide: true }, expected: { exists: false } },
    { buttonId: 'test', button: { type: 'dropdown', hide: false }, expected: { exists: false, hide: false } },
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

    { buttonId: 'test', button: { type: 'dropdown' }, expected: ACTION_TIMEOUT },
    { buttonId: 'test', button: { type: 'dropdown', action_timeout: 1 }, expected: 1 },
    { buttonId: 'test', button: { type: 'dropdown', action_timeout: 0 }, expected: 0 },
    { buttonId: 'test', button: { type: 'dropdown', action_timeout: true }, expected: ACTION_TIMEOUT },
    { buttonId: 'test', button: { type: 'dropdown', action_timeout: 'string' }, expected: ACTION_TIMEOUT },
    { buttonId: 'test', button: { type: 'dropdown', action_timeout: -1 }, expected: ACTION_TIMEOUT },
  ];

  buttonActionTimeoutTestSource.forEach(function(test) {
    it(`button.action_timeout: ${JSON.stringify(test.button)}`, () => {
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

  const buttonRawTestSource = [
    { buttonId: 'test', button: {} },
    { buttonId: 'test', button: { hide: false, order: 10, test_prop: 12 } },
    { buttonId: 'test', button: { hide: false, icon: 'mdi:test' } },
  ];

  buttonRawTestSource.forEach(function(test) {
    it(`button.raw: ${JSON.stringify(test.button)}`, () => {
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        indicators: {},
      };

      rawConfig.indicators[test.buttonId] = test.button;

      const config = new Config(rawConfig);
      const button = config.indicators.find(i => i.id === test.buttonId);

      expect(button?.raw).to.deep.equals(test.button);
    });
  });

  const buttonStyleTestSource = [
    { buttonId: 'test', state: true, button: {}, expected: {} },
    {
      buttonId: 'test',
      state: 10,
      button: {
        style: (state): StyleInfo => ({ state: state }),
      },
      expected: {
        state: 10,
      },
    },
    {
      buttonId: 'test',
      state: 10,
      button: {
        style: (): StyleInfo => ({ color: 'red' }),
      },
      expected: {
        color: 'red',
      },
    },
  ];

  buttonStyleTestSource.forEach(function(test) {
    it(`button.style:`, () => {
      const rawConfig = {
        entity: 'fan.test',
        model: 'empty',
        buttons: {},
      };

      rawConfig.buttons[test.buttonId] = test.button;

      const config = new Config(rawConfig);
      const button = config.buttons.find(i => i.id === test.buttonId);

      const contextMock: ExecutionContext = mock<ExecutionContext>();
      const context: ExecutionContext = instance(contextMock);

      assert.isDefined(button?.style);
      const style = button?.style(test.state, context);

      expect(style).to.deep.equals(test.expected);
    });
  });

  const buttonDisabledTestSource = [
    { buttonId: 'test', state: true, button: {}, expected: false },
    { buttonId: 'test', state: false, button: {}, expected: false },
    {
      buttonId: 'test',
      state: 10,
      button: {
        disabled: (state): boolean => state > 10,
      },
      expected: false,
    },
    {
      buttonId: 'test',
      state: 10,
      button: {
        disabled: '(state) => state > 10',
      },
      expected: false,
    },
    {
      buttonId: 'test',
      state: 11,
      button: {
        disabled: (state): boolean => state > 10,
      },
      expected: true,
    },
    {
      buttonId: 'test',
      state: 11,
      button: {
        disabled: '(state) => state > 10',
      },
      expected: true,
    },
  ];

  buttonDisabledTestSource.forEach(function(test) {
    it(`button.disabled: ${test.button.disabled} state:${test.state} expected:${test.expected}`, () => {
      const rawConfig = {
        entity: 'fan.test',
        model: 'empty',
        buttons: {},
      };

      rawConfig.buttons[test.buttonId] = test.button;

      const config = new Config(rawConfig);
      const button = config.buttons.find(i => i.id === test.buttonId);

      const contextMock: ExecutionContext = mock<ExecutionContext>();
      const context: ExecutionContext = instance(contextMock);

      assert.isDefined(button?.disabled);
      const disabled = button?.disabled(test.state, context);

      expect(disabled).to.deep.equals(test.expected);
    });
  });

  const buttonLabelTestSource = [
    { buttonId: 'test', state: true, button: {}, expected: undefined },
    { buttonId: 'test', state: false, button: {}, expected: undefined },
    {
      buttonId: 'test',
      state: 10,
      button: {
        label: (state): string | undefined => state?.toString(),
      },
      expected: '10',
    },
    {
      buttonId: 'test',
      state: 10,
      button: {
        label: '(state) => state.toString()',
      },
      expected: '10',
    },
    {
      buttonId: 'test',
      button: {
        label: (): string => 'test_label',
      },
      expected: 'test_label',
    },
    {
      buttonId: 'test',
      state: 11,
      button: {
        label: '() => "test_label"',
      },
      expected: 'test_label',
    },
  ];

  buttonLabelTestSource.forEach(function(test) {
    it(`button.label: ${test.button.label} state:${test.state} expected:${test.expected}`, () => {
      const rawConfig = {
        entity: 'fan.test',
        model: 'empty',
        buttons: {},
      };

      rawConfig.buttons[test.buttonId] = test.button;

      const config = new Config(rawConfig);
      const button = config.buttons.find(i => i.id === test.buttonId);

      const contextMock: ExecutionContext = mock<ExecutionContext>();
      const context: ExecutionContext = instance(contextMock);

      assert.isDefined(button?.label);
      const label = button?.label(test.state, context);

      expect(label).to.deep.equals(test.expected);
    });
  });

  const buttonStateMapperTestSource = [
    { buttonId: 'test', state: true, button: {}, expected: true },
    { buttonId: 'test', state: false, button: {}, expected: false },
    { buttonId: 'test', state: 10, button: {}, expected: 10 },
    {
      buttonId: 'test',
      state: 10,
      button: {
        state: {
          mapper: (state): Primitive => (state > 10 ? 'on' : 'off'),
        },
      },
      expected: 'off',
    },
    {
      buttonId: 'test',
      state: 11,
      button: {
        state: {
          mapper: (state): Primitive => (state > 10 ? 'on' : 'off'),
        },
      },
      expected: 'on',
    },
  ];

  buttonStateMapperTestSource.forEach(function(test) {
    it(`button.state.mapper: ${test.button?.state?.mapper} state:${test.state} expected:${test.expected}`, () => {
      const rawConfig = {
        entity: 'fan.test',
        model: 'empty',
        buttons: {},
      };

      rawConfig.buttons[test.buttonId] = test.button;

      const config = new Config(rawConfig);
      const button = config.buttons.find(i => i.id === test.buttonId);

      const contextMock: ExecutionContext = mock<ExecutionContext>();
      const context: ExecutionContext = instance(contextMock);

      assert.isDefined(button?.stateMapper);
      const state = button?.stateMapper(test.state, context);

      expect(state).to.deep.equals(test.expected);
    });
  });

  const dropdownMapperTestSource = [
    {
      buttonId: 'test',
      button: {},
      expected: undefined,
    },
    {
      buttonId: 'test',
      button: {
        source: ['item1', 'item2', 'item3'],
      },
      expected: undefined,
    },
    {
      buttonId: 'test',
      button: {
        type: 'dropdown',
        source: {
          item1: 'name_item1',
          item2: 'name_item2',
        },
      },
      expected: [
        { id: 'item1', name: 'name_item1', order: 0 },
        { id: 'item2', name: 'name_item2', order: 1 },
      ],
    },
    {
      buttonId: 'test',
      button: {
        type: 'dropdown',
        source: {
          item1: { name: 'name_item1', order: 2 },
          item2: { name: 'name_item2', order: 10, test_pro: 'test' },
        },
      },
      expected: [
        { id: 'item1', name: 'name_item1', order: 2 },
        { id: 'item2', name: 'name_item2', order: 10, test_pro: 'test' },
      ],
    },
  ];

  dropdownMapperTestSource.forEach(function(test) {
    it(`button.source:`, () => {
      const rawConfig = {
        entity: 'fan.test',
        model: 'empty',
        buttons: {},
      };

      rawConfig.buttons[test.buttonId] = test.button;

      const config = new Config(rawConfig);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const button = config.buttons.find(i => i.id === test.buttonId) as any;

      expect(button.source).to.deep.equals(test.expected);
    });
  });

  const dropdownSourceFilterTestSource = [
    {
      buttonId: 'test',
      button: {
        type: 'dropdown',
        source: {
          item1: 'name_item1',
          item2: 'name_item2',
        },
      },
      expected: [
        { id: 'item1', name: 'name_item1', order: 0 },
        { id: 'item2', name: 'name_item2', order: 1 },
      ],
    },
    {
      buttonId: 'test',
      button: {
        type: 'dropdown',
        source: {
          item1: { name: 'name_item1', order: 2 },
          item2: { name: 'name_item2', order: 10, test_pro: 'test' },
        },
      },
      expected: [
        { id: 'item1', name: 'name_item1', order: 2 },
        { id: 'item2', name: 'name_item2', order: 10, test_pro: 'test' },
      ],
    },
    {
      buttonId: 'test',
      button: {
        type: 'dropdown',
        source: {
          item1: { name: 'name_item1', order: 2 },
          item2: { name: 'name_item2', order: 10, test_pro: 'test' },
          __filter: (source: DropdownItem[]): DropdownItem[] => {
            return source;
          },
        },
      },
      expected: [
        { id: 'item1', name: 'name_item1', order: 2 },
        { id: 'item2', name: 'name_item2', order: 10, test_pro: 'test' },
      ],
    },
    {
      buttonId: 'test',
      button: {
        type: 'dropdown',
        source: {
          item1: { name: 'name_item1', order: 2 },
          item2: { name: 'name_item2', order: 10, test_pro: 'test' },
          __filter: (source: DropdownItem[]): DropdownItem[] => {
            return source.filter(i => i.id === 'item1');
          },
        },
      },
      expected: [{ id: 'item1', name: 'name_item1', order: 2 }],
    },
  ];

  dropdownSourceFilterTestSource.forEach(function(test) {
    it(`button.source.__filter:`, () => {
      const rawConfig = {
        entity: 'fan.test',
        model: 'empty',
        buttons: {},
      };

      rawConfig.buttons[test.buttonId] = test.button;

      const config = new Config(rawConfig);
      const dropdown = config.buttons.find(i => i.id === test.buttonId) as DropdownConfig;

      assert.isDefined(dropdown.sourceFilter);

      const contextMock: ExecutionContext = mock<ExecutionContext>();
      const context: ExecutionContext = instance(contextMock);

      const result = dropdown.sourceFilter(dropdown.source, context);

      expect(result).to.deep.equals(test.expected);
    });
  });

  const buttonActiveTestSource = [
    { buttonId: 'test', state: true, button: { type: 'dropdown' }, expected: false },
    { buttonId: 'test', state: false, button: { type: 'dropdown' }, expected: false },
    {
      buttonId: 'test',
      state: 10,
      button: {
        type: 'dropdown',
        active: (state): boolean => state > 10,
      },
      expected: false,
    },
    {
      buttonId: 'test',
      state: 11,
      button: {
        type: 'dropdown',
        active: (state): boolean => state > 10,
      },
      expected: true,
    },
  ];

  buttonActiveTestSource.forEach(function(test) {
    it(`button.active: ${test.button.active?.toString()} state:${test.state} expected:${test.expected}`, () => {
      const rawConfig = {
        entity: 'fan.test',
        model: 'empty',
        buttons: {},
      };

      rawConfig.buttons[test.buttonId] = test.button;

      const config = new Config(rawConfig);
      const dropdown = config.buttons.find(i => i.id === test.buttonId) as DropdownConfig;

      const contextMock: ExecutionContext = mock<ExecutionContext>();
      const context: ExecutionContext = instance(contextMock);

      assert.isDefined(dropdown?.active);
      const disabled = dropdown?.active(test.state, context);

      expect(disabled).to.deep.equals(test.expected);
    });
  });
});
