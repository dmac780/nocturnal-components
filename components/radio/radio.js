// nocturnal-components/components/radio/radio.js

/**
 * @customElement noc-radio
 * 
 * @slot - The secondary content or label for the radio button.
 * 
 * Attributes:
 * @attr {boolean} checked - Whether the radio button is selected.
 * @attr {boolean} disabled - Whether the radio button is disabled.
 * @attr {'sm' | 'md' | 'lg'} size - The size of the radio button. Defaults to 'md'.
 * @attr {string} name - The name of the radio group this button belongs to.
 * @attr {string} value - The value associated with this radio button.
 * 
 * CSS Custom Properties:
 * @cssprop --radio-size - The diameter of the radio button.
 * 
 * Events:
 * @event noc-change - Emitted when the radio button is selected.
 */

function buildTemplate(attrs = {}) {
  const checked = 'checked' in attrs;

  return `
    <style>
      :host {
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        --radio-size: 16px;
      }

      :host([size="sm"]) { --radio-size: 12px }
      :host([size="md"]) { --radio-size: 16px }
      :host([size="lg"]) { --radio-size: 20px }

      :host([disabled]) {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .radio {
        width: var(--radio-size);
        height: var(--radio-size);
        border-radius: 50%;
        border: 2px solid currentColor;
        display: grid;
        place-items: center;
        margin-right: 0.5em;
        box-sizing: border-box;
      }

      .dot {
        width: 60%;
        height: 60%;
        border-radius: 50%;
        background: currentColor;
        opacity: 0;
      }

      :host([checked]) .dot {
        opacity: 1;
      }
    </style>

    <div class="radio" aria-hidden="true">
      <div class="dot" role="presentation" aria-hidden="true"></div>
    </div>
    <slot></slot>
  `;
}

class NocRadio extends HTMLElement {
  static formAssociated = true

  static get observedAttributes() {
    return ['checked', 'disabled', 'size']
  }

  constructor() {
    super()
    this._internals = this.attachInternals()
    this._shadow = this.attachShadow({ mode: 'open' })
    this._shadow.innerHTML = buildTemplate()
  }

  connectedCallback() {
    this.setAttribute('role', 'radio')
    this.setAttribute('aria-checked', this.checked ? 'true' : 'false')
    this.tabIndex = this.disabled ? -1 : 0

    if (this.checked) {
      this._internals.setFormValue(this.value)
    }

    this.addEventListener('click', this._onSelect)
    this.addEventListener('keydown', this._onKeydown)
  }

  attributeChangedCallback(name) {
    if (name === 'checked') {
      this.setAttribute('aria-checked', this.checked ? 'true' : 'false')
    }
    this.tabIndex = this.disabled ? -1 : 0
  }

  get name() {
    return this.getAttribute('name')
  }

  get value() {
    return this.getAttribute('value') ?? 'on'
  }

  get checked() {
    return this.hasAttribute('checked')
  }

  set checked(val) {
    val ? this.setAttribute('checked', '') : this.removeAttribute('checked')
  }

  get disabled() {
    return this.hasAttribute('disabled')
  }

  set disabled(val) {
    val ? this.setAttribute('disabled', '') : this.removeAttribute('disabled')
  }

  _onSelect = () => {
    if (this.disabled || this.checked) return
    this._checkSelf()
  }

  _onKeydown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      this._onSelect()
    }
  }

  _checkSelf() {
    const group = document.querySelectorAll(
      `noc-radio[name="${CSS.escape(this.name)}"]`
    )

    group.forEach(radio => {
      radio.removeAttribute('checked')
      radio._internals.setFormValue(null)
    })

    this.checked = true
    this._internals.setFormValue(this.value)

    this.dispatchEvent(new CustomEvent('noc-change', { 
      bubbles: true,
      composed: true,
      detail: { value: this.value }
    }))
  }
}

customElements.define('noc-radio', NocRadio)

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`
}
