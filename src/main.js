import { html, LitElement } from 'lit';
import { classMap } from 'lit/directives/class-map';
import { styleMap } from 'lit/directives/style-map';
import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';

import style from './style';
import sharedStyle from './sharedStyle';
import handleClick from './utils/handleClick';
import { compileTemplate, toggleState } from './utils/utils';
import { ICON, SUPPORTED_DOMAINS } from './const';

import IndicatorObject from './models/indicator';
import ButtonObject from './models/button';
import TargetHumidityObject from './models/targetHumidity';
import HumidifierObject from './models/humidifier';
import getLabel from './utils/getLabel';
import './initialize';
import HUMIDIFIERS from './humidifiers';
import localize from './localize/localize';
import HumidifierTargetHumidity from './components/targetHumidity';
import HumidifierPower from './components/power';
import HumidifierIndicators from './components/indicators';
import HumidifierButtons from './components/buttons';
import buildElementDefinitions from './utils/buildElementDefinitions';

class MiniHumidifier extends ScopedRegistryHost(LitElement) {
  static get elementDefinitions() {
    return buildElementDefinitions([
      'ha-card',
      'ha-icon',
      'ha-relative-time',
      HumidifierTargetHumidity,
      HumidifierPower,
      HumidifierIndicators,
      'ha-icon-button',
      HumidifierButtons,
    ], MiniHumidifier);
  }

  static getStubConfig(hass, unusedEntities, allEntities) {
    let entity = unusedEntities.find(eid => eid.split('.')[0] === 'fan');
    if (!entity) {
      entity = allEntities.find(eid => eid.split('.')[0] === 'fan');
    }
    return { entity };
  }

  constructor() {
    super();
    this.initial = true;
    this.toggle = false;
    this.indicators = {};
    this.buttons = {};
    this.targetHumidity = {};
    this.power = {};
    this.config = {};
    this.updateIndicatorsTimer = undefined;
    this.updateButtonsTimer = undefined;
  }

  static get properties() {
    return {
      config: {},
      entity: {},
      humidifier: {},
      initial: Boolean,
      toggle: Boolean,
    };
  }

  static get styles() {
    return [
      sharedStyle,
      style,
    ];
  }

  set hass(hass) {
    if (!hass) return;
    const entity = hass.states[this.config.entity];
    let force = false;
    this._hass = hass;

    if (entity && (!this.humidifier || this.humidifier.changed(entity))) {
      this.entity = entity;
      this.humidifier = new HumidifierObject(hass, this.config, entity);
      force = true;
    }

    if (this.humidifier) {
      this.updateIndicators(force);
      this.updateButtons(force);
      this.updateTargetHumidity(force);
      this.updatePower(force);
    }
  }

  get hass() {
    return this._hass;
  }

  get name() {
    return this.config.name || this.humidifier.name;
  }

  evalEntityId(entityId) {
    if (entityId) {
      const name = this.config.entity && this.config.entity.split('.')[1].toLowerCase();
      return entityId.replaceAll('{entity_id}', name);
    }
    return entityId;
  }

  updateIndicators(force) {
    const indicators = { };
    let changed = false;

    for (let i = 0; i < this.config.indicators.length; i += 1) {
      const config = this.config.indicators[i];
      const { id } = config;

      const entityId = this.evalEntityId(config.source.entity || this.humidifier.id);
      const entity = this.hass.states[entityId];

      if (entity) {
        indicators[id] = new IndicatorObject(entity, config, this.humidifier, this.hass);
      }

      if (this.indicators[id] && this.indicators[id].changed(entity)) {
        changed = true;
      }
    }

    if (changed || force) {
      this.indicators = indicators;
      clearTimeout(this.updateIndicatorsTimer);
      this.updateIndicatorsTimer = setTimeout(async () => this.requestUpdate('indicators'), 500);
    }
  }

  updateButtons(force) {
    const buttons = { };
    let changed = false;

    for (let i = 0; i < this.config.buttons.length; i += 1) {
      const config = this.config.buttons[i];
      const { id } = config;

      const entityId = this.evalEntityId((config.state && config.state.entity)
          || this.humidifier.id);

      const entity = this.hass.states[entityId];

      if (entity) {
        buttons[id] = new ButtonObject(entity, config, this.humidifier, this.hass);
      }

      if (this.buttons[id] && this.buttons[id].changed(entity))
        changed = true;
    }

    if (changed || force) {
      this.buttons = buttons;
      clearTimeout(this.updateButtonsTimer);
      this.updateButtonsTimer = setTimeout(async () => this.requestUpdate('buttons'), 500);
    }
  }

  updatePower(force) {
    const config = this.config.power;
    const entityId = this.evalEntityId((config.state && config.state.entity) || this.humidifier.id);
    const entity = this.hass.states[entityId];
    const power = entity ? new ButtonObject(entity, config, this.humidifier, this.hass) : {};

    if ((entity !== (this.power && this.power.entity)) || force)
      this.power = power;
  }

  updateTargetHumidity(force) {
    const entityId = this.evalEntityId((this.config.target_humidity.state
      && this.config.target_humidity.state.entity) || this.config.entity);

    const entity = this.hass.states[entityId];
    const targetHumidity = new TargetHumidityObject(entity, this.config, this.humidifier);

    if (this.targetHumidity.value !== targetHumidity.value || force) {
      this.targetHumidity = targetHumidity;
    }
  }

  getIndicatorConfig(key, value, config) {
    const item = {
      id: key,
      source: { enitity: undefined, attribute: undefined, mapper: undefined },
      icon: '',
      ...value,
    };

    if (typeof value.tap_action === 'string')
      item.tap_action = { action: value.tap_action };
    else
      item.tap_action = { action: 'none', ...item.tap_action || {} };

    item.functions = item.functions || {};
    const context = { ...value };
    context.entity_config = config;
    context.toggle_state = toggleState;

    context.localize = (str, fallback) => {
      const lang = this.hass.selectedLanguage || this.hass.language || 'en';
      return localize(str, lang, fallback);
    };

    if (item.source.mapper) {
      item.functions.mapper = compileTemplate(item.source.mapper, context);
    }

    if (typeof item.icon === 'object') {
      item.functions.icon = {};

      if (item.icon.template)
        item.functions.icon.template = compileTemplate(item.icon.template, context);

      if (item.icon.style)
        item.functions.icon.style = compileTemplate(item.icon.style, context);
    }

    if (typeof item.unit === 'object') {
      item.functions.unit = {};

      if (item.unit.template)
        item.functions.unit.template = compileTemplate(item.unit.template, context);
    }

    return item;
  }

  getIndicatorsConfig(config, indicatorsConfig) {
    const defaultIndicators = indicatorsConfig || {};

    const data = Object.entries(config.indicators || {});

    for (let i = 0; i < data.length; i += 1) {
      const key = data[i][0];
      const value = data[i][1] || {};

      defaultIndicators[key] = { ...defaultIndicators[key] || {}, ...value };
    }

    return Object.entries(defaultIndicators)
      .map(i => this.getIndicatorConfig(i[0], i[1], config))
      .filter(i => !i.hide);
  }

  getButtonConfig(value, config) {
    const item = {
      icon: 'mdi:radiobox-marked',
      type: 'button',
      toggle_action: undefined,
      ...value,
    };

    item.functions = {};

    const context = { ...value };
    context.call_service = (domain, service, options) => this.hass.callService(
      domain, service, options,
    );
    context.entity_config = config;
    context.toggle_state = toggleState;

    context.localize = (str, fallback) => {
      const lang = this.hass.selectedLanguage || this.hass.language || 'en';
      return localize(str, lang, fallback);
    };

    if (item.disabled) {
      item.functions.disabled = compileTemplate(item.disabled, context);
    }

    if (item.state && item.state.mapper) {
      item.functions.state = { mapper: compileTemplate(item.state.mapper, context) };
    }

    if (item.active) {
      item.functions.active = compileTemplate(item.active, context);
    }

    if (item.source && item.source.__init) {
      item.functions.source = { __init: compileTemplate(item.source.__init, context) };
    }

    if (item.source && item.source.__filter) {
      item.functions.source = item.functions.source || {};
      item.functions.source.filter = compileTemplate(item.source.__filter, context);
    }

    if (item.toggle_action) {
      item.functions.toggle_action = compileTemplate(item.toggle_action, context);
    }

    if (item.change_action) {
      item.functions.change_action = compileTemplate(item.change_action, context);
    }

    if (item.style)
      item.functions.style = compileTemplate(item.style, context);

    return item;
  }

  getButtonsConfig(config, buttonsConfig) {
    const defaultButtonsConfig = { ...buttonsConfig || {} };

    const entries = Object.entries(config.buttons || {});

    for (let i = 0; i < entries.length; i += 1) {
      const key = entries[i][0];
      const value = entries[i][1] || {};

      defaultButtonsConfig[key] = { ...defaultButtonsConfig[key] || {}, ...value };
    }

    const data = Object.entries(defaultButtonsConfig);

    const buttons = [];

    for (let i = 0; i < data.length; i += 1) {
      const key = data[i][0];
      const value = data[i][1];
      const button = this.getButtonConfig(value, config);
      button.id = key;

      if (!('order' in button))
        button.order = i + 1;

      buttons.push(button);
    }

    return buttons;
  }

  getTargetHumidityConfig(config, targetHumidityConfig) {
    const item = {
      ...targetHumidityConfig || {},
      ...config.target_humidity || {},
    };

    item.functions = { icon: {} };
    const context = { ...config.target_humidity || {} };
    context.call_service = (domain, service, options) => this.hass.callService(
      domain, service, options,
    );
    context.entity_config = config;
    context.toggle_state = toggleState;

    context.localize = (str, fallback) => {
      const lang = this.hass.selectedLanguage || this.hass.language || 'en';
      return localize(str, lang, fallback);
    };

    if (item.disabled) {
      item.functions.disabled = compileTemplate(item.disabled, context);
    }

    if (typeof item.icon === 'object') {
      if (item.icon.template)
        item.functions.icon.template = compileTemplate(item.icon.template, context);

      if (item.icon.style)
        item.functions.icon.style = compileTemplate(item.icon.style, context);
    }

    if (item.change_action) {
      item.functions.change_action = compileTemplate(item.change_action, context);
    }

    if (item.state && item.state.mapper) {
      item.functions.state = { mapper: compileTemplate(item.state.mapper, context) };
    }

    if (typeof item.unit === 'object') {
      item.functions.unit = {};

      if (item.unit.template)
        item.functions.unit.template = compileTemplate(item.unit.template, context);
    }

    return item;
  }

  getPowerConfig(config, powerConfig) {
    return this.getButtonConfig({ ...powerConfig || {}, ...config.power || {} }, config);
  }

  setConfig(config) {
    const domain = config.entity && config.entity.split('.')[0].toLowerCase();

    if (SUPPORTED_DOMAINS.includes(domain) === false) {
      throw new Error(`Specify an entity from within ${SUPPORTED_DOMAINS.join(' ,')} domains.`);
    }

    let modelConfiguration;
    const { model } = config;

    if (model in HUMIDIFIERS)
      modelConfiguration = HUMIDIFIERS[model]();
    else
      modelConfiguration = HUMIDIFIERS.default();

    this.config = {
      model: 'zhimi.humidifier.cb1',
      tap_action: {
        action: 'more-info',
        navigation_path: '',
        url: '',
        entity: '',
        service: '',
        service_data: {},
      },
      ...config,
    };
    this.config.toggle = {
      icon: ICON.TOGGLE,
      hide: false,
      default: false,
      ...config.toggle || {},
    };

    this.config.power = this.getPowerConfig(config, modelConfiguration.power);
    this.config.target_humidity = this.getTargetHumidityConfig(config,
      modelConfiguration.target_humidity);
    this.config.indicators = this.getIndicatorsConfig(config, modelConfiguration.indicators);
    this.config.buttons = this.getButtonsConfig(config, modelConfiguration.buttons);

    if (typeof config.secondary_info === 'string') {
      this.config.secondary_info = { type: config.secondary_info };
    } else {
      this.config.secondary_info = {
        type: 'mode',
        ...config.secondary_info || {},
      };
    }

    this.toggle = this.config.toggle.default;
  }

  render() {
    if (!MiniHumidifier.elementDefinitionsLoaded) {
      return html``;
    }

    const cls = this.config.target_humidity.hide ? 'full' : '';
    return html`
      <ha-card
        class=${this.computeClasses()}
        style=${this.computeStyles()}>
        <div class='mh__bg'>
        </div>
        <div class='mh-humidifier'>
          <div class='mh-humidifier__core flex'>
            ${this.renderIcon()}
            <div class='entity__info'>
              <div class="wrap">
                <div class="entity__info__name_wrap ${cls}" 
                  @click=${e => this.handlePopup(e)}>
                  ${this.renderEntityName()}
                </div>
                <div class="ctl-wrap">
                  ${this.renderUnavailable()}
                  ${this.renderTargetHumidifier()}
                  ${this.renderPower()}
                </div>
              </div>
              ${this.renderBottomPanel()}
            </div>
          </div>
          ${this.renderTogglePanel()}
        </div>
      </ha-card>
    `;
  }

  renderTargetHumidifier() {
    if (this.humidifier.isUnavailable || this.targetHumidity.hide)
      return '';

    return html`
      <mh-target-humidity
        .targetHumidity=${this.targetHumidity}>
      </mh-target-humidity>
    `;
  }

  renderPower() {
    if (this.humidifier.isUnavailable || this.power.hide)
      return '';

    return html`
        <mh-power
          .power=${this.power}>
        </mh-power>
    `;
  }

  renderUnavailable() {
    if (!this.humidifier.isUnavailable)
      return '';

    return html`
        <span class="label unavailable ellipsis">        
          ${getLabel(this.hass, 'state.default.unavailable', 'Unavailable')}
        </span>
      `;
  }

  handlePopup(e) {
    e.stopPropagation();
    handleClick(this, this.hass, this.config.tap_action, this.humidifier.id);
  }

  handleToggle(e) {
    e.stopPropagation();
    this.toggle = !this.toggle;
  }

  renderIcon() {
    const state = this.humidifier.isActive;
    return html`
      <div class='entity__icon' ?color=${state}>
        <ha-icon .icon=${this.computeIcon()} ></ha-icon>
      </div>`;
  }

  renderTogglePanel() {
    if (!this.toggle)
      return '';

    return html`
        <div class="mh-toggle_content">
          <mh-buttons
            .buttons=${this.buttons}>
          </mh-buttons>
        </div>
    `;
  }

  renderBottomPanel() {
    if (this.humidifier.isUnavailable)
      return '';

    return html`
        <div class='bottom flex'>
          <mh-indicators
            .indicators=${this.indicators}>
          </mh-indicators>
          ${this.renderToggleButton()}
        </div>
    `;
  }

  renderToggleButton() {
    if (this.config.buttons.filter(b => !b.hide).length === 0)
      return '';

    if (this.config.toggle.hide)
      return '';

    const cls = this.toggle ? 'open' : '';
    return html`
        <ha-icon-button class='toggle-button ${cls}'
          @click=${e => this.handleToggle(e)}>
          <ha-icon icon="${this.config.toggle.icon}"></ha-icon>
        </ha-icon-button>
    `;
  }

  renderEntityName() {
    return html`
      <div class='entity__info__name'>
        ${this.name}
      </div>
     ${this.renderSecondaryInfo()}
    `;
  }

  renderSecondaryInfo() {
    if (this.humidifier.isUnavailable)
      return '';

    if (this.config.secondary_info.hide) {
      return '';
    }

    if (this.config.secondary_info.type === 'last-changed') {
      return html`
      <div class='entity__secondary_info ellipsis'>
            <ha-relative-time
              .hass=${this.hass}
              .datetime=${this.entity.last_changed}>
            </ha-relative-time>
      </div>
    `;
    }

    const { mode } = this.buttons;
    const { selected } = mode;
    const label = selected ? selected.name : mode.state;
    const icon = this.config.secondary_info.icon ? this.config.secondary_info.icon : mode.icon;

    return html`
      <div class='entity__secondary_info ellipsis'>
         <ha-icon class='entity__secondary_info_icon' .icon=${icon}></ha-icon>
         <span class='entity__secondary_info__name'>${label}</span>
      </div>
    `;
  }

  computeIcon() {
    return this.config.icon ? this.config.icon : this.humidifier.icon || ICON.DEFAULT;
  }

  computeClasses({ config } = this) {
    return classMap({
      '--initial': this.initial,
      '--collapse': config.collapse,
      '--group': config.group,
      '--more-info': config.tap_action !== 'none',
      '--inactive': !this.humidifier.isActive,
      '--unavailable': this.humidifier.isUnavailable,
    });
  }

  computeStyles() {
    const { scale } = this.config;
    return styleMap({
      ...(scale && { '--mh-unit': `${40 * scale}px` }),
    });
  }
}

customElements.define('mini-humidifier', MiniHumidifier);
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'mini-humidifier',
  name: 'Mini Humidifier',
  preview: true,
  description: 'A custom humidifier card',
  documentationURL: 'https://github.com/artem-sedykh/mini-humidifier',
});
