// nocturnal-components/components/copy-button/copy-button.js

/**
 * @customElement noc-copy-button
 *
 * @slot         - Button label text.
 * @slot prefix  - Content placed before the copy icon (icon, etc.).
 * @slot icon    - Replaces the default copy SVG icon.
 * @slot suffix  - Content placed after the label.
 *
 * Attributes:
 * @attr {string}  value        - Literal text to copy when no `target` is set.
 * @attr {string}  target       - ID of an element whose `.value` or `textContent` is copied.
 * @attr {string}  tooltip      - Hover tooltip text. Default: 'Copy to clipboard'.
 * @attr {string}  success-text - Tooltip text shown after a successful copy. Default: 'Copied!'.
 * @attr {'primary'|'success'|'warning'|'danger'|'neutral'} variant - Visual colour variant. Default: neutral.
 * @attr {'sm'|'md'|'lg'} size  - Size preset. Default: 'md'.
 * @attr {boolean} pill         - Full pill border-radius.
 * @attr {boolean} circle       - Equal width/height, ideal for icon-only use.
 * @attr {boolean} outline      - Transparent fill, coloured border and text.
 * @attr {boolean} disabled     - Disables the button.
 * @attr {boolean} loading      - Shows a spinner and disables interaction.
 *
 * CSS Custom Properties:
 * @cssprop --noc-copy-bg         - Resting background colour.
 * @cssprop --noc-copy-color      - Label and icon colour.
 * @cssprop --noc-copy-border     - Border colour.
 * @cssprop --noc-copy-hover-bg   - Hover background colour.
 * @cssprop --noc-copy-active-bg  - Active/pressed background colour.
 * @cssprop --noc-copy-focus      - Focus ring colour.
 * @cssprop --noc-copy-radius     - Border radius override.
 *
 * Events:
 * @event noc-copy - Fired when text is successfully copied. detail: { text }
 */

function buildTemplate(attrs = {}) {
  const tooltipText = attrs.tooltip || 'Copy to clipboard';
  const disabled    = 'disabled' in attrs;
  const loading     = 'loading' in attrs;

  return `
    <style>
      :host {
        display: inline-block;
        vertical-align: middle;

        --noc-copy-bg:        #2a2a2a;
        --noc-copy-color:     #eee;
        --noc-copy-border:    #444;
        --noc-copy-hover-bg:  #333;
        --noc-copy-active-bg: #222;
        --noc-copy-focus:     var(--noc-accent-alpha, rgba(59, 130, 246, 0.3));
        --noc-copy-radius:    6px;
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
        white-space: nowrap;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid var(--noc-copy-border);
        background: var(--noc-copy-bg);
        color: var(--noc-copy-color);
        border-radius: var(--noc-copy-radius);
        position: relative;
        overflow: hidden;
      }

      :host(:not([size])) button,
      :host([size="md"]) button {
        padding: 0.625rem 1.25rem;
        font-size: 0.875rem;
        --noc-copy-radius: 6px;
      }

      :host([size="sm"]) button {
        padding: 0.4rem 0.75rem;
        font-size: 0.75rem;
        --noc-copy-radius: 4px;
      }

      :host([size="lg"]) button {
        padding: 0.8rem 1.75rem;
        font-size: 1rem;
        --noc-copy-radius: 8px;
      }

      :host([pill]) button { border-radius: 999px; }

      :host([circle]) button {
        border-radius: 50%;
        padding: 0;
      }
      :host([circle]:not([size])) button,
      :host([circle][size="md"]) button { width: 2.375rem; height: 2.375rem; }
      :host([circle][size="sm"]) button { width: 1.75rem;  height: 1.75rem;  }
      :host([circle][size="lg"]) button { width: 2.875rem; height: 2.875rem; }

      :host([variant="primary"]) {
        --noc-copy-bg:        var(--noc-accent, #2563eb);
        --noc-copy-hover-bg:  #1d4ed8;
        --noc-copy-active-bg: #1e40af;
        --noc-copy-color:     #fff;
        --noc-copy-border:    transparent;
      }

      :host([variant="success"]) {
        --noc-copy-bg:        #16a34a;
        --noc-copy-hover-bg:  #15803d;
        --noc-copy-active-bg: #166534;
        --noc-copy-color:     #fff;
        --noc-copy-border:    transparent;
      }

      :host([variant="warning"]) {
        --noc-copy-bg:        #d97706;
        --noc-copy-hover-bg:  #b45309;
        --noc-copy-active-bg: #92400e;
        --noc-copy-color:     #fff;
        --noc-copy-border:    transparent;
      }

      :host([variant="danger"]) {
        --noc-copy-bg:        #dc2626;
        --noc-copy-hover-bg:  #b91c1c;
        --noc-copy-active-bg: #991b1b;
        --noc-copy-color:     #fff;
        --noc-copy-border:    transparent;
      }

      :host([variant="neutral"]) {
        --noc-copy-bg:        transparent;
        --noc-copy-hover-bg:  rgba(255, 255, 255, 0.05);
        --noc-copy-active-bg: rgba(255, 255, 255, 0.09);
        --noc-copy-color:     #aaa;
        --noc-copy-border:    #333;
      }

      :host([outline]) {
        --noc-copy-bg:        transparent;
        --noc-copy-hover-bg:  rgba(255, 255, 255, 0.05);
        --noc-copy-active-bg: rgba(255, 255, 255, 0.09);
      }

      :host([outline][variant="primary"]) {
        --noc-copy-color:  var(--noc-accent, #2563eb);
        --noc-copy-border: var(--noc-accent, #2563eb);
      }

      :host([outline][variant="success"]) {
        --noc-copy-color:  #22c55e;
        --noc-copy-border: #22c55e;
      }

      :host([outline][variant="warning"]) {
        --noc-copy-color:  #f59e0b;
        --noc-copy-border: #f59e0b;
      }

      :host([outline][variant="danger"]) {
        --noc-copy-color:  #ef4444;
        --noc-copy-border: #ef4444;
      }

      :host([outline][variant="neutral"]) {
        --noc-copy-color:  #aaa;
        --noc-copy-border: #333;
      }

      button:hover:not(:disabled) {
        background: var(--noc-copy-hover-bg);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      button:active:not(:disabled) {
        background: var(--noc-copy-active-bg);
        transform: translateY(1px);
      }

      button:focus-visible {
        box-shadow: 0 0 0 3px var(--noc-copy-focus);
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        filter: grayscale(0.5);
      }

      .spinner {
        display: none;
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: currentColor;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        flex-shrink: 0;
      }

      :host([loading]) .spinner { display: block; }

      @keyframes spin { to { transform: rotate(360deg); } }

      .icon-wrap {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: opacity 0.25s ease, transform 0.25s ease;
      }

      .success-mark {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #22c55e;
        font-size: 1.1em;
        opacity: 0;
        transform: scale(0.5);
        transition: opacity 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275),
                    transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        pointer-events: none;
      }

      .prefix-wrap,
      .label-wrap,
      .suffix-wrap {
        display: inline-flex;
        align-items: center;
        transition: opacity 0.25s ease, transform 0.25s ease;
      }

      .prefix-wrap.hidden,
      .label-wrap.hidden,
      .suffix-wrap.hidden {
        display: none;
      }

      button.success .icon-wrap,
      button.success .prefix-wrap,
      button.success .label-wrap,
      button.success .suffix-wrap {
        opacity: 0;
        transform: translateY(-6px) scale(0.85);
        pointer-events: none;
      }

      button.success .success-mark {
        opacity: 1;
        transform: scale(1);
      }

      button.success {
        --noc-copy-border: rgba(34, 197, 94, 0.5) !important;
        --noc-copy-bg:     rgba(34, 197, 94, 0.08) !important;
      }
    </style>

    <noc-tooltip content="${tooltipText}" trigger="manual">
      <button type="button" id="btn" part="base" ${disabled || loading ? 'disabled' : ''}>
        <div class="spinner" id="loader" ${loading ? '' : 'hidden'}></div>
        <span class="prefix-wrap"><slot name="prefix"></slot></span>
        <span class="icon-wrap">
          <slot name="icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </slot>
        </span>
        <span class="label-wrap"><slot></slot></span>
        <span class="suffix-wrap"><slot name="suffix"></slot></span>
        <span class="success-mark">&#10003;</span>
      </button>
    </noc-tooltip>
  `;
}

class NocCopyButton extends HTMLElement {

  static get observedAttributes() {
    return ['variant', 'size', 'pill', 'circle', 'outline', 'disabled', 'loading',
            'target', 'value', 'tooltip', 'success-text'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._copying      = false;
    this._isRendered   = false;
    this.copy          = this.copy.bind(this);
    this._onClickBound = this._onClick.bind(this);
  }

  connectedCallback() {
    if (!this._isRendered) {
      this._setup();
      this._isRendered = true;
    }
    this._updateUI();
  }

  disconnectedCallback() {
    if (this._btn) {
      this._btn.removeEventListener('click', this._onClickBound);
    }
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this.isConnected || oldVal === newVal) {
      return;
    }
    const visualAttrs = ['variant', 'size', 'pill', 'circle', 'outline', 'disabled', 'loading'];
    if (visualAttrs.includes(name)) {
      this._updateUI();
    } else {
      this._setup();
    }
  }

  async copy() {
    if (this._copying || this.hasAttribute('disabled') || this.hasAttribute('loading')) {
      return;
    }

    let text           = this.getAttribute('value') || '';
    const targetId     = this.getAttribute('target');

    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        if (el.value !== undefined) {
          text = el.value;
        } else if (el.hasAttribute('value')) {
          text = el.getAttribute('value');
        } else {
          text = el.textContent.trim();
        }
      }
    }

    if (!text) {
      return;
    }

    try {
      this._copying = true;
      await navigator.clipboard.writeText(text);
      this.dispatchEvent(new CustomEvent('noc-copy', {
        bubbles:  true,
        composed: true,
        detail:   { text },
      }));
      this._showSuccess();
    } catch (e) {
      console.error('[noc-copy-button] Copy failed', e);
      this._copying = false;
    }
  }

  _showSuccess() {
    const btn         = this._btn;
    const tip         = this.shadowRoot.querySelector('noc-tooltip');
    const successText = this.getAttribute('success-text') || 'Copied!';

    btn.classList.add('success');

    if (tip) {
      const original = tip.getAttribute('content');
      tip.setAttribute('content', successText);
      tip.show();
      setTimeout(() => {
        btn.classList.remove('success');
        tip.hide();
        setTimeout(() => {
          tip.setAttribute('content', original);
          this._copying = false;
        }, 300);
      }, 2000);
    } else {
      setTimeout(() => {
        btn.classList.remove('success');
        this._copying = false;
      }, 2000);
    }
  }

  _onClick(e) {
    if (this.hasAttribute('disabled') || this.hasAttribute('loading')) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.copy();
  }

  _setup() {
    this.shadowRoot.innerHTML = buildTemplate({
      tooltip:                       this.getAttribute('tooltip'),
      ...(this.hasAttribute('disabled') ? { disabled: true } : {}),
      ...(this.hasAttribute('loading')  ? { loading:  true } : {}),
    });

    this._btn    = this.shadowRoot.getElementById('btn');
    this._loader = this.shadowRoot.getElementById('loader');

    this._btn.addEventListener('click', this._onClickBound);

    const updateSlotVisibility = () => {
      const prefixSlot  = this.shadowRoot.querySelector('slot[name="prefix"]');
      const defaultSlot = this.shadowRoot.querySelector('slot:not([name])');
      const suffixSlot  = this.shadowRoot.querySelector('slot[name="suffix"]');

      this.shadowRoot.querySelector('.prefix-wrap').classList.toggle(
        'hidden', !prefixSlot || prefixSlot.assignedNodes().length === 0
      );
      this.shadowRoot.querySelector('.label-wrap').classList.toggle(
        'hidden', !defaultSlot || defaultSlot.assignedNodes({ flatten: true }).filter(n => n.textContent.trim()).length === 0
      );
      this.shadowRoot.querySelector('.suffix-wrap').classList.toggle(
        'hidden', !suffixSlot || suffixSlot.assignedNodes().length === 0
      );
    };

    this.shadowRoot.querySelectorAll('slot').forEach(s => s.addEventListener('slotchange', updateSlotVisibility));
    updateSlotVisibility();
  }

  _updateUI() {
    if (!this._isRendered) {
      return;
    }
    this._btn.disabled  = this.hasAttribute('disabled') || this.hasAttribute('loading');
    this._loader.hidden = !this.hasAttribute('loading');
  }
}

customElements.define('noc-copy-button', NocCopyButton);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
