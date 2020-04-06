import { css } from 'lit-element';

const sharedStyle = css`
  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .label {
    margin: 0 8px;
  }
  ha-icon {
    width: calc(var(--mh-unit) * .6);
    height: calc(var(--mh-unit) * .6);
  }
  paper-icon-button {
    width: calc(var(--mh-unit));
    height: calc(var(--mh-unit));
    color: var(--mh-text-color, var(--primary-text-color));
    transition: color .25s;
  }
  paper-icon-button[color] {
    color: var(--mh-icon-active-color) !important;
    opacity: 1 !important;
  }
  paper-icon-button[inactive] {
    opacity: .5;
  }
`;

export default sharedStyle;
