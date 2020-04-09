import { LitElement, html, css } from 'lit-element';

import './button';

import { ICON } from '../const';
import sharedStyle from '../sharedStyle';

import './controls';

class MiniHumidifierTogglePanel extends LitElement {
  constructor() {
    super();
    this.visible = false;
  }

  static get properties() {
    return {
      humidifier: {},
      hass: {},
      config: {},
      visible: Boolean,
    };
  }

  toggle(e) {
    e.stopPropagation();
    this.visible = !this.visible;
  }

  toggleButtonCls() {
    return this.visible ? 'open' : '';
  }

  render() {
    return html`
     <div class='mh-humidifier__toggle_panel flex'>
        ${this.renderPanelContent()}
        <div class='mh-humidifier__toggle'>
            <paper-icon-button class='toggle-button ${this.toggleButtonCls()}'
            .icon=${ICON.TOGGLE}
            @click=${e => this.toggle(e)}>
            </paper-icon-button>
        </div>
     </div>
    `;
  }

  renderPanelContent() {
    if (!this.visible)
      return '';

    return html`
        <div class="mh-humidifier__toggle_content">
            <mp-humidifier-controls
              .hass=${this.hass}
              .humidifier=${this.humidifier}
              .config=${this.config}>
            </mp-humidifier-controls>
        </div>
    `;
  }

  static get styles() {
    return [
      sharedStyle,
      css`
      :host {
        position: relative;
        box-sizing: border-box;
        margin: 0;
        min-width: 0;
        overflow: hidden;
        transition: background .5s;
      }
      .mh-humidifier__toggle {
         text-align: center;
         margin-top: -10px;
      }
      .toggle-button {
         margin-bottom: -2px;
         padding: 2px;
         width: 28px;
         height: 28px;
      }
      .toggle-button.open {
         transform: rotate(180deg);
      }
      mp-humidifier-controls {
        display: flex;
        flex: 1;
        justify-content: flex-end;
        margin-top: -13px;
      }
    `];
  }
}

customElements.define('mp-toggle-panel', MiniHumidifierTogglePanel);
