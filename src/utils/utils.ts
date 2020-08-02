import { TapAction } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isNumeric = (obj: any): boolean => !isNaN(parseFloat(obj)) && isFinite(obj);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function compileTemplate(template: string | Function): any {
  try {
    return new Function('', `return ${template}`).call({});
  } catch (e) {
    throw new Error(`\n[COMPILE ERROR]: [${e.toString()}]\n[SOURCE]: ${template}\n`);
  }
}

export function parseTapAction(value?: string): TapAction | undefined {
  const item = Object.entries(TapAction).find(s => s[1] === value);
  if (item) return TapAction[item[0]];

  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function round(value: any, decimals: number): number {
  return Number(`${Math.round(Number(`${value}e${decimals}`))}e-${decimals}`);
}
