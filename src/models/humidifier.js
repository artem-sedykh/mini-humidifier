import { STATES_OFF, UNAVAILABLE_STATES } from '../const';

export default class HumidifierObject {
  constructor(hass, config, entity) {
    this.hass = hass || {};
    this.config = config || {};
    this.entity = entity || {};
    this.state = entity.state;
    this.attr = {
      friendly_name: '',
      depth: 0,
      target_humidity: 0,
      mode: '',
      dry: false,
      buzzer: false,
      child_lock: false,
      led_brightness: 0,
      ...entity.attributes || {},
    };
  }

  get id() {
    return this.entity.entity_id;
  }

  get icon() {
    return this.attr.icon;
  }

  get name() {
    return this.attr.friendly_name || '';
  }

  get isOff() {
    return this.entity !== undefined
      && STATES_OFF.includes(this.state)
      && !UNAVAILABLE_STATES.includes(this.state);
  }

  get isActive() {
    return (this.isOff === false && this.isUnavailable === false) || false;
  }

  get isUnavailable() {
    return this.entity === undefined || UNAVAILABLE_STATES.includes(this.state);
  }

  get isOn() {
    return this.entity !== undefined
      && !STATES_OFF.includes(this.state)
      && !UNAVAILABLE_STATES.includes(this.state);
  }

  callService(domain, service, options) {
    return this.hass.callService(domain, service, options);
  }
}
