
export default class HumidifierObject {
  constructor(hass, config, entity) {
    this.hass = hass || {};
    this.config = config || {};
    this.entity = entity || {};
    this.state = entity.state;
    this.attr = entity.attributes;
  }

  get id() {
    return this.entity.entity_id;
  }

  get depth() {
    return this.attr.depth || 0;
  }

  get targetHumidity() {
    return this.attr.target_humidity;
  }

  get minTargetHumidity() {
    return 30;
  }

  get maxTargetHumidity() {
    return 80;
  }

  get targetHumidityStep() {
    return 10;
  }

  get ledBrightness() {
    return this.attr.led_brightness;
  }

  get ledBrightnessSource() {
    // 0 = Bright, 1 = Dim, 2 = Off
    return [
      { id: 0, name: 'Ярко' },
      { id: 1, name: 'Тускло' },
      { id: 2, name: 'Выкл' }];
  }

  get fanSpeed() {
    return this.attr.speed || this.attr.mode;
  }

  get fanSpeedSource() {
    return [
      { id: 'Auto', name: 'Авто' },
      { id: 'Silent', name: 'Тихая' },
      { id: 'Medium', name: 'Средняя' },
      { id: 'High', name: 'Высокая' }];
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

  get currentSpeedMode() {
    return this.attr.mode;
  }

  get temperature() {
    return this.attr.temperature;
  }

  get humidity() {
    return this.attr.humidity;
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

  setLedBrightness(e, value) {
    return this.callService(e, 'fan_set_led_brightness', { brightness: value }, 'xiaomi_miio');
  }

  // Включение выключение устройства
  togglePower(e) {
    if (this.config.toggle_power)
      return this.callService(e, 'toggle', undefined, 'fan');
    if (this.isOff)
      return this.callService(e, 'turn_on', undefined, 'fan');
    else
      this.callService(e, 'turn_off', undefined, 'fan');
  }


  callService(e, service, inOptions, domain) {
    e.stopPropagation();
    return this.hass.callService(domain, service, {
      entity_id: this.config.entity,
      ...inOptions,
    });
  }
}
