import { css } from 'lit';

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
    /* The width and height above do nothing on their own: ha-icon computes to
       display: inline, and an inline box ignores both. The glyph inside is an
       ha-svg-icon, and what it reads is --mdc-icon-size - which is why the
       indicators, which set that, are the only icons on the card that ever
       honoured a scale. See #273.

       At scale 1 this is 24px, exactly what these icons already rendered at,
       so nothing moves on a card that did not ask to be scaled. */
    --mdc-icon-size: calc(var(--mh-unit) * .6);
  }
  ha-icon-button {
    width: calc(var(--mh-unit));
    height: calc(var(--mh-unit));
    /* --mdc-icon-button-size is the pre-2026 knob, --ha-icon-button-size the
       current one; both are set so the card sizes correctly on either. */
    --mdc-icon-button-size: calc(var(--mh-unit));
    --ha-icon-button-size: calc(var(--mh-unit));
    color: var(--mh-button-color);
    transition: color .25s;
  }
  ha-icon-button[color] {
    color: var(--mh-icon-active-color) !important;
    opacity: 1 !important;
  }
  ha-icon-button[inactive] {
    opacity: .5;
  }
`;

export default sharedStyle;
