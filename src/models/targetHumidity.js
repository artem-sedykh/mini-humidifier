import { getEntityValue } from '../utils/utils';

export default class TargetHumidityObject {
  constructor(hass, entity, config, humidifier) {
    this.entity = entity || {};
    this.config = config;
    this.hass = hass;
    this.humidifier = humidifier;
  }

  get min() {
    return this.config.target_humidity.min;
  }

  get max() {
    return this.config.target_humidity.max;
  }

  get step() {
    return this.config.target_humidity.step;
  }

  get value() {
    return getEntityValue(this.entity, this.config.target_humidity.source);
  }

  get icon() {
    return this.config.target_humidity.icon;
  }

  get hide() {
    return this.config.target_humidity.hide;
  }

  get unit() {
    return this.config.target_humidity.unit;
  }

  get state() {
    let state = this.value;

    if (this.config.target_humidity.functions.state
      && this.config.target_humidity.functions.state.mapper) {
      state = this.config.target_humidity.functions.state.mapper(state, this.entity,
        this.humidifier.entity);
    }

    return state;
  }

  handleChange(value) {
    if (this.config.target_humidity.functions.change_action) {
      return this.config.target_humidity.functions.change_action(value, this.state,
        this.entity, this.humidifier.entity);
    }

    return undefined;
  }
}
