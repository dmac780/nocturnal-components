// nocturnal-components/components/tree-item/tree-item.js

/**
 * @customElement noc-tree-item
 * 
 * @slot - The content of the tree item.
 * 
 * Attributes:
 * @attr {boolean} expanded - Whether the tree item is expanded.
 * @attr {boolean} selected - Whether the tree item is selected.
 * @attr {boolean} disabled - Whether the tree item is disabled.
 * @attr {boolean} lazy - Whether the tree item is lazy.
 * @attr {boolean} loading - Whether the tree item is loading.
 *
 * CSS Custom Properties:
 * @cssprop --indent-size - The size of the indent.
 * @cssprop --indent-guide-width - The width of the indent guide.
 * @cssprop --indent-guide-color - The color of the indent guide.
 * @cssprop --indent-guide-style - The style of the indent guide.
 * @cssprop --indent-guide-offset - The offset of the indent guide.
 * @cssprop --noc-tree-item-height - The height of the tree item.
 *
 * Events:
 * @event noc-expand - Emitted when the tree item is expanded.
 * @event noc-collapse - Emitted when the tree item is collapsed.
 * @event noc-select - Emitted when the tree item is selected.
 */

function buildTemplate(attrs = {}) {
  const expanded = 'expanded' in attrs;

  return `
    <style>
      :host {
        display: block;
        outline: none;
        --indent-size: 1.5rem;
        --indent-guide-width: 0;
        --indent-guide-color: #444;
        --indent-guide-style: solid;
        --indent-guide-offset: 0;
        --noc-tree-item-height: 2rem;
      }

      .item-container {
        display: flex;
        flex-direction: column;
      }

      .item-row {
        display: flex;
        align-items: center;
        height: var(--noc-tree-item-height);
        padding: 0 0.5rem;
        cursor: pointer;
        user-select: none;
        border-radius: 4px;
        transition: background 0.2s;
        gap: 0.5rem;
        color: var(--noc-color, #eee);
        white-space: nowrap;
      }

      :host([disabled]) .item-row {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .item-row:hover:not(.disabled) {
        background: rgba(255, 255, 255, 0.05);
      }

      :host([selected]) .item-row {
        background: var(--noc-accent-alpha, rgba(37, 99, 235, 0.2));
        color: var(--noc-accent, #60a5fa);
      }

      .toggle-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1rem;
        height: 1rem;
        flex-shrink: 0;
        color: #888;
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      :host([expanded]:not([has-collapse-icon])) .toggle-icon {
        transform: rotate(90deg);
      }

      .toggle-icon.hidden {
        visibility: hidden;
      }

      .children-container {
        display: none;
        padding-left: var(--indent-size);
        position: relative;
      }

      :host([expanded]) .children-container {
        display: block;
      }

      .children-container::before {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: calc(var(--indent-guide-offset) + var(--indent-size) / 2);
        width: var(--indent-guide-width);
        border-left: var(--indent-guide-width) var(--indent-guide-style) var(--indent-guide-color);
      }

      .loading-spinner {
        width: 14px;
        height: 14px;
        margin-right: 4px;
      }

      .label {
        font-size: 0.875rem;
        flex: 1;
      }
    </style>

    <div class="item-container">
      <div class="item-row" id="row" part="base">
        <div class="toggle-icon" id="toggle">
          <slot name="expand-icon" id="expand-slot">▶</slot>
          <slot name="collapse-icon" id="collapse-slot" hidden></slot>
        </div>
        
        <slot name="prefix"></slot>
        
        <div class="loading-container" id="loading-ui" hidden>
          <noc-spinner class="loading-spinner"></noc-spinner>
        </div>

        <div class="label" part="label">
          <slot></slot>
        </div>

        <slot name="suffix"></slot>
      </div>

      <div class="children-container" id="children" part="children">
        <slot name="children"></slot>
      </div>
    </div>
  `;
}

class NocTreeItem extends HTMLElement {

  static get observedAttributes() {
    return ['expanded', 'selected', 'disabled', 'lazy', 'loading'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isRendered = false;
    this._isLeaf     = true;
  }

  connectedCallback() {
    if (!this._isRendered) {
      this._setup();
      this._isRendered = true;
    }
    this._syncState();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (this._isRendered && oldVal !== newVal) {
      this._syncState();
      
      if (name === 'expanded') {
        const isExpanded = newVal !== null;
        this.dispatchEvent(new CustomEvent(isExpanded ? 'noc-expand' : 'noc-collapse', { 
          bubbles: true, 
          composed: true 
        }));
      }
    }
  }

  get expanded() { return this.hasAttribute('expanded'); }
  set expanded(val) { val ? this.setAttribute('expanded', '') : this.removeAttribute('expanded'); }

  get selected() { return this.hasAttribute('selected'); }
  set selected(val) { val ? this.setAttribute('selected', '') : this.removeAttribute('selected'); }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(val) { val ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  get lazy() { return this.hasAttribute('lazy'); }
  set lazy(val) { val ? this.setAttribute('lazy', '') : this.removeAttribute('lazy'); }

  get loading() { return this.hasAttribute('loading'); }
  set loading(val) { val ? this.setAttribute('loading', '') : this.removeAttribute('loading'); }

  _setup() {
    this.shadowRoot.innerHTML = buildTemplate({
      ...(this.hasAttribute('expanded') ? { expanded: true } : {}),
    });

    this._row          = this.shadowRoot.getElementById('row');
    this._toggle       = this.shadowRoot.getElementById('toggle');
    this._expandSlot   = this.shadowRoot.getElementById('expand-slot');
    this._collapseSlot = this.shadowRoot.getElementById('collapse-slot');
    this._loadingUi    = this.shadowRoot.getElementById('loading-ui');

    this._row.addEventListener('click', (e) => this._handleClick(e));
    
    this.shadowRoot.querySelector('slot[name="children"]').addEventListener('slotchange', () => this._syncState());
    this._collapseSlot.addEventListener('slotchange', () => {
      this.toggleAttribute('has-collapse-icon', this._collapseSlot.assignedElements().length > 0);
      this._syncState();
    });
  }

  _syncState() {
    if (!this._isRendered) {
      return;
    }
    
    const childSlot   = this.shadowRoot.querySelector('slot[name="children"]');
    const hasChildren = childSlot.assignedElements().length > 0;
    
    this._isLeaf = !hasChildren && !this.lazy;
    
    this._loadingUi.hidden = !this.loading;
    
    this._toggle.classList.toggle('hidden', this._isLeaf);
    
    const hasCollapseIcon = this.hasAttribute('has-collapse-icon');
    if (hasCollapseIcon) {
      if (this.expanded) {
        this._expandSlot.hidden  = true;
        this._collapseSlot.hidden = false;
      } else {
        this._expandSlot.hidden  = false;
        this._collapseSlot.hidden = true;
      }
    } else {
      this._expandSlot.hidden  = false;
      this._collapseSlot.hidden = true;
    }
  }

  _handleClick(e) {
    if (this.disabled) {
      return;
    }
    
    const isToggle = e.target.closest('#toggle');
    
    if (isToggle || !this._isLeaf) {
      this.expanded = !this.expanded;
    }

    this.dispatchEvent(new CustomEvent('noc-select', {
      bubbles: true,
      composed: true,
      detail: { item: this }
    }));
  }
}

customElements.define('noc-tree-item', NocTreeItem);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
