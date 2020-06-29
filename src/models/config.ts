import {
  ButtonConfig,
  DefaultModelConfig,
  DropdownConfig,
  DropdownItem,
  ElementType,
  HumidifierCardConfig,
  IndicatorConfig,
  PowerButtonConfig,
  Primitive,
  SecondaryInfo,
  TapAction,
  TapActionConfig,
  TargetHumidityConfig,
  ToggleButtonConfig,
} from '../types';
import ICON, { ACTION_TIMEOUT } from '../const';
import HUMIDIFIERS from '../humidifiers';
import { compileTemplate, findTapAction } from '../utils/utils';
import { toggleEntity } from '../utils/toggle-entity';
import { StyleInfo } from 'lit-html/directives/style-map';

export class Config implements HumidifierCardConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly _config: any;
  private readonly _entity: string;
  private readonly _name: string;
  private readonly _type: string;
  private readonly _group: boolean;
  private readonly _icon: string;
  private readonly _scale: number;
  private readonly _model: string;
  private readonly _toggle: ToggleButtonConfig;
  private readonly _tapAction: TapActionConfig;
  private readonly _modelConfig?: DefaultModelConfig;
  private readonly _power: PowerButtonConfig;
  private readonly _targetHumidity: TargetHumidityConfig;
  private readonly _indicators: IndicatorConfig[];
  private readonly _buttons: (ButtonConfig | DropdownConfig)[];
  private readonly _secondaryInfo: SecondaryInfo;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(config: any) {
    if (!config) throw new Error('config not defined!');

    if (!config.entity) throw new Error('entity not set');
    const entity = config.entity?.toString();

    if (entity.split('.')[0] !== 'fan') throw new Error('Specify an entity from within the fan domain.');

    this._config = config;
    this._entity = entity;
    this._name = config.name?.toString();
    this._type = config.type?.toString();
    this._group = !!config.group;
    this._icon = config.icon?.toString();
    this._scale = 1;

    if ('scale' in config && typeof config.scale === 'number') this._scale = config.scale;

    this._toggle = Config._parseToggle(config.toggle);
    this._tapAction = Config._parseTapAction(config.tap_action, this.entity, TapAction.MoreInfo);

    if (config.model && config.model in HUMIDIFIERS) {
      this._model = config.model;
      this._modelConfig = HUMIDIFIERS[config.model]();
    } else {
      this._model = 'default';
      this._modelConfig = HUMIDIFIERS.default();
    }

    this._indicators = this._parseIndicators();
    this._buttons = this._parseButtons();
    this._power = this._parsePowerButton();
    this._targetHumidity = this._parseTargetHumidity();
    this._secondaryInfo = Config._parseSecondaryInfo(config.secondary_info);
  }

  public get type(): string {
    return this._type;
  }
  public get entity(): string {
    return this._entity;
  }
  public get name(): string {
    return this._name;
  }
  public get icon(): string {
    return this._icon;
  }
  public get group(): boolean {
    return this._group;
  }
  public get scale(): number {
    return this._scale;
  }
  public get model(): string {
    return this._model;
  }
  public get power(): PowerButtonConfig {
    return this._power;
  }
  public get targetHumidity(): TargetHumidityConfig {
    return this._targetHumidity;
  }
  public get toggle(): ToggleButtonConfig {
    return this._toggle;
  }
  public get tapAction(): TapActionConfig {
    return this._tapAction;
  }
  public get indicators(): IndicatorConfig[] {
    return this._indicators;
  }
  public get buttons(): (ButtonConfig | DropdownConfig)[] {
    return this._buttons;
  }
  public get secondaryInfo(): SecondaryInfo {
    return this._secondaryInfo;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static _parseToggle(toggleObj: any): ToggleButtonConfig {
    const toggle: ToggleButtonConfig = {
      default: false,
      hide: false,
      icon: ICON.TOGGLE,
    };

    if (typeof toggleObj === 'boolean') {
      toggle.hide = toggleObj as boolean;
      return toggle;
    }

    if (typeof toggleObj === 'object') {
      if ('icon' in toggleObj) toggle.icon = toggleObj.icon?.toString();
      if ('hide' in toggleObj) toggle.hide = !!toggleObj.hide;
      if ('default' in toggleObj) toggle.default = !!toggleObj.default;
    }

    return toggle;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static _parseTapAction(tapActionObj: any, entity: string, defaultAction: TapAction): TapActionConfig {
    const tapAction: TapActionConfig = {
      action: defaultAction,
      entity: entity,
    };

    if (!tapActionObj) return tapAction;

    if (typeof tapActionObj === 'string') {
      const action = findTapAction(tapActionObj);
      if (action) tapAction.action = action;
      return tapAction;
    }

    if (typeof tapActionObj === 'object') {
      if ('action' in tapActionObj) {
        const action = findTapAction(tapActionObj.action);
        if (action) tapAction.action = action;
      }

      if ('entity' in tapActionObj) tapAction.entity = tapActionObj.entity?.toString();
      if ('service' in tapActionObj) tapAction.service = tapActionObj.service?.toString();
      if ('service_data' in tapActionObj) tapAction.serviceData = tapActionObj.service_data;
      if ('navigation_path' in tapActionObj) tapAction.navigationPath = tapActionObj.navigation_path;
      if ('url' in tapActionObj) tapAction.url = tapActionObj.url;
    }

    return tapAction;
  }

  private _parseIndicators(): IndicatorConfig[] {
    const indicators = { ...(this._modelConfig?.indicators || {}) };
    const data = Object.entries(this._config.indicators || {});

    for (let i = 0; i < data.length; i += 1) {
      const key = data[i][0];
      const value = data[i][1] || {};

      if (typeof value === 'object') {
        indicators[key] = { ...(indicators[key] || {}), ...value };
      }
    }

    return Object.entries(indicators)
      .map(([id, value], index) => this._parseIndicator(id, value, index))
      .filter(i => !i.hide);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _parseIndicator(id: string, indicatorObj: any, order: number): IndicatorConfig {
    const indicator: IndicatorConfig = {
      id: id,
      raw: indicatorObj,
      icon: { template: (): string => '', style: (): StyleInfo => ({}) },
      unit: { template: (): string => '', style: (): StyleInfo => ({}) },
      hide: !!indicatorObj.hide,
      order: order,
      round: undefined,
      tapAction: { action: TapAction.None, entity: this.entity },
      state: { entity: this.entity },
      stateMapper: (value): Primitive => value,
    };

    if ('icon' in indicatorObj && indicatorObj.icon) {
      if (typeof indicatorObj.icon === 'string') {
        indicator.icon.template = (): string => indicatorObj.icon;
      } else {
        if (indicatorObj.icon.template) {
          indicator.icon.template = compileTemplate(indicatorObj.icon.template);
        }

        if (indicatorObj.icon.style) {
          indicator.icon.style = compileTemplate(indicatorObj.icon.style);
        }
      }
    }

    if ('unit' in indicatorObj && indicatorObj.unit) {
      if (typeof indicatorObj.unit === 'string') {
        indicator.unit.template = (): string => indicatorObj.unit;
      } else {
        if (indicatorObj.unit.template) {
          indicator.unit.template = compileTemplate(indicatorObj.unit.template);
        }

        if (indicatorObj.unit.style) {
          indicator.unit.style = compileTemplate(indicatorObj.unit.style);
        }
      }
    }

    if ('order' in indicatorObj && typeof indicatorObj.order === 'number') {
      indicator.order = order;
    }

    if (indicatorObj.state) {
      if (typeof indicatorObj.state === 'string') {
        indicator.state.entity = indicatorObj.state;
      } else {
        indicator.state.attribute = indicatorObj.state.attribute?.toString();
        if (indicatorObj.state.entity) indicator.state.entity = indicatorObj.state.entity?.toString();

        if (indicatorObj.state.mapper) {
          indicator.stateMapper = compileTemplate(indicatorObj.state.mapper);
        }
      }
    }

    if ('round' in indicatorObj && typeof indicatorObj.round === 'number') indicator.round = indicatorObj.round;

    if ('fixed' in indicatorObj && typeof indicatorObj.fixed === 'number') indicator.fixed = indicatorObj.fixed;

    indicator.tapAction = Config._parseTapAction(indicatorObj.tap_action, indicator.state.entity, TapAction.None);

    return indicator;
  }

  private _parseButtons(): (ButtonConfig | DropdownConfig)[] {
    const buttons = { ...(this._modelConfig?.buttons || {}) };
    const data = Object.entries(this._config.buttons || {});

    for (let i = 0; i < data.length; i += 1) {
      const key = data[i][0];
      const value = data[i][1] || {};

      if (typeof value === 'object') {
        buttons[key] = { ...(buttons[key] || {}), ...value };
      }
    }

    return Object.entries(buttons)
      .map(([id, value], order) => this._parseButtonBase(id, value, order))
      .filter(i => !i.hide);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _parseButtonBase(id: string, buttonObj: any, order: number): ButtonConfig | DropdownConfig {
    if (buttonObj.type === 'dropdown') return this._parseDropdown(id, buttonObj, order);

    return this._parseButton(id, buttonObj, order);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _parseButton(id: string, buttonObj: any, order: number): ButtonConfig {
    const button: ButtonConfig = {
      id: id,
      raw: buttonObj,
      elementType: ElementType.Button,
      icon: { template: (): string => '', style: (): StyleInfo => ({}) },
      actionTimeout: ACTION_TIMEOUT,
      order: order,
      hide: !!buttonObj.hide,
      state: { entity: this.entity },
      stateMapper: (value): Primitive => value,
      disabled: () => false,
      style: () => ({}),
      toggleAction: (_state, context): Promise<void> => toggleEntity(context.entity, context.call_service),
    };

    if (typeof buttonObj.action_timeout === 'number') button.actionTimeout = buttonObj.action_timeout;
    if (typeof buttonObj.order === 'number') button.order = buttonObj.order;

    if (buttonObj.disabled) {
      button.disabled = compileTemplate(buttonObj.disabled);
    }

    if (buttonObj.toggle_action) {
      button.toggleAction = compileTemplate(buttonObj.toggle_action);
    }

    if (buttonObj.style) {
      button.style = compileTemplate(buttonObj.style);
    }

    if (buttonObj.state) {
      if (typeof buttonObj.state === 'string') {
        button.state.entity = buttonObj.state;
      } else {
        button.state.attribute = buttonObj.state.attribute?.toString();
        if (buttonObj.state.entity) button.state.entity = buttonObj.state.entity?.toString();

        if (buttonObj.state.mapper) {
          button.stateMapper = compileTemplate(buttonObj.state.mapper);
        }
      }
    }

    if ('icon' in buttonObj && buttonObj.icon) {
      if (typeof buttonObj.icon === 'string') {
        button.icon.template = (): string => buttonObj.icon;
      } else {
        if (buttonObj.icon.template) {
          button.icon.template = compileTemplate(buttonObj.icon.template);
        }

        if (buttonObj.icon.style) {
          button.icon.style = compileTemplate(buttonObj.icon.style);
        }
      }
    }
    return button;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _parseDropdown(id: string, dropdownObj: any, order: number): DropdownConfig {
    const dropdown: DropdownConfig = {
      id: id,
      elementType: ElementType.Dropdown,
      raw: dropdownObj,
      icon: { template: (): string => '', style: (): StyleInfo => ({}) },
      actionTimeout: ACTION_TIMEOUT,
      order: order,
      hide: !!dropdownObj.hide,
      state: { entity: this.entity },
      stateMapper: (state): Primitive => state,
      active: () => false,
      disabled: () => false,
      style: () => ({}),
      sourceFilter: source => source,
      source: [],
      change: () =>
        new Promise(() => {
          return;
        }),
    };

    if (typeof dropdownObj.action_timeout === 'number') dropdown.actionTimeout = dropdownObj.action_timeout;
    if (typeof dropdownObj.order === 'number') dropdown.order = dropdownObj.order;

    if (dropdownObj.disabled) {
      dropdown.disabled = compileTemplate(dropdownObj.disabled);
    }

    if (dropdownObj.style) {
      dropdown.style = compileTemplate(dropdownObj.style);
    }

    if (dropdownObj.state) {
      if (typeof dropdownObj.state === 'string') {
        dropdown.state.entity = dropdownObj.state;
      } else {
        dropdown.state.attribute = dropdownObj.state.attribute?.toString();
        if (dropdownObj.state.entity) dropdown.state.entity = dropdownObj.state.entity?.toString();

        if (dropdownObj.state.mapper) {
          dropdown.stateMapper = compileTemplate(dropdownObj.state.mapper);
        }
      }
    }

    if (dropdownObj.change_action) {
      dropdown.change = compileTemplate(dropdownObj.change_action);
    }

    if (dropdownObj.active) {
      dropdown.active = compileTemplate(dropdownObj.active);
    }

    if (typeof dropdownObj.source === 'object') {
      if (dropdownObj.source['__filter']) {
        dropdown.sourceFilter = compileTemplate(dropdownObj.source['__filter']);
      }

      dropdown.source = Object.entries(dropdownObj.source)
        .filter(([key]) => key !== '__filter')
        .map(([key, value], order) => {
          if (typeof value === 'object' && value) {
            const item: DropdownItem = { id: key, name: `${value['name']}`, order: order, ...value };
            return item;
          }
          const item: DropdownItem = { id: key, name: `${value}`, order: order };
          return item;
        })
        .sort((a, b) => (a.order > b.order ? 1 : b.order > a.order ? -1 : 0));
    }

    if ('icon' in dropdownObj && dropdownObj.icon) {
      if (typeof dropdownObj.icon === 'string') {
        dropdown.icon.template = (): string => dropdownObj.icon;
      } else {
        if (dropdownObj.icon.template) {
          dropdown.icon.template = compileTemplate(dropdownObj.icon.template);
        }

        if (dropdownObj.icon.style) {
          dropdown.icon.style = compileTemplate(dropdownObj.icon.style);
        }
      }
    }

    return dropdown;
  }

  private _parsePowerButton(): PowerButtonConfig {
    const powerButtonObj = { ...(this._modelConfig?.power || {}), ...(this._config.power || {}) };
    const button = this._parseButton('power', powerButtonObj, 0);
    return { type: powerButtonObj.type, ...button };
  }

  private _parseTargetHumidity(): TargetHumidityConfig {
    const targetHumidityObj = {
      ...(this._modelConfig?.target_humidity || {}),
      ...(this._config.target_humidity || {}),
    };
    const indicator = this._parseIndicator('target_humidity', targetHumidityObj.indicator || {}, 0);

    const targetHumidity: TargetHumidityConfig = {
      indicator: indicator,
      raw: targetHumidityObj,
      min: 30,
      max: 80,
      step: 10,
      hide: !!targetHumidityObj.hide,
      actionTimeout: ACTION_TIMEOUT,
      disabled: () => false,
      state: { entity: this.entity },
      stateMapper: (value): number => Number(value),
      change: () =>
        new Promise(() => {
          return;
        }),
    };

    if (typeof targetHumidityObj.min === 'number') targetHumidity.min = targetHumidityObj.min;
    if (typeof targetHumidityObj.max === 'number') targetHumidity.max = targetHumidityObj.max;
    if (typeof targetHumidityObj.step === 'number') targetHumidity.step = targetHumidityObj.step;

    if (targetHumidityObj.disabled) {
      targetHumidity.disabled = compileTemplate(targetHumidityObj.disabled);
    }

    if (typeof targetHumidityObj.action_timeout === 'number') {
      targetHumidity.actionTimeout = targetHumidityObj.action_timeout;
    }

    if (targetHumidityObj.state) {
      if (typeof targetHumidityObj.state === 'string') {
        targetHumidity.state.entity = targetHumidityObj.state;
      } else {
        targetHumidity.state.attribute = targetHumidityObj.state.attribute?.toString();
        if (targetHumidityObj.state.entity) targetHumidity.state.entity = targetHumidityObj.state.entity?.toString();

        if (targetHumidityObj.state.mapper) {
          targetHumidity.stateMapper = compileTemplate(targetHumidityObj.state.mapper);
        }
      }
    }

    indicator.state = targetHumidity.state;

    if (targetHumidityObj.change_action) {
      targetHumidity.change = compileTemplate(targetHumidityObj.change_action);
    }

    return targetHumidity;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static _parseSecondaryInfo(secondaryInfoObj: any): SecondaryInfo {
    const secondaryInfo: SecondaryInfo = {
      type: 'mode',
      icon: undefined,
    };

    if (!secondaryInfoObj) return secondaryInfo;

    if (typeof secondaryInfoObj === 'string') {
      secondaryInfo.type = secondaryInfoObj;
      return secondaryInfo;
    }

    if (typeof secondaryInfoObj.icon === 'string') secondaryInfo.icon = secondaryInfoObj.icon;
    if (typeof secondaryInfoObj.type === 'string') secondaryInfo.type = secondaryInfoObj.type;

    return secondaryInfo;
  }
}
