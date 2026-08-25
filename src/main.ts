import { html, LitElement } from 'lit';
import type { PropertyDeclarations } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import style from './style';
import sharedStyle from './sharedStyle';
import handleClick from './utils/handleClick';
import buildCardConfig from './config/buildConfig';
import validateConfig from './utils/validateConfig';
import configForm from './configForm';
import { ICON, SUPPORTED_DOMAINS } from './const';

import IndicatorObject from './models/indicator';
import ButtonObject from './models/button';
import TargetHumidityObject from './models/targetHumidity';
import HumidifierObject from './models/humidifier';
import getLabel from './utils/getLabel';
import './initialize';
import HUMIDIFIERS from './humidifiers';
import localize from './localize/localize';
import type { TemplateRuntime } from './config/buildConfig';
import type {
  CardConfig,
  HassEntity,
  HomeAssistant,
  ModelConfiguration,
  RawCardConfig,
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

  /**
   * What has already been warned about, so that it is said once rather than on
   * every `hass`. Cleared by `setConfig`: a corrected configuration deserves
   * to be told about again.
   */
  private warned: Set<string>;

  private updateIndicatorsTimer: ReturnType<typeof setTimeout> | undefined;

  private updateButtonsTimer: ReturnType<typeof setTimeout> | undefined;

  // `_hass` is part of the signature Home Assistant calls this with, and is not
  // needed to pick an entity out of the two lists that follow it.
  static getStubConfig(
    _hass: HomeAssistant,
    unusedEntities: string[],
    allEntities: string[],
  ): { entity: string | undefined; model?: string } {
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

    const entity = pick(unusedEntities) ?? pick(allEntities);

    // A card added from the picker names its preset, when there is a right one
    // to name (#214).
    //
    // With no `model:` the card starts from `zhimi.humidifier.cb1`, and for
    // anyone whose humidifier is not a Xiaomi that first impression is a
    // half-empty card wired to a device they do not own - indicators reading
    // `sensor.<entity>_temperature`, buttons calling Xiaomi services. "Which
    // preset am I on" is the most common confusion in the tracker, and nobody
    // arrives knowing that no model already means a particular one.
    //
    // `humidifier` entities get the domain preset, which is built on what Home
    // Assistant guarantees for that domain and works anywhere it does. `fan`
    // entities do not: every device-specific preset here is written against
    // one, and the domain preset's `humidifier.*` service calls would be wrong.
    // Existing cards are untouched either way - an absent `model:` still means
    // what it always meant.
    if (entity && entity.split('.')[0] === 'humidifier') return { entity, model: 'humidifier' };

    return { entity };
  }

  // The visual editor, as a schema Home Assistant renders itself (#179). See
  // src/configForm.ts for why it is a schema rather than an editor element of
  // this card's own.
  static getConfigForm() {
    return configForm();
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
    this.warned = new Set();
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

  /**
   * A control the card is about to leave out, said once.
   *
   * An indicator or a button whose entity is not in `hass.states` is skipped
   * rather than rendered - the right thing to draw, and until now the whole of
   * what happened. The entity id is usually computed rather than written: the
   * bundled presets build it out of `{entity_id}`, so what is missing is a name
   * nobody typed. Home Assistant appends `_2` at the end for a second device of
   * the same kind, which is enough to stop the two lining up - see #78 and #98,
   * where finding that out took fourteen comments.
   */
  warnMissing(kind: string, id: string, entityId: string) {
    const key = `${kind}.${id}:${entityId}`;
    if (this.warned.has(key)) return;

    this.warned.add(key);
    console.warn(
      `mini-humidifier: ${kind} '${id}' reads ${entityId}, which does not exist in Home ` +
        `Assistant, so it is not shown. Check the entity id - the bundled models build it from ` +
        `the humidifier's own.`,
    );
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
      } else {
        this.warnMissing('indicator', id, entityId);
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
      } else {
        this.warnMissing('button', id, entityId);
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

  setConfig(config: RawCardConfig) {
    // A new configuration is a new chance to be told what it leaves out.
    this.warned = new Set();

    const domain = config.entity && config.entity.split('.')[0].toLowerCase();

    if (SUPPORTED_DOMAINS.includes(domain) === false) {
      throw new Error(`Specify an entity from within ${SUPPORTED_DOMAINS.join(' ,')} domains.`);
    }

    // What the card is about to ignore, said out loud (#178). Warnings only:
    // the card goes on to render exactly as it would have, and an option the
    // card does not read is not necessarily a mistake - see validateConfig for
    // why the check stops at the top level.
    validateConfig(config).forEach(warning => console.warn(`mini-humidifier: ${warning}`));

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

    this.config = buildCardConfig(config, modelConfiguration, this.templateRuntime());

    this.toggle = this.config.toggle.default;
  }

  /**
   * The two things a template can reach for at call time, handed to the merge
   * layer so that it needs nothing else from the element (#233).
   *
   * Both read `this.hass` when the template runs rather than when it compiles,
   * which is the whole reason they are functions: `setConfig` is called before
   * the card has a `hass` at all, and `hass` is replaced on every state change
   * in the installation afterwards. Built once per configuration - the three
   * identical copies this replaces were built once per section.
   */
  templateRuntime(): TemplateRuntime {
    return {
      callService: (domain: string, service: string, options: Record<string, unknown>) =>
        this.hass.callService(domain, service, options),
      localize: (str: string, fallback?: string) =>
        localize(str, this.hass.selectedLanguage || this.hass.language || 'en', fallback),
    };
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

    // The default `secondary_info` is the mode the device is in, read off the
    // button that offers the modes - so a configuration with no `mode` button
    // has nothing to show here. Every bundled model has one, which is why this
    // read went unguarded; `model: none` is the first configuration that can
    // legitimately arrive without it.
    const { mode } = this.buttons;
    if (!mode) return '';

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
      '--group': !!config.group,
      '--more-info': config.tap_action.action !== 'none',
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
