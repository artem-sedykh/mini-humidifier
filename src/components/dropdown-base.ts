import { LitElement, html, css } from 'lit';
import type { PropertyValues } from 'lit';
import sharedStyle from '../sharedStyle';
import define from '../utils/define';
import type { SourceItem } from '../types';

// The menu behind every dropdown on the card: an icon button that opens a list
// of options, one of which is the current one.
//
// This used to be `@material/mwc-menu` and `@material/mwc-list`, wrapped in
// scoped registries so the card's copies would not collide with Home
// Assistant's. Those packages are end of life on lit 2, which held the whole
// card there - see #148 - and they cost 95 KB of a 182 KB bundle for a list of
// four modes.
//
// An item is `{ id, name }`: `id` is what goes back to the device, `name` is
// what the user reads. `selected` is the id of the current one, compared case
// insensitively because devices report their modes in whatever case they like.
//
// The menu is positioned by hand rather than by the layout, because the card
// clips its own overflow and a menu that stayed in flow would be cut off. Where
// the browser has the popover API it is also put in the top layer, which is
// immune to a transformed ancestor as well - Home Assistant applies one while
// dashboards are being edited.
const MENU_MARGIN = 8;

export default class HumidifierDropdownBase extends LitElement {
  static override get properties() {
    return {
      items: { type: Array },
      label: { type: String },
      selected: { type: String },
      icon: { type: String },
      active: { type: Boolean },
      disabled: { type: Boolean },
      open: { type: Boolean, state: true },
    };
  }

  items!: SourceItem[];

  label: string | undefined;

  selected: string | undefined;

  icon: string | undefined;

  active: boolean | undefined;

  disabled: boolean | undefined;

  open: boolean;

  private onDocumentPointerDown: (event: Event) => void;

  private onDocumentKeydown: (event: KeyboardEvent) => void;

  private onViewportChange: () => void;

  constructor() {
    super();
    this.items = [];
    this.open = false;
    this.onDocumentPointerDown = event => this.handleDocumentPointerDown(event);
    this.onDocumentKeydown = event => this.handleDocumentKeydown(event);
    this.onViewportChange = () => this.close();
  }

  override disconnectedCallback() {
    // The listeners below live on the document, so a card removed while its
    // menu is open would leave them behind.
    this.stopListening();
    super.disconnectedCallback();
  }

  get selectedId() {
    if (this.selected === undefined || this.selected === null) return -1;

    return this.items
      .map(item => item.id.toString().toUpperCase())
      .indexOf(this.selected.toString().toUpperCase());
  }

  get menu(): HTMLElement | null {
    return this.shadowRoot && this.shadowRoot.getElementById('menu');
  }

  get button(): HTMLElement | null {
    return this.shadowRoot && this.shadowRoot.getElementById('button');
  }

  get options(): HTMLButtonElement[] {
    return this.menu
      ? [...this.menu.querySelectorAll<HTMLButtonElement>('.mh-dropdown__item')]
      : [];
  }

  handleClick() {
    if (this.disabled) return;

    this.open = !this.open;
  }

  select(index: number) {
    const item = this.items[index];

    this.close();

    if (!item || index === this.selectedId) return;

    this.dispatchEvent(new CustomEvent('change', { detail: item }));
  }

  close() {
    if (!this.open) return;

    this.open = false;
  }

  // Keys inside the menu. Enter and Space are the button's own, so they are not
  // handled here.
  handleKeydown(event: KeyboardEvent) {
    const { options } = this;
    const current = options.indexOf(this.shadowRoot!.activeElement as HTMLButtonElement);

    const focus = (index: number) => {
      event.preventDefault();
      const option = options[(index + options.length) % options.length];
      if (option) option.focus();
    };

    switch (event.key) {
      case 'ArrowDown':
        focus(current + 1);
        break;
      case 'ArrowUp':
        focus(current - 1);
        break;
      case 'Home':
        focus(0);
        break;
      case 'End':
        focus(options.length - 1);
        break;
      case 'Tab':
        // Let the focus go where it was going, but not back into a menu that is
        // no longer on screen.
        this.close();
        break;
      default:
        break;
    }
  }

  handleDocumentKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;

    event.stopPropagation();
    this.close();
    if (this.button) this.button.focus();
  }

  handleDocumentPointerDown(event: Event) {
    // `composedPath` sees through the shadow root, which a click target does
    // not: without it every click looks like it came from the card.
    if (event.composedPath().includes(this)) return;

    this.close();
  }

  startListening() {
    document.addEventListener('pointerdown', this.onDocumentPointerDown, true);
    document.addEventListener('keydown', this.onDocumentKeydown, true);
    // Closing beats following the anchor around: a menu is a decision, and the
    // page moving under it means the user is doing something else.
    window.addEventListener('scroll', this.onViewportChange, true);
    window.addEventListener('resize', this.onViewportChange);
  }

  stopListening() {
    document.removeEventListener('pointerdown', this.onDocumentPointerDown, true);
    document.removeEventListener('keydown', this.onDocumentKeydown, true);
    window.removeEventListener('scroll', this.onViewportChange, true);
    window.removeEventListener('resize', this.onViewportChange);
  }

  // Position and focus, after the menu is in the DOM and can be measured.
  override updated(changedProps: PropertyValues) {
    if (!changedProps.has('open')) return;

    if (!this.open) {
      this.stopListening();
      return;
    }

    const { menu } = this;
    if (!menu) return;

    this.showAsPopover(menu);
    this.position();
    this.startListening();

    const option = this.options[this.selectedId] || this.options[0];
    if (option) option.focus();
  }

  // The top layer, where the browser offers it. It is worth having because a
  // dashboard being edited puts a transformed ancestor above this menu, and a
  // transformed ancestor is what `position: fixed` cannot escape.
  //
  // The care here is about the failure, not the feature. `popover="manual"` is
  // on the menu from the moment it renders, and in an engine that honours the
  // attribute an element carrying it is `display: none` until `showPopover`
  // puts it in the top layer. So a call that does not land does not leave the
  // menu merely un-layered - it leaves it invisible, with the hand positioning
  // underneath unable to help. `showPopover` can refuse: it throws on an
  // element that is already showing, and engines have refused it in other
  // states.
  //
  // An engine that has never heard of the attribute needs none of this - an
  // unknown attribute is inert, and the menu is an ordinary fixed box. It is
  // the half-way case this guards.
  showAsPopover(menu: HTMLElement) {
    if (!menu.showPopover) return;

    try {
      menu.showPopover();
    } catch {
      // Stop claiming to be something the browser just refused to show, and go
      // back to being the fixed box the stylesheet already describes.
      menu.removeAttribute('popover');
    }
  }

  position() {
    const { menu, button } = this;
    if (!menu || !button) return;

    const anchor = button.getBoundingClientRect();
    const { width, height } = menu.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // Right edges aligned and the menu drawn over the button, which is where
    // the menu this replaces put it.
    const left = Math.min(
      Math.max(MENU_MARGIN, anchor.right - width),
      Math.max(MENU_MARGIN, viewport.width - width - MENU_MARGIN),
    );
    const bottom = anchor.top + height > viewport.height - MENU_MARGIN;
    const top = bottom
      ? Math.max(MENU_MARGIN, anchor.bottom - height)
      : Math.max(MENU_MARGIN, anchor.top);

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }

  renderMenu() {
    if (!this.open) return '';

    return html`
      <div
        id="menu"
        class="mh-dropdown__menu"
        role="listbox"
        popover="manual"
        @keydown=${this.handleKeydown}>
        ${this.items.map(
          (item, index) => html`
            <button
              type="button"
              role="option"
              class="mh-dropdown__item"
              data-value=${item.id}
              aria-selected=${index === this.selectedId ? 'true' : 'false'}
              @click=${() => this.select(index)}>
              <span class="mh-dropdown__item__label ellipsis">${item.name}</span>
            </button>
          `,
        )}
      </div>
    `;
  }

  override render() {
    return html`
      <div class='mh-dropdown'>
        <ha-icon-button class='mh-dropdown__button icon'
                        id=${'button'}
                        @click=${this.handleClick}
                        ?disabled=${this.disabled}
                        ?color=${this.active}
                        .label=${this.label}
                        aria-haspopup='listbox'
                        aria-expanded=${this.open ? 'true' : 'false'}>
          <ha-icon .icon=${this.icon}></ha-icon>
        </ha-icon-button>
        ${this.renderMenu()}
      </div>
    `;
  }

  static override get styles() {
    return [
      sharedStyle,
      css`
        :host {
          position: relative;
          overflow: hidden;
        }
        :host([disabled]) {
          opacity: .25;
          pointer-events: none;
        }
        :host([faded]) {
          opacity: .75;
        }
        .mh-dropdown {
          padding: 0;
        }
        ha-icon-button[disabled] {
          opacity: .25;
          pointer-events: none;
        }
        .mh-dropdown__button.icon {
          margin: 0;
        }
        ha-icon-button {
          width: calc(var(--mh-dropdown-unit));
          height: calc(var(--mh-dropdown-unit));
          --mdc-icon-button-size: calc(var(--mh-dropdown-unit));
          --ha-icon-button-size: calc(var(--mh-dropdown-unit));
        }
        .mh-dropdown[focused] ha-icon-button {
          color: var(--mh-accent-color);
        }
        .mh-dropdown[focused] ha-icon-button[focused] {
          color: var(--mh-text-color);
          transform: rotate(0deg);
        }
        /* The surface. The colours are Home Assistant's own menu colours, so
           this follows the theme the same way the menu it replaces did. */
        .mh-dropdown__menu {
          position: fixed;
          inset: auto;
          z-index: 9;
          box-sizing: border-box;
          margin: 0;
          padding: 8px 0;
          border: none;
          border-radius: 4px;
          min-width: 112px;
          max-width: 280px;
          max-height: 60vh;
          overflow-y: auto;
          background: var(--mdc-theme-surface,
            var(--card-background-color, var(--ha-card-background, #fff)));
          color: var(--primary-text-color, #212121);
          box-shadow:
            0 5px 5px -3px rgba(0, 0, 0, .2),
            0 8px 10px 1px rgba(0, 0, 0, .14),
            0 3px 14px 2px rgba(0, 0, 0, .12);
        }
        .mh-dropdown__item {
          display: flex;
          align-items: center;
          box-sizing: border-box;
          width: 100%;
          min-height: 48px;
          margin: 0;
          padding: 0 16px;
          border: none;
          background: none;
          color: inherit;
          font-family: inherit;
          font-size: 16px;
          text-align: start;
          cursor: pointer;
          /* No 300ms wait for a second tap that is not coming. */
          touch-action: manipulation;
          -webkit-appearance: none;
          appearance: none;
        }
        .mh-dropdown__item:hover,
        .mh-dropdown__item:focus {
          outline: none;
          background: rgba(127, 127, 127, .12);
        }
        .mh-dropdown__item[aria-selected='true'] {
          color: var(--mh-active-color);
        }
        .mh-dropdown__item__label {
          pointer-events: none;
        }
      `,
    ];
  }
}

define('mh-dropdown-base', HumidifierDropdownBase);
