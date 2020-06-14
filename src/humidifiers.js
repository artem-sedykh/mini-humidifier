import ZHIMI_HUMIDIFIER_CB1 from './configurations/zhimi_humidifier_cb1';
import DEERMA_HUMIDIFIER_MJJSQ from './configurations/deerma_humidifier_mjjsq';

const HUMIDIFIERS = {
  default: ZHIMI_HUMIDIFIER_CB1,
  'zhimi.humidifier.cb1': ZHIMI_HUMIDIFIER_CB1,
  'deerma.humidifier.mjjsq': DEERMA_HUMIDIFIER_MJJSQ,
};

export default HUMIDIFIERS;
