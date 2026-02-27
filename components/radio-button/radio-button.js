// nocturnal-components/components/radio-button/radio-button.js

/**
 * @customElement noc-radio-button
 * 
 * @slot - The primary label of the radio button.
 * @slot prefix - Content to display before the label (e.g., an icon).
 * @slot suffix - Content to display after the label (e.g., a badge).
 * 
 * Attributes:
 * @attr {boolean} checked - Whether the radio button is selected.
 * @attr {boolean} disabled - Whether the radio button is disabled.
 * @attr {'sm' | 'md' | 'lg'} size - The size of the button. Defaults to 'md'.
 * @attr {boolean} pill - If present, the button will have a pill shape.
 * @attr {string} name - The name of the radio group this button belongs to.
 * @attr {string} value - The value associated with this radio button.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-surface - Background color of the button in its normal state.
 * @cssprop --noc-surface-hover - Background color when the button is hovered.
 * @cssprop --noc-accent - Background color when the button is checked.
 * @cssprop --noc-text - Main text color of the button.
 * @cssprop --noc-border - Border color of the button.
 * @cssprop --noc-focus - Focus ring color.
 * 
 * Events:
 * @event noc-change - Emitted when the radio button is selected.
 */

function buildTemplate(attrs = {}) {
  return `
    <style>
      :host {
        display: inline-block;
        --padding: 0.75rem 1.25rem;
        --radius: 8px;
        --bg: var(--noc-surface, #111);
        --bg-hover: var(--noc-surface-hover, #1a1a1a);
        --bg-checked: var(--noc-accent, #3b82f6);
        --fg: var(--noc-text, #e5e7eb);
        --fg-checked: #fff;
        --border: var(--noc-border, #333);
        --border-checked: var(--noc-accent, #3b82f6);
        --focus: var(--noc-focus, #60a5fa);
      }

      :host([size="sm"]) {
        --padding: 0.5rem 1rem;
        --radius: 6px;
      }

      :host([size="lg"]) {
        --padding: 1rem 1.5rem;
        --radius: 10px;
      }

      :host(:not([size]), [size="md"]) {
        --padding: 0.75rem 1.25rem;
        --radius: 8px;
      }

      button {
        all: unset;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        padding: var(--padding);
        border-radius: var(--radius);
        border: 1px solid var(--border);
        background: var(--bg);
        color: var(--fg);
        font: inherit;
        user-select: none;
        transition: background 0.15s, border-color 0.15s;
      }

      button:hover {
        background: var(--bg-hover);
      }

      button:focus-visible {
        outline: 2px solid var(--focus);
        outline-offset: 2px;
      }

      :host([checked]) button {
        background: var(--bg-checked);
        border-color: var(--border-checked);
        color: var(--fg-checked);
      }

      :host([disabled]) button {
        opacity: 0.5;
        cursor: not-allowed;
      }

      :host([pill]) button {
        border-radius: 999px;
      }

      ::slotted([slot="prefix"]),
      ::slotted([slot="suffix"]) {
        display: inline-flex;
        align-items: center;
      }
    </style>

    <button
      part="button"
      role="radio"
      aria-checked="false"
    >
      <slot name="prefix"></slot>
      <slot></slot>
      <slot name="suffix"></slot>
    </button>
  `;
}

class NocRadioButton extends HTMLElement {

  static get observedAttributes() {
    return ['checked', 'disabled', 'size', 'pill'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = buildTemplate();
    this.button = this.shadowRoot.querySelector('button');
  }

  connectedCallback() {
    this.setAttribute('tabindex', this.disabled ? '-1' : '0');
    this._syncAria();

    this.button.addEventListener('click', () => {
      if (this.disabled) {
        return;
      }
      this._check();
    });

    this.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this._check();
      }
    });
  }

  attributeChangedCallback() {
    this._syncAria();
  }

  get checked() {
    return this.hasAttribute('checked');
  }

  set checked(val) {
    val ? this.setAttribute('checked', '') : this.removeAttribute('checked');
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(val) {
    val ? this.setAttribute('disabled', '') : this.removeAttribute('disabled');
  }

  _check() {
    if (this.checked) {
      return;
    }
    
    const name = this.getAttribute('name');
    if (name) {
      document
        .querySelectorAll(`noc-radio-button[name="${name}"]`)
        .forEach(el => el !== this && el.removeAttribute('checked'));
    }

    this.checked = true;

    this.dispatchEvent(
      new CustomEvent('noc-change', {
        detail: {
          value: this.value,
        },
        bubbles: true,
      })
    );
  }

  _syncAria() {
    if (!this.button) return;
    this.button.setAttribute('aria-checked', this.checked);
    this.button.setAttribute('aria-disabled', this.disabled);
  }

  get value() {
    return this.getAttribute('value');
  }
}

customElements.define('noc-radio-button', NocRadioButton);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
