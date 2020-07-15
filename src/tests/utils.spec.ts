import { expect } from 'chai';
import { isNumeric, parseTapAction } from '../utils/utils';
import { TapAction } from '../types';
import { computeDomain } from '../utils/compute-domain';

describe('utils', () => {
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
});
