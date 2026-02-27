// nocturnal-components/components/radio-group/radio-group.js

/**
 * @customElement noc-radio-group
 * 
 * @slot - List of noc-radio or noc-radio-button components.
 * 
 * Attributes:
 * @attr {string} value - The value of the currently selected radio button.
 * @attr {boolean} disabled - Whether the entire radio group is disabled.
 * @attr {'sm' | 'md' | 'lg'} size - The size to propagate to child radio buttons.
 * @attr {boolean} required - Whether a selection is required (for form validation).
 * 
 * Events:
 * @event change - Emitted when the selected value of the group changes.
 */

function buildTemplate(attrs = {}) {
  return `<slot></slot>`;
}

class NocRadioGroup extends HTMLElement {

  static formAssociated = true

  constructor() {
    super()
    this._internals = this.attachInternals()
    this._value = ''
    this._customValidity = ''
  }

  static get observedAttributes() {
    return ['value', 'disabled', 'size', 'required']
  }

  connectedCallback() {
    this.setAttribute('role', 'radiogroup')
    this._upgrade()
    this._syncRadios()
    this._attachEvents()
    this._updateValidity()
  }

  attributeChangedCallback() {
    this._syncRadios()
    this._updateValidity()
  }

  get value() {
    return this._value
  }

  set value(val) {
    this._value = val ?? ''
    this.setAttribute('value', this._value)
    this._syncRadios()
    this._updateValidity()
    this.dispatchEvent(new Event('change', { bubbles: true }))
  }

  setCustomValidity(message = '') {
    this._customValidity = message
    this._updateValidity()
  }

  _upgrade() {
    if (this.hasAttribute('value')) {
      this._value = this.getAttribute('value')
    }
  }

  _radios() {
    return [...this.querySelectorAll('noc-radio, noc-radio-button')]
  }

  _syncRadios() {
    const disabled = this.hasAttribute('disabled')
    const size = this.getAttribute('size')

    this._radios().forEach(radio => {
      radio.checked = radio.value === this._value
      radio.disabled = disabled || radio.hasAttribute('disabled')

      if (size && !radio.hasAttribute('size')) {
        radio.size = size
      }
    })
  }

  _attachEvents() {
    this.addEventListener('noc-change', e => {
      if (this.hasAttribute('disabled')) return
      this.value = e.detail.value
    })
  }

  _updateValidity() {
    let message = this._customValidity

    if (!message && this.hasAttribute('required') && !this._value) {
      message = 'Please select an option.'
    }

    this._internals.setValidity(
      message ? { customError: true } : {},
      message
    )

    this._internals.setFormValue(this._value || null)
  }
}

customElements.define('noc-radio-group', NocRadioGroup)

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`
}
