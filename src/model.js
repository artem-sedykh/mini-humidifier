
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

  get fanSpeed() {
    return this.attr.speed || '';
  }

  get fanSpeedSource() {
    return [
      { id: 'Auto', name: 'Авто' },
      { id: 'Silent', name: 'Тихий' },
      { id: 'Medium', name: 'Средний' },
      { id: 'High', name: 'Высокий' }];
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

  get currentSpeedMode() {
    return this.attr.mode;
  }

  get currentTemperature() {
    return this.attr.temperature;
  }

  get currentHumidity() {
    return this.attr.humidity;
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
