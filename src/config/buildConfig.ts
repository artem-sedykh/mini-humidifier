import { ICON } from '../const';
import { compileTemplate, toggleState } from '../utils/utils';
import type {
  ButtonConfig,
  CardConfig,
  IndicatorConfig,
  ModelConfiguration,
  RawCardConfig,
  TargetHumidityConfig,
} from '../types';

/**
 * Turning the YAML a person wrote into the configuration the card renders.
 *
 * This was the middle third of `main.ts`, and it is here because it is not
 * about the element at all: it reads a `RawCardConfig`, merges the named
 * model's defaults under it, compiles every template, and answers a plain
 * object. No DOM, no lit, no `hass` - which also means it can be tested
 * without constructing a card (#233).
 *
 * What it does need from the running card is the two things a template can
 * reach for at call time, and those arrive as `TemplateRuntime` rather than as
 * the card itself. The distinction is not cosmetic: `hass` is replaced on every
 * state change in the installation, so anything captured here has to read it
 * when the template runs and not when the template is compiled.
 */
export interface TemplateRuntime {
  /** `this.call_service(domain, service, options)` inside a template. */
  callService: (domain: string, service: string, options: Record<string, unknown>) => unknown;
  /** `this.localize(key, fallback)`, in the language the frontend is showing now. */
  localize: (key: string, fallback?: string) => string;
}

/**
 * The scope a template runs in: everything written beside it, plus the helpers.
 *
 * `{ ...value }` is the extension point the bundled presets are built on - a
 * key the card does not read is readable from the template as `this.<key>` -
 * and it is why `validateConfig` stops looking for unknown keys at the top
 * level. See docs/custom-device.md.
 */
const readingContext = (value: any, raw: RawCardConfig, runtime: TemplateRuntime) => ({
  ...value,
  entity_config: raw,
  toggle_state: toggleState,
  localize: runtime.localize,
});

/**
 * The same, for a control that acts rather than reads.
 *
 * An indicator never gets `call_service`: it is read-only by construction, and
 * that asymmetry is documented rather than accidental.
 */
const actingContext = (value: any, raw: RawCardConfig, runtime: TemplateRuntime) => ({
  ...readingContext(value, raw, runtime),
  call_service: runtime.callService,
});

const buildIndicator = (
  key: string,
  value: any,
  raw: RawCardConfig,
  runtime: TemplateRuntime,
): IndicatorConfig => {
  const item = {
    id: key,
    // This used to seed three keys, all `undefined`, and one of them was
    // spelled `enitity`. Nothing read any of them: an indicator that names no
    // source of its own falls back to the card's entity where the entity id
    // is resolved, and an absent `attribute` reads the entity's state. The
    // object only has to exist at all, so that `item.source.mapper` below is
    // safe to reach through. Empty says exactly that and cannot be
    // misspelled - `Source` in `types.ts` is where the shape is described.
    source: {},
    icon: '',
    ...value,
  };

  if (typeof value.tap_action === 'string') item.tap_action = { action: value.tap_action };
  else item.tap_action = { action: 'none', ...(item.tap_action || {}) };

  item.functions = item.functions || {};
  const context = readingContext(value, raw, runtime);
  const where = `indicators.${key}`;

  if (item.source.mapper) {
    item.functions.mapper = compileTemplate(item.source.mapper, context, `${where}.source.mapper`);
  }

  if (typeof item.icon === 'object') {
    item.functions.icon = {};

    if (item.icon.template)
      item.functions.icon.template = compileTemplate(
        item.icon.template,
        context,
        `${where}.icon.template`,
      );

    if (item.icon.style)
      item.functions.icon.style = compileTemplate(item.icon.style, context, `${where}.icon.style`);
  }

  if (typeof item.unit === 'object') {
    item.functions.unit = {};

    if (item.unit.template)
      item.functions.unit.template = compileTemplate(
        item.unit.template,
        context,
        `${where}.unit.template`,
      );
  }

  // The reading's own styling, beside the icon's (#213). Two options rather
  // than one on purpose: an icon style here is geometry as much as colour -
  // the AQI indicator of `zhimi.airpurifier.ma2` sets `--mdc-icon-size` and a
  // margin in it - so widening the existing one to cover the value would
  // resize and shift what it lands on.
  if (typeof item.value === 'object') {
    item.functions.value = {};

    if (item.value.style)
      item.functions.value.style = compileTemplate(
        item.value.style,
        context,
        `${where}.value.style`,
      );
  }

  return item;
};

const buildIndicators = (
  raw: RawCardConfig,
  defaults: any,
  runtime: TemplateRuntime,
): IndicatorConfig[] => {
  const merged = defaults || {};

  const data = Object.entries(raw.indicators || {});

  for (let i = 0; i < data.length; i += 1) {
    const key = data[i][0];
    const value = data[i][1] || {};

    merged[key] = { ...(merged[key] || {}), ...value };
  }

  return Object.entries(merged)
    .map((entry, i) => {
      const indicator = buildIndicator(entry[0], entry[1], raw, runtime);

      // Same rule as the buttons: an indicator the configuration does not
      // number takes its position. Without it the sort in `mh-indicators`
      // would compare against `undefined` and leave the order to chance.
      if (!('order' in indicator)) indicator.order = i;

      return indicator;
    })
    .filter(i => !i.hide);
};

const buildButton = (
  value: any,
  raw: RawCardConfig,
  runtime: TemplateRuntime,
  where: string,
): ButtonConfig => {
  const item = {
    icon: 'mdi:radiobox-marked',
    type: 'button',
    toggle_action: undefined,
    ...value,
  };

  item.functions = {};

  const context = actingContext(value, raw, runtime);

  if (item.disabled) {
    item.functions.disabled = compileTemplate(item.disabled, context, `${where}.disabled`);
  }

  if (item.state && item.state.mapper) {
    item.functions.state = {
      mapper: compileTemplate(item.state.mapper, context, `${where}.state.mapper`),
    };
  }

  if (item.active) {
    item.functions.active = compileTemplate(item.active, context, `${where}.active`);
  }

  if (item.source && item.source.__init) {
    item.functions.source = {
      __init: compileTemplate(item.source.__init, context, `${where}.source.__init`),
    };
  }

  if (item.source && item.source.__filter) {
    item.functions.source = item.functions.source || {};
    item.functions.source.filter = compileTemplate(
      item.source.__filter,
      context,
      `${where}.source.__filter`,
    );
  }

  if (item.toggle_action) {
    item.functions.toggle_action = compileTemplate(
      item.toggle_action,
      context,
      `${where}.toggle_action`,
    );
  }

  if (item.change_action) {
    item.functions.change_action = compileTemplate(
      item.change_action,
      context,
      `${where}.change_action`,
    );
  }

  if (item.style) item.functions.style = compileTemplate(item.style, context, `${where}.style`);

  return item;
};

const buildButtons = (
  raw: RawCardConfig,
  defaults: any,
  runtime: TemplateRuntime,
): ButtonConfig[] => {
  const merged = { ...(defaults || {}) };

  const entries = Object.entries(raw.buttons || {});

  for (let i = 0; i < entries.length; i += 1) {
    const key = entries[i][0];
    const value = entries[i][1] || {};

    merged[key] = { ...(merged[key] || {}), ...value };
  }

  const data = Object.entries(merged);

  const buttons = [];

  for (let i = 0; i < data.length; i += 1) {
    const key = data[i][0];
    const value = data[i][1];
    const button = buildButton(value, raw, runtime, `buttons.${key}`);
    button.id = key;

    if (!('order' in button)) button.order = i + 1;

    buttons.push(button);
  }

  return buttons;
};

const buildTargetHumidity = (
  raw: RawCardConfig,
  defaults: any,
  runtime: TemplateRuntime,
): TargetHumidityConfig => {
  const item = {
    ...(defaults || {}),
    ...(raw.target_humidity || {}),
  };

  item.functions = { icon: {} };
  // The scope is what the user wrote, not the merge: unlike an indicator, a
  // preset's own keys are not offered to a template written over it. Kept as
  // it was rather than tidied - a template reading `this.<key>` off a preset it
  // did not write would be new behaviour, not a refactor.
  const context = actingContext(raw.target_humidity || {}, raw, runtime);

  if (item.disabled) {
    item.functions.disabled = compileTemplate(item.disabled, context, 'target_humidity.disabled');
  }

  if (typeof item.icon === 'object') {
    if (item.icon.template)
      item.functions.icon.template = compileTemplate(
        item.icon.template,
        context,
        'target_humidity.icon.template',
      );

    if (item.icon.style)
      item.functions.icon.style = compileTemplate(
        item.icon.style,
        context,
        'target_humidity.icon.style',
      );
  }

  if (item.change_action) {
    item.functions.change_action = compileTemplate(
      item.change_action,
      context,
      'target_humidity.change_action',
    );
  }

  if (item.state && item.state.mapper) {
    item.functions.state = {
      mapper: compileTemplate(item.state.mapper, context, 'target_humidity.state.mapper'),
    };
  }

  if (typeof item.unit === 'object') {
    item.functions.unit = {};

    if (item.unit.template)
      item.functions.unit.template = compileTemplate(
        item.unit.template,
        context,
        'target_humidity.unit.template',
      );
  }

  return item;
};

const buildPower = (raw: RawCardConfig, defaults: any, runtime: TemplateRuntime): ButtonConfig =>
  buildButton({ ...(defaults || {}), ...(raw.power || {}) }, raw, runtime, 'power');

/**
 * The user's YAML plus the model's defaults, with every template compiled.
 *
 * Everything this does is a merge, which is why it is worth having on its own:
 * given the same three arguments it answers the same object, and `setConfig`
 * is left reading as validate, build, assign.
 */
const buildCardConfig = (
  raw: RawCardConfig,
  model: ModelConfiguration,
  runtime: TemplateRuntime,
): CardConfig => {
  // The sections below are filled in immediately after, which is what makes
  // this a `CardConfig` rather than the YAML it starts as.
  const config = {
    model: 'zhimi.humidifier.cb1',
    tap_action: {
      action: 'more-info',
      navigation_path: '',
      url: '',
      entity: '',
      service: '',
      service_data: {},
    },
    ...raw,
  } as unknown as CardConfig;

  // `tap_action: none` is documented, and a bare string is how people write
  // it - but written that way it replaced the default object wholesale and
  // nothing downstream understood it. `handleClick` returns early on a
  // string, so `tap_action: more-info` was a dead click; `computeClasses`
  // compared against the string `'none'`, so the object form of "do nothing"
  // - which is what Home Assistant's own editors write - still drew the card
  // as clickable. Indicators have never had either problem, because
  // `buildIndicator` normalises there. This is the same line, in the one
  // place it was missing (#206).
  if (typeof raw.tap_action === 'string') {
    config.tap_action = { action: raw.tap_action };
  }

  config.toggle = {
    icon: ICON.TOGGLE,
    hide: false,
    default: false,
    ...(raw.toggle || {}),
  };

  config.power = buildPower(raw, model.power, runtime);
  config.target_humidity = buildTargetHumidity(raw, model.target_humidity, runtime);
  config.indicators = buildIndicators(raw, model.indicators, runtime);
  config.buttons = buildButtons(raw, model.buttons, runtime);

  if (typeof raw.secondary_info === 'string') {
    config.secondary_info = { type: raw.secondary_info };
  } else {
    config.secondary_info = {
      type: 'mode',
      ...(raw.secondary_info || {}),
    };
  }

  return config;
};

export default buildCardConfig;
