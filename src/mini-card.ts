import { CSSResult, customElement, html, LitElement, property, TemplateResult } from 'lit-element';
import { HomeAssistant } from 'custom-card-helpers';
import { ButtonConfig, DropdownConfig, ElementType, CardConfig, TapAction } from './types';
import { Config } from './models/config';
import { StyleInfo, styleMap } from 'lit-html/directives/style-map';
import { Slider } from './models/slider';
import { ClassInfo, classMap } from 'lit-html/directives/class-map';
import style from './style';
import sharedStyle from './sharedStyle';
import { ActionHandlerEvent } from 'custom-card-helpers/dist';
import { handleClick } from './utils/utils';
import { getLabel } from './utils/getLabel';
import { Indicator } from './models/indicator';
import { HassEntity } from 'home-assistant-js-websocket';
import { Button } from './models/button';
import { Dropdown } from './models/dropdown';
import { PowerButton } from './models/power-button';
import { CardObject } from './models/card';
import { SecondaryInfo } from './models/secondary-info';

import './components/dropdown';
import './components/button';
import './components/power-button';
import './components/dropdown-base';
import './components/indicator';
import './components/slider';
import './components/secondary-info';
import './components/secondary-info-dropdown';

import './initialize';

@customElement('mini-humidifier')
export class MiniCard extends LitElement {
  private _indicators: { [id: string]: Indicator };
  private _buttons: { [id: string]: Button | Dropdown };
  private _powerButton!: PowerButton;
  private _slider!: Slider;
  private _secondaryInfo!: SecondaryInfo;

  constructor() {
    super();
    this._indicators = {};
    this._buttons = {};
    this._toggle = false;
  }

  @property()
  public config!: CardConfig;

  @property()
  public card!: CardObject;

  @property()
  private _toggle: boolean;

  private _hass: HomeAssistant | undefined;

  public get entity(): HassEntity | undefined {
    return this._hass?.states[this.config.entity];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public setConfig(config: any): void {
    this.config = new Config(config);
  }

  public set hass(hass: HomeAssistant) {
    if (!hass) return;
    this._hass = hass;
    let force = false;

    const card = new CardObject(hass, this.config);

    if (card.entity && this.card?.entity !== card.entity) {
      this.card = card;
      force = true;
    }

    this._updateIndicators(force);
    this._updateButtons(force);
    this._updatePowerButton(force);
    this._updateSlider(force);
    this._updateSecondaryInfo(force);
  }

  private _updateIndicators(force: boolean): void {
    if (!this._hass || !this.entity) return;

    const indicators: { [id: string]: Indicator } = {};

    let changed = false;

    for (let i = 0; i < this.config.indicators.length; i += 1) {
      const config = this.config.indicators[i];
      const id = config.id;

      const entity = this._hass?.states[config.state.entity];

      if (entity) {
        indicators[id] = new Indicator(this._hass, config, this.entity);
      }

      if (entity !== (this._indicators[id] && this._indicators[id].entity)) changed = true;
    }

    if (changed || force) this._indicators = indicators;
  }

  private _updateButtons(force: boolean): void {
    if (!this._hass || !this.entity) return;

    const buttons: { [id: string]: Button | Dropdown } = {};

    let changed = false;

    for (let i = 0; i < this.config.buttons.length; i += 1) {
      const config = this.config.buttons[i];
      const id = config.id;

      const entity = this._hass?.states[config.state.entity];

      if (entity) {
        if (config.elementType === ElementType.Button) {
          buttons[id] = new Button(this._hass, config as ButtonConfig, entity);
        } else if (config.elementType === ElementType.Dropdown) {
          buttons[id] = new Dropdown(this._hass, config as DropdownConfig, entity);
        }
      }

      if (entity !== (this._buttons[id] && this._buttons[id].entity)) changed = true;
    }

    if (changed || force) this._buttons = buttons;
  }

  private _updatePowerButton(force: boolean): void {
    if (!this._hass || !this.entity) return;

    const config = this.config.power;
    const entity = this._hass?.states[config.state.entity];

    if (force || entity !== this._powerButton?.entity) {
      this._powerButton = new PowerButton(this._hass, config, entity);
    }
  }

  private _updateSlider(force: boolean): void {
    if (!this._hass || !this.entity) return;

    const config = this.config.slider;
    const entity = this._hass?.states[config.state.entity];

    if (force || entity !== this._slider?.entity) {
      this._slider = new Slider(this._hass, config, entity);
    }
  }

  private _updateSecondaryInfo(force: boolean): void {
    if (!this._hass || !this.entity) return;

    const config = this.config.secondaryInfo;
    const entity = this._hass?.states[config.state.entity];

    if (force || entity !== this._secondaryInfo?.entity) {
      this._secondaryInfo = new SecondaryInfo(this._hass, config, entity);
    }
  }

  protected render(): TemplateResult | void {
    const handle = this.config.secondaryInfo.type !== 'custom-dropdown';

    const cls = this.config.slider.hide ? 'full' : '';
    return html`
      <ha-card class=${this._computeClasses()} style=${this._computeStyles()}>
        <div class="mh__bg"></div>
        <div class="mh-humidifier">
          <div class="mh-humidifier__core flex">
            <div class="entity__icon" ?color=${this.card.isActive}>
              <ha-icon .icon=${this.card.icon}> </ha-icon>
            </div>
            <div class="entity__info">
              <div class="wrap">
                <div class="entity__info__name_wrap ${cls}" @click=${(e): boolean => this._onClick(e, handle)}>
                  <div class="entity__info__name" @click=${(e): boolean => this._onClick(e, true)}>
                    ${this.card.name}
                  </div>
                  ${this._renderSecondaryInfo()}
                </div>
                <div class="ctl-wrap">
                  ${this._renderUnavailable()} ${this._renderSlider()} ${this._renderPower()}
                </div>
              </div>
              ${this._renderBottomPanel()}
            </div>
          </div>
          ${this._renderTogglePanel()}
        </div>
      </ha-card>
    `;
  }

  private _renderSecondaryInfo(): TemplateResult | void {
    if (this.card.isUnavailable) return;

    switch (this._secondaryInfo.type) {
      case 'last-changed': {
        return html`
          <div class="entity__secondary_info ellipsis">
            <ha-relative-time .hass=${this._secondaryInfo.hass} .datetime=${this._secondaryInfo.entity.last_changed}>
            </ha-relative-time>
          </div>
        `;
      }
      case 'custom': {
        return html`
          <mh-secondary-info .secondaryInfo="${this._secondaryInfo}"> </mh-secondary-info>
        `;
      }
      case 'custom-dropdown': {
        return html`
          <mh-secondary-info-dropdown .secondaryInfo="${this._secondaryInfo}"> </mh-secondary-info-dropdown>
        `;
      }
      default:
        return;
    }
  }

  private _renderBottomPanel(): TemplateResult | void {
    if (this.card.isUnavailable) return;

    const indicators = Object.entries(this._indicators)
      .map(i => i[1])
      .filter(i => !i.hide)
      .sort((a, b) => (a.order > b.order ? 1 : b.order > a.order ? -1 : 0));

    return html`
      <div class="bottom flex">
        <div class="mh-indicators__container">
          ${indicators.map(
            indicator =>
              html`
                <mh-indicator .indicator="${indicator}"> </mh-indicator>
              `,
          )}
        </div>
        ${this._renderToggleButton()}
      </div>
    `;
  }

  private _renderToggleButton(): TemplateResult | void {
    if (this.config.buttons.length === 0) return;

    if (this.config.toggle.hide) return;

    const cls = this._toggle ? 'open' : '';
    return html`
      <ha-icon-button class="toggle-button ${cls}" .icon=${this.config.toggle.icon} @click=${this._handleToggle}>
      </ha-icon-button>
    `;
  }

  private _renderTogglePanel(): TemplateResult | void {
    if (!this._toggle || this.card.isUnavailable) return;

    const buttons = Object.entries(this._buttons)
      .map(i => i[1])
      .filter(i => !i.hide)
      .sort((a, b) => (a.order > b.order ? 1 : b.order > a.order ? -1 : 0));

    return html`
      <div class="mh-toggle_content">
        ${buttons.map(button => {
          if (button.elementType === ElementType.Button)
            return html`
              <mh-button .button="${button}"> </mh-button>
            `;
          if (button.elementType == ElementType.Dropdown)
            return html`
              <mh-dropdown .dropdown="${button}"> </mh-dropdown>
            `;
          return undefined;
        })}
      </div>
    `;
  }

  private _renderUnavailable(): TemplateResult | void {
    if (!this._hass || !this.card.isUnavailable) return;

    return html`
      <span class="label unavailable ellipsis">
        ${getLabel(this._hass, 'state.default.unavailable', 'Unavailable')}
      </span>
    `;
  }

  private _renderSlider(): TemplateResult | void {
    if (this.card.isUnavailable || this._slider.hide) return;

    return html`
      <mh-slider .slider=${this._slider}> </mh-slider>
    `;
  }

  private _renderPower(): TemplateResult | void {
    if (this.card.isUnavailable) return;

    return html`
      <mh-power .button="${this._powerButton}"> </mh-power>
    `;
  }

  private _onClick(ev: ActionHandlerEvent, handle: boolean): boolean {
    if (!handle) return true;

    ev.stopPropagation();
    handleClick(this, this.card.hass, this.card.tapAction);
    return false;
  }

  private _handleToggle(ev: ActionHandlerEvent): void {
    ev.stopPropagation();
    this._toggle = !this._toggle;
  }

  static get styles(): CSSResult[] {
    return [sharedStyle, style];
  }

  private _computeClasses({ config } = this): Function {
    return classMap({
      '--initial': true,
      '--group': config.group,
      '--more-info': config.tapAction.action !== TapAction.None,
      '--inactive': !this.card.isActive,
      '--unavailable': this.card.isUnavailable,
    } as ClassInfo);
  }

  private _computeStyles(): Function {
    const scale = this.config.scale;
    return styleMap({ ...(scale && { '--mh-unit': `${40 * scale}px` }) } as StyleInfo);
  }
}
