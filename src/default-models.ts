import { ZHIMI_HUMIDIFIER_CB1 } from './configurations/zhimi_humidifier_cb1';
import { DEERMA_HUMIDIFIER_MJJSQ } from './configurations/deerma_humidifier_mjjsq';
import { AIRDOG_AIRPURIFIER_X5 } from './configurations/airdog_airpurifier_x5';
const DefaultModels = {
  default: ZHIMI_HUMIDIFIER_CB1,
  empty: (): object => ({}),
  'zhimi.humidifier.cb1': ZHIMI_HUMIDIFIER_CB1,
  'deerma.humidifier.mjjsq': DEERMA_HUMIDIFIER_MJJSQ,
  'airdog.airpurifier.x5': AIRDOG_AIRPURIFIER_X5,
};

export default DefaultModels;
