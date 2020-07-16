import { Config } from '../models/config';
import { assert, expect } from 'chai';
import { HassEntity } from 'home-assistant-js-websocket';
import { instance, mock, when } from 'ts-mockito';
import { HomeAssistant } from 'custom-card-helpers/dist';
import { DropdownConfig, DropdownItem, ElementType, ExecutionContext } from '../types';
import { ACTION_TIMEOUT } from '../const';
import { Dropdown } from '../models/dropdown';

describe('dropdown-model', () => {
  const dropdownTestSource = [
    {
      button: {
        type: 'dropdown',
      },
      state: 'on',
      attributes: {},
      selectedLanguage: undefined,
      language: undefined,
      expected: {
        state: 'on',
        hide: false,
        order: 0,
        elementType: ElementType.Dropdown,
        actionTimeout: ACTION_TIMEOUT,
        label: undefined,
        style: {},
        icon: undefined,
        disabled: false,
        selected: undefined,
        isActive: false,
        source: [],
      },
    },
    {
      button: {
        type: 'dropdown',
        source: {
          on: { name: 'on' },
          off: { name: 'off' },
          __filter: (source: DropdownItem[], context: ExecutionContext): DropdownItem[] => {
            return source.map(item => {
              item.name = context.localize('test.' + item.id, item.name);
              return item;
            });
          },
        },
      },
      state: 'on',
      attributes: {},
      selectedLanguage: undefined,
      language: undefined,
      expected: {
        state: 'on',
        hide: false,
        order: 0,
        elementType: ElementType.Dropdown,
        actionTimeout: ACTION_TIMEOUT,
        label: undefined,
        style: {},
        icon: undefined,
        disabled: false,
        selected: { id: 'on', name: 'on', order: 0 },
        isActive: false,
        source: [
          { id: 'on', name: 'on', order: 0 },
          { id: 'off', name: 'off', order: 1 },
        ],
      },
    },
    {
      button: {
        type: 'dropdown',
        state: 'undefined_attr',
      },
      state: 'on',
      attributes: {},
      selectedLanguage: undefined,
      language: undefined,
      expected: {
        state: undefined,
        hide: false,
        order: 0,
        elementType: ElementType.Dropdown,
        actionTimeout: ACTION_TIMEOUT,
        label: undefined,
        style: {},
        icon: undefined,
        disabled: false,
        selected: undefined,
        isActive: false,
        source: [],
      },
    },
  ];

  dropdownTestSource.forEach(function(test) {
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
      const dropdownConfig = config.buttons.find(i => i.id === buttonId) as DropdownConfig;
      if (!dropdownConfig) {
        assert.fail('dropdownConfig not set');
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
      const model = new Dropdown(hass, dropdownConfig, entity);

      expect(model.id).to.equal(buttonId, 'id not equals');
      expect(model.state).to.equal(test.expected.state, 'state not equals');
      expect(model.hide).to.equal(test.expected.hide, 'hide not equals');
      expect(model.elementType).to.equal(test.expected.elementType, 'elementType not equals');
      expect(model.actionTimeout).to.equal(test.expected.actionTimeout, 'actionTimeout not equals');
      expect(model.order).to.equal(test.expected.order, 'order not equals');
      expect(model.label).to.equal(test.expected.label, 'label not equals');
      expect(model.style).to.deep.equal(test.expected.style, 'style not equals');
      expect(model.icon).to.equal(test.expected.icon, 'icon not equals');
      expect(model.disabled).to.equal(test.expected.disabled, 'disabled not equals');
      expect(model.selected).to.deep.equal(test.expected.selected, 'selected not equals');
      expect(model.source).to.deep.equal(test.expected.source, 'source not equals');
      expect(model.isActive(model.state?.toString())).to.equal(test.expected.isActive, 'isActive not equals');
    });
  });
});
