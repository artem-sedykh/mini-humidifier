import { STATES_OFF, UNAVAILABLE_STATES } from '../const';
import type { CardConfig, HassEntity, HomeAssistant } from '../types';

/** The attributes the card renders whether the device reports them or not. */
interface HumidifierAttributes extends Record<string, any> {
  friendly_name: string;
  depth: number;
  target_humidity: number;
  mode: string;
  dry: boolean;
  buzzer: boolean;
  child_lock: boolean;
  led_brightness: number;
}

export default class HumidifierObject {
  hass: HomeAssistant;

  config: CardConfig;

  entity: HassEntity;

  state: string;

  attr: HumidifierAttributes;

  private _last_changed: string;

  private _last_updated: string;

  // `hass` and `config` are guarded the way they always have been. The card
  // never constructs one of these without them - the `hass` setter returns
  // before this point when there is no `hass` - so the fallbacks are for
  // callers that build a model on its own, the tests among them.
  //
  // `entity` is different: it is genuinely absent when the configured entity
  // is not in `hass.states` - renamed, removed, or a typo `setConfig` cannot
  // catch, since it only checks the domain (#263). `this.entity` keeps the
  // undefined, because that is what `isUnavailable` below reads; only the
  // three reads of it are given somewhere to land.
  constructor(hass: HomeAssistant, config: CardConfig, entity: HassEntity) {
    const state = entity || ({} as HassEntity);

    this.hass = hass || ({} as HomeAssistant);
    this.config = config || ({} as CardConfig);
    this.entity = entity;
    this.state = state.state;
    this.attr = {
      friendly_name: '',
      depth: 0,
      target_humidity: 0,
      mode: '',
      dry: false,
      buzzer: false,
      child_lock: false,
      led_brightness: 0,
      ...(state.attributes || {}),
    };

    this._last_changed = state.last_changed;
    this._last_updated = state.last_updated;
  }

  get lastChanged(): string {
    return this._last_changed;
  }

  get lastUpdated(): string {
    return this._last_updated;
  }

  changed(entity: HassEntity): boolean {
    const e = entity || ({} as HassEntity);

    return this.lastChanged !== e.last_changed || this.lastUpdated !== e.last_updated;
  }

  // The configured id when the entity is not in `hass.states` (#263): the
  // update passes build every other entity id off this one, and a card whose
  // own entity has gone still has to say which one it was looking for.
  get id(): string {
    return this.entity ? this.entity.entity_id : this.config.entity;
  }

  get icon(): string | undefined {
    return this.attr.icon;
  }

  get name(): string {
    return this.attr.friendly_name || '';
  }

  get isOff(): boolean {
    return (
      this.entity !== undefined &&
      STATES_OFF.includes(this.state) &&
      !UNAVAILABLE_STATES.includes(this.state)
    );
  }

  get isActive(): boolean {
    return (this.isOff === false && this.isUnavailable === false) || false;
  }

  get isUnavailable(): boolean {
    return this.entity === undefined || UNAVAILABLE_STATES.includes(this.state);
  }

  get isOn(): boolean {
    return (
      this.entity !== undefined &&
      !STATES_OFF.includes(this.state) &&
      !UNAVAILABLE_STATES.includes(this.state)
    );
  }

  callService(domain: string, service: string, options?: Record<string, unknown>) {
    return this.hass.callService(domain, service, options);
  }
}
