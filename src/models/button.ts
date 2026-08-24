import { getEntityValue } from '../utils/utils';
import { ACTION_TIMEOUT, STATES_OFF, UNAVAILABLE_STATES } from '../const';
import type { ButtonConfig, HassEntity, HomeAssistant, SourceItem } from '../types';
import type HumidifierObject from './humidifier';

export default class ButtonObject {
  config: ButtonConfig;

  entity: HassEntity;

  humidifier: HumidifierObject;

  private _hass: HomeAssistant;

  private _last_changed: string | undefined;

  private _last_updated: string | undefined;

  constructor(
    entity: HassEntity,
    config: ButtonConfig,
    humidifier: HumidifierObject,
    hass: HomeAssistant,
  ) {
    this.config = config || ({} as ButtonConfig);
    this.entity = entity || ({} as HassEntity);
    this.humidifier = humidifier || ({} as HumidifierObject);
    this._hass = hass || ({} as HomeAssistant);

    if (entity) {
      this._last_changed = entity.last_changed;
      this._last_updated = entity.last_updated;
    }
  }

  get lastChanged(): string | undefined {
    return this._last_changed;
  }

  get lastUpdated(): string | undefined {
    return this._last_updated;
  }

  changed(entity: HassEntity): boolean {
    const e = entity || ({} as HassEntity);

    return this.lastChanged !== e.last_changed || this.lastUpdated !== e.last_updated;
  }

  get id(): string {
    return this.config.id;
  }

  get hass(): HomeAssistant {
    return this._hass;
  }

  get type(): ButtonConfig['type'] {
    return this.config.type;
  }

  get order(): number | undefined {
    return this.config.order;
  }

  get hide(): boolean | undefined {
    return this.config.hide;
  }

  get icon(): string | undefined {
    return this.config.icon;
  }

  // The state as the device reports it, then as the model configuration reads
  // it. Both ends are the user's, so `any` here is the honest type.
  get originalState(): any {
    return getEntityValue(this.entity, this.config.state);
  }

  get state(): any {
    let state = this.originalState;

    if (this.config.functions.state && this.config.functions.state.mapper) {
      state = this.config.functions.state.mapper(state, this.entity, this.humidifier.entity);
    }

    return state;
  }

  isActive(state: unknown): boolean {
    if (this.config.functions.active) {
      return this.config.functions.active(state, this.entity, this.humidifier.entity);
    }

    return false;
  }

  get isUnavailable(): boolean {
    return this.entity === undefined || UNAVAILABLE_STATES.includes(this.state);
  }

  get isOff(): boolean {
    return (
      this.entity !== undefined &&
      STATES_OFF.includes(this.state) &&
      !UNAVAILABLE_STATES.includes(this.state)
    );
  }

  get isOn(): boolean {
    return (
      this.entity !== undefined &&
      !STATES_OFF.includes(this.state) &&
      !UNAVAILABLE_STATES.includes(this.state)
    );
  }

  get disabled(): boolean {
    if (this.config.functions.disabled) {
      return this.config.functions.disabled(this.state, this.entity, this.humidifier.entity);
    }

    return false;
  }

  get style(): Record<string, string> {
    if (this.config.functions.style) {
      return this.config.functions.style(this.state, this.entity, this.humidifier.entity) || {};
    }

    return {};
  }

  get source(): SourceItem[] {
    const { functions } = this.config;
    let source: SourceItem[];

    if (functions && functions.source && functions.source.__init) {
      source = functions.source.__init(this.entity, this.config);
    } else {
      source = Object.entries(this.config.source || {})
        .filter(s => s[0] !== '__filter')
        .map(s => ({ id: s[0], name: s[1] }));
    }

    if (this.config.functions.source && this.config.functions.source.filter) {
      return this.config.functions.source.filter(
        source,
        this.state,
        this.entity,
        this.humidifier.entity,
      );
    }

    return source;
  }

  get selected(): SourceItem | undefined {
    const { state } = this;
    if (state === undefined || state === null) return undefined;
    const find = state.toString().toUpperCase();
    const selected = this.source.find(s => s.id.toString().toUpperCase() === find);
    return selected;
  }

  get actionTimeout(): number {
    if ('action_timeout' in this.config) return this.config.action_timeout as number;

    return ACTION_TIMEOUT;
  }

  handleToggle(): unknown {
    if (this.config.functions.toggle_action) {
      return this.config.functions.toggle_action(this.state, this.entity, this.humidifier.entity);
    }

    return this.humidifier.callService('switch', 'toggle', { entity_id: this.entity.entity_id });
  }

  handleChange(selected: unknown): unknown {
    if (this.config.functions.change_action) {
      return this.config.functions.change_action(
        selected,
        this.state,
        this.entity,
        this.humidifier.entity,
      );
    }

    return undefined;
  }
}
