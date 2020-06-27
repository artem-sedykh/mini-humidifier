import { LovelaceCardConfig } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { HomeAssistant } from 'custom-card-helpers/dist';

export interface HumidifierCardConfig extends LovelaceCardConfig {
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
  readonly targetHumidity: TargetHumidityConfig;
  readonly secondaryInfo: SecondaryInfo;
}

export type ToggleButtonConfig = {
  icon: string;
  hide: boolean;
  default: boolean;
};

export type SecondaryInfo = {
  icon: string | undefined;
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

export type IndicatorIcon = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  template(value: any, entity: HassEntity, humidifierEntity: HassEntity): string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style(value: any, entity: HassEntity, humidifierEntity: HassEntity): object;
};

export type StateConfig = {
  entity: string;
  attribute?: string;
};

export type IndicatorConfig = {
  id: string;
  unit?: string;
  round?: number;
  hide: boolean;
  order: number;
  tapAction: TapActionConfig;
  state: StateConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stateMapper(state: any, entity: HassEntity, humidifierEntity: HassEntity): any;
  icon: IndicatorIcon;
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
  icon: string;
  actionTimeout: number;
  order: number;
  hide: boolean;
  elementType: ElementType;
  state: StateConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stateMapper(state: any, entity: HassEntity, humidifierEntity: HassEntity): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  disabled(state: any, entity: HassEntity, humidifierEntity: HassEntity): boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style(state: any, entity: HassEntity, humidifierEntity: HassEntity): any;
};

export type ButtonConfig = ElementConfigBase & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toggleAction(hass: HomeAssistant, state: any, entity: HassEntity, humidifierEntity: HassEntity): Promise<void>;
};

export type DropdownConfig = ElementConfigBase & {
  source: DropdownItem[];
  change(
    hass: HomeAssistant,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selected: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: any,
    entity: HassEntity,
    humidifierEntity: HassEntity,
  ): Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  active(state: any, entity: HassEntity, humidifierEntity: HassEntity): any;
  sourceFilter(
    hass: HomeAssistant,
    source: DropdownItem[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: any,
    entity: HassEntity,
    humidifierEntity: HassEntity,
  ): DropdownItem[];
};

export type PowerButtonConfig = ButtonConfig & {
  type: string;
};

export type TargetHumidityConfig = {
  indicator: IndicatorConfig;
  min: number;
  max: number;
  step: number;
  state: StateConfig;
  hide: boolean;
  actionTimeout: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stateMapper(state: any, entity: HassEntity, humidifierEntity: HassEntity): any;
  change(
    hass: HomeAssistant,
    selected: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: any,
    entity: HassEntity,
    humidifierEntity: HassEntity,
  ): Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  disabled(state: any, entity: HassEntity, humidifierEntity: HassEntity): boolean;
};
