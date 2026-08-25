import { SUPPORTED_DOMAINS } from './const';
import HUMIDIFIERS from './humidifiers';

/**
 * The visual editor, first half (#179).
 *
 * This is a **schema**, handed to Home Assistant through the static
 * `getConfigForm` on the card, rather than an editor element of our own. The
 * difference is not cosmetic - it is what makes the editor safe for a
 * hand-written card:
 *
 * - Home Assistant renders it with its own `hui-form-editor`, which passes the
 *   **whole configuration** into `ha-form` as `data` and re-emits whatever
 *   comes back. `ha-form` merges each field change over that data
 *   (`this.data = { ...this.data, ...newValue }`), so every key this schema
 *   does not mention survives a trip through the editor untouched.
 * - `ha-form` is imported by Home Assistant, not by this bundle. An editor
 *   element of our own would have to make the frontend load `ha-form` first,
 *   since it is lazily loaded and simply absent until some editor has been
 *   opened.
 *
 * Verified on Home Assistant 2026.8.3 against the real elements rather than
 * read out of the source: a card carrying an unknown `model` and an
 * `indicators` section with a compiled template came back from an edit to a
 * neighbouring field with both intact.
 *
 * **Only the flat options are here on purpose.** `getConfigForm` is static and
 * takes no arguments, so the schema cannot depend on the configuration being
 * edited - and which indicators and buttons a card has depends on its model and
 * on ids the user chose. Those stay in YAML, which is where the second half of
 * #179 would pick them up, with an editor element and the merge to write by
 * hand.
 *
 * There is deliberately no `assertConfig`. Throwing from it sends the card to
 * the YAML editor with "visual editor is not supported", and that is worth
 * doing when an editor would misrepresent a configuration - but nothing here
 * can: the options this schema does not name are carried through by Home
 * Assistant, and the ones it does name are scalars.
 */
const configForm = () => ({
  schema: [
    {
      name: 'entity',
      required: true,
      // The same two domains the card accepts, from the same constant, so a
      // domain added to one is offered by the other.
      selector: { entity: { domain: [...SUPPORTED_DOMAINS] } },
    },
    {
      name: 'model',
      selector: {
        select: {
          mode: 'dropdown',
          // `custom_value` because a model the registry does not know is a
          // supported way to use this card, not a mistake - see the note in
          // `setConfig`. Without it the field would be a closed list, and a
          // card written for a device nobody here has heard of could not say
          // so in the editor at all.
          custom_value: true,
          // `default` is the fallback the registry uses internally, not a
          // device: offering it would put a name in the picker that means
          // "no name". `none` stays - it is a documented preset (#186).
          options: Object.keys(HUMIDIFIERS).filter(id => id !== 'default'),
        },
      },
    },
    { name: 'name', selector: { text: {} } },
    { name: 'icon', selector: { icon: {} } },
    { name: 'scale', selector: { number: { min: 0.1, max: 5, step: 0.1, mode: 'box' } } },
    { name: 'group', selector: { boolean: {} } },
  ],
});

export default configForm;
