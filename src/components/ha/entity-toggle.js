import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import buildElementDefinitions from '../../utils/buildElementDefinitions';

export default class HumidifierEntityToggle extends ScopedRegistryHost(customElements.get('ha-entity-toggle')) {
  static get defineId() { return 'ha-entity-toggle'; }

  static get elementDefinitions() {
    return buildElementDefinitions();
  }
}
