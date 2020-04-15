
export default class HumidifierObject {
  constructor(hass, config, entity) {
    this.hass = hass || {};
    this.config = config || {};
    this.entity = entity || {};
    this.state = entity.state;
    this.attr = entity.attributes;
    this.__fanSpeedSource = this.__getFanSpeedSource(config.fan_modes);
  }

  get id() {
    return this.entity.entity_id;
  }

  get depth() {
    const depth = 109; // this.attr.depth || 0;

    let value = (100 * depth) / this.config.depth.max_value;

    if (this.config.depth.unit_type === 'liters') {
      value = (value * this.config.depth.volume) / 100;
    }

    return value.toFixed(this.config.depth.fixed);
  }

  get targetHumidity() {
    const humidity = this.attr.target_humidity || 0;
    return {
      min: 30,
      max: 80,
      step: 10,
      value: humidity,
    };
  }

  get fanSpeed() {
    return this.attr.speed || this.attr.mode;
  }

  get fanSpeedSource() {
    return this.__fanSpeedSource;
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

  get temperature() {
    return this.attr.temperature;
  }

  get humidity() {
    return this.attr.humidity;
  }

  __getFanSpeedSource(fanModes) {
    const defaultFanSpeedSource = [
      { id: 'Auto', name: 'Auto' },
      { id: 'Silent', name: 'Silent' },
      { id: 'Medium', name: 'Medium' },
      { id: 'High', name: 'High' }];

    if (!fanModes)
      return defaultFanSpeedSource;

    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(this.config.fan_modes)) {
      const item = defaultFanSpeedSource.find(s => s.id.toUpperCase() === key.toUpperCase());

      if (item)
        item.name = value;
    }

    return defaultFanSpeedSource;
  }

  toggleLedBrightness(e) {
    if (this.isLedBrightnessOn)
      return this.callService(e, 'fan_set_led_brightness', { brightness: 2 }, 'xiaomi_miio');

    return this.callService(e, 'fan_set_led_brightness', { brightness: 1 }, 'xiaomi_miio');
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

  setFanSpeed(e, value) {
    return this.callService(e, 'set_speed', { speed: value }, 'fan');
  }

  callService(e, service, inOptions, domain) {
    e.stopPropagation();
    return this.hass.callService(domain, service, {
      entity_id: this.config.entity,
      ...inOptions,
    });
  }
}
