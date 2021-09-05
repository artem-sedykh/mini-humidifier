import ZHIMI_HUMIDIFIER_CB1 from './configurations/xiaomi_miio/zhimi_humidifier_cb1';
import ZHIMI_AIRPURIFIER_MA2 from './configurations/xiaomi_miio/zhimi_airpurifier_ma2';
import ZHIMI_AIRFRESH_VA2 from './configurations/xiaomi_miio/zhimi_airfresh_va2';
import DEERMA_HUMIDIFIER_JSQ from './configurations/xiaomi_miio/deerma_humidifier_jsq';

import XIAOMI_MIIO_AIRPURIFIER_DEERMA_HUMIDIFIER_MJJSQ from './configurations/xiaomi_miio_airpurifier/deerma_humidifier_mjjsq';
import XIAOMI_MIIO_AIRPURIFIER_ZHIMI_HUMIDIFIER_CB1 from './configurations/xiaomi_miio_airpurifier/zhimi_humidifier_cb1';
import XIAOMI_MIIO_AIRPURIFIER_ZHIMI_HUMIDIFIER_CA4 from './configurations/xiaomi_miio_airpurifier/zhimi_humidifier_ca4';

const HUMIDIFIERS = {
  default: ZHIMI_HUMIDIFIER_CB1,
  // xiaomi_miio integration (default home assistant)
  'zhimi.humidifier.cb1': ZHIMI_HUMIDIFIER_CB1,
  'zhimi.humidifier.ca1': ZHIMI_HUMIDIFIER_CB1,
  'zhimi.humidifier.ca4': ZHIMI_HUMIDIFIER_CB1,
  'zhimi.airpurifier.ma2': ZHIMI_AIRPURIFIER_MA2,
  'zhimi.airfresh.va2': ZHIMI_AIRFRESH_VA2,
  'deerma.humidifier.jsq': DEERMA_HUMIDIFIER_JSQ,

  // xiaomi_miio_airpurifier integration https://github.com/syssi/xiaomi_airpurifier
  'xiaomi_miio_airpurifier:zhimi.humidifier.cb1': XIAOMI_MIIO_AIRPURIFIER_ZHIMI_HUMIDIFIER_CB1,
  'xiaomi_miio_airpurifier:zhimi.humidifier.ca4': XIAOMI_MIIO_AIRPURIFIER_ZHIMI_HUMIDIFIER_CA4,
  'xiaomi_miio_airpurifier:deerma.humidifier.mjjsq': XIAOMI_MIIO_AIRPURIFIER_DEERMA_HUMIDIFIER_MJJSQ,
  'deerma.humidifier.mjjsq': XIAOMI_MIIO_AIRPURIFIER_DEERMA_HUMIDIFIER_MJJSQ,
};

export default HUMIDIFIERS;
