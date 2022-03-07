import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import buildElementDefinitions from '../../utils/buildElementDefinitions';
import HumidifierSvgIcon from './svg-icon';

export default class HumidifierIcon extends ScopedRegistryHost(customElements.get('ha-icon')) {
  static get defineId() { return 'ha-icon'; }

  static get elementDefinitions() {
    return buildElementDefinitions([HumidifierSvgIcon]);
  }
}
