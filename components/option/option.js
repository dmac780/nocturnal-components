// nocturnal-components/components/option/option.js

/**
 * @customElement noc-option
 * 
 * @slot - The primary label of the option.
 * @slot prefix - Content to display before the label (e.g., an icon).
 * @slot suffix - Content to display after the label (e.g., a badge or description).
 * 
 * Attributes:
 * @attr {string} value - The value associated with the option. Defaults to the text content if not provided.
 * @attr {boolean} disabled - Whether the option is disabled and cannot be selected.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-accent - Color used for the selected state indicator and text.
 */

function buildTemplate(attrs = {}) {
  const disabled = 'disabled' in attrs;
  const selected = 'selected' in attrs;

  return `
    <style>
      :host {
        display: block;
        user-select: none;
        font-family: inherit;
      }

      .option {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        color: #aaa;
        background: transparent;
        position: relative;
        font-size: 0.9375rem;
        font-weight: 500;
      }

      :host([disabled]) .option {
        cursor: not-allowed;
        opacity: 0.3;
      }

      .option:hover:not(.disabled) {
        background: rgba(255, 255, 255, 0.05);
        color: #fff;
        padding-left: 1.25rem;
      }

      .option.selected {
        background: rgba(37, 99, 235, 0.1);
        color: var(--noc-accent, #3b82f6);
      }

      .option.selected::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: var(--noc-accent, #3b82f6);
        border-radius: 0 4px 4px 0;
      }

      .check {
        margin-left: auto;
        display: ${selected ? 'flex' : 'none'};
        color: currentColor;
        width: 16px;
        height: 16px;
        align-items: center;
        justify-content: center;
        animation: checkPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      @keyframes checkPop {
        from { transform: scale(0.5); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }

      ::slotted([slot="prefix"]), ::slotted([slot="suffix"]) {
        display: flex;
        align-items: center;
        font-size: 1.1em;
        opacity: 0.7;
      }

      .option.active {
        background: rgba(255, 255, 255, 0.08);
      }
    </style>

    <div class="option ${disabled ? 'disabled' : ''} ${selected ? 'selected' : ''}">
      <slot name="prefix"></slot>
      <div class="label"><slot></slot></div>
      <slot name="suffix"></slot>
      <div class="check">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
    </div>
  `;
}

class NocOption extends HTMLElement {

  static get observedAttributes() {
    return ['value', 'disabled'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._selected = false;
  }

  get value() {
    return this.getAttribute('value') || this.textContent.trim();
  }

  set value(val) {
    this.setAttribute('value', val);
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(val) {
    if (val) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  get selected() {
    return this._selected;
  }

  set selected(val) {
    this._selected = val;
    this.render();
  }

  connectedCallback() {
    this.setAttribute('role', 'option');
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const disabled = this.disabled;
    const selected = this.selected;

    this.shadowRoot.innerHTML = buildTemplate({
      ...(disabled ? { disabled: true } : {}),
      ...(selected ? { selected: true } : {}),
    });
  }
}

customElements.define('noc-option', NocOption);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
