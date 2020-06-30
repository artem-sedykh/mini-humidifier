import { Config } from '../../models/config';
import { assert, expect } from 'chai';
import { ButtonConfig, DropdownConfig, ElementType } from '../../types';
import { HassEntity } from 'home-assistant-js-websocket';
import { anyString, anything, deepEqual, instance, mock, verify, when } from 'ts-mockito';
import { HomeAssistant } from 'custom-card-helpers/dist';
import { Button } from '../../models/button';
import { Dropdown } from '../../models/dropdown';
import { TargetHumidity } from '../../models/target-humidity';

describe('zhimi.humidifier.cb1 buttons', () => {
  const config = new Config({ entity: 'fan.xiaomi_miio_device', model: 'zhimi.humidifier.cb1' });
  const defaultAttributes = {
    speed_list: ['Silent', 'Medium', 'High', 'Auto'],
    speed: null,
    model: 'zhimi.humidifier.cb1',
    temperature: 27.6,
    humidity: 32,
    mode: 'high',
    buzzer: false,
    child_lock: false,
    target_humidity: 70,
    led_brightness: 2,
    use_time: 1244928,
    hardware_version: '0001',
    motor_speed: 0,
    depth: 0,
    dry: false,
    friendly_name: 'Увлажнитель',
    supported_features: 1,
  };

  it('dry.toggle', () => {
    const state = 'off';
    const attributes = Object.assign({}, defaultAttributes, { dry: false });

    const entityId = config.entity;
    const buttonConf = config.buttons.find(b => b.id === 'dry') as ButtonConfig;
    assert.exists(buttonConf);
    assert.isTrue(buttonConf?.elementType === ElementType.Button);

    const entityMock: HassEntity = mock<HassEntity>();
    when(entityMock.state).thenReturn(state);
    when(entityMock.entity_id).thenReturn(entityId);
    when(entityMock.attributes).thenReturn(attributes);
    const entity: HassEntity = instance(entityMock);

    const states = {};
    states[entityId] = entity;
    const hassMock: HomeAssistant = mock<HomeAssistant>();
    when(hassMock.states).thenReturn(states);
    when(hassMock.selectedLanguage).thenReturn('en');

    when(hassMock.callService(anyString(), anyString(), anything())).thenCall((domain: string, service: string) => {
      if (domain === 'xiaomi_miio') {
        if (service === 'fan_set_dry_on') attributes.dry = true;
        if (service === 'fan_set_dry_off') attributes.dry = false;
      }
      return new Promise<void>(() => {
        return;
      });
    });

    const hass: HomeAssistant = instance(hassMock);

    expect(hass.states[entityId]).to.deep.equal(entity);

    const button = new Button(hass, buttonConf, entity);

    expect(button.state).to.equal('off');
    assert.isFalse(button.isOn);

    Promise.resolve(button.toggle());

    verify(hassMock.callService('xiaomi_miio', 'fan_set_dry_on', deepEqual({ entity_id: entityId }))).once();

    expect(button.state).to.equal('on');
    assert.isTrue(button.isOn);

    Promise.resolve(button.toggle());

    verify(hassMock.callService('xiaomi_miio', 'fan_set_dry_off', deepEqual({ entity_id: entityId }))).once();

    expect(button.state).to.equal('off');
    assert.isFalse(button.isOn);
  });

  it('buzzer.toggle', () => {
    const state = 'off';
    const buttonId = 'buzzer';
    const attributes = Object.assign({}, defaultAttributes, { buzzer: false });

    const entityId = config.entity;
    const buttonConf = config.buttons.find(b => b.id === buttonId) as ButtonConfig;
    assert.exists(buttonConf);
    assert.isTrue(buttonConf?.elementType === ElementType.Button);

    const entityMock: HassEntity = mock<HassEntity>();
    when(entityMock.state).thenReturn(state);
    when(entityMock.entity_id).thenReturn(entityId);
    when(entityMock.attributes).thenReturn(attributes);
    const entity: HassEntity = instance(entityMock);

    const states = {};
    states[entityId] = entity;
    const hassMock: HomeAssistant = mock<HomeAssistant>();
    when(hassMock.states).thenReturn(states);
    when(hassMock.selectedLanguage).thenReturn('en');

    when(hassMock.callService(anyString(), anyString(), anything())).thenCall((domain: string, service: string) => {
      if (domain === 'xiaomi_miio') {
        if (service === 'fan_set_buzzer_on') attributes.buzzer = true;
        if (service === 'fan_set_buzzer_off') attributes.buzzer = false;
      }
      return new Promise<void>(() => {
        return;
      });
    });

    const hass: HomeAssistant = instance(hassMock);

    expect(hass.states[entityId]).to.deep.equal(entity);

    const button = new Button(hass, buttonConf, entity);

    expect(button.state).to.equal('off');
    assert.isFalse(button.isOn);

    Promise.resolve(button.toggle());

    verify(hassMock.callService('xiaomi_miio', 'fan_set_buzzer_on', deepEqual({ entity_id: entityId }))).once();

    expect(button.state).to.equal('on');
    assert.isTrue(button.isOn);

    Promise.resolve(button.toggle());

    verify(hassMock.callService('xiaomi_miio', 'fan_set_buzzer_off', deepEqual({ entity_id: entityId }))).once();

    expect(button.state).to.equal('off');
    assert.isFalse(button.isOn);
  });

  it('child_lock.toggle', () => {
    const state = 'off';
    const buttonId = 'child_lock';
    const attributes = Object.assign({}, defaultAttributes, { child_lock: false });

    const entityId = config.entity;
    const buttonConf = config.buttons.find(b => b.id === buttonId) as ButtonConfig;
    assert.exists(buttonConf);
    assert.isTrue(buttonConf?.elementType === ElementType.Button);

    const entityMock: HassEntity = mock<HassEntity>();
    when(entityMock.state).thenReturn(state);
    when(entityMock.entity_id).thenReturn(entityId);
    when(entityMock.attributes).thenReturn(attributes);
    const entity: HassEntity = instance(entityMock);

    const states = {};
    states[entityId] = entity;
    const hassMock: HomeAssistant = mock<HomeAssistant>();
    when(hassMock.states).thenReturn(states);
    when(hassMock.selectedLanguage).thenReturn('en');

    when(hassMock.callService(anyString(), anyString(), anything())).thenCall((domain: string, service: string) => {
      if (domain === 'xiaomi_miio') {
        if (service === 'fan_set_child_lock_on') attributes.child_lock = true;
        if (service === 'fan_set_child_lock_off') attributes.child_lock = false;
      }
      return new Promise<void>(() => {
        return;
      });
    });

    const hass: HomeAssistant = instance(hassMock);

    expect(hass.states[entityId]).to.deep.equal(entity);

    const button = new Button(hass, buttonConf, entity);

    expect(button.state).to.equal('off');
    assert.isFalse(button.isOn);

    Promise.resolve(button.toggle());

    verify(hassMock.callService('xiaomi_miio', 'fan_set_child_lock_on', deepEqual({ entity_id: entityId }))).once();

    expect(button.state).to.equal('on');
    assert.isTrue(button.isOn);

    Promise.resolve(button.toggle());

    verify(hassMock.callService('xiaomi_miio', 'fan_set_child_lock_off', deepEqual({ entity_id: entityId }))).once();

    expect(button.state).to.equal('off');
    assert.isFalse(button.isOn);
  });

  it('mode.change', () => {
    const buttonId = 'mode';
    const defaultMode = 'high';
    const attributes = Object.assign({}, defaultAttributes, { mode: defaultMode });

    const entityId = config.entity;
    const buttonConf = config.buttons.find(b => b.id === buttonId) as DropdownConfig;
    assert.exists(buttonConf);
    assert.isTrue(buttonConf?.elementType === ElementType.Dropdown);

    const entityMock: HassEntity = mock<HassEntity>();
    when(entityMock.state).thenReturn('off');
    when(entityMock.entity_id).thenReturn(entityId);
    when(entityMock.attributes).thenReturn(attributes);
    const entity: HassEntity = instance(entityMock);

    const states = {};
    states[entityId] = entity;
    const hassMock: HomeAssistant = mock<HomeAssistant>();
    when(hassMock.states).thenReturn(states);
    when(hassMock.selectedLanguage).thenReturn('en');

    when(hassMock.callService(anyString(), anyString(), anything())).thenCall(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (domain: string, service: string, serviceData?: { [key: string]: any }) => {
        if (domain === 'fan' && service === 'set_speed') {
          attributes.mode = serviceData?.speed;
        }
        return new Promise<void>(() => {
          return;
        });
      },
    );

    const hass: HomeAssistant = instance(hassMock);

    expect(hass.states[entityId]).to.deep.equal(entity);

    const button = new Dropdown(hass, buttonConf, entity);

    expect(button.state).to.equal(defaultMode);

    expect(entity.state).to.equal('off');
    assert.isFalse(button.isActive(button.state?.toString()));

    when(entityMock.state).thenReturn('on');
    expect(entity.state).to.equal('on');
    assert.isTrue(button.isActive(button.state?.toString()));

    attributes.depth = 0;
    assert.isTrue(button.disabled);

    attributes.depth = 11;
    assert.isTrue(button.disabled);

    attributes.depth = 12;
    assert.isFalse(button.disabled);

    const modes = ['auto', 'silent', 'medium', 'high'];

    for (let i = 0; i < modes.length; i += 1) {
      const mode = modes[i];
      Promise.resolve(button.change(mode));

      verify(hassMock.callService('fan', 'set_speed', deepEqual({ entity_id: entityId, speed: mode }))).once();

      expect(button.state).to.equal(mode);
    }
  });

  it('led.change', () => {
    const buttonId = 'led';
    const defaultLedValue = 0;
    const attributes = Object.assign({}, defaultAttributes, { led_brightness: defaultLedValue });

    const entityId = config.entity;
    const buttonConf = config.buttons.find(b => b.id === buttonId) as DropdownConfig;
    assert.exists(buttonConf);
    assert.isTrue(buttonConf?.elementType === ElementType.Dropdown);

    const entityMock: HassEntity = mock<HassEntity>();
    when(entityMock.state).thenReturn('off');
    when(entityMock.entity_id).thenReturn(entityId);
    when(entityMock.attributes).thenReturn(attributes);
    const entity: HassEntity = instance(entityMock);

    const states = {};
    states[entityId] = entity;
    const hassMock: HomeAssistant = mock<HomeAssistant>();
    when(hassMock.states).thenReturn(states);
    when(hassMock.selectedLanguage).thenReturn('en');

    when(hassMock.callService(anyString(), anyString(), anything())).thenCall(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (domain: string, service: string, serviceData?: { [key: string]: any }) => {
        if (domain === 'xiaomi_miio' && service === 'fan_set_led_brightness') {
          attributes.led_brightness = serviceData?.brightness;
        }
        return new Promise<void>(() => {
          return;
        });
      },
    );

    const hass: HomeAssistant = instance(hassMock);

    expect(hass.states[entityId]).to.deep.equal(entity);

    const button = new Dropdown(hass, buttonConf, entity);

    expect(button.state).to.equal(defaultLedValue.toString());

    const values = button.source.map(v => v.id);

    for (let i = 0; i < values.length; i += 1) {
      const value = values[i];
      Promise.resolve(button.change(value));

      verify(
        hassMock.callService(
          'xiaomi_miio',
          'fan_set_led_brightness',
          deepEqual({ entity_id: entityId, brightness: value }),
        ),
      ).once();

      if (value === '2') assert.isFalse(button.isActive(button.state?.toString()));
      else assert.isTrue(button.isActive(button.state?.toString()));

      expect(button.state).to.equal(value);
    }
  });

  it('target_humidity.change', () => {
    const defaultTargetHumidity = 30;
    const attributes = Object.assign({}, defaultAttributes, { target_humidity: defaultTargetHumidity });

    const entityId = config.entity;
    const targetHumidityConf = config.targetHumidity;
    assert.exists(targetHumidityConf);

    const entityMock: HassEntity = mock<HassEntity>();
    when(entityMock.state).thenReturn('off');
    when(entityMock.entity_id).thenReturn(entityId);
    when(entityMock.attributes).thenReturn(attributes);
    const entity: HassEntity = instance(entityMock);

    const states = {};
    states[entityId] = entity;
    const hassMock: HomeAssistant = mock<HomeAssistant>();
    when(hassMock.states).thenReturn(states);
    when(hassMock.selectedLanguage).thenReturn('en');

    when(hassMock.callService(anyString(), anyString(), anything())).thenCall(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (domain: string, service: string, serviceData?: { [key: string]: any }) => {
        if (domain === 'xiaomi_miio' && service === 'fan_set_target_humidity') {
          attributes.target_humidity = serviceData?.humidity;
        }
        return new Promise<void>(() => {
          return;
        });
      },
    );

    const hass: HomeAssistant = instance(hassMock);

    expect(hass.states[entityId]).to.deep.equal(entity);

    const targetHumidity = new TargetHumidity(hass, targetHumidityConf, entity);

    expect(targetHumidity.state).to.equal(defaultTargetHumidity);

    for (let i = targetHumidityConf.min; i <= targetHumidityConf.max; i += targetHumidityConf.step) {
      Promise.resolve(targetHumidity.change(i));

      verify(
        hassMock.callService('xiaomi_miio', 'fan_set_target_humidity', deepEqual({ entity_id: entityId, humidity: i })),
      ).once();

      expect(targetHumidity.state).to.equal(i);
    }
  });
});
