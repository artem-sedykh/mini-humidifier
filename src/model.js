
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

  round(value, decimals) {
    return Number(`${Math.round(Number(`${value}e${decimals}`))}e-${decimals}`);
  }

  get depth() {
    const depth = this.attr.depth || 0;

    let value = (100 * depth) / this.config.depth.max_value;

    if (this.config.depth.unit_type === 'liters') {
      value = (value * this.config.depth.volume) / 100;
    }

    return this.round(value, this.config.depth.fixed);
  }

  get targetHumidity() {
    const humidity = this.attr.target_humidity || 0;
    return {
      min: this.config.target_humidity.min,
      max: this.config.target_humidity.max,
      step: this.config.target_humidity.step,
      value: humidity,
    };
  }

  get fanSpeed() {
    if (this.attr.mode)
      return this.fanSpeedSource.find(s => s.value.toUpperCase() === this.attr.mode.toUpperCase());

    return undefined;
  }

  get fanSpeedSource() {
    return this.config.fan_mode_button.source;
  }

  get ledButtonValue() {
    return this.ledButtonSource.find(s => s.value === this.attr.led_brightness);
  }

  get ledButtonSource() {
    return this.config.led_button.source;
  }

  get icon() {
    return this.attr.icon;
  }

  get name() {
    return this.attr.friendly_name || '';
  }

  get isOff() {
    return this.state === 'off';
  }

  get isActive() {
    return (this.isOff === false && this.isUnavailable === false) || false;
  }

  get isUnavailable() {
    return this.state === 'unavailable';
  }

  get isOn() {
    return this.state === 'on';
  }

  get isDryOn() {
    return this.attr.dry === true;
  }

  get isBuzzerOn() {
    return this.attr.buzzer === true;
  }

  get isChildLockOn() {
    return this.attr.child_lock === true;
  }

  get isLedBrightnessOn() {
    return this.attr.led_brightness !== 2;
  }

  get isFanDisabled() {
    return this.attr.depth === 0;
  }

  get temperature() {
    const value = this.getValue(this.config.temperature.source, this.attr.temperature);
    return this.round(value, this.config.temperature.fixed);
  }

  get humidity() {
    const value = this.getValue(this.config.humidity.source, this.attr.humidity);
    return this.round(value, this.config.humidity.fixed);
  }

  getValue(config, defaultValue) {
    if (!config)
      return defaultValue;

    if (config.entity && this.hass.states) {
      const entity = this.hass.states[config.entity];

      if (entity && config.attribute)
        return entity.attributes[config.attribute];

      if (entity)
        return entity.state;
    }

    if (config.attribute)
      return this.attr[config.attribute];

    return defaultValue;
  }

  toggleLedBrightness(e) {
    if (this.isLedBrightnessOn)
      return this.setLedButtonBrightness(e, 'off');

    return this.setLedButtonBrightness(e, 'bright');
  }

  setLedButtonBrightness(e, id) {
    const item = this.ledButtonSource.find(s => s.id === id);
    if (item)
      return this.callService(e, 'fan_set_led_brightness', { brightness: item.value }, 'xiaomi_miio');

    throw new Error(`could not find value for key ${id}`);
  }

  togglePower(e) {
    if (this.isOn)
      return this.callService(e, 'turn_off', undefined, 'fan');

    return this.callService(e, 'turn_on', undefined, 'fan');
  }

  toggleChildLock(e) {
    if (this.isChildLockOn)
      return this.callService(e, 'fan_set_child_lock_off', undefined, 'xiaomi_miio');

    return this.callService(e, 'fan_set_child_lock_on', undefined, 'xiaomi_miio');
  }

  toggleBuzzer(e) {
    if (this.isBuzzerOn)
      return this.callService(e, 'fan_set_buzzer_off', undefined, 'xiaomi_miio');

    return this.callService(e, 'fan_set_buzzer_on', undefined, 'xiaomi_miio');
  }

  toggleDry(e) {
    if (this.isDryOn)
      return this.callService(e, 'fan_set_dry_off', undefined, 'xiaomi_miio');

    return this.callService(e, 'fan_set_dry_on', undefined, 'xiaomi_miio');
  }

  getAttribute(attribute) {
    return this.attr[attribute] || '';
  }

  setTargetHumidity(e, value) {
    return this.callService(e, 'fan_set_target_humidity', { humidity: value }, 'xiaomi_miio');
  }

  setFanSpeed(e, id) {
    const item = this.fanSpeedSource.find(s => s.id === id);
    if (item)
      return this.callService(e, 'set_speed', { speed: item.value }, 'fan');

    throw new Error(`could not find value for key ${id}`);
  }

  callService(e, service, inOptions, domain) {
    e.stopPropagation();
    return this.hass.callService(domain, service, {
      entity_id: this.config.entity,
      ...inOptions,
    });
  }
}
