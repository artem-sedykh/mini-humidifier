import { expect, assert } from 'chai';
import { compileTemplate, isNumeric, parseTapAction } from '../utils/utils';
import { TapAction } from '../types';
import { computeDomain } from '../utils/compute-domain';
import { EmptyPromise } from '../const';
import { HassEntity } from 'home-assistant-js-websocket';
import { deepEqual, instance, mock, spy, verify, when } from 'ts-mockito';
import { toggleEntity } from '../utils/toggle-entity';

describe('utils', () => {
  it('EmptyPromise', () => {
    assert.isDefined(EmptyPromise);
    assert.isFunction(EmptyPromise);
    Promise.resolve(EmptyPromise());
  });

  const isNumericTestSource = [
    { value: 1, expected: true },
    { value: '1', expected: true },
    { value: '', expected: false },
    { value: 'number', expected: false },
    { value: '1.10', expected: true },
    { value: undefined, expected: false },
  ];

  isNumericTestSource.forEach(function(test) {
    it(`isNumeric: ${test.value} is numeric: ${test.expected}`, () => {
      expect(isNumeric(test.value)).to.equal(test.expected);
    });
  });

  const parseTapActionSource = [
    { value: 'more-info', expected: TapAction.MoreInfo },
    { value: 'navigate', expected: TapAction.Navigate },
    { value: 'call-service', expected: TapAction.CallService },
    { value: 'url', expected: TapAction.Url },
    { value: 'toggle', expected: TapAction.Toggle },
    { value: 'none', expected: TapAction.None },
    { value: 'unknown', expected: undefined },
    { value: undefined, expected: undefined },
    { value: null, expected: undefined },
    { value: 0, expected: undefined },
  ];

  parseTapActionSource.forEach(function(test) {
    it(`parseTapAction: ${test.value}`, () => {
      expect(parseTapAction(test.value?.toString())).to.equal(test.expected);
    });
  });

  const computeDomainTestSource = [
    { value: 'domain.entity', expected: 'domain' },
    { value: 'binary_sensor.mi_bedside2_right_nightlight', expected: 'binary_sensor' },
    { value: 'fan.xiaomi_miio_device', expected: 'fan' },
  ];

  computeDomainTestSource.forEach(function(test) {
    it(`computeDomain: ${test.value}`, () => {
      expect(computeDomain(test.value)).to.equal(test.expected);
    });
  });

  const toggleEntityTestSource = [
    {
      entityId: 'lock.test',
      state: 'closed',
      expected: {
        domain: 'lock',
        service: 'unlock',
        serviceData: { entity_id: 'lock.test' },
      },
    },
    {
      entityId: 'lock.test',
      state: 'open',
      expected: {
        domain: 'lock',
        service: 'lock',
        serviceData: { entity_id: 'lock.test' },
      },
    },
    {
      entityId: 'switch.test',
      state: 'on',
      expected: {
        domain: 'switch',
        service: 'turn_off',
        serviceData: { entity_id: 'switch.test' },
      },
    },
    {
      entityId: 'switch.test',
      state: 'off',
      expected: {
        domain: 'switch',
        service: 'turn_on',
        serviceData: { entity_id: 'switch.test' },
      },
    },
    {
      entityId: 'cover.test',
      state: 'on',
      expected: {
        domain: 'cover',
        service: 'close_cover',
        serviceData: { entity_id: 'cover.test' },
      },
    },
    {
      entityId: 'cover.test',
      state: 'off',
      expected: {
        domain: 'cover',
        service: 'open_cover',
        serviceData: { entity_id: 'cover.test' },
      },
    },
    {
      entityId: 'group.test',
      state: 'off',
      expected: {
        domain: 'homeassistant',
        service: 'turn_on',
        serviceData: { entity_id: 'group.test' },
      },
    },
    {
      entityId: 'group.test',
      state: 'on',
      expected: {
        domain: 'homeassistant',
        service: 'turn_off',
        serviceData: { entity_id: 'group.test' },
      },
    },
  ];

  toggleEntityTestSource.forEach(function(test) {
    it(`toggleEntity: ${test.entityId}, state: ${test.state}`, () => {
      const entityMock: HassEntity = mock<HassEntity>();
      when(entityMock.state).thenReturn(test.state);
      when(entityMock.entity_id).thenReturn(test.entityId);
      const entity: HassEntity = instance(entityMock);

      const testObj: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callService: (domain: string, service: string, serviceData?: { [key: string]: any }) => Promise<void>;
      } = {
        callService: EmptyPromise,
      };

      const spiedTestObj = spy(testObj);

      toggleEntity(entity, testObj.callService);

      verify(
        spiedTestObj.callService(test.expected.domain, test.expected.service, deepEqual(test.expected.serviceData)),
      ).once();
    });
  });

  const compileTemplateTestSource = [
    {
      func: (): string => 'test_value',
      expected: {
        result: 'test_value',
        exception: false,
      },
    },
    {
      func: "() => 'test_value'",
      expected: {
        result: 'test_value',
        exception: false,
      },
    },
    {
      func: '() ==> test_value',
      expected: {
        result: 'test_value',
        exception: true,
      },
    },
  ];

  compileTemplateTestSource.forEach(function(test) {
    it('compileTemplate', () => {
      try {
        const func = compileTemplate(test.func);
        expect(func()).to.equal(test.expected.result);
      } catch (e) {
        if (!test.expected.exception) {
          assert.fail();
        }
        return;
      }
      if (test.expected.exception) {
        assert.fail();
      }
    });
  });
});
