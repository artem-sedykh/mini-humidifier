import { css } from 'lit-element';

const style = css`
  :host {
    overflow: visible !important;
    display: block;
    --mh-scale: var(--mini-humidifier-scale, 1);
    --mh-unit: calc(var(--mh-scale) * 40px);
    --mh-name-font-weight: var(--mini-humidifier-name-font-weight, 400);
    --mh-accent-color: var(--mini-humidifier-accent-color, var(--accent-color, #f39c12));
    --mh-base-color: var(--mini-humidifier-base-color, var(--primary-text-color, #000));
    --mh-overlay-color: var(--mini-humidifier-overlay-color, rgba(0,0,0,0.5));
    --mh-overlay-color-stop: var(--mini-humidifier-overlay-color-stop, 25%);
    --mh-overlay-base-color: var(--mini-humidifier-overlay-base-color, #fff);
    --mh-overlay-accent-color: var(--mini-humidifier-overlay-accent-color, --mh-accent-color);
    --mh-text-color: var(--mini-humidifier-base-color, var(--primary-text-color, #000));
    --mh-text-color-inverted: var(--disabled-text-color);
    --mh-active-color: var(--mh-accent-color);
    --mh-button-color: var(--mini-humidifier-button-color, rgba(255,255,255,0.25));
    --mh-icon-color:
      var(--mini-humidifier-icon-color,
        var(--mini-humidifier-base-color,
          var(--paper-item-icon-color, #44739e)));
    --mh-icon-active-color: var(--paper-item-icon-active-color, --mh-active-color);
    --mh-info-opacity: 1;
    --mh-bg-opacity: var(--mini-humidifier-background-opacity, 1);
    --mh-artwork-opacity: var(--mini-humidifier-artwork-opacity, 1);
    --mh-progress-height: var(--mini-humidifier-progress-height, 6px);
    --mh-theme-primary: var(--mh-text-color);
    --mh-theme-on-primary: var(--mh-text-color);
    --paper-checkbox-unchecked-color: var(--mh-text-color);
    --paper-checkbox-label-color: var(--mh-text-color);
    color: var(--mh-text-color);
  }
  ha-card.--group {
    box-shadow: none;
  }
  ha-card.--bg {
    --mh-info-opacity: .75;
  }
  ha-card {
    cursor: default;
    display: flex;
    background: transparent;
    overflow: visible;
    padding: 0;
    position: relative;
    color: inherit;
    font-size: calc(var(--mh-unit) * 0.35);
  }
  ha-card:before {
    content: '';
    padding-top: 0px;
    transition: padding-top .5s cubic-bezier(.21,.61,.35,1);
    will-change: padding-top;
  }
  header {
    display: none;
  }
  .mh__bg {
    background: var(--ha-card-background, var(--paper-card-background-color, white));
    position: absolute;
    top: 0; right: 0; bottom: 0; left: 0;
    overflow: hidden;
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
    opacity: var(--mh-bg-opacity);
  }
  
  .mh-humidifier {
    align-self: flex-end;
    box-sizing: border-box;
    position: relative;
    padding: 16px 16px 0px 16px;
    transition: padding .25s ease-out;
    width: 100%;
    will-change: padding;
  }
  .flex {
    display: flex;
    display: -ms-flexbox;
    display: -webkit-flex;
    flex-direction: row;
  }
  .mh-humidifier__core {
    position: relative;
  }
  .entity__info {
    justify-content: center;
    display: flex;
    flex-direction: column;
    margin-left: 8px;
    position: relative;
    overflow: hidden;
    user-select: none;
    max-width: 130px;
  }
  .entity__icon {
    color: var(--mh-icon-color);
  }
  .entity__icon[color] {
    color: var(--mh-icon-active-color);
  }
  .entity__icon {
    animation: fade-in .25s ease-out;
    background-position: center center;
    background-repeat: no-repeat;
    background-size: cover;
    border-radius: 100%;
    height: var(--mh-unit);
    width: var(--mh-unit);
    min-width: var(--mh-unit);
    line-height: var(--mh-unit);
    margin-right: calc(var(--mh-unit) / 5);
    position: relative;
    text-align: center;
    will-change: border-color;
    transition: border-color .25s ease-out;
  }
  .entity__info__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: calc(var(--mh-unit) / 2);
    color: var(--mh-text-color);
    font-weight: var(--mh-name-font-weight);
  }
  .entity__secondary_info_icon {
    color: var(--mh-icon-color);
    width: 15px;
    height: 15px;
    min-width: 15px;
  }
  .entity__secondary_info {
    margin-top: -2px;
  }
  .entity__secondary_info__name {
    font-size: 13px;
    font-weight: 300;
  }
  mh-powerstrip {
    flex: 1;
    justify-content: flex-end;
    margin-right: 0;
    margin-left: auto;
    width: auto;
    min-width: 0;
  }
  ha-card.--inactive .mh-humidifier {
    padding: 16px 16px 0px 16px;
  }
  ha-card.--unavailable .mh-humidifier {
    padding: 16px;
  }
  ha-card.--group .mh-humidifier {
    padding: 2px 0;
  }  
  mp-humidifier-state {
    margin: 0;
  }
  .mh-humidifier__bottom {
    margin: 10px 0px 0px 10px;
    justify-content: space-between;
  }
  mp-target-humidity-slider {
    flex: 1;
  }
  mp-humidifier-state {
    flex: 1;
  }
`;

export default style;
