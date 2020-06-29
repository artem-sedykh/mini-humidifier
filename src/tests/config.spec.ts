import { Config } from '../models/config';
import { assert, AssertionError, expect } from 'chai';

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
});
