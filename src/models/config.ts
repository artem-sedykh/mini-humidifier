import {
  ButtonConfig,
  DefaultModelConfig,
  DropdownConfig,
  DropdownItem,
  ElementType,
  GenericFanConfig,
  IndicatorConfig,
  PowerButtonConfig,
  Primitive,
  SecondaryInfoConfig,
  SliderConfig,
  TapAction,
  TapActionConfig,
  ToggleButtonConfig,
  IconConfig,
  StateConfig,
  ExecutionContext,
} from '../types';
import ICON, { ACTION_TIMEOUT } from '../const';
import DefaultModels from '../default-models';
import { compileTemplate, parseTapAction } from '../utils/utils';
import { toggleEntity } from '../utils/toggle-entity';
import { StyleInfo } from 'lit-html/directives/style-map';

export class Config implements GenericFanConfig {
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
  private readonly _slider: SliderConfig;
  private readonly _indicators: IndicatorConfig[];
  private readonly _buttons: (ButtonConfig | DropdownConfig)[];
  private readonly _secondaryInfo: SecondaryInfoConfig;

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

    this._toggle = Config._ParseToggle(config.toggle);
    this._tapAction = Config._ParseTapAction(config.tap_action, this.entity, TapAction.MoreInfo);

    if (config.model && config.model in DefaultModels) {
      this._model = config.model;
      this._modelConfig = DefaultModels[config.model]();
    } else {
      this._model = 'default';
      this._modelConfig = DefaultModels.default();
    }

    this._indicators = this._parseIndicators();
    this._buttons = this._parseButtons();
    this._power = this._parsePowerButton();
    this._slider = this._parseSlider();
    this._secondaryInfo = this._parseSecondaryInfo();
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
  public get slider(): SliderConfig {
    return this._slider;
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
  public get secondaryInfo(): SecondaryInfoConfig {
    return this._secondaryInfo;
  }

  private static _ParseState(
    model: { state: StateConfig; stateMapper: (state: Primitive, context: ExecutionContext) => Primitive },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modelObj: any,
  ): void {
    if (!modelObj.state) return;

    if (typeof modelObj.state === 'string') {
      if (modelObj.state.includes('.')) {
        model.state.entity = modelObj.state;
      } else {
        model.state.attribute = modelObj.state;
      }
    } else {
      model.state.attribute = modelObj.state.attribute?.toString();
      if (modelObj.state.entity) model.state.entity = modelObj.state.entity?.toString();

      if (modelObj.state.mapper) {
        model.stateMapper = compileTemplate(modelObj.state.mapper);
      }
    }
  }

  private static _ParseDropdownSource(
    model: {
      source: DropdownItem[];
      sourceFilter: (source: DropdownItem[], context: ExecutionContext) => DropdownItem[];
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modelObj: any,
  ): void {
    if (typeof modelObj.source !== 'object') return;

    if (modelObj.source['__filter']) {
      model.sourceFilter = compileTemplate(modelObj.source['__filter']);
    }

    model.source = Object.entries(modelObj.source)
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static _ParseIcon(model: { icon: IconConfig }, modelObj: any): void {
    if (!('icon' in modelObj)) return;
    if (!modelObj.icon) return;

    if (typeof modelObj.icon === 'string') {
      model.icon.template = (): string => modelObj.icon;
    } else {
      if (modelObj.icon.template) {
        model.icon.template = compileTemplate(modelObj.icon.template);
      }

      if (modelObj.icon.style) {
        model.icon.style = compileTemplate(modelObj.icon.style);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static _ParseUnit(model: { unit: IconConfig }, modelObj: any): void {
    if (!('unit' in modelObj)) return;
    if (!modelObj.unit) return;

    if (typeof modelObj.unit === 'string') {
      model.unit.template = (): string => modelObj.unit;
    } else {
      if (modelObj.unit.template) {
        model.unit.template = compileTemplate(modelObj.unit.template);
      }

      if (modelObj.unit.style) {
        model.unit.style = compileTemplate(modelObj.unit.style);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static _ParseToggle(toggleObj: any): ToggleButtonConfig {
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
  private static _ParseTapAction(tapActionObj: any, entity: string, defaultAction: TapAction): TapActionConfig {
    const tapAction: TapActionConfig = {
      entity: entity,
      action: defaultAction,
    };

    if (!tapActionObj) return tapAction;

    if (typeof tapActionObj === 'string') {
      const action = parseTapAction(tapActionObj);
      if (action) tapAction.action = action;
      return tapAction;
    }

    if (typeof tapActionObj === 'object') {
      if ('action' in tapActionObj) {
        const action = parseTapAction(tapActionObj.action);
        if (action) tapAction.action = action;
      }

      if (tapAction.action === TapAction.Toggle) {
        if ('entity' in tapActionObj) tapAction.entity = tapActionObj.entity?.toString();
      } else if (tapAction.action === TapAction.callService) {
        if ('service' in tapActionObj) tapAction.service = tapActionObj.service?.toString();
        if ('service_data' in tapActionObj) tapAction.serviceData = tapActionObj.service_data;
      } else if (tapAction.action === TapAction.Navigate) {
        if ('navigation_path' in tapActionObj) tapAction.navigationPath = tapActionObj.navigation_path;
      } else if (tapAction.action === TapAction.Url) {
        if ('url' in tapActionObj) tapAction.url = tapActionObj.url?.toString();
      }
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
      icon: { template: (): string | undefined => undefined, style: (): StyleInfo => ({}) },
      unit: { template: (): string | undefined => undefined, style: (): StyleInfo => ({}) },
      hide: !!indicatorObj.hide,
      order: order,
      tapAction: { action: TapAction.None, entity: this.entity },
      state: { entity: this.entity, attribute: undefined },
      stateMapper: (value): Primitive => value,
    };

    Config._ParseIcon(indicator, indicatorObj);
    Config._ParseUnit(indicator, indicatorObj);
    Config._ParseState(indicator, indicatorObj);

    if ('order' in indicatorObj && typeof indicatorObj.order === 'number') {
      indicator.order = indicatorObj.order;
    }

    if ('round' in indicatorObj && typeof indicatorObj.round === 'number') {
      if (indicatorObj.round >= 0) indicator.round = indicatorObj.round;
    }

    if ('fixed' in indicatorObj && typeof indicatorObj.fixed === 'number' && indicatorObj.fixed >= 0) {
      indicator.fixed = indicatorObj.fixed;
    }

    indicator.tapAction = Config._ParseTapAction(indicatorObj.tap_action, indicator.state.entity, TapAction.None);

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
      label: (): undefined => undefined,
      raw: buttonObj,
      elementType: ElementType.Button,
      icon: { template: (): string | undefined => undefined, style: (): StyleInfo => ({}) },
      actionTimeout: ACTION_TIMEOUT,
      order: order,
      hide: !!buttonObj.hide,
      state: { entity: this.entity, attribute: undefined },
      stateMapper: (value): Primitive => value,
      disabled: () => false,
      style: () => ({}),
      toggleAction: (_state, context): Promise<void> => toggleEntity(context.entity, context.call_service),
    };

    if (typeof buttonObj.action_timeout === 'number' && buttonObj.action_timeout >= 0) {
      button.actionTimeout = buttonObj.action_timeout;
    }
    if (typeof buttonObj.order === 'number') button.order = buttonObj.order;

    if (buttonObj.disabled) {
      button.disabled = compileTemplate(buttonObj.disabled);
    }

    if (buttonObj.label) {
      button.label = compileTemplate(buttonObj.label);
    }

    if (buttonObj.toggle_action) {
      button.toggleAction = compileTemplate(buttonObj.toggle_action);
    }

    if (buttonObj.style) {
      button.style = compileTemplate(buttonObj.style);
    }

    Config._ParseState(button, buttonObj);
    Config._ParseIcon(button, buttonObj);

    return button;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _parseDropdown(id: string, dropdownObj: any, order: number): DropdownConfig {
    const dropdown: DropdownConfig = {
      id: id,
      elementType: ElementType.Dropdown,
      label: (): undefined => undefined,
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

    Config._ParseState(dropdown, dropdownObj);
    Config._ParseIcon(dropdown, dropdownObj);
    Config._ParseDropdownSource(dropdown, dropdownObj);

    if (typeof dropdownObj.action_timeout === 'number' && dropdownObj.action_timeout >= 0) {
      dropdown.actionTimeout = dropdownObj.action_timeout;
    }

    if (typeof dropdownObj.order === 'number') {
      dropdown.order = dropdownObj.order;
    }

    if (dropdownObj.disabled) {
      dropdown.disabled = compileTemplate(dropdownObj.disabled);
    }

    if (dropdownObj.label) {
      dropdown.label = compileTemplate(dropdownObj.label);
    }

    if (dropdownObj.style) {
      dropdown.style = compileTemplate(dropdownObj.style);
    }

    if (dropdownObj.change_action) {
      dropdown.change = compileTemplate(dropdownObj.change_action);
    }

    if (dropdownObj.active) {
      dropdown.active = compileTemplate(dropdownObj.active);
    }

    return dropdown;
  }

  private _parsePowerButton(): PowerButtonConfig {
    if (typeof this._config.power === 'string') {
      const button = this._parseButton('power', { ...(this._modelConfig?.power || {}) }, 0);
      return { type: this._config.power, ...button };
    }
    const powerButtonObj = { ...(this._modelConfig?.power || {}), ...(this._config.power || {}) };
    const button = this._parseButton('power', powerButtonObj, 0);
    return { type: powerButtonObj.type, ...button };
  }

  private _parseSlider(): SliderConfig {
    const sliderObj = {
      ...(this._modelConfig?.slider || {}),
      ...(this._config.slider || {}),
    };
    const indicator = this._parseIndicator('slider', sliderObj.indicator || {}, 0);

    const slider: SliderConfig = {
      indicator: indicator,
      raw: sliderObj,
      min: 30,
      max: 80,
      step: 10,
      hide: !!sliderObj.hide,
      actionTimeout: ACTION_TIMEOUT,
      disabled: () => false,
      state: { entity: this.entity, attribute: undefined },
      stateMapper: (value): number => Number(value),
      change: () =>
        new Promise(() => {
          return;
        }),
    };

    Config._ParseState(slider, sliderObj);
    indicator.state = slider.state;

    if (typeof sliderObj.min === 'number') slider.min = sliderObj.min;
    if (typeof sliderObj.max === 'number') slider.max = sliderObj.max;
    if (typeof sliderObj.step === 'number') slider.step = sliderObj.step;

    if (sliderObj.disabled) {
      slider.disabled = compileTemplate(sliderObj.disabled);
    }

    if (typeof sliderObj.action_timeout === 'number' && sliderObj.action_timeout >= 0) {
      slider.actionTimeout = sliderObj.action_timeout;
    }

    if (sliderObj.change_action) {
      slider.change = compileTemplate(sliderObj.change_action);
    }

    return slider;
  }

  private _parseSecondaryInfo(): SecondaryInfoConfig {
    const supportedSecondaryInfos = this._modelConfig?.supported_secondary_infos || {};
    let secondaryInfoObj = { type: 'none' };

    if (typeof this._modelConfig?.secondary_info === 'string') {
      secondaryInfoObj.type = this._modelConfig?.secondary_info;
    }

    if (typeof this._modelConfig?.secondary_info === 'object') {
      secondaryInfoObj = { ...secondaryInfoObj, ...this._modelConfig.secondary_info };
    }

    if (typeof this._config.secondary_info === 'string') {
      secondaryInfoObj.type = this._config.secondary_info;
    }

    if (typeof this._config.secondary_info === 'object') {
      secondaryInfoObj = { ...secondaryInfoObj, ...this._config.secondary_info };
    }

    let defaultSecondaryInfoObj = {};
    let originalType = '';

    const secondaryInfo: SecondaryInfoConfig = {
      type: 'none',
      raw: secondaryInfoObj,
      icon: { template: (): string | undefined => undefined, style: (): StyleInfo => ({}) },
      state: { entity: this.entity },
      stateMapper: (state): Primitive => state,
      active: (): boolean => false,
      disabled: (): boolean => false,
      style: (): StyleInfo => ({}),
      sourceFilter: (source): DropdownItem[] => source,
      source: [],
      actionTimeout: ACTION_TIMEOUT,
      change: (): Promise<void> =>
        new Promise(() => {
          return;
        }),
    };

    if (secondaryInfoObj.type in supportedSecondaryInfos) {
      defaultSecondaryInfoObj = supportedSecondaryInfos[secondaryInfoObj.type];
      originalType = supportedSecondaryInfos[secondaryInfoObj.type].type;
    } else {
      const types = ['none', 'last-changed', 'custom', 'custom-dropdown'];
      if (!types.includes(secondaryInfoObj.type)) {
        return secondaryInfo;
      }
      originalType = secondaryInfoObj.type;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mergedSecondaryInfo: any = {
      ...defaultSecondaryInfoObj,
      ...secondaryInfoObj,
    };
    mergedSecondaryInfo.type = originalType;

    if (mergedSecondaryInfo.target_button_id) {
      const targetButtonConf = this.buttons.find(b => b.id === mergedSecondaryInfo.target_button_id);
      if (targetButtonConf) {
        mergedSecondaryInfo = { ...targetButtonConf.raw, ...mergedSecondaryInfo };
      }
    }

    Config._ParseState(secondaryInfo, mergedSecondaryInfo);
    Config._ParseDropdownSource(secondaryInfo, mergedSecondaryInfo);
    Config._ParseIcon(secondaryInfo, mergedSecondaryInfo);

    secondaryInfo.type = mergedSecondaryInfo.type;

    if (typeof mergedSecondaryInfo.action_timeout === 'number' && mergedSecondaryInfo.action_timeout >= 0) {
      secondaryInfo.actionTimeout = mergedSecondaryInfo.action_timeout;
    }

    if (mergedSecondaryInfo.style) {
      secondaryInfo.style = compileTemplate(mergedSecondaryInfo.style);
    }

    if (mergedSecondaryInfo.active) {
      secondaryInfo.active = compileTemplate(mergedSecondaryInfo.active);
    }

    if (mergedSecondaryInfo.disabled) {
      secondaryInfo.disabled = compileTemplate(mergedSecondaryInfo.disabled);
    }

    if (mergedSecondaryInfo.change_action) {
      secondaryInfo.change = compileTemplate(mergedSecondaryInfo.change_action);
    }

    return secondaryInfo;
  }
}
