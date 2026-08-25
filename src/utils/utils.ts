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
//
// What comes back is wrapped, because of where these are called from. A
// template runs inside a component's own render, so a throw leaves that
// component in the tree with an empty shadow root while the card around it
// renders intact: a control that vanished, with the reason in the browser
// console and nothing on screen. #70 lived on that for four years, and the
// templates a user writes can still do it. Wrapped, the card renders as if the
// option had not been written, and says which option it was.
//
// `where` is that option's path. The warning is printed once per compiled
// function rather than once per call: `hass` arrives on every state change in
// the installation, and a warning per render would bury the console it is
// meant to help. `setConfig` compiles fresh functions, so a corrected
// configuration warns again.
const compileTemplate = (template: any, context?: Record<string, unknown>, where?: string): any => {
  let compiled;

  try {
    // eslint-disable-next-line no-new-func
    compiled = new Function('', `return ${template.toString()}`).call(context || {});
  } catch (e) {
    throw new Error(`\n[COMPILE ERROR]: [${(e as Error).toString()}]\n[SOURCE]: ${template}\n`, {
      cause: e,
    });
  }

  // An option written as a plain value rather than a function - `disabled: true`
  // compiles to `true`. There is nothing to guard, and wrapping it would change
  // what the caller is handed.
  if (typeof compiled !== 'function') return compiled;

  let warned = false;

  return (...args: unknown[]) => {
    try {
      return compiled(...args);
    } catch (e) {
      if (!warned) {
        warned = true;
        console.warn(
          `mini-humidifier: ${where || 'a template'} threw ${(e as Error).toString()}, so the ` +
            `card is rendering as if that option had not been written.`,
        );
      }

      return undefined;
    }
  };
};

export { byOrder, round, compileTemplate, getEntityValue, toggleState };
