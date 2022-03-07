import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import buildElementDefinitions from '../../utils/buildElementDefinitions';

export default class HumidifierIconButton extends ScopedRegistryHost(customElements.get('ha-icon-button')) {
  static get defineId() { return 'ha-icon-button'; }

  static get elementDefinitions() {
    return buildElementDefinitions();
  }
}
