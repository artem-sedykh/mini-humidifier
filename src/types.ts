// The shapes the card works with, as far as they are actually knowable.
//
// Two of them are not ours and cannot be tightened: `hass` belongs to Home
// Assistant, and the configuration objects start life as the user's YAML. What
// is written down here is what the card reads - anything narrower would be a
// claim this repository is not in a position to make.
//
// Part of the migration in #152, which is file by file rather than at once.

/** One entity, as Home Assistant reports it in `hass.states`. */
export interface HassEntity {
  entity_id: string;
  state: string;
  last_changed: string;
  last_updated: string;
  /** Whatever the integration sends. Model configurations read these by name. */
  attributes: Record<string, any>;
}

/** The four things the card uses out of the `hass` object it is handed. */
export interface HomeAssistant {
  states: Record<string, HassEntity>;
  language?: string;
  selectedLanguage?: string;
  localize: (key: string) => string;
  callService: (
    domain: string,
    service: string,
    data?: Record<string, unknown>,
  ) => Promise<unknown> | void;
}

/**
 * A function compiled out of a model configuration by `compileTemplate`.
 *
 * They are called with the value in question, the entity it came from, and the
 * humidifier entity - some read all three, most read one. The return type
 * varies by callback, so each use names its own.
 */
export type Template<Result = unknown> = (
  value: any,
  entity: HassEntity,
  humidifier: HassEntity,
) => Result;

/** Where a reading comes from: an entity of its own, or an attribute. */
export interface Source {
  entity?: string;
  attribute?: string;
}

/** One option of a dropdown: `id` goes to the device, `name` is read by a user. */
export interface SourceItem {
  id: string;
  name: string;
}

/** What a tap does, from the Lovelace vocabulary the card supports. */
export interface TapAction {
  action?: string;
  entity?: string;
  navigation_path?: string;
  service?: string;
  service_data?: Record<string, unknown>;
  url?: string;
}

export interface IndicatorConfig {
  id: string;
  source: Source;
  tap_action?: TapAction;
  icon?: string | { template?: string; style?: string };
  unit?: string | { template?: string };
  round?: number;
  hide?: boolean;
  order?: number;
  functions: {
    mapper?: Template;
    icon?: { template?: Template<string>; style?: Template<Record<string, string>> };
    unit?: { template?: Template<string> };
  };
}

export interface ButtonConfig {
  id: string;
  /**
   * `toggle` is undocumented and no bundled model uses it, but the power
   * control reads it - a user's YAML can still ask for `ha-entity-toggle`.
   */
  type?: 'button' | 'dropdown' | 'toggle';
  icon?: string;
  /** Always set: `getButtonsConfig` numbers the buttons the YAML leaves out. */
  order: number;
  hide?: boolean;
  state?: Source;
  source?: Record<string, string>;
  action_timeout?: number;
  functions: {
    state?: { mapper?: Template };
    source?: {
      __init?: (entity: HassEntity, config: ButtonConfig) => SourceItem[];
      filter?: (
        source: SourceItem[],
        state: unknown,
        entity: HassEntity,
        humidifier: HassEntity,
      ) => SourceItem[];
    };
    active?: Template<boolean>;
    disabled?: Template<boolean>;
    style?: Template<Record<string, string>>;
    toggle_action?: Template;
    change_action?: (
      selected: unknown,
      state: unknown,
      entity: HassEntity,
      humidifier: HassEntity,
    ) => unknown;
  };
}

export interface TargetHumidityConfig {
  min?: number;
  max?: number;
  step?: number;
  hide?: boolean;
  hide_indicator?: boolean;
  icon?: string;
  unit?: string;
  state?: Source;
  action_timeout?: number;
  functions: {
    icon: { template?: Template<string>; style?: Template<Record<string, string>> };
    unit?: { template?: Template<string> };
    state?: { mapper?: Template };
    disabled?: Template<boolean>;
    change_action?: (
      value: unknown,
      state: unknown,
      entity: HassEntity,
      humidifier: HassEntity,
    ) => unknown;
  };
}

/**
 * The card's own configuration, as `setConfig` leaves it.
 *
 * Only the parts the models read are described so far. The whole of it - the
 * type the option reference in `docs/` could eventually be checked against - is
 * the prize named in #152 and comes with `main.js`.
 */
export interface CardConfig {
  entity: string;
  model: string;
  target_humidity: TargetHumidityConfig;
  indicators: IndicatorConfig[];
  buttons: ButtonConfig[];
  [key: string]: unknown;
}
