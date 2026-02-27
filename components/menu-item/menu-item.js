// nocturnal-components/components/menu-item/menu-item.js

/**
 * @customElement noc-menu-item
 * 
 * @slot - The primary label for the menu item.
 * @slot prefix - Content to display before the label (e.g., an icon).
 * @slot suffix - Content to display after the label (e.g., a keyboard shortcut).
 * 
 * Attributes:
 * @attr {boolean} disabled - Whether the item is disabled and cannot be clicked.
 * @attr {'checkbox'} type - The type of menu item. If 'checkbox', it will toggle its checked state on click.
 * @attr {boolean} checked - Whether the item is checked (only applicable when type is 'checkbox').
 * @attr {'neutral' | 'danger'} variant - The visual variant of the item.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-item-bg - Background color of the item in its normal state.
 * @cssprop --noc-item-hover - Background color when the item is hovered.
 * @cssprop --noc-item-color - Text color in the normal state.
 * @cssprop --noc-item-active - Text color when the item is hovered.
 * @cssprop --noc-item-radius - Border radius of the item.
 * @cssprop --noc-accent - Color of the checkbox when checked.
 * 
 * Events:
 * @event noc-select - Emitted when the item is clicked (unless disabled).
 */

function buildTemplate(attrs = {}) {
  const disabled = 'disabled' in attrs;
  const type     = attrs.type    || '';
  const checked  = 'checked' in attrs;

  return `
    <style>
      :host {
        display: block;
        font-family: inherit;
        --noc-item-bg: transparent;
        --noc-item-hover: rgba(255, 255, 255, 0.08);
        --noc-item-color: #cbd5e1;
        --noc-item-active: #fff;
        --noc-item-radius: 8px;
        --noc-accent: #2563eb;
      }

      .menu-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0.75rem;
        background: var(--noc-item-bg);
        border-radius: var(--noc-item-radius);
        cursor: ${disabled ? 'not-allowed' : 'pointer'};
        color: var(--noc-item-color);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
        font-size: 0.875rem;
        position: relative;
        overflow: hidden;
      }

      :host(:hover:not([disabled])) .menu-item {
        background: var(--noc-item-hover);
        color: var(--noc-item-active);
        padding-left: 0.85rem;
      }

      :host([variant="danger"]) .menu-item {
        color: #f87171;
      }

      :host([variant="danger"]:hover:not([disabled])) .menu-item {
        background: rgba(239, 68, 68, 0.15);
        color: #fca5a5;
      }

      .label {
        flex: 1;
        font-weight: 500;
      }

      .prefix, .suffix {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        opacity: 0.7;
        transition: opacity 0.2s;
      }

      :host(:hover) .prefix, :host(:hover) .suffix {
        opacity: 1;
      }

      .checkbox {
        width: 18px;
        height: 18px;
        border: 1.5px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.2);
        transition: all 0.2s;
        margin-right: 0.25rem;
      }

      .checkbox.checked {
        background: var(--noc-accent);
        border-color: var(--noc-accent);
        box-shadow: 0 0 10px rgba(37, 99, 235, 0.4);
      }

      .checkbox::after {
        content: '';
        width: 4px;
        height: 8px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        display: ${checked && type === 'checkbox' ? 'block' : 'none'};
        margin-top: -1px;
      }

      :host([disabled]) {
        opacity: 0.4;
        pointer-events: none;
      }

      ::slotted([slot="prefix"]), ::slotted([slot="suffix"]) {
        display: inline-flex;
        align-items: center;
      }
    </style>

    <div class="menu-item" id="item" part="base">
      ${type === 'checkbox' ? `<span class="checkbox ${checked ? 'checked' : ''}"></span>` : ''}
      <slot name="prefix" class="prefix"></slot>
      <span class="label" part="label"><slot></slot></span>
      <slot name="suffix" class="suffix"></slot>
    </div>
  `;
}

class NocMenuItem extends HTMLElement {

  static get observedAttributes() {
    return ['disabled', 'type', 'checked'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  handleClick(e) {
    if (this.hasAttribute('disabled')) {
      e.stopPropagation();
      return;
    }

    if (this.getAttribute('type') === 'checkbox') {
      this.toggleAttribute('checked');
    }

    this.dispatchEvent(new CustomEvent('noc-select', {
      bubbles: true,
      composed: true,
      detail: { item: this, checked: this.hasAttribute('checked') }
    }));
  }

  render() {
    this.shadowRoot.innerHTML = buildTemplate({
      ...(this.hasAttribute('disabled') ? { disabled: true }  : {}),
      ...(this.getAttribute('type')     ? { type: this.getAttribute('type') } : {}),
      ...(this.hasAttribute('checked')  ? { checked: true }   : {}),
    });

    this.shadowRoot.getElementById('item').addEventListener('click', (e) => this.handleClick(e));
  }
}

customElements.define('noc-menu-item', NocMenuItem);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
