import { version } from '../package.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const global = window as any;

global.customCards = global.customCards || [];
global.customCards.push({
  type: 'mini-humidifier',
  name: 'Mini Humidifier Card',
  description: 'mini Humidifier card',
});

// eslint-disable-next-line no-console
console.info(
  `%c MINI-HUMIDIFIER-CARD %c ${version}`,
  'color: white; background: coral; font-weight: 700;',
  'color: coral; background: white; font-weight: 700;',
);
