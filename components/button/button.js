// nocturnal-components/components/button/button.js

/**
 * @customElement noc-button
 *
 * @slot          - Button label / content.
 * @slot prefix   - Content placed before the label (icon, etc.).
 * @slot suffix   - Content placed after the label.
 *
 * Attributes:
 * @attr {'primary'|'success'|'warning'|'danger'|'neutral'} variant
 *   Visual colour variant. Default: no variant (neutral-ish dark fill).
 * @attr {'sm'|'md'|'lg'} size  - Size preset. Default: 'md'.
 * @attr {boolean} pill         - Full pill border-radius.
 * @attr {boolean} circle       - Equal width/height + 50% radius, ideal for icon-only use.
 * @attr {boolean} outline      - Transparent fill, coloured border and text.
 * @attr {boolean} disabled     - Disables the button.
 * @attr {boolean} loading      - Shows a spinner and disables interaction.
 * @attr {boolean} caret        - Appends a small downward caret after the label.
 *
 * CSS Custom Properties:
 * @cssprop --noc-button-bg         - Resting background colour
 * @cssprop --noc-button-color      - Label / icon colour
 * @cssprop --noc-button-border     - Border colour
 * @cssprop --noc-button-hover-bg   - Hover background colour
 * @cssprop --noc-button-active-bg  - Active / pressed background colour
 * @cssprop --noc-button-focus      - Focus ring colour
 * @cssprop --noc-button-radius     - Border radius override
 *
 * Events:
 * @event noc-click - Fired on click when not disabled or loading. detail: { originalEvent }
 */

function buildTemplate() {
  return `
    <style>
      :host {
        display: inline-block;
        vertical-align: middle;

        --noc-button-bg:        #2a2a2a;
        --noc-button-color:     #eee;
        --noc-button-border:    #444;
        --noc-button-hover-bg:  #333;
        --noc-button-active-bg: #222;
        --noc-button-focus:     var(--noc-accent-alpha, rgba(59, 130, 246, 0.3));
        --noc-button-radius:    6px;
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
        border: 1px solid var(--noc-button-border);
        background: var(--noc-button-bg);
        color: var(--noc-button-color);
        border-radius: var(--noc-button-radius);
      }

      :host(:not([size])) button,
      :host([size="md"]) button {
        padding: 0.625rem 1.25rem;
        font-size: 0.875rem;
        --noc-button-radius: 6px;
      }

      :host([size="sm"]) button {
        padding: 0.4rem 0.75rem;
        font-size: 0.75rem;
        --noc-button-radius: 4px;
      }

      :host([size="lg"]) button {
        padding: 0.8rem 1.75rem;
        font-size: 1rem;
        --noc-button-radius: 8px;
      }

      :host([pill]) button   { border-radius: 999px; }
      :host([circle]) button { border-radius: 50%; padding: 0; }

      :host([circle]:not([size])) button,
      :host([circle][size="md"]) button { width: 2.375rem; height: 2.375rem; }
      :host([circle][size="sm"]) button { width: 1.75rem;  height: 1.75rem; }
      :host([circle][size="lg"]) button { width: 2.875rem; height: 2.875rem; }

      :host([variant="primary"]) {
        --noc-button-bg:        var(--noc-accent, #2563eb);
        --noc-button-hover-bg:  #1d4ed8;
        --noc-button-active-bg: #1e40af;
        --noc-button-color:     #fff;
        --noc-button-border:    transparent;
      }

      :host([variant="success"]) {
        --noc-button-bg:        #16a34a;
        --noc-button-hover-bg:  #15803d;
        --noc-button-active-bg: #166534;
        --noc-button-color:     #fff;
        --noc-button-border:    transparent;
      }

      :host([variant="warning"]) {
        --noc-button-bg:        #d97706;
        --noc-button-hover-bg:  #b45309;
        --noc-button-active-bg: #92400e;
        --noc-button-color:     #fff;
        --noc-button-border:    transparent;
      }

      :host([variant="danger"]) {
        --noc-button-bg:        #dc2626;
        --noc-button-hover-bg:  #b91c1c;
        --noc-button-active-bg: #991b1b;
        --noc-button-color:     #fff;
        --noc-button-border:    transparent;
      }

      :host([variant="neutral"]) {
        --noc-button-bg:        transparent;
        --noc-button-hover-bg:  rgba(255, 255, 255, 0.05);
        --noc-button-active-bg: rgba(255, 255, 255, 0.09);
        --noc-button-color:     #aaa;
        --noc-button-border:    #333;
      }

      :host([outline]) {
        --noc-button-bg:        transparent;
        --noc-button-hover-bg:  rgba(255, 255, 255, 0.05);
        --noc-button-active-bg: rgba(255, 255, 255, 0.09);
      }

      :host([outline][variant="primary"]) { --noc-button-color: var(--noc-accent, #2563eb); --noc-button-border: var(--noc-accent, #2563eb); }
      :host([outline][variant="success"]) { --noc-button-color: #22c55e; --noc-button-border: #22c55e; }
      :host([outline][variant="warning"]) { --noc-button-color: #f59e0b; --noc-button-border: #f59e0b; }
      :host([outline][variant="danger"])  { --noc-button-color: #ef4444; --noc-button-border: #ef4444; }
      :host([outline][variant="neutral"]) { --noc-button-color: #aaa;    --noc-button-border: #333; }

      button:hover:not(:disabled)  { background: var(--noc-button-hover-bg);  box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
      button:active:not(:disabled) { background: var(--noc-button-active-bg); transform: translateY(1px); }
      button:focus-visible         { box-shadow: 0 0 0 3px var(--noc-button-focus); }
      button:disabled              { opacity: 0.5; cursor: not-allowed; filter: grayscale(0.5); }

      .caret {
        display: none;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 4px solid currentColor;
        margin-left: 0.125rem;
        flex-shrink: 0;
      }

      :host([caret]) .caret { display: inline-block; }

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
    </style>

    <button id="btn" part="base">
      <div class="spinner" id="loader" hidden></div>
      <slot name="prefix"></slot>
      <slot></slot>
      <slot name="suffix"></slot>
      <span class="caret" id="caret-ui" hidden></span>
    </button>
  `;
}

class NocButton extends HTMLElement {

  static get observedAttributes() {
    return ['variant', 'size', 'pill', 'circle', 'outline', 'disabled', 'loading', 'caret'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isRendered = false;
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
    if (this._isRendered && oldVal !== newVal) {
      this._updateUI();
    }
  }

  _setup() {
    this.shadowRoot.innerHTML = buildTemplate();

    this._btn    = this.shadowRoot.getElementById('btn');
    this._loader = this.shadowRoot.getElementById('loader');
    this._caret  = this.shadowRoot.getElementById('caret-ui');

    this._onClickBound = (e) => {
      if (this.hasAttribute('disabled') || this.hasAttribute('loading')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      this.dispatchEvent(new CustomEvent('noc-click', {
        bubbles:  true,
        composed: true,
        detail:   { originalEvent: e },
      }));
    };

    this._btn.addEventListener('click', this._onClickBound);
  }

  _updateUI() {
    if (!this._isRendered) return;
    this._btn.disabled  = this.hasAttribute('disabled') || this.hasAttribute('loading');
    this._loader.hidden = !this.hasAttribute('loading');
    this._caret.hidden  = !this.hasAttribute('caret');
  }
}

customElements.define('noc-button', NocButton);

export function ssrTemplate() {
  return `<template shadowrootmode="open">${buildTemplate()}</template>`;
}
