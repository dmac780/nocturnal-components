// nocturnal-components/components/file-button/file-button.js

/**
 * @customElement noc-file-button
 *
 * @slot - Icon, emoji, or label rendered inside the button.
 *
 * Attributes:
 * @attr {'primary'|'neutral'|'success'|'warning'|'danger'} variant
 *   Visual colour variant. Matches noc-button vocabulary. Default: 'neutral'.
 * @attr {'sm'|'md'|'lg'} size
 *   Size preset. Matches noc-button sizing so heights align with noc-input. Default: 'md'.
 * @attr {boolean} pill    - Full pill border-radius.
 * @attr {boolean} outline - Transparent background, coloured border and text.
 * @attr {boolean} circle  - Forces equal width/height and 50% radius (icon-only button).
 * @attr {boolean} disabled   - Disables the button.
 * @attr {string}  accept     - Passed to the file input, e.g. "image/*,.pdf".
 * @attr {boolean} multiple   - Allow selecting more than one file.
 * @attr {string}  aria-label - Accessible label. Defaults to "Attach file".
 *
 * CSS Custom Properties:
 * @cssprop --noc-fb-bg          - Resting background colour
 * @cssprop --noc-fb-bg-hover    - Hover background colour
 * @cssprop --noc-fb-bg-active   - Active / pressed background colour
 * @cssprop --noc-fb-color       - Label / icon colour
 * @cssprop --noc-fb-border      - Border colour
 * @cssprop --noc-fb-radius      - Border radius override
 * @cssprop --noc-fb-focus       - Focus ring colour
 * @cssprop --noc-fb-icon-size   - Explicit icon size (defaults to current font-size)
 *
 * Properties:
 * @prop {FileList|null} files - The last selected FileList. Null before any selection.
 *
 * Methods:
 * @method open()  - Programmatically open the native file picker.
 * @method clear() - Clear the internal file input value and reset `files`.
 *
 * Events:
 * @event noc-change - Fired when files are selected. detail: { files: FileList }
 * @event noc-cancel - Fired when the picker is closed with no selection (where supported).
 */

function buildTemplate(attrs = {}) {
  const disabled = 'disabled' in attrs;

  return `
    <style>
      :host {
        display: inline-block;
        vertical-align: middle;

        --noc-fb-bg:         #2a2a2a;
        --noc-fb-bg-hover:   #333;
        --noc-fb-bg-active:  #222;
        --noc-fb-color:      #aaa;
        --noc-fb-border:     #333;
        --noc-fb-radius:     6px;
        --noc-fb-focus:      var(--noc-accent-alpha, rgba(59, 130, 246, 0.3));
        --noc-fb-icon-size:  1em;
      }

      *, *::before, *::after { box-sizing: border-box; }

      button {
        all: unset;
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-family: inherit;
        font-weight: 500;
        line-height: 1;
        cursor: pointer;
        user-select: none;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid var(--noc-fb-border);
        background: var(--noc-fb-bg);
        color: var(--noc-fb-color);
        border-radius: var(--noc-fb-radius);
        white-space: nowrap;
      }

      :host(:not([size])) button,
      :host([size="md"]) button {
        padding: 0.625rem 1.25rem;
        font-size: 0.875rem;
        --noc-fb-radius: 6px;
      }

      :host([size="sm"]) button {
        padding: 0.4rem 0.75rem;
        font-size: 0.75rem;
        --noc-fb-radius: 4px;
      }

      :host([size="lg"]) button {
        padding: 0.8rem 1.75rem;
        font-size: 1rem;
        --noc-fb-radius: 8px;
      }

      :host([pill]) button {
        border-radius: 999px;
      }

      :host([circle]) button {
        border-radius: 50%;
        padding: 0;
      }

      :host(:not([size]):not([circle])[circle]) button,
      :host([size="md"][circle]) button {
        width: 2.375rem;
        height: 2.375rem;
      }

      :host([size="sm"][circle]) button {
        width: 1.75rem;
        height: 1.75rem;
      }

      :host([size="lg"][circle]) button {
        width: 2.875rem;
        height: 2.875rem;
      }

      :host([circle]:not([size])) button {
        width: 2.375rem;
        height: 2.375rem;
      }

      :host([variant="primary"]) {
        --noc-fb-bg:        var(--noc-accent, #2563eb);
        --noc-fb-bg-hover:  #1d4ed8;
        --noc-fb-bg-active: #1e40af;
        --noc-fb-color:     #fff;
        --noc-fb-border:    transparent;
      }

      :host([variant="success"]) {
        --noc-fb-bg:        #16a34a;
        --noc-fb-bg-hover:  #15803d;
        --noc-fb-bg-active: #166534;
        --noc-fb-color:     #fff;
        --noc-fb-border:    transparent;
      }

      :host([variant="warning"]) {
        --noc-fb-bg:        #d97706;
        --noc-fb-bg-hover:  #b45309;
        --noc-fb-bg-active: #92400e;
        --noc-fb-color:     #fff;
        --noc-fb-border:    transparent;
      }

      :host([variant="danger"]) {
        --noc-fb-bg:        #dc2626;
        --noc-fb-bg-hover:  #b91c1c;
        --noc-fb-bg-active: #991b1b;
        --noc-fb-color:     #fff;
        --noc-fb-border:    transparent;
      }

      :host([variant="neutral"]) {
        --noc-fb-bg:       transparent;
        --noc-fb-bg-hover: rgba(255, 255, 255, 0.05);
        --noc-fb-color:    #aaa;
        --noc-fb-border:   #333;
      }

      :host([outline]) {
        --noc-fb-bg:       transparent;
        --noc-fb-bg-hover: transparent;
      }

      :host([outline][variant="primary"]) {
        --noc-fb-color:  var(--noc-accent, #2563eb);
        --noc-fb-border: var(--noc-accent, #2563eb);
      }

      :host([outline][variant="success"]) {
        --noc-fb-color:  #22c55e;
        --noc-fb-border: #22c55e;
      }

      :host([outline][variant="danger"]) {
        --noc-fb-color:  #ef4444;
        --noc-fb-border: #ef4444;
      }

      button:hover:not(:disabled) {
        background: var(--noc-fb-bg-hover);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      button:active:not(:disabled) {
        background: var(--noc-fb-bg-active);
        transform: translateY(1px);
      }

      button:focus-visible {
        box-shadow: 0 0 0 3px var(--noc-fb-focus);
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        filter: grayscale(0.5);
      }

      ::slotted(svg) {
        width:  var(--noc-fb-icon-size);
        height: var(--noc-fb-icon-size);
        display: block;
        flex-shrink: 0;
      }

      input[type="file"] {
        position: absolute;
        width: 0;
        height: 0;
        opacity: 0;
        pointer-events: none;
      }
    </style>

    <button id="btn" part="button" type="button" ${disabled ? 'disabled' : ''}>
      <slot></slot>
    </button>

    <input
      type="file"
      id="input"
      part="input"
      tabindex="-1"
      aria-hidden="true"
      ${disabled ? 'disabled' : ''}
    />
  `;
}

class NocFileButton extends HTMLElement {

  static get observedAttributes() {
    return ['variant', 'size', 'pill', 'outline', 'circle', 'disabled', 'accept', 'multiple', 'aria-label'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._files    = null;
    this._onClick  = this._onClick.bind(this);
    this._onChange = this._onChange.bind(this);
    this._onCancel = this._onCancel.bind(this);
    this._isRendered = false;
  }

  connectedCallback() {
    if (!this._isRendered) {
      this._setup();
      this._isRendered = true;
    }
    this._updateUI();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal && this.isConnected) {
      if (name === 'disabled') {
        this._updateUI();
      } else {
        this._setup();
        this._updateUI();
      }
    }
  }

  get files() {
    return this._files;
  }

  open() {
    const input = this.shadowRoot.getElementById('input');
    if (input && !this.hasAttribute('disabled')) {
      input.click();
    }
  }

  clear() {
    const input = this.shadowRoot.getElementById('input');
    if (input) {
      input.value = '';
    }
    this._files = null;
  }

  _onClick() {
    this.open();
  }

  _onChange(e) {
    this._files = e.target.files;
    this.dispatchEvent(new CustomEvent('noc-change', {
      bubbles:  true,
      composed: true,
      detail:   { files: this._files },
    }));
  }

  _onCancel() {
    this.dispatchEvent(new CustomEvent('noc-cancel', {
      bubbles:  true,
      composed: true,
    }));
  }

  _setup() {
    this.shadowRoot.innerHTML = buildTemplate({
      ...(this.hasAttribute('disabled') ? { disabled: true } : {}),
    });

    this.shadowRoot.getElementById('btn').addEventListener('click', this._onClick);
    this.shadowRoot.getElementById('input').addEventListener('change', this._onChange);
    this.shadowRoot.getElementById('input').addEventListener('cancel', this._onCancel);
  }

  _updateUI() {
    if (!this._isRendered) {
      return;
    }

    const btn    = this.shadowRoot.getElementById('btn');
    const input  = this.shadowRoot.getElementById('input');
    const label  = this.getAttribute('aria-label') || 'Attach file';
    const accept = this.getAttribute('accept') || '';
    const multi  = this.hasAttribute('multiple');
    const disabled = this.hasAttribute('disabled');

    btn.disabled = disabled;
    btn.setAttribute('aria-label', label);
    input.disabled = disabled;

    if (accept) {
      input.setAttribute('accept', accept);
    } else {
      input.removeAttribute('accept');
    }

    if (multi) {
      input.setAttribute('multiple', '');
    } else {
      input.removeAttribute('multiple');
    }
  }
}

customElements.define('noc-file-button', NocFileButton);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
