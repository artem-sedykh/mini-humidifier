import { TAP_ACTIONS } from '../const';
import type { RawCardConfig } from '../types';

// The card's own top-level options. This list is the one place that says what
// the card reads at the top level, so it has to stay level with `RawCardConfig`
// in types.ts and the table in docs/configuration.md.
const CARD_OPTIONS = [
  'type',
  'entity',
  'model',
  'name',
  'icon',
  'scale',
  'group',
  'tap_action',
  'toggle',
  'secondary_info',
  'power',
  'target_humidity',
  'indicators',
  'buttons',
];

// Keys that appear in a card's configuration without the card ever putting them
// there. The card is not the only writer of its own config: Home Assistant adds
// layout and visibility keys from the dashboard editor, and card-mod - which is
// not Home Assistant's but is on a great many dashboards - adds its own.
//
// Warning about these would be worse than saying nothing at all: the
// configuration is correct, the person did not write the key, and there is
// nothing for them to do about it.
const FOREIGN_OPTIONS = ['view_layout', 'grid_options', 'layout_options', 'visibility', 'card_mod'];

// The mistakes worth naming rather than merely reporting. A singular where the
// card wants a plural is the expensive version of this error: a whole section
// of the configuration is accepted, ignored, and looks like an option the card
// never implemented.
const MEANT_INSTEAD: Record<string, string> = {
  indicator: 'indicators',
  button: 'buttons',
  tap_actions: 'tap_action',
  entities: 'entity',
};

// `none` is not in TAP_ACTIONS - that list is what the indicators use to decide
// whether a value is clickable - but it is a documented action and it works, by
// falling through the switch in handleClick and doing nothing.
const ACTIONS = [...TAP_ACTIONS, 'none'];

const DOCS = 'https://github.com/artem-sedykh/mini-humidifier/blob/master/docs/configuration.md';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const checkActionName = (where: string, action: unknown, warnings: string[]): void => {
  if (typeof action === 'string' && ACTIONS.includes(action)) return;

  warnings.push(
    `${where} is '${String(action)}', which the card does not handle, so the click does nothing. ` +
      `The actions are: ${ACTIONS.join(', ')}.`,
  );
};

/**
 * The string form is shorthand for `{ action: <string> }` wherever it is
 * written: `getIndicatorConfig` has always normalised it for indicators, and
 * since #206 `setConfig` does the same for the card's own option. So the only
 * thing that can be wrong about a string here is the action it names.
 *
 * This used to take a `normalisesStrings` flag, because the card did not
 * normalise and a string other than `none` was a dead click with a pointer
 * cursor. Both halves of that are fixed rather than described.
 */
const checkTapAction = (where: string, tapAction: unknown, warnings: string[]): void => {
  if (tapAction === undefined) return;

  if (typeof tapAction === 'string') {
    checkActionName(where, tapAction, warnings);
    return;
  }

  if (!isPlainObject(tapAction)) return;
  if (tapAction.action === undefined) return;

  checkActionName(`${where}.action`, tapAction.action, warnings);
};

const checkOrder = (where: string, order: unknown, warnings: string[]): void => {
  if (order === undefined) return;

  if (typeof order !== 'number' || Number.isNaN(order)) {
    // Written as a string, the comparison that sorts these is a string
    // comparison, and '10' comes before '9'. Nothing else goes wrong, which is
    // what makes it hard to spot: the card renders, in the wrong order.
    warnings.push(
      `${where}.order is ${JSON.stringify(order)} rather than a number, so the sorting will not ` +
        `be what you expect.`,
    );
  }
};

const checkSection = (
  section: 'indicators' | 'buttons',
  config: RawCardConfig,
  warnings: string[],
) => {
  const entries = config[section];
  if (!isPlainObject(entries)) return;

  for (const [id, item] of Object.entries(entries)) {
    if (!isPlainObject(item)) continue;

    checkOrder(`${section}.${id}`, item.order, warnings);
    // Buttons have no tap_action; indicators do.
    if (section === 'indicators')
      checkTapAction(`${section}.${id}.tap_action`, item.tap_action, warnings);
  }
};

/**
 * Reads a card configuration and reports what the card will silently ignore.
 *
 * Returns the messages rather than printing them, so that what is reported can
 * be tested without capturing a console.
 *
 * Two rules govern what belongs here, both learned the hard way (#178):
 *
 * - **Only the top level is checked for unknown keys.** Inside an indicator or
 *   a button, a key the card does not read is an extension point rather than a
 *   typo: `getIndicatorConfig` and `getButtonConfig` build the template scope
 *   as `{ ...value }`, so every key written beside a template is readable from
 *   it as `this.`, and the bundled configurations are written that way. A
 *   validator with a closed vocabulary would reject this repository's own
 *   presets.
 * - **Never throw.** Measured on Home Assistant 2026.8.3: a thrown `setConfig`
 *   message reaches the console and never the card, because `hui-error-card`
 *   draws a red icon and drops the text. Throwing tells the user nothing that a
 *   warning does not, and breaks a dashboard while doing it.
 */
export default (config: RawCardConfig): string[] => {
  const warnings: string[] = [];

  if (!isPlainObject(config)) return warnings;

  for (const key of Object.keys(config)) {
    if (CARD_OPTIONS.includes(key) || FOREIGN_OPTIONS.includes(key)) continue;

    const meant = MEANT_INSTEAD[key];
    warnings.push(
      meant
        ? `'${key}' is not an option this card reads - did you mean '${meant}'? Everything under ` +
            `'${key}' is being ignored.`
        : `'${key}' is not an option this card reads, so it does nothing. The options are ` +
            `listed at ${DOCS}.`,
    );
  }

  checkTapAction('tap_action', config.tap_action, warnings);
  checkSection('indicators', config, warnings);
  checkSection('buttons', config, warnings);

  return warnings;
};
