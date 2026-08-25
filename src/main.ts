import { html, LitElement } from 'lit';
import type { PropertyDeclarations } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

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
import type {
  ButtonConfig,
  CardConfig,
  HassEntity,
  HomeAssistant,
  IndicatorConfig,
  ModelConfiguration,
  RawCardConfig,
  TargetHumidityConfig,
} from './types';
import './components/targetHumidity';
import './components/power';
import './components/indicators';
import './components/buttons';

class MiniHumidifier extends LitElement {
  config!: CardConfig;

  // Both are set by the `hass` setter before anything renders, and the card has
  // always read them without checking.
  entity!: HassEntity;

  humidifier!: HumidifierObject;

  initial: boolean;

  toggle: boolean;

  indicators: Record<string, IndicatorObject>;

  buttons: Record<string, ButtonObject>;

  power: ButtonObject;

  targetHumidity: TargetHumidityObject;

  private _hass: HomeAssistant | undefined;

  private updateIndicatorsTimer: ReturnType<typeof setTimeout> | undefined;

  private updateButtonsTimer: ReturnType<typeof setTimeout> | undefined;

  // `_hass` is part of the signature Home Assistant calls this with, and is not
  // needed to pick an entity out of the two lists that follow it.
  static getStubConfig(
    _hass: HomeAssistant,
    unusedEntities: string[],
    allEntities: string[],
  ): { entity: string | undefined } {
    // Both supported domains, not just `fan`. The Xiaomi integrations this card
    // was written against expose a `fan` entity, but a generic hygrostat or an
    // MQTT humidifier is a `humidifier` one, and on such an installation the
    // picker handed back a config with no entity in it - which `setConfig` then
    // threw on, so the first thing the user saw was a broken card.
    //
    // The order of SUPPORTED_DOMAINS is the preference: `fan` first, because
    // every model in the registry is written against one.
    const pick = (entities: string[]): string | undefined => {
      for (const domain of SUPPORTED_DOMAINS) {
        const entity = entities.find(eid => eid.split('.')[0] === domain);
        if (entity) return entity;
      }
      return undefined;
    };

    return { entity: pick(unusedEntities) ?? pick(allEntities) };
  }

  constructor() {
    super();
    this.initial = true;
    this.toggle = false;
    this.indicators = {};
    this.buttons = {};
    // Empty until `setConfig` and the first `hass`, which is how the card is
    // built: constructed, configured, then given state.
    this.targetHumidity = {} as TargetHumidityObject;
    this.power = {} as ButtonObject;
    this.config = {} as CardConfig;
    this.updateIndicatorsTimer = undefined;
    this.updateButtonsTimer = undefined;
  }

  // `initial` and `toggle` were declared as `Boolean` here. lit reads the value
  // as a declaration and looks for `type` on it; a constructor has none, so it
  // used the defaults - which is what `{}` says, and says on purpose.
  static override get properties(): PropertyDeclarations {
    return {
      config: {},
      entity: {},
      humidifier: {},
      initial: {},
      toggle: {},
    };
  }

  static override get styles() {
    return [sharedStyle, style];
  }

  set hass(hass: HomeAssistant) {
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

  get hass(): HomeAssistant {
    // Only read after the setter has run: everything that reads it renders, and
    // nothing renders before Home Assistant has handed the card its first one.
    return this._hass as HomeAssistant;
  }

  get name(): string {
    return this.config.name || this.humidifier.name;
  }

  evalEntityId(entityId: string): string {
    if (entityId) {
      const name = this.config.entity && this.config.entity.split('.')[1].toLowerCase();
      return entityId.replaceAll('{entity_id}', name);
    }
    return entityId;
  }

  updateIndicators(force: boolean) {
    const indicators: Record<string, IndicatorObject> = {};
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
      this.updateIndicatorsTimer = setTimeout(() => this.requestUpdate('indicators'), 500);
    }
  }

  updateButtons(force: boolean) {
    const buttons: Record<string, ButtonObject> = {};
    let changed = false;

    for (let i = 0; i < this.config.buttons.length; i += 1) {
      const config = this.config.buttons[i];
      const { id } = config;

      const entityId = this.evalEntityId(
        (config.state && config.state.entity) || this.humidifier.id,
      );

      const entity = this.hass.states[entityId];

      if (entity) {
        buttons[id] = new ButtonObject(entity, config, this.humidifier, this.hass);
      }

      if (this.buttons[id] && this.buttons[id].changed(entity)) changed = true;
    }

    if (changed || force) {
      this.buttons = buttons;
      clearTimeout(this.updateButtonsTimer);
      this.updateButtonsTimer = setTimeout(() => this.requestUpdate('buttons'), 500);
    }
  }

  updatePower(force: boolean) {
    const config = this.config.power;
    const entityId = this.evalEntityId((config.state && config.state.entity) || this.humidifier.id);
    const entity = this.hass.states[entityId];
    const power = entity
      ? new ButtonObject(entity, config, this.humidifier, this.hass)
      : ({} as ButtonObject);

    if (entity !== (this.power && this.power.entity) || force) this.power = power;
  }

  updateTargetHumidity(force: boolean) {
    const entityId = this.evalEntityId(
      (this.config.target_humidity.state && this.config.target_humidity.state.entity) ||
        this.config.entity,
    );

    const entity = this.hass.states[entityId];
    const targetHumidity = new TargetHumidityObject(entity, this.config, this.humidifier);

    if (this.targetHumidity.value !== targetHumidity.value || force) {
      this.targetHumidity = targetHumidity;
    }
  }

  getIndicatorConfig(key: string, value: any, config: RawCardConfig): IndicatorConfig {
    const item = {
      id: key,
      // This used to seed three keys, all `undefined`, and one of them was
      // spelled `enitity`. Nothing read any of them: an indicator that names no
      // source of its own falls back to the card's entity where the entity id
      // is resolved, and an absent `attribute` reads the entity's state. The
      // object only has to exist at all, so that `item.source.mapper` below is
      // safe to reach through. Empty says exactly that and cannot be
      // misspelled - `Source` in `types.ts` is where the shape is described.
      source: {},
      icon: '',
      ...value,
    };

    if (typeof value.tap_action === 'string') item.tap_action = { action: value.tap_action };
    else item.tap_action = { action: 'none', ...(item.tap_action || {}) };

    item.functions = item.functions || {};
    const context = { ...value };
    context.entity_config = config;
    context.toggle_state = toggleState;

    context.localize = (str: string, fallback?: string) => {
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

      if (item.icon.style) item.functions.icon.style = compileTemplate(item.icon.style, context);
    }

    if (typeof item.unit === 'object') {
      item.functions.unit = {};

      if (item.unit.template)
        item.functions.unit.template = compileTemplate(item.unit.template, context);
    }

    return item;
  }

  getIndicatorsConfig(config: RawCardConfig, indicatorsConfig: any): IndicatorConfig[] {
    const defaultIndicators = indicatorsConfig || {};

    const data = Object.entries(config.indicators || {});

    for (let i = 0; i < data.length; i += 1) {
      const key = data[i][0];
      const value = data[i][1] || {};

      defaultIndicators[key] = { ...(defaultIndicators[key] || {}), ...value };
    }

    return Object.entries(defaultIndicators)
      .map((entry, i) => {
        const indicator = this.getIndicatorConfig(entry[0], entry[1], config);

        // Same rule as the buttons: an indicator the configuration does not
        // number takes its position. Without it the sort in `mh-indicators`
        // would compare against `undefined` and leave the order to chance.
        if (!('order' in indicator)) indicator.order = i;

        return indicator;
      })
      .filter(i => !i.hide);
  }

  getButtonConfig(value: any, config: RawCardConfig): ButtonConfig {
    const item = {
      icon: 'mdi:radiobox-marked',
      type: 'button',
      toggle_action: undefined,
      ...value,
    };

    item.functions = {};

    const context = { ...value };
    context.call_service = (domain: string, service: string, options: Record<string, unknown>) =>
      this.hass.callService(domain, service, options);
    context.entity_config = config;
    context.toggle_state = toggleState;

    context.localize = (str: string, fallback?: string) => {
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

    if (item.style) item.functions.style = compileTemplate(item.style, context);

    return item;
  }

  getButtonsConfig(config: RawCardConfig, buttonsConfig: any): ButtonConfig[] {
    const defaultButtonsConfig = { ...(buttonsConfig || {}) };

    const entries = Object.entries(config.buttons || {});

    for (let i = 0; i < entries.length; i += 1) {
      const key = entries[i][0];
      const value = entries[i][1] || {};

      defaultButtonsConfig[key] = { ...(defaultButtonsConfig[key] || {}), ...value };
    }

    const data = Object.entries(defaultButtonsConfig);

    const buttons = [];

    for (let i = 0; i < data.length; i += 1) {
      const key = data[i][0];
      const value = data[i][1];
      const button = this.getButtonConfig(value, config);
      button.id = key;

      if (!('order' in button)) button.order = i + 1;

      buttons.push(button);
    }

    return buttons;
  }

  getTargetHumidityConfig(config: RawCardConfig, targetHumidityConfig: any): TargetHumidityConfig {
    const item = {
      ...(targetHumidityConfig || {}),
      ...(config.target_humidity || {}),
    };

    item.functions = { icon: {} };
    const context = { ...(config.target_humidity || {}) };
    context.call_service = (domain: string, service: string, options: Record<string, unknown>) =>
      this.hass.callService(domain, service, options);
    context.entity_config = config;
    context.toggle_state = toggleState;

    context.localize = (str: string, fallback?: string) => {
      const lang = this.hass.selectedLanguage || this.hass.language || 'en';
      return localize(str, lang, fallback);
    };

    if (item.disabled) {
      item.functions.disabled = compileTemplate(item.disabled, context);
    }

    if (typeof item.icon === 'object') {
      if (item.icon.template)
        item.functions.icon.template = compileTemplate(item.icon.template, context);

      if (item.icon.style) item.functions.icon.style = compileTemplate(item.icon.style, context);
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

  getPowerConfig(config: RawCardConfig, powerConfig: any): ButtonConfig {
    return this.getButtonConfig({ ...(powerConfig || {}), ...(config.power || {}) }, config);
  }

  setConfig(config: RawCardConfig) {
    const domain = config.entity && config.entity.split('.')[0].toLowerCase();

    if (SUPPORTED_DOMAINS.includes(domain) === false) {
      throw new Error(`Specify an entity from within ${SUPPORTED_DOMAINS.join(' ,')} domains.`);
    }

    const { model } = config;
    const bundled = model === undefined ? undefined : HUMIDIFIERS[model];

    if (model !== undefined && bundled === undefined) {
      // A model the card does not ship for is **not** an error, and this is
      // deliberately not thrown. The card is written to be described in YAML
      // end to end precisely because nobody knows every humidifier on the
      // market: a configuration that names its own device and writes out its
      // own controls - see issue #112, which is a working one for a
      // `deerma.humidifier.jsq2w` - is the card being used as intended, and
      // refusing it would break configurations that work today.
      //
      // What was wrong was doing this in silence: `deerma.humidifier.mjjsq`
      // and `xiaomi_miio_airpurifier:deerma.humidifier.mjjsq` are the same
      // hardware through two integrations that call different services, so a
      // typo hands someone another device's defaults and nothing says so.
      //
      // A warning covers both, and it costs the first case nothing. It is also
      // all a throw would have achieved: checked on Home Assistant 2026.8.3, a
      // thrown `setConfig` message reaches the console and never the card -
      // `hui-error-card` there draws a red icon and drops the text, as it does
      // for a built-in card with a broken config. Both roads end in the
      // console, and only one of them breaks working dashboards.
      const known = Object.keys(HUMIDIFIERS).filter(id => id !== 'default');

      console.warn(
        `mini-humidifier: '${model}' is not one of the bundled model configurations, so the ` +
          `card started from the default one. That is supported - it is how a device the card ` +
          `does not ship for is described, with the controls written out in the card's own ` +
          `options. If you meant a bundled model, they are: ${known.join(', ')}.`,
      );
    }

    const modelConfiguration: ModelConfiguration = (bundled ?? HUMIDIFIERS.default)();

    // The sections below are filled in immediately after, which is what makes
    // this a `CardConfig` rather than the YAML it starts as.
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
      // Not a `CardConfig` yet: every section below is replaced with its
      // resolved form in the statements that follow, and only then is it one.
    } as unknown as CardConfig;
    this.config.toggle = {
      icon: ICON.TOGGLE,
      hide: false,
      default: false,
      ...(config.toggle || {}),
    };

    this.config.power = this.getPowerConfig(config, modelConfiguration.power);
    this.config.target_humidity = this.getTargetHumidityConfig(
      config,
      modelConfiguration.target_humidity,
    );
    this.config.indicators = this.getIndicatorsConfig(config, modelConfiguration.indicators);
    this.config.buttons = this.getButtonsConfig(config, modelConfiguration.buttons);

    if (typeof config.secondary_info === 'string') {
      this.config.secondary_info = { type: config.secondary_info };
    } else {
      this.config.secondary_info = {
        type: 'mode',
        ...(config.secondary_info || {}),
      };
    }

    this.toggle = this.config.toggle.default;
  }

  override render() {
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
                  @click=${(e: Event) => this.handlePopup(e)}>
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
    if (this.humidifier.isUnavailable || this.targetHumidity.hide) return '';

    return html`
      <mh-target-humidity
        .targetHumidity=${this.targetHumidity}>
      </mh-target-humidity>
    `;
  }

  renderPower() {
    if (this.humidifier.isUnavailable || this.power.hide) return '';

    return html`
        <mh-power
          .power=${this.power}>
        </mh-power>
    `;
  }

  renderUnavailable() {
    if (!this.humidifier.isUnavailable) return '';

    return html`
        <span class="label unavailable ellipsis">        
          ${getLabel(this.hass, 'state.default.unavailable', 'Unavailable')}
        </span>
      `;
  }

  handlePopup(e: Event) {
    e.stopPropagation();
    handleClick(this, this.hass, this.config.tap_action, this.humidifier.id);
  }

  handleToggle(e: Event) {
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
    if (!this.toggle) return '';

    return html`
        <div class="mh-toggle_content">
          <mh-buttons
            .buttons=${this.buttons}>
          </mh-buttons>
        </div>
    `;
  }

  renderBottomPanel() {
    if (this.humidifier.isUnavailable) return '';

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
    if (this.config.buttons.filter(b => !b.hide).length === 0) return '';

    if (this.config.toggle.hide) return '';

    const cls = this.toggle ? 'open' : '';
    return html`
        <ha-icon-button class='toggle-button ${cls}'
          @click=${(e: Event) => this.handleToggle(e)}>
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
    if (this.humidifier.isUnavailable) return '';

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
      '--collapse': !!config.collapse,
      '--group': !!config.group,
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

declare global {
  interface Window {
    /** The list Home Assistant reads to offer a card in the picker. */
    customCards: Record<string, unknown>[];
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'mini-humidifier',
  name: 'Mini Humidifier',
  preview: true,
  description: 'A custom humidifier card',
  documentationURL: 'https://github.com/artem-sedykh/mini-humidifier',
});
