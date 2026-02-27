// nocturnal-components/components/switch/switch.js

/**
 * @customElement noc-switch
 * 
 * @slot - The primary label for the switch.
 * 
 * Attributes:
 * @attr {boolean} checked - Whether the switch is in the 'on' state.
 * @attr {boolean} disabled - Whether the switch is disabled.
 * @attr {'sm' | 'md' | 'lg'} size - The size of the switch. Defaults to 'md'.
 * @attr {string} help - Supplemental help text to display below the label.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-switch-width - The width of the switch track.
 * @cssprop --noc-switch-height - The height of the switch track.
 * @cssprop --noc-switch-thumb - The diameter of the switch thumb.
 * @cssprop --noc-switch-bg - The background color of the track when unchecked.
 * @cssprop --noc-switch-bg-checked - The background color of the track when checked.
 * @cssprop --noc-switch-thumb-bg - The background color of the thumb.
 * @cssprop --noc-switch-focus - The color of the focus ring.
 * @cssprop --noc-switch-muted - The color of the help text.
 * @cssprop --noc-switch-padding - The distance between the thumb and track edge.
 * @cssprop --noc-color - The color of the primary label.
 * 
 * Events:
 * @event noc-change - Emitted when the switch state changes.
 */

function buildTemplate(attrs = {}) {
  const help    = attrs.help    || '';
  const checked = 'checked' in attrs;

  return `
    <style>
      :host {
        display: inline-block;
        font-family: inherit;
        --noc-switch-width: 2.25rem;
        --noc-switch-height: 1.25rem;
        --noc-switch-thumb: 1rem;
        --noc-switch-bg: #d1d5db;
        --noc-switch-bg-checked: var(--noc-accent, #2563eb);
        --noc-switch-thumb-bg: #fff;
        --noc-switch-focus: var(--noc-accent-alpha, rgba(37, 99, 235, 0.35));
        --noc-switch-muted: #6b7280;
        --noc-switch-padding: 2px;
        user-select: none;
        vertical-align: middle;
      }

      :host([size="sm"]) {
        --noc-switch-width: 1.75rem;
        --noc-switch-height: 1rem;
        --noc-switch-thumb: 0.75rem;
      }

      :host([size="lg"]) {
        --noc-switch-width: 2.75rem;
        --noc-switch-height: 1.5rem;
        --noc-switch-thumb: 1.25rem;
      }

      .container {
        display: flex;
        flex-direction: column;
      }

      .switch-wrapper {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
      }

      :host([disabled]) .switch-wrapper {
        cursor: not-allowed;
        opacity: 0.5;
      }

      .toggle {
        position: relative;
        width: var(--noc-switch-width);
        height: var(--noc-switch-height);
        background: var(--noc-switch-bg);
        border-radius: 999px;
        transition: background 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        flex-shrink: 0;
      }

      .thumb {
        position: absolute;
        top: 50%;
        left: var(--noc-switch-padding);
        width: var(--noc-switch-thumb);
        height: var(--noc-switch-thumb);
        background: var(--noc-switch-thumb-bg);
        border-radius: 50%;
        transform: translateY(-50%);
        transition: left 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        pointer-events: none;
      }

      :host([checked]) .toggle {
        background: var(--noc-switch-bg-checked);
      }

      :host([checked]) .thumb {
        left: calc(100% - var(--noc-switch-thumb) - var(--noc-switch-padding));
      }

      :host(:focus-visible) .toggle {
        box-shadow: 0 0 0 3px var(--noc-switch-focus);
      }

      .label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--noc-color, inherit);
        line-height: 1.25;
      }

      .help {
        font-size: 0.75rem;
        color: var(--noc-switch-muted);
        margin-top: 0.125rem;
      }

      .content-container {
        display: flex;
        flex-direction: column;
      }

      input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
        pointer-events: none;
      }
    </style>

    <div class="container">
      <label class="switch-wrapper" id="wrapper">
        <input type="checkbox" id="input" ${checked ? 'checked' : ''}>
        <span class="toggle" tabindex="0">
          <span class="thumb"></span>
        </span>
        <div class="content-container">
          <span class="label" id="label-text"><slot></slot></span>
          <span class="help" id="help-text" style="${help ? '' : 'display:none'}">${help}</span>
        </div>
      </label>
    </div>
  `;
}

class NocSwitch extends HTMLElement {

  static formAssociated = true;

  static get observedAttributes() {
    return ['checked', 'disabled', 'size', 'label', 'help'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._internals  = this.attachInternals();
    this._isRendered = false;
  }

  connectedCallback() {
    if (!this._isRendered) {
      this._setup();
      this._isRendered = true;
    }
    this._updateUI();
  }

  attributeChangedCallback(oldVal, newVal) {
    if (this._isRendered && oldVal !== newVal) {
      this._updateUI();
    }
  }

  get checked() {
    return this.hasAttribute('checked');
  }

  set checked(val) {
    if (val) {
      this.setAttribute('checked', '');
    } else {
      this.removeAttribute('checked');
    }
    this._internals.setFormValue(val ? 'on' : null);
    this._updateUI();
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

  _setup() {
    this.shadowRoot.innerHTML = buildTemplate({
      help:    this.getAttribute('help'),
      ...(this.hasAttribute('checked')  ? { checked: true }  : {}),
      ...(this.hasAttribute('disabled') ? { disabled: true } : {}),
    });

    this._input           = this.shadowRoot.getElementById('input');
    this._wrapper         = this.shadowRoot.getElementById('wrapper');
    this._helpText        = this.shadowRoot.getElementById('help-text');
    this._toggleContainer = this.shadowRoot.querySelector('.toggle');

    this._wrapper.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.disabled) {
        return;
      }
      this.checked = !this.checked;
      this.dispatchEvent(new CustomEvent('noc-change', {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked }
      }));
    });

    this._toggleContainer.addEventListener('keydown', (e) => {
      if (this.disabled) {
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this._wrapper.click();
      }
    });

    this._input.addEventListener('change', (e) => {
      e.stopPropagation();
    });
  }

  _updateUI() {
    if (!this._isRendered) {
      return;
    }
    
    const help = this.getAttribute('help');
    this._helpText.textContent   = help || '';
    this._helpText.style.display = help ? 'block' : 'none';

    this._input.checked  = this.checked;
    this._input.disabled = this.disabled;
  }
}

customElements.define('noc-switch', NocSwitch);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
