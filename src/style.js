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
    --mh-media-cover-info-color: var(--mini-humidifier-media-cover-info-color, --mh-text-color);
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
  ha-card.--bg {
    --mh-info-opacity: .75;
  }
  ha-card.--has-artwork[artwork*='cover'] {
    --mh-accent-color: var(--mini-humidifier-overlay-accent-color, var(--mini-humidifier-accent-color, var(--accent-color, #f39c12)));
    --mh-text-color: var(--mh-overlay-base-color);
    --mh-text-color-inverted: #000;
    --mh-active-color: rgba(255,255,255,.5);
    --mh-icon-color: var(--mh-text-color);
    --mh-icon-active-color: var(--mh-text-color);
    --mh-info-opacity: .75;
    --paper-slider-container-color: var(--mini-humidifier-overlay-color, rgba(255,255,255,.75));
    --mdc-theme-primary: var(--mh-text-color);
    --mdc-theme-on-primary: var(--mh-text-color);
    --paper-checkbox-unchecked-color: var(--mh-text-color);
    --paper-checkbox-label-color: var(--mh-text-color);
    color: var(--mh-text-color);
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
  ha-card.--group {
    box-shadow: none;
    --mh-progress-height: var(--mini-humidifier-progress-height, 4px);
  }
  ha-card.--more-info {
    cursor: pointer;
  }
  .mh__bg, .mh-humidifier, .mmp__container {
    border-radius: var(--ha-card-border-radius, 0);
  }
  .mmp__container {
    overflow: hidden;
    height: 100%;
    width: 100%;
    position: absolute;
    pointer-events: none;
  }
  ha-card:before {
    content: '';
    padding-top: 0px;
    transition: padding-top .5s cubic-bezier(.21,.61,.35,1);
    will-change: padding-top;
  }
  ha-card.--initial .entity__artwork,
  ha-card.--initial .entity__icon {
    animation-duration: .001s;
  }
  ha-card.--initial:before,
  ha-card.--initial .mh-humidifier {
    transition: none;
  }
  header {
    display: none;
  }
  ha-card[artwork='full-cover'].--has-artwork:before {
    padding-top: 56%;
  }
  ha-card[artwork='full-cover'].--has-artwork[content='music']:before,
  ha-card[artwork='full-cover-fit'].--has-artwork:before {
    padding-top: 100%;
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
  ha-card[artwork*='cover'].--has-artwork .mh__bg {
    opacity: var(--mh-artwork-opacity);
    background: transparent;
  }
  ha-card.--group .mh__bg {
    background: transparent;
  }
  .cover,
  .cover:before {
    display: block;
    opacity: 0;
    position: absolute;
    top: 0; right: 0; bottom: 0; left: 0;
    transition: opacity .75s cubic-bezier(.21,.61,.35,1);
    will-change: opacity;
  }
  .cover {
    animation: fade-in .5s cubic-bezier(.21,.61,.35,1);
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center center;
    border-radius: var(--ha-card-border-radius, 0);
    overflow: hidden;
  }
  .cover:before {
    background: var(--mh-overlay-color);
    content: '';
  }
  ha-card[artwork*='full-cover'].--has-artwork .mh-humidifier {
    background: linear-gradient(to top, var(--mh-overlay-color) var(--mh-overlay-color-stop), transparent 100%);
    border-bottom-left-radius: var(--ha-card-border-radius, 0);
    border-bottom-right-radius: var(--ha-card-border-radius, 0);
  }
  ha-card.--has-artwork .cover,
  ha-card.--has-artwork[artwork='cover'] .cover:before,
  ha-card.--bg .cover {
    opacity: .999;
  }
  ha-card[artwork='default'] .cover {
    display: none;
  }
  ha-card.--bg .cover {
    display: block;
  }
  ha-card[artwork='full-cover-fit'].--has-artwork .cover {
    background-color: black;
    background-size: contain;
  }
  .mh-humidifier {
    align-self: flex-end;
    box-sizing: border-box;
    position: relative;
    padding: 16px;
    transition: padding .25s ease-out;
    width: 100%;
    will-change: padding;
  }
  ha-card.--group .mh-humidifier {
    padding: 2px 0;
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
  }
  ha-card.--rtl .entity__info {
    margin-left: auto;
    margin-right: calc(var(--mh-unit) / 5);
  }
  ha-card[content='movie'] .attr__media_season,
  ha-card[content='movie'] .attr__media_episode {
    display: none;
  }
  .entity__icon {
    color: var(--mh-icon-color);
  }
  .entity__icon[color] {
    color: var(--mh-icon-active-color);
  }
  .entity__artwork, .entity__icon {
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
  ha-card.--rtl .entity__artwork,
  ha-card.--rtl .entity__icon {
    margin-right: auto;
  }
  .entity__artwork[border] {
    border: 2px solid var(--primary-text-color);
    box-sizing: border-box;
    -moz-box-sizing: border-box;
    -webkit-box-sizing: border-box;
  }
  .entity__artwork[border][state='playing'] {
    border-color: var(--mh-accent-color);
  }
  .entity__info__name,
  .entity__info__media[short] {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .entity__info__name {
    line-height: calc(var(--mh-unit) / 2);
    color: var(--mh-text-color);
    font-weight: var(--mh-name-font-weight);
  }
  .entity__info__media {
    color: var(--secondary-text-color);
    max-height: 6em;
    word-break: break-word;
    opacity: var(--mh-info-opacity);
    transition: color .5s;
  }
  .entity__info__media[short] {
    max-height: calc(var(--mh-unit) / 2);
    overflow: hidden;
  }
  .attr__app_name {
    display: none;
  }
  .attr__app_name:first-child,
  .attr__app_name:first-of-type {
    display: inline;
  }
  .mh-humidifier__core[inactive] .entity__info__media {
    color: var(--mh-text-color);
    max-width: 200px;
    opacity: .5;
  }
  .entity__info__media[short-scroll] {
    max-height: calc(var(--mh-unit) / 2);
    white-space: nowrap;
  }
  .entity__info__media[scroll] > span {
    visibility: hidden;
  }
  .entity__info__media[scroll] > div {
    animation: move linear infinite;
  }
  .entity__info__media[scroll] .marquee {
    animation: slide linear infinite;
  }
  .entity__info__media[scroll] .marquee,
  .entity__info__media[scroll] > div {
    animation-duration: inherit;
    visibility: visible;
  }
  .entity__info__media[scroll] {
    animation-duration: 10s;
    mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
  }
  .marquee {
    visibility: hidden;
    position: absolute;
    white-space: nowrap;
  }
  ha-card[artwork*='cover'].--has-artwork .entity__info__media,
  ha-card.--bg .entity__info__media {
    color: var(--mh-media-cover-info-color);
  }
  .entity__info__media span:before {
    content: ' - ';
  }
  .entity__info__media span:first-of-type:before {
    content: '';
  }
  .entity__info__media span:empty {
    display: none;
  }
  .mh-humidifier__adds {
    margin-left: calc(var(--mh-unit) * 1.2);
    position: relative;
  }
  ha-card.--rtl .mh-humidifier__adds {
    margin-left: auto;
    margin-right: calc(var(--mh-unit) * 1.2);
  }
  .mh-humidifier__adds > *:nth-child(2) {
    margin-top: 0px;
  }
  mh-powerstrip {
    flex: 1;
    justify-content: flex-end;
    margin-right: 0;
    margin-left: auto;
    width: auto;
    max-width: 100%;
  }
  mh-media-controls {
    flex-wrap: wrap;
  }
  ha-card.--flow mh-powerstrip {
    justify-content: space-between;
    margin-left: auto;
  }
  ha-card.--flow.--rtl mh-powerstrip {
    margin-right: auto;
  }
  ha-card.--flow .entity__info {
    display: none;
  }
  ha-card.--responsive .mh-humidifier__adds {
    margin-left: 0;
  }
  ha-card.--responsive.--rtl .mh-humidifier__adds {
    margin-right: 0;
  }
  ha-card.--responsive .mh-humidifier__adds > mh-media-controls {
    padding: 0;
  }
  ha-card.--progress .mh-humidifier {
    padding-bottom: calc(16px + calc(var(--mini-humidifier-progress-height, 6px) - 6px));
  }
  ha-card.--progress.--group .mh-humidifier {
    padding-bottom: calc(10px + calc(var(--mini-humidifier-progress-height, 6px) - 6px));
  }
  ha-card.--runtime .mh-humidifier {
    padding-bottom: calc(16px + 16px + var(--mini-humidifier-progress-height, 0px));
  }
  ha-card.--runtime.--group .mh-humidifier {
    padding-bottom: calc(16px + 12px + var(--mini-humidifier-progress-height, 0px));
  }
  ha-card.--inactive .mh-humidifier {
    padding: 16px;
  }
  ha-card.--inactive.--group .mh-humidifier {
    padding: 2px 0;
  }
  .mh-humidifier div:empty {
    display: none;
  }
  @keyframes slide {
    100% { transform: translateX(-100%); }
  }
  @keyframes move {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

export default style;
