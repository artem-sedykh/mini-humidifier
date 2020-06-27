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
    width: calc(var(--mh-unit) * 0.6);
    height: calc(var(--mh-unit) * 0.6);
  }
  ha-icon-button {
    width: calc(var(--mh-unit));
    height: calc(var(--mh-unit));
    --mdc-icon-button-size: calc(var(--mh-unit));
    color: var(--mh-button-color);
    transition: color 0.25s;
  }
  ha-icon-button[inactive] {
    opacity: 0.5;
  }
`;

export default sharedStyle;
