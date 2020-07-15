import { Config } from '../models/config';
import { assert, AssertionError, expect } from 'chai';
import ICON from '../const';
import { TapAction } from '../types';

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

  const groupTestSource = [
    { config: { entity: 'fan.xiaomi_miio_device' }, expected: false },
    { config: { entity: 'fan.xiaomi_miio_device', group: false }, expected: false },
    { config: { entity: 'fan.xiaomi_miio_device', group: true }, expected: true },
  ];

  groupTestSource.forEach(function(test) {
    it('group', () => {
      const config = new Config(test.config);
      expect(config.group).to.equal(test.expected);
    });
  });

  const modelTestSource = [
    { config: { entity: 'fan.xiaomi_miio_device' }, expected: 'default' },
    { config: { entity: 'fan.xiaomi_miio_device', model: 'test' }, expected: 'default' },
    { config: { entity: 'fan.xiaomi_miio_device', model: 'zhimi.humidifier.cb1' }, expected: 'zhimi.humidifier.cb1' },
    { config: { entity: 'fan.xiaomi_miio_device', model: 'empty' }, expected: 'empty' },
  ];

  modelTestSource.forEach(function(test) {
    it('model', () => {
      const config = new Config(test.config);
      expect(config.model).to.equal(test.expected);
    });
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

  const toggleButtonTestSource = [
    {
      config: {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
      },
      expected: {
        default: false,
        hide: false,
        icon: ICON.TOGGLE,
      },
    },
    {
      config: {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        toggle: {
          default: true,
        },
      },
      expected: {
        default: true,
        hide: false,
        icon: ICON.TOGGLE,
      },
    },
    {
      config: {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        toggle: {
          default: true,
          hide: true,
        },
      },
      expected: {
        default: true,
        hide: true,
        icon: ICON.TOGGLE,
      },
    },
    {
      config: {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        toggle: {
          icon: 'mdi:test',
        },
      },
      expected: {
        default: false,
        hide: false,
        icon: 'mdi:test',
      },
    },
    {
      config: {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        toggle: false,
      },
      expected: {
        default: false,
        hide: false,
        icon: ICON.TOGGLE,
      },
    },
    {
      config: {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        toggle: true,
      },
      expected: {
        default: false,
        hide: true,
        icon: ICON.TOGGLE,
      },
    },
  ];

  toggleButtonTestSource.forEach(function(test) {
    it('toggle', () => {
      const config = new Config(test.config);
      expect(config.toggle).to.deep.equal(test.expected);
    });
  });

  const tapActionTestSource = [
    {
      config: {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        tap_action: {
          action: 'test',
        },
      },
      expected: {
        entity: 'fan.xiaomi_miio_device',
        action: TapAction.MoreInfo,
      },
    },
    {
      config: {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        tap_action: {},
      },
      expected: {
        entity: 'fan.xiaomi_miio_device',
        action: TapAction.MoreInfo,
      },
    },
    {
      config: {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
      },
      expected: {
        entity: 'fan.xiaomi_miio_device',
        action: TapAction.MoreInfo,
      },
    },
    {
      config: {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        tap_action: 123,
      },
      expected: {
        entity: 'fan.xiaomi_miio_device',
        action: TapAction.MoreInfo,
      },
    },
    {
      config: {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        tap_action: 'none',
      },
      expected: {
        entity: 'fan.xiaomi_miio_device',
        action: TapAction.None,
      },
    },
    {
      config: {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        tap_action: {
          action: 'toggle',
          entity: 'switch.test',
        },
      },
      expected: {
        entity: 'switch.test',
        action: TapAction.Toggle,
      },
    },
    {
      config: {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        tap_action: {
          action: 'toggle',
        },
      },
      expected: {
        entity: 'fan.xiaomi_miio_device',
        action: TapAction.Toggle,
      },
    },
    {
      config: {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        tap_action: {
          action: 'call-service',
          service: 'fan.set_speed',
          service_data: { speed: 1, entity_id: 'fan.xiaomi_miio_device' },
        },
      },
      expected: {
        entity: 'fan.xiaomi_miio_device',
        action: TapAction.CallService,
        service: 'fan.set_speed',
        serviceData: { speed: 1, entity_id: 'fan.xiaomi_miio_device' },
      },
    },
    {
      config: {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        tap_action: {
          action: 'call-service',
        },
      },
      expected: {
        entity: 'fan.xiaomi_miio_device',
        action: TapAction.CallService,
      },
    },
    {
      config: {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        tap_action: {
          action: 'url',
          url: '/developer-tools/service',
        },
      },
      expected: {
        entity: 'fan.xiaomi_miio_device',
        action: TapAction.Url,
        url: '/developer-tools/service',
      },
    },
    {
      config: {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        tap_action: {
          action: 'url',
        },
      },
      expected: {
        entity: 'fan.xiaomi_miio_device',
        action: TapAction.Url,
      },
    },
    {
      config: {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        tap_action: {
          action: 'navigate',
        },
      },
      expected: {
        entity: 'fan.xiaomi_miio_device',
        action: TapAction.Navigate,
      },
    },
    {
      config: {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        tap_action: {
          action: 'navigate',
          navigation_path: '/developer-tools/service',
        },
      },
      expected: {
        entity: 'fan.xiaomi_miio_device',
        action: TapAction.Navigate,
        navigationPath: '/developer-tools/service',
      },
    },
  ];

  tapActionTestSource.forEach(function(test) {
    it('tap_action', () => {
      const config = new Config(test.config);
      expect(config.tapAction).to.deep.equal(test.expected);
    });
  });
});
