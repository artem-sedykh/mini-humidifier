import { LovelaceCardConfig } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { StyleInfo } from 'lit-html/directives/style-map';

export type Primitive = null | undefined | boolean | number | string | symbol | bigint;

export interface CardConfig extends LovelaceCardConfig {
  readonly type: string;
  readonly entity: string;
  readonly name: string;
  readonly icon: string;
  readonly group: boolean;
  readonly scale: number;
  readonly toggle: ToggleButtonConfig;
  readonly model: string;
  readonly tapAction: TapActionConfig;
  readonly indicators: IndicatorConfig[];
  readonly buttons: (ButtonConfig | DropdownConfig)[];
  readonly power: PowerButtonConfig;
  readonly slider: SliderConfig;
  readonly secondaryInfo: SecondaryInfo;
}

export type ToggleButtonConfig = {
  icon: string;
  hide: boolean;
  default: boolean;
};

export type SecondaryInfo = {
  icon?: string;
  type: string;
};

export enum ElementType {
  Button,
  Dropdown,
}

export enum TapAction {
  MoreInfo = 'more-info',
  Navigate = 'navigate',
  callService = 'call-service',
  Url = 'url',
  None = 'none',
  Toggle = 'toggle',
}

export type TapActionConfig = {
  action: TapAction;
  entity: string;
  service?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceData?: any;
  navigationPath?: string;
  url?: string;
};

export type IconConfig = {
  template: (state: Primitive, context: ExecutionContext) => string | undefined;
  style: (state: Primitive, context: ExecutionContext) => StyleInfo;
};

export type StateConfig = {
  entity: string;
  attribute?: string;
};

export type IndicatorConfig = {
  id: string;
  unit: IconConfig;
  round?: number;
  fixed?: number;
  hide: boolean;
  order: number;
  tapAction: TapActionConfig;
  state: StateConfig;
  stateMapper: (state: Primitive, context: ExecutionContext) => Primitive;
  icon: IconConfig;
  raw: object;
};

export type DropdownItem = {
  id: string;
  name: string;
  order: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type ElementConfigBase = {
  id: string;
  icon: IconConfig;
  actionTimeout: number;
  order: number;
  hide: boolean;
  elementType: ElementType;
  state: StateConfig;
  stateMapper: (state: Primitive, context: ExecutionContext) => Primitive;
  disabled: (state: Primitive, context: ExecutionContext) => boolean;
  style: (state: Primitive, context: ExecutionContext) => StyleInfo;
  raw: object;
  label: (state: Primitive, context: ExecutionContext) => string | undefined;
};

export type ButtonConfig = ElementConfigBase & {
  toggleAction: (state: Primitive, context: ExecutionContext) => Promise<void>;
};

export type DropdownConfig = ElementConfigBase & {
  source: DropdownItem[];
  change: (selected: Primitive, context: ExecutionContext) => Promise<void>;
  active: (state: Primitive, context: ExecutionContext) => boolean;
  sourceFilter: (source: DropdownItem[], context: ExecutionContext) => DropdownItem[];
};

export type PowerButtonConfig = ButtonConfig & {
  type: string;
};

export type SliderConfig = {
  indicator: IndicatorConfig;
  min: number;
  max: number;
  step: number;
  state: StateConfig;
  hide: boolean;
  actionTimeout: number;
  stateMapper: (state: Primitive, context: ExecutionContext) => number;
  change: (selected: number, context: ExecutionContext) => Promise<void>;
  disabled: (state: Primitive, context: ExecutionContext) => boolean;
  raw: object;
};

export type ExecutionContext = {
  entity: HassEntity;
  cardEntity: HassEntity;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  call_service: (domain: string, service: string, serviceData?: { [key: string]: any }) => Promise<void>;
  localize: (string: string, fallback: string) => string;
};

export type DefaultModelConfig = {
  power: DefaultPowerButton;
  slider: DefaultSlider;
  indicators?: { [key: string]: DefaultIndicator };
  buttons?: { [key: string]: DefaultButton | DefaultDropdown };
};

export type DefaultState = {
  entity?: string;
  attribute?: string;
  mapper?: (state: Primitive, context: ExecutionContext) => Primitive;
};

export type DefaultIndicator = {
  unit?: DefaultUnit | string;
  round?: number;
  hide?: boolean;
  order?: number;
  fixed?: number;
  tap_action?: TapActionConfig;
  state?: DefaultState;
  icon: DefaultIcon | string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [property: string]: any;
};

export type DefaultIcon = {
  template?: (state: Primitive, context: ExecutionContext) => string;
  style?: (state: Primitive, context: ExecutionContext) => StyleInfo;
};

export type DefaultUnit = {
  template?: (state: Primitive, context: ExecutionContext) => string;
  style?: (state: Primitive, context: ExecutionContext) => StyleInfo;
};

export type DefaultElement = {
  icon: DefaultIcon | string;
  type: string;
  hide?: boolean;
  order?: number;
  state?: DefaultState;
  label?: (state: Primitive, context: ExecutionContext) => string | undefined;
  disabled?: (state: Primitive, context: ExecutionContext) => boolean;
  style?: (state: Primitive, context: ExecutionContext) => StyleInfo;
  action_timeout?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [property: string]: any;
};

export type DefaultButton = DefaultElement & {
  toggle_action?: (state: Primitive, context: ExecutionContext) => Promise<void>;
};

export type DefaultPowerButton = DefaultButton;

export type DefaultDropdown = DefaultElement & {
  source: DefaultDropdownSource;
  change_action: (selected: Primitive, context: ExecutionContext) => Promise<void>;
  active?: (state: Primitive, context: ExecutionContext) => boolean;
};

export type DefaultSlider = {
  indicator: {
    unit?: DefaultUnit | string;
    round?: number;
    hide?: boolean;
    state?: {
      mapper?: (state: Primitive, context: ExecutionContext) => Primitive;
    };
    icon: DefaultIcon | string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [property: string]: any;
  };
  min: number;
  max: number;
  step: number;
  hide?: boolean;
  action_timeout?: number;
  state?: DefaultState;
  change_action: (selected: Primitive, context: ExecutionContext) => Promise<void>;
};

export type DefaultDropdownSource = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [property: string]: any;
  __filter?: (source: DropdownItem[], context: ExecutionContext) => DropdownItem[];
};
