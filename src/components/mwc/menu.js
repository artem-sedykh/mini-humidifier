import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import { MenuBase } from '@material/mwc-menu/mwc-menu-base';
import { styles as menuStyles } from '@material/mwc-menu/mwc-menu.css';
import HumidifierMenuSurface from './menu-surface';
import HumidifierList from './list';
import buildElementDefinitions from '../../utils/buildElementDefinitions';

export default class HumidifierMenu extends ScopedRegistryHost(MenuBase) {
  static get defineId() { return 'mwc-menu'; }

  static get elementDefinitions() {
    return buildElementDefinitions([HumidifierMenuSurface, HumidifierList], HumidifierMenu);
  }

  static get styles() {
    return menuStyles;
  }
}
