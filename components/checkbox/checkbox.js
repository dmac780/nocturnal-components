// nocturnal-components/components/checkbox/checkbox.js

/**
 * @customElement noc-checkbox
 * 
 * @slot - The checkbox's label.
 * @slot help - Additional help text to display below the label.
 * 
 * @attr {boolean} checked - Whether the checkbox is checked.
 * @attr {boolean} indeterminate - Whether the checkbox is in an indeterminate state.
 * @attr {boolean} disabled - Whether the checkbox is disabled.
 * @attr {'sm' | 'md' | 'lg'} size - The size of the checkbox.
 * 
 * @cssprop --noc-size-sm - The size of the checkbox when size is 'sm'.
 * @cssprop --noc-size-md - The size of the checkbox when size is 'md'.
 * @cssprop --noc-size-lg - The size of the checkbox when size is 'lg'.
 * @cssprop --noc-checkbox-size - Overrides the default box size.
 * @cssprop --noc-gap - The gap between the checkbox and the label.
 * @cssprop --noc-border - The border color of the checkbox.
 * @cssprop --noc-radius - The border radius of the checkbox.
 * @cssprop --noc-input-bg - The background color of the checkbox.
 * @cssprop --noc-check - The color of the checkmark or indeterminate line.
 * @cssprop --noc-bg - The background color when checked or hovered.
 * @cssprop --noc-hover-shadow - The shadow color on hover.
 * @cssprop --noc-focus - The focus ring color.
 * @cssprop --noc-disabled-bg - The background color when disabled.
 * @cssprop --noc-disabled - The border color when disabled.
 * @cssprop --noc-color - The text color of the label.
 * @cssprop --noc-help - The text color of the help text.
 * 
 * @event change - Emitted when the checked state changes.
 */

function buildTemplate() {
  return `
    <style>
      :host {
        display: inline-block;
        font-family: inherit;

        --noc-size-sm: 14px;
        --noc-size-md: 18px;
        --noc-size-lg: 24px;

        --box-size: var(--noc-size-md);
      }

      :host([size="sm"]) { --box-size: var(--noc-size-sm); }
      :host([size="md"]) { --box-size: var(--noc-size-md); }
      :host([size="lg"]) { --box-size: var(--noc-size-lg); }

      label {
        display: flex;
        align-items: center;
        gap: var(--noc-gap, 0.75rem);
        cursor: pointer;
        user-select: none;
      }

      input {
        appearance: none;
        width: var(--noc-checkbox-size, var(--box-size, 18px));
        height: var(--noc-checkbox-size, var(--box-size, 18px));
        border: 1.5px solid var(--noc-border, #d1d5db);
        border-radius: var(--noc-radius, 4px);
        display: grid;
        place-content: center;
        background: var(--noc-input-bg, #fff);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        margin: 0;
        flex-shrink: 0;
      }

      input::before {
        content: "";
        width: 0.65em;
        height: 0.65em;
        transform: scale(0);
        background: var(--noc-check, #fff);
        transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0, 43% 62%);
      }

      input:hover:not(:disabled) {
        border-color: var(--noc-bg, #111);
        box-shadow: 0 0 0 4px var(--noc-hover-shadow, rgba(0,0,0,0.05));
      }

      input:checked {
        background: var(--noc-bg, #111);
        border-color: var(--noc-bg, #111);
      }

      input:checked::before { transform: scale(1); }

      input:indeterminate::before {
        clip-path: none;
        width: 0.5em;
        height: 2px;
        background: var(--noc-check, #fff);
        transform: scale(1);
      }

      input:focus-visible {
        outline: 2px solid var(--noc-focus, #2563eb);
        outline-offset: 2px;
      }

      input:disabled {
        background: var(--noc-disabled-bg, #f3f4f6);
        border-color: var(--noc-disabled, #9ca3af);
        cursor: not-allowed;
        opacity: 0.6;
      }

      .text {
        display: flex;
        flex-direction: column;
        line-height: 1.25;
        color: var(--noc-color, inherit);
      }

      .help {
        display: block;
        font-size: 0.85em;
        color: var(--noc-help, #6b7280);
        margin-top: 2px;
      }
    </style>

    <label>
      <input type="checkbox" />
      <span class="text">
        <slot></slot>
        <slot name="help" class="help"></slot>
      </span>
    </label>
  `;
}

class NocCheckbox extends HTMLElement {

  static get observedAttributes() {
    return ['checked', 'indeterminate', 'disabled', 'size'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._onChange = this._onChange.bind(this);
  }

  connectedCallback() {
    this.render();
    this._sync();
  }

  attributeChangedCallback() {
    this._sync();
  }

  setCustomValidity(message) { this._input?.setCustomValidity(message); }
  reportValidity()           { return this._input?.reportValidity(); }

  _sync() {
    if (!this._input) return;
    this._input.checked       = this.hasAttribute('checked');
    this._input.indeterminate = this.hasAttribute('indeterminate');
    this._input.disabled      = this.hasAttribute('disabled');
  }

  _onChange() {
    if (this._input.checked) {
      this.setAttribute('checked', '');
    } else {
      this.removeAttribute('checked');
    }
    this.removeAttribute('indeterminate');
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  render() {
    this.shadowRoot.innerHTML = buildTemplate();
    this._input = this.shadowRoot.querySelector('input');
    this._input.addEventListener('change', this._onChange);
  }
}

customElements.define('noc-checkbox', NocCheckbox);

export function ssrTemplate() {
  return `<template shadowrootmode="open">${buildTemplate()}</template>`;
}
