// nocturnal-components/components/input/input.js

/**
 * @customElement noc-input
 * 
 * @slot prefix - Content to display before the input text (e.g., an icon or prefix text).
 * @slot suffix - Content to display after the input text (and after action buttons).
 * 
 * Attributes:
 * @attr {string} type - The type of input (text, password, email, etc.). Defaults to 'text'.
 * @attr {string} placeholder - The placeholder text.
 * @attr {string} value - The current value of the input.
 * @attr {'sm' | 'md' | 'lg'} size - The size of the input. Defaults to 'md'.
 * @attr {'outline' | 'filled'} variant - The visual variant of the input. Defaults to 'outline'.
 * @attr {boolean} clearable - If present, shows a clear button when the input has a value.
 * @attr {boolean} toggle - If present and type is 'password', shows a button to toggle password visibility.
 * @attr {boolean} readonly - Whether the input is read-only.
 * @attr {boolean} disabled - Whether the input is disabled.
 * @attr {string} label - Label text to display above the input.
 * @attr {string} help-text - Help text to display below the input.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-input-bg - Background color of the input wrapper.
 * @cssprop --noc-input-border - Border color of the input wrapper.
 * @cssprop --noc-input-color - Text color of the input.
 * @cssprop --noc-input-focus - Border color when focused.
 * @cssprop --noc-input-focus-alpha - Shadow color when focused (alpha).
 * @cssprop --noc-input-radius - Border radius of the input wrapper.
 * @cssprop --noc-input-padding - Internal padding of the input field.
 * 
 * Events:
 * @event input - Emitted when the input value changes.
 * @event noc-clear - Emitted when the input is cleared via the clear button.
 */

function buildTemplate(attrs = {}) {
  const type        = attrs.type        || 'text';
  const placeholder = attrs.placeholder || '';
  const value       = attrs.value       || '';
  const label       = attrs.label       || '';
  const helpText    = attrs['help-text'] || '';
  const disabled    = 'disabled' in attrs;
  const readonly    = 'readonly' in attrs;

  return `
    <style>
      :host {
        display: block;
        font-family: inherit;
        --noc-input-bg: #1a1a1a;
        --noc-input-border: #333;
        --noc-input-color: #eee;
        --noc-input-focus: var(--noc-accent, #2563eb);
        --noc-input-radius: 8px;
        --noc-input-padding: 0.625rem 0.75rem;
        width: 100%;
      }

      .input-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #fff;
        margin-bottom: 0.125rem;
      }

      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        background: var(--noc-input-bg);
        border: 1px solid var(--noc-input-border);
        border-radius: var(--noc-input-radius);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
      }

      :host([variant="filled"]) .input-wrapper {
        background: #0a0a0a;
        border-color: #222;
      }

      .input-wrapper:focus-within:not(.disabled) {
        border-color: var(--noc-input-focus);
        box-shadow: 0 0 0 3px var(--noc-input-focus-alpha, rgba(37, 99, 235, 0.2));
      }

      .input-wrapper.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: #111;
      }

      input {
        flex: 1;
        background: transparent;
        border: none;
        color: var(--noc-input-color);
        font: inherit;
        padding: var(--noc-input-padding);
        outline: none;
        width: 0;
        min-width: 0;
      }

      input::placeholder { color: #555; }

      /* Sizes */
      :host([size="sm"]) { --noc-input-padding: 0.4rem 0.6rem; --noc-input-radius: 6px; }
      :host([size="sm"]) input { font-size: 0.8125rem; }
      :host([size="lg"]) { --noc-input-padding: 0.8rem 1rem; --noc-input-radius: 10px; }
      :host([size="lg"]) input { font-size: 1.125rem; }

      .helper {
        font-size: 0.75rem;
        color: #888;
        margin-top: 0.125rem;
      }

      .button-group {
        display: flex;
        align-items: center;
        padding-right: 0.5rem;
        gap: 0.25rem;
      }

      .action-button {
        all: unset;
        cursor: pointer;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        color: #666;
        transition: all 0.2s;
        font-size: 1rem;
      }

      .action-button:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #eee;
      }

      ::slotted([slot="prefix"]), ::slotted([slot="suffix"]) {
        display: flex;
        align-items: center;
        padding: 0 0.75rem;
        color: #666;
        background: rgba(255, 255, 255, 0.02);
        height: 100%;
        border-right: 1px solid var(--noc-input-border);
      }

      ::slotted([slot="suffix"]) {
        border-right: none;
        border-left: 1px solid var(--noc-input-border);
      }
    </style>

    <div class="input-group">
      ${label ? `<label class="label">${label}</label>` : ''}
      <div class="input-wrapper ${disabled ? 'disabled' : ''}">
        <slot name="prefix"></slot>
        <input 
          type="${type}" 
          placeholder="${placeholder}" 
          value="${value}" 
          ${readonly ? 'readonly' : ''} 
          ${disabled ? 'disabled' : ''} 
        />
        <div class="button-group">
          <button class="action-button" id="clearBtn" aria-label="Clear" style="display: none;">✕</button>
          <button class="action-button" id="toggleBtn" aria-label="Toggle password" style="display: none;">👁</button>
        </div>
        <slot name="suffix"></slot>
      </div>
      ${helpText ? `<div class="helper">${helpText}</div>` : ''}
    </div>
  `;
}

class NocInput extends HTMLElement {

  static get observedAttributes() {
    return ['type', 'placeholder', 'value', 'size', 'variant', 'clearable', 'toggle', 'readonly', 'disabled', 'label', 'help-text'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    this.togglePassword = this.togglePassword.bind(this);
    this.clearInput = this.clearInput.bind(this);
  }

  connectedCallback() {
    this.render();
  }

  get value() {
    return this.inputEl ? this.inputEl.value : (this.getAttribute('value') || '');
  }

  set value(v) {
    this.setAttribute('value', v);
    if (this.inputEl) {
      this.inputEl.value = v;
      this.updateClearButton();
    }
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this.inputEl) return;
    switch (name) {
      case 'value':
        if (this.inputEl.value !== newVal) {
          this.inputEl.value = newVal;
        }
        this.updateClearButton();
        break;
      case 'placeholder':
        this.inputEl.placeholder = newVal || '';
        break;
      case 'type':
        this.inputEl.type = newVal || 'text';
        break;
      case 'label':
      case 'help-text':
      case 'variant':
      case 'size':
        this.render();
        break;
      case 'clearable':
      case 'toggle':
        this.updateButtons();
        break;
      case 'readonly':
        this.inputEl.readOnly = this.hasAttribute('readonly');
        break;
      case 'disabled':
        this.inputEl.disabled = this.hasAttribute('disabled');
        break;
    }
  }

  togglePassword() {
    if (this.inputEl) {
      const isPassword = this.inputEl.type === 'password';
      this.inputEl.type = isPassword ? 'text' : 'password';
      this.toggleBtn.innerHTML = isPassword ? '🔒' : '👁';
    }
  }

  clearInput() {
    if (!this.inputEl) {
      return;
    }
    this.inputEl.value = '';
    this.setAttribute('value', '');
    this.updateClearButton();
    this.inputEl.focus();
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent('noc-clear', { bubbles: true, composed: true }));
  }

  updateClearButton() {
    if (!this.clearBtn) {
      return;
    }
    this.clearBtn.style.display = (this.hasAttribute('clearable') && this.inputEl.value) ? 'flex' : 'none';
  }

  updateButtons() {
    this.updateClearButton();
    if (this.toggleBtn) {
      this.toggleBtn.style.display = (this.hasAttribute('toggle') && this.getAttribute('type') === 'password') ? 'flex' : 'none';
    }
  }

  render() {
    const type        = this.getAttribute('type') || 'text';
    const placeholder = this.getAttribute('placeholder') || '';
    const value       = this.getAttribute('value') || '';
    const label       = this.getAttribute('label');
    const helpText    = this.getAttribute('help-text');
    const readonly    = this.hasAttribute('readonly');
    const disabled    = this.hasAttribute('disabled');

    this.shadowRoot.innerHTML = buildTemplate({
      type,
      placeholder,
      value,
      ...(label    ? { label }              : {}),
      ...(helpText ? { 'help-text': helpText } : {}),
      ...(readonly ? { readonly: true }     : {}),
      ...(disabled ? { disabled: true }     : {}),
    });

    this.inputEl   = this.shadowRoot.querySelector('input');
    this.clearBtn  = this.shadowRoot.getElementById('clearBtn');
    this.toggleBtn = this.shadowRoot.getElementById('toggleBtn');

    this.inputEl.addEventListener('input', e => {
      this.setAttribute('value', this.inputEl.value);
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      this.updateClearButton();
    });

    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', this.clearInput);
    }

    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', this.togglePassword);
    }
    
    this.updateButtons();
  }
}

customElements.define('noc-input', NocInput);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
