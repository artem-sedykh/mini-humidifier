import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import { ListBase } from '@material/mwc-list/mwc-list-base';
import { styles as listStyles } from '@material/mwc-list/mwc-list.css';
import HumidifierListItem from './list-item';
import buildElementDefinitions from '../../utils/buildElementDefinitions';

export default class HumidifierList extends ScopedRegistryHost(ListBase) {
  static get defineId() { return 'mwc-list'; }

  static get elementDefinitions() {
    return buildElementDefinitions([HumidifierListItem], HumidifierList);
  }

  static get styles() {
    return listStyles;
  }
}
