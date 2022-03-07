import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import buildElementDefinitions from '../../utils/buildElementDefinitions';

export default class HumidifierSvgIcon extends ScopedRegistryHost(customElements.get('ha-svg-icon')) {
  static get defineId() { return 'ha-svg-icon'; }

  static get elementDefinitions() {
    return buildElementDefinitions();
  }
}
