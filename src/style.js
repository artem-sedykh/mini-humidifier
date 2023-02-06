import { css } from 'lit';

const style = css`
  :host {
    overflow: visible !important;
    display: block;
    --mh-scale: var(--mini-humidifier-scale, 1);
    --mh-unit: calc(var(--mh-scale) * 40px);
    --mh-name-font-weight: var(--mini-humidifier-name-font-weight, 400);
    --mh-info-font-weight: var(--mini-humidifier-info-font-weight, 300);
    --mh-entity-info-left-offset: 8px;
    --mh-accent-color: var(--mini-humidifier-accent-color, var(--accent-color, #f39c12));
    --mh-text-color: var(--mini-humidifier-base-color, var(--primary-text-color, #000));
    --mh-active-color: var(--mh-accent-color);
    --mh-button-color: var(--mini-humidifier-button-color, var(--paper-item-icon-color, #44739e));
    --mh-icon-color:
      var(--mini-humidifier-icon-color,
        var(--mini-humidifier-base-color,
          var(--paper-item-icon-color, #44739e)));
    --mh-icon-active-color: var(--state-binary_sensor-active-color, #ffc107);
    --mh-info-opacity: 1;
    --mh-bg-opacity: var(--mini-humidifier-background-opacity, 1);
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
    border: none;
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
    background: var(--ha-card-background, var(--card-background-color, var(--paper-card-background-color, white)));
    position: absolute;
    top: 0; right: 0; bottom: 0; left: 0;
    overflow: hidden;
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
    opacity: var(--mh-bg-opacity);
    border-radius: var(--ha-card-border-radius, 0);
  }
  ha-card.--group .mh__bg {
    background: none;
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
    padding-right: 5px;
  }
  .entity__info {
    user-select: none;
    margin-left: var(--mh-entity-info-left-offset);
    flex: 1;
    min-width: 0;
    white-space: nowrap;
  }
  .entity__icon {
    color: var(--mh-icon-color);
    white-space: nowrap;
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
    height: calc(var(--mh-unit) * .5);
    width: calc(var(--mh-unit) * .5);
    min-width: calc(var(--mh-unit) * .5);
    --mdc-icon-size: calc(var(--mh-unit) * 0.5);
  }
  .entity__secondary_info {
    margin-top: -2px;
  }
  .entity__secondary_info ha-relative-time {
    color: #727272;
  }
  .entity__secondary_info__name {
    font-size: calc(var(--mh-unit) * .35);
    font-weight: var(--mh-info-font-weight);
    line-height: calc(var(--mh-unit) * .5);
    vertical-align: middle;
    display: inline-block;
  }
  ha-card.--initial .mh-humidifier {
    padding: 16px 16px 5px 16px;
  }
  ha-card.--unavailable .mh-humidifier {
    padding: 16px;
  }
  ha-card.--group .mh-humidifier {
    padding: 2px 0 0 0;
  }  
  .toggle-button {
    width: calc(var(--mh-unit) * .75);
    height: calc(var(--mh-unit) * .75);
    --mdc-icon-button-size: calc(var(--mh-unit) * .75);
    --ha-icon-display: flex;
    color: var(--mh-icon-color);
    margin-left: auto;
    margin-top: calc(var(--mh-unit) * -.125);
  }
  .toggle-button.open {
     transform: rotate(180deg);
     color: var(--mh-active-color)
  }
  .wrap {
    display: flex;
    flex-direction: row;
  }
  .bottom {
    margin-top: calc(var(--mh-unit) * .075);
  }
  .entity__info__name_wrap {
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-right: 0;
    max-width: calc(var(--mh-unit) * 4.25);
    cursor: pointer;
  }
  .entity__info__name_wrap.full {
    max-width: 80%;
  }
  .--unavailable .ctl-wrap {
    margin-left: auto;
    margin-top: auto;
    margin-bottom: auto;
  }
  .--unavailable .ctl-wrap .unavailable {
    margin-left: auto;
    margin-right: 0;
  }
  .--unavailable .entity__info {
    margin-top: auto;
    margin-bottom: auto;
  }
  .mh-toggle_content {
    margin-top: calc(var(--mh-unit) * .05);
  }
  mh-buttons {
    width: 100%;
    justify-content: space-evenly;
    display: flex;
    --ha-icon-display: flex;
  }
  .ctl-wrap {
    flex: 1;
    margin-left: auto;
    display: flex;
    flex-direction: row;
  }
  mh-power {
    margin-left: auto;
    min-width: calc(var(--mh-unit) * .875);
    margin-right: calc(var(--mh-unit) * -0.125);
    --ha-icon-display: flex;
  }
  mh-target-humidity {
    display: flex;
    flex: 1;
  }
`;

export default style;
