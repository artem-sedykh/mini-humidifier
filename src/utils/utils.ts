import { STATES_OFF, UNAVAILABLE_STATES } from '../const';
import type { HassEntity, Source } from '../types';

const toggleState = (state: string | undefined): string | undefined => {
  if (!state) return state;

  if (!STATES_OFF.includes(state) && !UNAVAILABLE_STATES.includes(state)) return 'off';

  if (STATES_OFF.includes(state) && !UNAVAILABLE_STATES.includes(state)) return 'on';

  return state;
};

// The value is the device's and the configuration is the user's, so this is
// where `any` starts and the models keep it.
const getEntityValue = (entity: HassEntity | undefined, config?: Source): any => {
  if (!entity) return undefined;

  if (!config) return entity.state;

  if (config.attribute) return entity.attributes[config.attribute];

  return entity.state;
};

// Two things without an order compare as equal, which leaves a stable sort
// holding them where they were. `undefined > undefined` did the same, back when
// this comparison was written inline and against a property that did not exist.
const byOrder = (a: number | undefined, b: number | undefined): number => {
  if (a === undefined || b === undefined) return 0;

  return a > b ? 1 : b > a ? -1 : 0;
};

const round = (value: any, decimals?: number): number =>
  Number(`${Math.round(Number(`${value}e${decimals}`))}e-${decimals}`);

// Takes the source text of a function out of a model configuration and gives
// it back as a function bound to `context` - which is how `this.call_service`
// in those files reaches the card. See the note on `moduleContext` in
// rollup.config.mjs.
const compileTemplate = (template: any, context?: Record<string, unknown>): any => {
  try {
    // eslint-disable-next-line no-new-func
    return new Function('', `return ${template.toString()}`).call(context || {});
  } catch (e) {
    throw new Error(`\n[COMPILE ERROR]: [${(e as Error).toString()}]\n[SOURCE]: ${template}\n`, {
      cause: e,
    });
  }
};

export { byOrder, round, compileTemplate, getEntityValue, toggleState };
