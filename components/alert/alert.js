// nocturnal-components/components/alert/alert.js

/**
 * NocturnalAlert component
 * @customElement
 * @slot icon - Icon for the alert
 * @slot - Message for the alert
 * 
 * Attributes:
 * @attr variant - Variant of the alert (info, success, warning, danger)
 * @attr dismissible - Whether the alert is dismissible
 * @attr open - Whether the alert is open
 * 
 * CSS Custom Properties:   
 * @cssprop --noc-alert-bg - Alert background color
 * @cssprop --noc-alert-color - Alert text color
 * @cssprop --noc-alert-border - Alert border color
 * 
 * Events:
 * @event noc-dismiss - Emitted when the alert is dismissed
 */

function buildTemplate(dismissible = false) {
  return `
    <style>
      :host {
        display: block;
        margin-bottom: 1rem;
        --noc-alert-bg: rgba(59, 130, 246, 0.1);
        --noc-alert-color: #60a5fa;
        --noc-alert-border: rgba(59, 130, 246, 0.2);
      }

      :host([variant="success"]) {
        --noc-alert-bg: rgba(34, 197, 94, 0.1);
        --noc-alert-color: #4ade80;
        --noc-alert-border: rgba(34, 197, 94, 0.2);
      }

      :host([variant="warning"]) {
        --noc-alert-bg: rgba(234, 179, 8, 0.1);
        --noc-alert-color: #facc15;
        --noc-alert-border: rgba(234, 179, 8, 0.2);
      }

      :host([variant="danger"]) {
        --noc-alert-bg: rgba(239, 68, 68, 0.1);
        --noc-alert-color: #f87171;
        --noc-alert-border: rgba(239, 68, 68, 0.2);
      }

      .alert {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem 1.25rem;
        background: var(--noc-alert-bg);
        color: var(--noc-alert-color);
        border: 1px solid var(--noc-alert-border);
        border-radius: 8px;
        position: relative;
        backdrop-filter: blur(8px);
        transition: transform 0.2s, opacity 0.2s;
      }

      .icon-container {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        line-height: 1;
      }

      .message {
        flex: 1;
        font-size: 0.875rem;
        line-height: 1.5;
      }

      .close {
        background: none;
        border: none;
        color: inherit;
        padding: 0;
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 0.2s;
        font-size: 1.25rem;
        line-height: 1;
        margin: -0.25rem -0.25rem 0 0;
      }

      .close:hover {
        opacity: 1;
      }

      :host(:not([open])) {
        display: none;
      }
    </style>

    <div class="alert" part="base">
      <div class="icon-container" id="icon" part="icon">
        <slot name="icon"></slot>
      </div>
      <div class="message" part="message">
        <slot></slot>
      </div>
      ${dismissible ? '<button class="close" id="close-btn" aria-label="Dismiss">&times;</button>' : ''}
    </div>
  `;
}

class NocturnalAlert extends HTMLElement {

  static get observedAttributes() {
    return ['variant', 'dismissible', 'open']; 
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
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (this._isRendered && oldVal !== newVal) {
      if (name === 'open') {
        this._updateVisibility();
      } else {
        this._setup();
      }
    }
  }

  _setup() {
    const dismissible = this.hasAttribute('dismissible');
    this.shadowRoot.innerHTML = buildTemplate(dismissible);

    if (dismissible) {
      this.shadowRoot.getElementById('close-btn').addEventListener('click', () => {
        this.removeAttribute('open');
        this.dispatchEvent(new CustomEvent('noc-dismiss', { bubbles: true, composed: true }));
      });
    }

    // Default open to true if not set
    if (!this.hasAttribute('open')) {
      this.setAttribute('open', '');
    }
  }

  _updateVisibility() {
    this.style.display = this.hasAttribute('open') ? 'block' : 'none';
  }
}

customElements.define('noc-alert', NocturnalAlert);

export function ssrTemplate(attrs) {
  const dismissible = 'dismissible' in attrs;
  return `<template shadowrootmode="open">${buildTemplate(dismissible)}</template>`;
}