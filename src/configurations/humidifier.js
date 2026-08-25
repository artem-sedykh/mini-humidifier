import { ICON } from '../const';

// A preset for the `humidifier` domain itself, rather than for a device.
//
// Every other file here describes hardware: which attributes one particular
// humidifier reports, which entities its integration creates alongside it,
// which services it answers. A device the card has no preset for therefore
// starts from `zhimi.humidifier.cb1` - indicators pointing at
// `sensor.<entity>_temperature` entities it does not have, buttons calling
// Xiaomi services it has never heard of - or from `none`, which brings nothing
// and leaves even the on/off button to be written out by hand.
//
// This is the missing third option, and it is built out of what Home Assistant
// guarantees for the domain and nothing else: `humidifier.turn_on`,
// `humidifier.turn_off`, `humidifier.set_humidity`, `humidifier.set_mode`, and
// the attributes `humidity`, `current_humidity` and `available_modes`. A
// generic_hygrostat, an MQTT humidifier or a dehumidifier on a smart switch
// works with it as it is, and anything the device has beyond the domain - a
// night light, a buzzer, a filter reading - is added in YAML on top, which is
// what this card is for. See #207.
//
// Deliberately absent: LED, buzzer, child lock, water level. Those are
// integration features, and a preset that guesses at them is how a card ends
// up calling services a device does not have.
const GENERIC_HUMIDIFIER = () => ({
  power: {
    icon: ICON.POWER,
    type: 'button',
    hide: false,
    toggle_action: (state, entity) => {
      const service = state === 'on' ? 'turn_off' : 'turn_on';
      const options = { entity_id: entity.entity_id };
      return this.call_service('humidifier', service, options);
    },
  },
  target_humidity: {
    icon: ICON.HUMIDITY,
    // No min, max or step on purpose: the entity carries its own range in
    // `min_humidity` and `max_humidity`, and `TargetHumidityObject` reads them
    // when the configuration is silent. A number here would override a device
    // that knows better.
    hide: false,
    hide_indicator: false,
    unit: {
      template: val => (val === '' ? '' : '%'),
    },
    state: {
      attribute: 'humidity',
      mapper: val => (val === undefined || val === null || val === 'unknown' ? '' : val),
    },
    change_action: (selected, state, entity) => {
      const options = { entity_id: entity.entity_id, humidity: selected };
      return this.call_service('humidifier', 'set_humidity', options);
    },
  },
  indicators: {
    // The reading, which for this domain is an attribute of the humidifier
    // itself rather than a sensor entity beside it. A device that does not
    // report it shows an empty slot rather than `NaN`, which is what the
    // mapper and the unit template are for.
    humidity: {
      icon: ICON.HUMIDITY,
      round: 0,
      order: 0,
      hide: false,
      source: {
        attribute: 'current_humidity',
        mapper: val => (val === undefined || val === null || val === 'unknown' ? '' : val),
      },
      unit: {
        template: val => (val === '' ? '' : '%'),
      },
    },
  },
  buttons: {
    // `available_modes` is optional in the domain - a generic_hygrostat has no
    // modes at all - so this is disabled rather than absent when the device
    // reports none. Absent would mean the button cannot come back when a
    // device gains modes, and `hide` is not a template.
    mode: {
      icon: ICON.FAN,
      type: 'dropdown',
      hide: false,
      order: 1,
      state: { attribute: 'mode' },
      active: (state, entity) => entity.state !== 'off',
      disabled: (state, entity) => (entity.attributes.available_modes || []).length === 0,
      source: {
        __init: entity =>
          (entity.attributes.available_modes || []).map(mode => ({ id: mode, name: mode })),
      },
      change_action: (selected, state, entity) => {
        const options = { entity_id: entity.entity_id, mode: selected };
        return this.call_service('humidifier', 'set_mode', options);
      },
    },
  },
});

export default GENERIC_HUMIDIFIER;
