import { LitElement, html, css } from 'lit-element';

import sharedStyle from '../sharedStyle';

import './controls';

class MiniHumidifierTogglePanel extends LitElement {
  static get properties() {
    return {
      humidifier: {},
      hass: {},
      config: {},
      visible: Boolean,
    };
  }

  render() {
    return html`
     <div class='mh-humidifier__toggle_panel flex'>
        ${this.renderPanelContent()}
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
        overflow: hidden;
      }
      mp-humidifier-controls {
        display: flex;
        flex: 1;
        justify-content: flex-end;
      }
    `];
  }
}

customElements.define('mp-toggle-panel', MiniHumidifierTogglePanel);
