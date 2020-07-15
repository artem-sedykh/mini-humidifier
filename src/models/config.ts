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
import ICON, { ACTION_TIMEOUT, EmptyPromise } from '../const';
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
  private readonly _modelConfig: DefaultModelConfig;
  private readonly _power: PowerButtonConfig;
  private readonly _slider: SliderConfig;
  private readonly _indicators: IndicatorConfig[];
  private readonly _buttons: (ButtonConfig | DropdownConfig)[];
  private readonly _secondaryInfo: SecondaryInfoConfig;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(config: any) {
    if (!config) {
      throw new Error('config not defined!');
    }

    if (!config.entity) {
      throw new Error('entity not set');
    }

    const entity = config.entity.toString();

    if (entity.split('.')[0] !== 'fan') {
      throw new Error('Specify an entity from within the fan domain.');
    }

    this._config = config;
    this._entity = entity;
    this._name = config.name?.toString();
    this._type = config.type?.toString();
    this._group = !!config.group;
    this._icon = config.icon?.toString();
    this._scale = 1;

    if ('scale' in config && typeof config.scale === 'number') {
      this._scale = config.scale;
    }

    this._toggle = Config._ParseToggle(config.toggle);
    this._tapAction = Config._ParseTapActionConfig(config.tap_action, this.entity, TapAction.MoreInfo);

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
    entity: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stateObj: any,
  ): { state: StateConfig; stateMapper: (state: Primitive, context: ExecutionContext) => Primitive } {
    const model: { state: StateConfig; stateMapper: (state: Primitive, context: ExecutionContext) => Primitive } = {
      state: { entity: entity, attribute: undefined },
      stateMapper: (value): Primitive => value,
    };

    if (stateObj === null || stateObj === undefined) {
      return model;
    }

    if (typeof stateObj === 'string') {
      if (stateObj.includes('.')) {
        model.state.entity = stateObj;
      } else {
        model.state.attribute = stateObj;
      }
    }

    if (typeof stateObj === 'object') {
      model.state.attribute = stateObj.attribute;
      if (stateObj.entity) {
        model.state.entity = stateObj.entity;
      }

      if (stateObj.mapper) {
        model.stateMapper = compileTemplate(stateObj.mapper);
      }
    }

    return model;
  }

  private static _ParseDropdownSource(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sourceObj: any,
  ): { source: DropdownItem[]; sourceFilter: (source: DropdownItem[], context: ExecutionContext) => DropdownItem[] } {
    const model: {
      source: DropdownItem[];
      sourceFilter: (source: DropdownItem[], context: ExecutionContext) => DropdownItem[];
    } = {
      source: [],
      sourceFilter: source => source,
    };

    if (sourceObj === null || sourceObj === undefined) {
      return model;
    }

    if (typeof sourceObj !== 'object') return model;

    if (sourceObj['__filter']) {
      model.sourceFilter = compileTemplate(sourceObj['__filter']);
    }

    model.source = Object.entries(sourceObj)
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

    return model;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static _ParseIconConfig(modelObj: any): IconConfig {
    const model: IconConfig = {
      template: (): string | undefined => undefined,
      style: (): StyleInfo => ({}),
    };

    if (modelObj === null || modelObj === undefined) {
      return model;
    }

    if (typeof modelObj === 'string') {
      model.template = (): string => modelObj;
    }

    if (typeof modelObj === 'object') {
      if (modelObj.template) {
        model.template = compileTemplate(modelObj.template);
      }

      if (modelObj.style) {
        model.style = compileTemplate(modelObj.style);
      }
    }

    return model;
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
      if ('icon' in toggleObj && toggleObj.icon) {
        toggle.icon = toggleObj.icon;
      }

      if ('hide' in toggleObj) {
        toggle.hide = !!toggleObj.hide;
      }

      if ('default' in toggleObj) {
        toggle.default = !!toggleObj.default;
      }
    }

    return toggle;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static _ParseTapActionConfig(tapActionObj: any, entity: string, defaultAction: TapAction): TapActionConfig {
    const tapAction: TapActionConfig = {
      entity: entity,
      action: defaultAction,
    };

    if (!tapActionObj) {
      return tapAction;
    }

    if (typeof tapActionObj === 'string') {
      const action = parseTapAction(tapActionObj);
      if (action) {
        tapAction.action = action;
      }
      return tapAction;
    }

    if (typeof tapActionObj !== 'object') {
      return tapAction;
    }

    if ('action' in tapActionObj) {
      const action = parseTapAction(tapActionObj.action);
      if (action) {
        tapAction.action = action;
      }
    }

    switch (tapAction.action) {
      case TapAction.Toggle: {
        if ('entity' in tapActionObj && tapAction.entity) {
          tapAction.entity = tapActionObj.entity;
        }
        break;
      }
      case TapAction.CallService: {
        if ('service' in tapActionObj && tapActionObj.service) {
          tapAction.service = tapActionObj.service;
        }
        if ('service_data' in tapActionObj) {
          tapAction.serviceData = tapActionObj.service_data;
        }
        break;
      }
      case TapAction.Navigate: {
        if ('navigation_path' in tapActionObj) {
          tapAction.navigationPath = tapActionObj.navigation_path;
        }
        break;
      }
      case TapAction.Url: {
        if ('url' in tapActionObj && tapActionObj.url) {
          tapAction.url = tapActionObj.url;
        }
        break;
      }
      default: {
        break;
      }
    }

    return tapAction;
  }

  private _parseIndicators(): IndicatorConfig[] {
    const indicators = { ...(this._modelConfig.indicators || {}) };
    const data = Object.entries(this._config.indicators || {});

    for (let i = 0; i < data.length; i += 1) {
      const key = data[i][0];
      const value = data[i][1];

      if (typeof value === 'object' && value) {
        indicators[key] = { ...(indicators[key] || {}), ...value };
      }
    }

    return Object.entries(indicators)
      .map(([id, value], index) => this._parseIndicator(id, value, index))
      .filter(i => !i.hide);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _parseIndicator(id: string, indicatorObj: any, order: number): IndicatorConfig {
    const stateModel = Config._ParseState(this.entity, indicatorObj.state);

    const indicator: IndicatorConfig = {
      id: id,
      raw: indicatorObj,
      icon: Config._ParseIconConfig(indicatorObj.icon),
      unit: Config._ParseIconConfig(indicatorObj.unit),
      hide: !!indicatorObj.hide,
      order: order,
      tapAction: { action: TapAction.None, entity: this.entity },
      state: stateModel.state,
      stateMapper: stateModel.stateMapper,
    };

    if ('order' in indicatorObj && typeof indicatorObj.order === 'number') {
      indicator.order = indicatorObj.order;
    }

    if ('round' in indicatorObj && typeof indicatorObj.round === 'number') {
      if (indicatorObj.round >= 0) indicator.round = indicatorObj.round;
    }

    if ('fixed' in indicatorObj && typeof indicatorObj.fixed === 'number' && indicatorObj.fixed >= 0) {
      indicator.fixed = indicatorObj.fixed;
    }

    indicator.tapAction = Config._ParseTapActionConfig(indicatorObj.tap_action, indicator.state.entity, TapAction.None);

    return indicator;
  }

  private _parseButtons(): (ButtonConfig | DropdownConfig)[] {
    const buttons = { ...(this._modelConfig.buttons || {}) };
    const data = Object.entries(this._config.buttons || {});

    for (let i = 0; i < data.length; i += 1) {
      const key = data[i][0];
      const value = data[i][1];

      if (typeof value === 'object' && value) {
        buttons[key] = { ...(buttons[key] || {}), ...value };
      }
    }

    return Object.entries(buttons)
      .map(([id, value], order) => this._parseButtonBase(id, value, order))
      .filter(i => !i.hide);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _parseButtonBase(id: string, buttonObj: any, order: number): ButtonConfig | DropdownConfig {
    if (buttonObj.type === 'dropdown') {
      return this._parseDropdown(id, buttonObj, order);
    }

    return this._parseButton(id, buttonObj, order);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _parseButton(id: string, buttonObj: any, order: number): ButtonConfig {
    const stateModel = Config._ParseState(this.entity, buttonObj.state);

    const button: ButtonConfig = {
      id: id,
      label: (): undefined => undefined,
      raw: buttonObj,
      elementType: ElementType.Button,
      icon: Config._ParseIconConfig(buttonObj.icon),
      actionTimeout: ACTION_TIMEOUT,
      order: order,
      hide: !!buttonObj.hide,
      state: stateModel.state,
      stateMapper: stateModel.stateMapper,
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

    return button;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _parseDropdown(id: string, dropdownObj: any, order: number): DropdownConfig {
    const stateModel = Config._ParseState(this.entity, dropdownObj.state);
    const dropdownSourceModel = Config._ParseDropdownSource(dropdownObj.source);

    const dropdown: DropdownConfig = {
      id: id,
      elementType: ElementType.Dropdown,
      label: (): undefined => undefined,
      raw: dropdownObj,
      icon: Config._ParseIconConfig(dropdownObj.icon),
      actionTimeout: ACTION_TIMEOUT,
      order: order,
      hide: !!dropdownObj.hide,
      state: stateModel.state,
      stateMapper: stateModel.stateMapper,
      active: () => false,
      disabled: () => false,
      style: () => ({}),
      source: dropdownSourceModel.source,
      sourceFilter: dropdownSourceModel.sourceFilter,
      change: EmptyPromise,
    };

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
      const button = this._parseButton('power', { ...(this._modelConfig.power || {}) }, 0);
      const type = this._config.power === 'toggle' ? 'toggle' : 'button';
      return { type: type, ...button };
    }
    const powerButtonObj = { ...(this._modelConfig.power || {}), ...(this._config.power || {}) };
    const button = this._parseButton('power', powerButtonObj, 0);
    const type = powerButtonObj.type === 'toggle' ? 'toggle' : 'button';
    return { type: type, ...button };
  }

  private _parseSlider(): SliderConfig {
    const sliderObj = {
      ...(this._modelConfig.slider || {}),
      ...(this._config.slider || {}),
    };
    const indicator = this._parseIndicator('slider', sliderObj.indicator || {}, 0);
    const stateModel = Config._ParseState(this.entity, sliderObj.state);
    indicator.state = stateModel.state;

    const slider: SliderConfig = {
      indicator: indicator,
      raw: sliderObj,
      min: 30,
      max: 80,
      step: 10,
      hide: !!sliderObj.hide,
      actionTimeout: ACTION_TIMEOUT,
      disabled: () => false,
      state: stateModel.state,
      stateMapper: stateModel.stateMapper,
      change: EmptyPromise,
    };

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
    const supportedSecondaryInfos = this._modelConfig.supported_secondary_infos || {};
    let secondaryInfoObj = { type: 'none' };

    if (typeof this._modelConfig.secondary_info === 'string') {
      secondaryInfoObj.type = this._modelConfig.secondary_info;
    }

    if (typeof this._modelConfig.secondary_info === 'object') {
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
      change: EmptyPromise,
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

    const stateModel = Config._ParseState(this.entity, mergedSecondaryInfo.state);
    const dropdownSourceModel = Config._ParseDropdownSource(mergedSecondaryInfo.source);

    secondaryInfo.state = stateModel.state;
    secondaryInfo.stateMapper = stateModel.stateMapper;
    secondaryInfo.source = dropdownSourceModel.source;
    secondaryInfo.sourceFilter = dropdownSourceModel.sourceFilter;

    secondaryInfo.icon = Config._ParseIconConfig(mergedSecondaryInfo);

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
