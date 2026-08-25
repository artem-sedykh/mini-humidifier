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
  /**
   * `getButtonsConfig` numbers the buttons the YAML leaves out, so every button
   * the panel renders has one. The power control goes through the same builder
   * and never gets one, which is why this is optional.
   */
  order?: number;
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
 * What a model configuration factory in `src/configurations/` returns: four
 * sections of defaults, still untyped inside. Those files are the last thing
 * #152 migrates - they are evaluated with `this` bound to the card - so what is
 * described here is their shape, not their contents.
 */
export interface ModelConfiguration {
  power: Record<string, any>;
  target_humidity: Record<string, any>;
  indicators: Record<string, Record<string, any>>;
  buttons: Record<string, Record<string, any>>;
}

/** How the entity name is annotated underneath itself. */
export interface SecondaryInfoConfig {
  type?: string;
  icon?: string;
  hide?: boolean;
}

/** The button panel's own toggle, the one that opens the row of buttons. */
export interface ToggleConfig {
  icon: string;
  hide: boolean;
  default: boolean;
}

/**
 * The card's configuration as the user wrote it.
 *
 * Everything is optional and several options accept two shapes, because this is
 * YAML that a person typed. `setConfig` is where it stops being this and starts
 * being a `CardConfig`.
 */
export interface RawCardConfig {
  entity: string;
  model?: string;
  name?: string;
  icon?: string;
  scale?: number;
  group?: boolean;
  tap_action?: string | TapAction;
  toggle?: Partial<ToggleConfig>;
  secondary_info?: string | SecondaryInfoConfig;
  power?: Record<string, any>;
  target_humidity?: Record<string, any>;
  indicators?: Record<string, Record<string, any> | undefined>;
  buttons?: Record<string, Record<string, any> | undefined>;
  [key: string]: unknown;
}

/**
 * The card's configuration as `setConfig` leaves it: the user's YAML merged
 * over the defaults of the model it names, with every template compiled into a
 * callback.
 *
 * This is the type #152 calls the prize - the one the option reference in
 * `docs/` could be checked against. It describes what the card reads, not
 * everything a user may write: an option that is not here is not one the card
 * looks at.
 */
export interface CardConfig {
  entity: string;
  model: string;
  name?: string;
  icon?: string;
  scale?: number;
  group?: boolean;
  /**
   * Whatever the YAML had, unchanged: `setConfig` spreads the user's options
   * over its defaults, so `tap_action: none` written as a string arrives here
   * as one. `computeClasses` compares against that string, and `handleClick`
   * reads `.action` off the object form.
   */
  tap_action: TapAction | string;
  toggle: ToggleConfig;
  secondary_info: SecondaryInfoConfig;
  power: ButtonConfig;
  target_humidity: TargetHumidityConfig;
  indicators: IndicatorConfig[];
  buttons: ButtonConfig[];
  [key: string]: unknown;
}
