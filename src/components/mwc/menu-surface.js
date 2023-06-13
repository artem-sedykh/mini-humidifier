import { MenuSurfaceBase } from '@material/mwc-menu/mwc-menu-surface-base';
import { styles as menuSurfaceStyles } from '@material/mwc-menu/mwc-menu-surface.css';
import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import buildElementDefinitions from '../../utils/buildElementDefinitions';

export default class HumidifierMenuSurface extends ScopedRegistryHost(MenuSurfaceBase) {
  static get defineId() { return 'mwc-menu-surface'; }

  static get elementDefinitions() {
    return buildElementDefinitions([], HumidifierMenuSurface);
  }

  static get styles() {
    return menuSurfaceStyles;
  }
}
