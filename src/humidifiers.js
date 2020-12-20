import ZHIMI_HUMIDIFIER_CB1 from './configurations/zhimi_humidifier_cb1';
import SYSSI_ZHIMI_HUMIDIFIER_CB1 from './configurations/syssi_zhimi_humidifier_cb1';
import DEERMA_HUMIDIFIER_MJJSQ from './configurations/deerma_humidifier_mjjsq';
import SYSSI_DEERMA_HUMIDIFIER_MJJSQ from './configurations/syssi_deerma_humidifier_mjjsq';
import ZHIMI_AIRPURIFIER_MA2 from './configurations/zhimi_airpurifier_ma2';

const HUMIDIFIERS = {
  default: ZHIMI_HUMIDIFIER_CB1,
  'zhimi.humidifier.cb1': ZHIMI_HUMIDIFIER_CB1,
  'syssi:zhimi.humidifier.cb1': SYSSI_ZHIMI_HUMIDIFIER_CB1,
  'deerma.humidifier.mjjsq': DEERMA_HUMIDIFIER_MJJSQ,
  'syssi:deerma.humidifier.mjjsq': SYSSI_DEERMA_HUMIDIFIER_MJJSQ,
  'zhimi.airpurifier.ma2': ZHIMI_AIRPURIFIER_MA2,
};

export default HUMIDIFIERS;
