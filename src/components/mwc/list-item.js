import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import { ListItemBase } from '@material/mwc-list/mwc-list-item-base';
import { styles as listItemStyles } from '@material/mwc-list/mwc-list-item.css';
import HumidifierRipple from './ripple';
import buildElementDefinitions from '../../utils/buildElementDefinitions';

export default class HumidifierListItem extends ScopedRegistryHost(ListItemBase) {
  static get defineId() { return 'mwc-list-item'; }

  static get elementDefinitions() {
    return buildElementDefinitions([HumidifierRipple], HumidifierListItem);
  }

  static get styles() {
    return listItemStyles;
  }
}
