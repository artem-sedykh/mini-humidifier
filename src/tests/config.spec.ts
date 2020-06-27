import { Config } from '../config';
import { assert, AssertionError, expect } from 'chai';
import { ButtonConfig, IndicatorConfig, StateConfig, TapAction, TapActionConfig, ToggleButtonConfig } from '../types';
import ICON from '../const';
import { HassEntity } from 'home-assistant-js-websocket';
import { HomeAssistant } from 'custom-card-helpers/dist';

describe('parse config', () => {
  const validationTests = [
    { config: undefined, expected: 'config not defined!' },
    { config: null, expected: 'config not defined!' },
    { config: {}, expected: 'entity not set' },
    { config: { entity: 'entity' }, expected: 'Specify an entity from within the fan domain.' },
    { config: { entity: 123213 }, expected: 'Specify an entity from within the fan domain.' },
    { config: { entity: 'fan.entity' }, valid: true },
  ];

  validationTests.forEach(function(test) {
    it(`raw config: ${JSON.stringify(test.config)}`, () => {
      try {
        new Config(test.config);
        if (test.valid) return;
        assert.fail('expected exception not thrown');
      } catch (e) {
        if (e instanceof AssertionError) {
          throw e;
        }
        assert.equal(e.message, test.expected);
      }
    });
  });

  it('entity', () => {
    const entity = 'fan.xiaomi_miio_device';
    const config = new Config({ entity: entity });
    expect(config.entity).to.equal(entity);
  });

  it('type', () => {
    const entity = 'fan.xiaomi_miio_device';
    const type = 'custom:mini-humidifier';
    const config = new Config({ entity: entity, type: type });
    expect(config.entity).to.equal(entity);
    expect(config.type).to.equal(type);
  });

  it('name', () => {
    const entity = 'fan.xiaomi_miio_device';
    const name = 'humidifier';
    const config = new Config({ entity: entity, name: name });
    expect(config.entity).to.equal(entity);
    expect(config.name).to.equal(name);
  });

  it('icon', () => {
    const entity = 'fan.xiaomi_miio_device';
    const icon = 'mdi:air-filter';
    const config = new Config({ entity: entity, icon: icon });
    expect(config.entity).to.equal(entity);
    expect(config.icon).to.equal(icon);
  });

  it('scale', () => {
    const entity = 'fan.xiaomi_miio_device';

    expect(new Config({ entity: entity }).scale).to.equal(1);
    expect(new Config({ entity: entity, scale: 1.01 }).scale).to.equal(1.01);
    expect(new Config({ entity: entity, scale: 2 }).scale).to.equal(2);
    expect(new Config({ entity: entity, scale: '2' }).scale).to.equal(1);
    expect(new Config({ entity: entity, scale: undefined }).scale).to.equal(1);
    expect(new Config({ entity: entity, scale: null }).scale).to.equal(1);
  });

  const groupTest = [
    { config: { entity: 'fan.xiaomi_miio_device' }, expected: false },
    { config: { entity: 'fan.xiaomi_miio_device', group: true }, expected: true },
    { config: { entity: 'fan.xiaomi_miio_device', group: 123 }, expected: true },
    { config: { entity: 'fan.xiaomi_miio_device', group: 0 }, expected: false },
    { config: { entity: 'fan.xiaomi_miio_device', group: '' }, expected: false },
    { config: { entity: 'fan.xiaomi_miio_device', group: 'str' }, expected: true },
  ];

  groupTest.forEach(function(test) {
    it(`group, config: ${JSON.stringify(test.config)} expected: ${test.expected}`, () => {
      const config = new Config(test.config);
      expect(config.group).to.equal(test.expected);
    });
  });

  const toggleTest = [
    {
      config: { entity: 'fan.t', toggle: false },
      expected: { icon: ICON.TOGGLE, hide: false, default: false } as ToggleButtonConfig,
    },
    {
      config: { entity: 'fan.t', toggle: { icon: 'mdi:test' } },
      expected: { icon: 'mdi:test', hide: false, default: false } as ToggleButtonConfig,
    },
    {
      config: { entity: 'fan.t', toggle: { hide: true } },
      expected: { icon: ICON.TOGGLE, hide: true, default: false } as ToggleButtonConfig,
    },
    {
      config: { entity: 'fan.t', toggle: { default: true } },
      expected: { icon: ICON.TOGGLE, hide: false, default: true } as ToggleButtonConfig,
    },
  ];

  toggleTest.forEach(function(test) {
    it(`toggle, config: ${JSON.stringify(test.config)} expected:${JSON.stringify(test.expected)}`, () => {
      const config = new Config(test.config);
      expect(config.toggle).to.deep.equal(test.expected);
    });
  });

  const tapActionTest = [
    {
      config: { entity: 'fan.t' },
      expected: { action: TapAction.MoreInfo, entity: 'fan.t' } as TapActionConfig,
    },
    {
      config: { entity: 'fan.t', tap_action: 'none' },
      expected: { action: TapAction.None, entity: 'fan.t' } as TapActionConfig,
    },
    {
      config: { entity: 'fan.t', tap_action: 'call-service' },
      expected: { action: TapAction.callService, entity: 'fan.t' } as TapActionConfig,
    },
    {
      config: { entity: 'fan.t', tap_action: 'url' },
      expected: { action: TapAction.Url, entity: 'fan.t' } as TapActionConfig,
    },
    {
      config: { entity: 'fan.t', tap_action: 'navigate' },
      expected: { action: TapAction.Navigate, entity: 'fan.t' } as TapActionConfig,
    },
    {
      config: { entity: 'fan.t', tap_action: 'test' },
      expected: { action: TapAction.MoreInfo, entity: 'fan.t' } as TapActionConfig,
    },
    {
      config: {
        entity: 'fan.t',
        tap_action: {
          action: 'toggle',
          entity: 'test',
          service: 'service',
          url: 'url',
          navigation_path: 'navigation_path',
          service_data: { test: 'test', id: 'id' },
        },
      },
      expected: {
        action: TapAction.Toggle,
        entity: 'test',
        service: 'service',
        url: 'url',
        navigationPath: 'navigation_path',
        serviceData: { test: 'test', id: 'id' },
      } as TapActionConfig,
    },
  ];

  tapActionTest.forEach(function(test) {
    it(`tap_action, config: ${JSON.stringify(test.config)} expected:${JSON.stringify(test.expected)}`, () => {
      const config = new Config(test.config);
      expect(config.tapAction).to.deep.equal(test.expected);
    });
  });

  const indicatorsTest = [
    {
      config: {
        entity: 'fan.t',
        model: 'empty',
        indicators: {
          temperature: {
            unit: '°C',
          },
        },
      },
      expected: {
        id: 'temperature',
        unit: '°C',
        round: undefined,
        hide: false,
        state: { entity: 'fan.t' } as StateConfig,
        tapAction: { action: TapAction.None, entity: 'fan.t' } as TapActionConfig,
      } as IndicatorConfig,
    },
    {
      config: {
        entity: 'fan.t',
        model: 'empty',
        indicators: {
          temperature: {
            unit: '°C',
            source: 'test',
          },
        },
      },
      expected: {
        id: 'temperature',
        unit: '°C',
        round: undefined,
        hide: false,
        state: { entity: 'test' } as StateConfig,
        tapAction: { action: TapAction.None, entity: 'test' } as TapActionConfig,
      } as IndicatorConfig,
    },
    {
      config: {
        entity: 'fan.t',
        model: 'empty',
        indicators: {
          temperature: {
            unit: '°C',
            source: { attribute: 'power' },
          },
        },
      },
      expected: {
        id: 'temperature',
        unit: '°C',
        round: undefined,
        hide: false,
        state: { entity: 'fan.t', attribute: 'power' } as StateConfig,
        tapAction: { action: TapAction.None, entity: 'fan.t' } as TapActionConfig,
      } as IndicatorConfig,
    },
    {
      config: {
        entity: 'fan.t',
        model: 'empty',
        indicators: {
          temperature: {
            unit: '°C',
            source: { entity: 'entity', attribute: 'power' },
          },
        },
      },
      expected: {
        id: 'temperature',
        unit: '°C',
        round: undefined,
        hide: false,
        state: { entity: 'entity', attribute: 'power' } as StateConfig,
        tapAction: { action: TapAction.None, entity: 'entity' } as TapActionConfig,
      } as IndicatorConfig,
    },
  ];

  indicatorsTest.forEach(function(test) {
    it(`indicator, config: ${JSON.stringify(test.config)} expected:${JSON.stringify(test.expected)}`, () => {
      const config = new Config(test.config);
      const indicator = config.indicators[0];
      expect(indicator).to.deep.include(test.expected);
    });
  });

  const indicatorIconTemplateTest = [
    {
      config: {
        entity: 'fan.t',
        model: 'empty',
        indicators: {
          temperature: {
            unit: '°C',
            icon: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              template: (value, entity, humidifier_entity): any => [value, entity, humidifier_entity],
            },
          },
        },
      },
      templateArguments: {
        value: 'value',
        entity: { entity_id: 'entity' } as HassEntity,
        humidifier_entity: { entity_id: 'humidifier_entity' } as HassEntity,
      },
      expected: ['value', { entity_id: 'entity' } as HassEntity, { entity_id: 'humidifier_entity' } as HassEntity],
    },
    {
      config: {
        entity: 'fan.t',
        model: 'empty',
        indicators: {
          temperature: {
            unit: '°C',
            icon: {
              template: '(value, entity, humidifier_entity) => [value, entity, humidifier_entity]',
            },
          },
        },
      },
      templateArguments: {
        value: 'value',
        entity: { entity_id: 'entity' } as HassEntity,
        humidifier_entity: { entity_id: 'humidifier_entity' } as HassEntity,
      },
      expected: ['value', { entity_id: 'entity' } as HassEntity, { entity_id: 'humidifier_entity' } as HassEntity],
    },
    {
      name: 'execution context testing',
      config: {
        entity: 'fan.t',
        model: 'empty',
        indicators: {
          temperature: {
            unit: '°C',
            icon: {
              template: '() => this',
            },
          },
        },
      },
      templateArguments: {
        value: 'value',
        entity: { entity_id: 'entity' } as HassEntity,
        humidifier_entity: { entity_id: 'humidifier_entity' } as HassEntity,
      },
      expected: {
        unit: '°C',
        icon: {
          template: '() => this',
        },
      },
    },
    {
      name: 'string icon test',
      config: {
        entity: 'fan.t',
        model: 'empty',
        indicators: {
          temperature: {
            unit: '°C',
            icon: 'mdi:thermometer-low',
          },
        },
      },
      templateArguments: {
        value: 'value',
        entity: { entity_id: 'entity' } as HassEntity,
        humidifier_entity: { entity_id: 'humidifier_entity' } as HassEntity,
      },
      expected: 'mdi:thermometer-low',
    },
  ];

  indicatorIconTemplateTest.forEach(function(test) {
    it(`icon template, config: ${JSON.stringify(test.config)} expected:${JSON.stringify(test.expected)}`, () => {
      const config = new Config(test.config);
      const indicator = config.indicators[0];
      const args = test.templateArguments;
      const template = indicator.icon.template(args.value, args.entity, args.humidifier_entity);
      expect(template).to.deep.equals(test.expected);
    });
  });

  const indicatorIconStyleTest = [
    {
      config: {
        entity: 'fan.t',
        model: 'empty',
        indicators: {
          temperature: {
            unit: '°C',
            icon: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              style: (value, entity, humidifier_entity): any => [value, entity, humidifier_entity],
            },
          },
        },
      },
      styleArguments: {
        value: 'value',
        entity: { entity_id: 'entity' } as HassEntity,
        humidifier_entity: { entity_id: 'humidifier_entity' } as HassEntity,
      },
      expected: ['value', { entity_id: 'entity' } as HassEntity, { entity_id: 'humidifier_entity' } as HassEntity],
    },
    {
      config: {
        entity: 'fan.t',
        model: 'empty',
        indicators: {
          temperature: {
            unit: '°C',
            icon: {
              style: '(value, entity, humidifier_entity) => [value, entity, humidifier_entity]',
            },
          },
        },
      },
      styleArguments: {
        value: 'value',
        entity: { entity_id: 'entity' } as HassEntity,
        humidifier_entity: { entity_id: 'humidifier_entity' } as HassEntity,
      },
      expected: ['value', { entity_id: 'entity' } as HassEntity, { entity_id: 'humidifier_entity' } as HassEntity],
    },
    {
      name: 'execution context testing',
      config: {
        entity: 'fan.t',
        model: 'empty',
        indicators: {
          temperature: {
            unit: '°C',
            icon: {
              style: '() => this',
            },
          },
        },
      },
      styleArguments: {
        value: 'value',
        entity: { entity_id: 'entity' } as HassEntity,
        humidifier_entity: { entity_id: 'humidifier_entity' } as HassEntity,
      },
      expected: {
        unit: '°C',
        icon: {
          style: '() => this',
        },
      },
    },
    {
      name: 'string icon test',
      config: {
        entity: 'fan.t',
        model: 'empty',
        indicators: {
          temperature: {
            unit: '°C',
            icon: 'mdi:thermometer-low',
          },
        },
      },
      styleArguments: {
        value: 'value',
        entity: { entity_id: 'entity' } as HassEntity,
        humidifier_entity: { entity_id: 'humidifier_entity' } as HassEntity,
      },
      expected: {},
    },
  ];

  indicatorIconStyleTest.forEach(function(test) {
    it(`icon style, config: ${JSON.stringify(test.config)} expected:${JSON.stringify(test.expected)}`, () => {
      const config = new Config(test.config);
      const indicator = config.indicators[0];
      const args = test.styleArguments;
      const template = indicator.icon.style(args.value, args.entity, args.humidifier_entity);
      expect(template).to.deep.equals(test.expected);
    });
  });

  const indicatorMapperTest = [
    {
      config: {
        entity: 'fan.t',
        model: 'empty',
        indicators: {
          temperature: {},
        },
      },
      args: {
        value: 'value',
        entity: { entity_id: 'entity' } as HassEntity,
        humidifier_entity: { entity_id: 'humidifier_entity' } as HassEntity,
      },
      expected: 'value',
    },
    {
      config: {
        entity: 'fan.t',
        model: 'empty',
        indicators: {
          temperature: {
            source: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              mapper: (value, entity, humidifier_entity): any => [value, entity, humidifier_entity],
            },
          },
        },
      },
      args: {
        value: 'value',
        entity: { entity_id: 'entity' } as HassEntity,
        humidifier_entity: { entity_id: 'humidifier_entity' } as HassEntity,
      },
      expected: ['value', { entity_id: 'entity' } as HassEntity, { entity_id: 'humidifier_entity' } as HassEntity],
    },
    {
      config: {
        entity: 'fan.t',
        model: 'empty',
        indicators: {
          temperature: {
            source: {
              mapper: '(value, entity, humidifier_entity) => [value, entity, humidifier_entity]',
            },
          },
        },
      },
      args: {
        value: 'value',
        entity: { entity_id: 'entity' } as HassEntity,
        humidifier_entity: { entity_id: 'humidifier_entity' } as HassEntity,
      },
      expected: ['value', { entity_id: 'entity' } as HassEntity, { entity_id: 'humidifier_entity' } as HassEntity],
    },
    {
      config: {
        entity: 'fan.t',
        model: 'empty',
        indicators: {
          temperature: {
            source: {
              mapper: '(value, entity, humidifier_entity) => this',
            },
          },
        },
      },
      args: {
        value: 'value',
        entity: { entity_id: 'entity' } as HassEntity,
        humidifier_entity: { entity_id: 'humidifier_entity' } as HassEntity,
      },
      expected: {
        source: {
          mapper: '(value, entity, humidifier_entity) => this',
        },
      },
    },
  ];

  indicatorMapperTest.forEach(function(test) {
    it(`state mapper, config: ${JSON.stringify(test.config)} expected:${JSON.stringify(test.expected)}`, () => {
      const config = new Config(test.config);
      const indicator = config.indicators[0];
      const args = test.args;
      const result = indicator.stateMapper(args.value, args.entity, args.humidifier_entity);
      expect(result).to.deep.equals(test.expected);
    });
  });

  it('toggle_action', () => {
    const buttons = {
      test: {
        toggle_action: "(state, entity, humidifier_entity) => { return this.call_service('1', '2', { test: 'asd' })}",
      },
    };
    let data;
    const config = new Config({ entity: 'fan.xiaomi_miio_device', model: 'empty', buttons: buttons });
    const hass = {
      callService: (domain, service, serviceData) =>
        new Promise<void>(() => {
          data = [domain, service, serviceData];
        }),
    } as HomeAssistant;
    const entity = { entity_id: 'entity' } as HassEntity;
    const humidifierEntity = { entity_id: 'entity' } as HassEntity;
    const button = config.buttons[0] as ButtonConfig;
    Promise.resolve(button.toggleAction(hass, 'state', entity, humidifierEntity));
    expect(data).to.deep.equals(['1', '2', { test: 'asd' }]);
  });
});
