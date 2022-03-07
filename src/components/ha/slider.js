import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import buildElementDefinitions from '../../utils/buildElementDefinitions';

export default class HumidifierSlider extends ScopedRegistryHost(customElements.get('ha-slider')) {
  static get defineId() { return 'ha-slider'; }

  static get elementDefinitions() {
    return buildElementDefinitions();
  }
}
