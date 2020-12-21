import ZHIMI_HUMIDIFIER_CB1 from './configurations/xiaomi_miio/zhimi_humidifier_cb1';
import ZHIMI_AIRPURIFIER_MA2 from './configurations/xiaomi_miio/zhimi_airpurifier_ma2';
import XIAOMI_MIIO_AIRPURIFIER_DEERMA_HUMIDIFIER_MJJSQ from './configurations/xiaomi_miio_airpurifier/deerma_humidifier_mjjsq';
import XIAOMI_MIIO_AIRPURIFIER_ZHIMI_HUMIDIFIER_CB1 from './configurations/xiaomi_miio_airpurifier/zhimi_humidifier_cb1';
import XIAOMI_MIIO_AIRPURIFIER_ZHIMI_HUMIDIFIER_CA4 from './configurations/xiaomi_miio_airpurifier/zhimi_humidifier_ca4';

const HUMIDIFIERS = {
  default: ZHIMI_HUMIDIFIER_CB1,
  // xiaomi_miio integration (default home assistant)
  'zhimi.humidifier.cb1': ZHIMI_HUMIDIFIER_CB1,
  'zhimi.airpurifier.ma2': ZHIMI_AIRPURIFIER_MA2,

  // xiaomi_miio_airpurifier integration https://github.com/syssi/xiaomi_airpurifier
  'xiaomi_miio_airpurifier:zhimi.humidifier.cb1': XIAOMI_MIIO_AIRPURIFIER_ZHIMI_HUMIDIFIER_CB1,
  'xiaomi_miio_airpurifier:zhimi.humidifier.ca4': XIAOMI_MIIO_AIRPURIFIER_ZHIMI_HUMIDIFIER_CA4,
  'xiaomi_miio_airpurifier:deerma.humidifier.mjjsq': XIAOMI_MIIO_AIRPURIFIER_DEERMA_HUMIDIFIER_MJJSQ,
  'deerma.humidifier.mjjsq': XIAOMI_MIIO_AIRPURIFIER_DEERMA_HUMIDIFIER_MJJSQ,
};

export default HUMIDIFIERS;
