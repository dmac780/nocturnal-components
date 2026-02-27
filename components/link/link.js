// nocturnal-components/components/link/link.js

/**
 * @customElement noc-link
 * 
 * @slot - The primary content of the link.
 * @slot prefix - Content to display before the link text.
 * @slot suffix - Content to display after the link text.
 * 
 * Attributes:
 * @attr {'link' | 'primary' | 'secondary'} variant - The visual style of the link. Defaults to 'link'.
 * @attr {string} href - The URL the link points to.
 * @attr {string} target - Where to open the link (e.g., '_blank'). Defaults to '_self'.
 * @attr {boolean} disabled - Whether the link is disabled.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-link-color - The text color of the link.
 * @cssprop --noc-accent - The primary accent color for links and buttons.
 * @cssprop --noc-link-hover-color - The text color when the link is hovered.
 */

function buildTemplate(attrs = {}) {
  const href     = attrs.href   || '#';
  const target   = attrs.target || '_self';
  const disabled = 'disabled' in attrs;

  return `
    <style>
      :host {
        display: inline-flex;
        vertical-align: middle;
      }

      a {
        font: inherit;
        text-decoration: none;
        color: var(--noc-link-color, var(--noc-accent, #60a5fa));
        transition: all 0.2s;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        border-radius: 4px;
      }

      a:hover {
        color: var(--noc-link-hover-color, #93c5fd);
        text-decoration: underline;
      }

      /* Variant for button-like links */
      :host([variant="primary"]) a, :host([variant="secondary"]) a {
        padding: 0.5rem 1rem;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 500;
      }

      :host([variant="primary"]) a {
        background: var(--noc-accent, #2563eb);
        color: #fff;
      }
      :host([variant="primary"]) a:hover {
        background: #1d4ed8;
        text-decoration: none;
      }

      :host([variant="secondary"]) a {
        background: #2a2a2a;
        color: #eee;
        border: 1px solid #444;
      }
      :host([variant="secondary"]) a:hover {
        background: #333;
        text-decoration: none;
      }

      :host([disabled]) a {
        opacity: 0.5;
        pointer-events: none;
        cursor: not-allowed;
        filter: grayscale(1);
      }
    </style>

    <a href="${disabled ? 'javascript:void(0)' : href}" target="${target}" part="base">
      <slot name="prefix"></slot>
      <slot></slot>
      <slot name="suffix"></slot>
    </a>
  `;
}

class NocLink extends HTMLElement {

  static get observedAttributes() {
    return ['variant', 'href', 'target', 'disabled'];
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

  attributeChangedCallback() {
    this._setup();
  }

  _setup() {
    this.shadowRoot.innerHTML = buildTemplate({
      href:     this.getAttribute('href'),
      target:   this.getAttribute('target'),
      ...(this.hasAttribute('disabled') ? { disabled: true } : {}),
    });
  }
}

customElements.define('noc-link', NocLink);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
