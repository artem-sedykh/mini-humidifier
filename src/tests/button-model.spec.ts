import { Config } from '../models/config';
import { assert, expect } from 'chai';
import { HassEntity } from 'home-assistant-js-websocket';
import { instance, mock, when } from 'ts-mockito';
import { HomeAssistant } from 'custom-card-helpers/dist';
import { Button } from '../models/button';
import { ButtonConfig, ElementType, Primitive } from '../types';
import { ACTION_TIMEOUT } from '../const';

describe('button-model', () => {
  const buttonTestSource = [
    {
      button: {
        state: {
          attribute: 'boolean_field',
          mapper: (state): Primitive => (state ? 'on' : 'off'),
        },
      },
      state: 'on',
      attributes: {
        boolean_field: true,
      },
      expected: {
        isOn: true,
        state: 'on',
        hide: false,
        order: 0,
        elementType: ElementType.Button,
        actionTimeout: ACTION_TIMEOUT,
        label: undefined,
        style: {},
        icon: undefined,
        disabled: false,
        isUnavailable: false,
      },
    },
    {
      button: {
        order: 10,
        state: {
          attribute: 'boolean_field',
          mapper: (state): Primitive => (state ? 'on' : 'off'),
        },
      },
      state: 'on',
      attributes: {
        boolean_field: false,
      },
      expected: {
        isOn: false,
        state: 'off',
        hide: false,
        order: 10,
        elementType: ElementType.Button,
        actionTimeout: ACTION_TIMEOUT,
        label: undefined,
        style: {},
        icon: undefined,
        disabled: false,
        isUnavailable: false,
      },
    },
    {
      button: {
        state: {
          mapper: (state): Primitive => state,
        },
      },
      state: 'on',
      attributes: {},
      expected: {
        isOn: true,
        state: 'on',
        hide: false,
        order: 0,
        elementType: ElementType.Button,
        actionTimeout: ACTION_TIMEOUT,
        label: undefined,
        style: {},
        icon: undefined,
        disabled: false,
        isUnavailable: false,
      },
    },
    {
      button: {
        state: {
          attribute: 'undefined_filed',
          mapper: (state): Primitive => state,
        },
      },
      state: 'on',
      attributes: {},
      expected: {
        isOn: false,
        state: undefined,
        hide: false,
        order: 0,
        elementType: ElementType.Button,
        actionTimeout: ACTION_TIMEOUT,
        label: undefined,
        style: {},
        icon: undefined,
        disabled: false,
        isUnavailable: true,
      },
    },
    {
      button: {
        state: {
          mapper: (state): Primitive => state,
        },
        label: (state, context): Primitive => {
          const key = `test.${state}`;
          return context.localize(key, key);
        },
      },
      state: 'on',
      attributes: {},
      selectedLanguage: undefined,
      language: undefined,
      expected: {
        isOn: true,
        state: 'on',
        hide: false,
        order: 0,
        elementType: ElementType.Button,
        actionTimeout: ACTION_TIMEOUT,
        label: 'test.on',
        style: {},
        icon: undefined,
        disabled: false,
        isUnavailable: false,
      },
    },
  ];

  buttonTestSource.forEach(function(test) {
    it('button', () => {
      const buttonId = 'test';
      const rawConfig = {
        entity: 'fan.xiaomi_miio_device',
        model: 'empty',
        buttons: {},
      };
      rawConfig.buttons[buttonId] = test.button;
      const config = new Config(rawConfig);

      assert.isTrue(config.buttons.length === 1);
      const buttonConfig = config.buttons.find(i => i.id === buttonId) as ButtonConfig;
      if (!buttonConfig) {
        assert.fail('button not set');
      }
      const entityId = config.entity;
      const entityMock: HassEntity = mock<HassEntity>();
      when(entityMock.state).thenReturn(test.state);
      when(entityMock.entity_id).thenReturn(entityId);
      when(entityMock.attributes).thenReturn(test.attributes);
      const entity: HassEntity = instance(entityMock);

      const states = {};
      states[entityId] = entity;
      const hassMock: HomeAssistant = mock<HomeAssistant>();
      when(hassMock.states).thenReturn(states);
      when(hassMock.selectedLanguage).thenReturn(test.selectedLanguage || '');
      when(hassMock.language).thenReturn(test.language || '');
      const hass: HomeAssistant = instance(hassMock);

      expect(hass.states[entityId]).to.deep.equal(entity);
      const model = new Button(hass, buttonConfig, entity);

      expect(model.id).to.equal(buttonId);
      expect(model.state).to.equal(test.expected.state);
      expect(model.hide).to.equal(test.expected.hide);
      expect(model.elementType).to.equal(test.expected.elementType);
      expect(model.actionTimeout).to.equal(test.expected.actionTimeout);
      expect(model.isOn).to.equal(test.expected.isOn);
      expect(model.order).to.equal(test.expected.order);
      expect(model.label).to.equal(test.expected.label);
      expect(model.style).to.deep.equal(test.expected.style);
      expect(model.icon).to.equal(test.expected.icon);
      expect(model.disabled).to.equal(test.expected.disabled);
      expect(model.isUnavailable).to.equal(test.expected.isUnavailable);
    });
  });
});
