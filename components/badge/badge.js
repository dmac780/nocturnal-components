// nocturnal-components/components/badge/badge.js

/**
 * @customElement noc-badge
 * @slot - Badge content
 * 
 * Attributes:
 * @attr pill - Badge is pill shaped
 * @attr dot - Badge is a dot
 * @attr pulse - Badge has a pulse animation
 * 
 * CSS Custom Properties:
 * @cssprop --noc-radius - Border radius for the badge
 * @cssprop --noc-accent - Accent color for the badge
 * @cssprop --noc-badge-bg - Background color for the badge
 * @cssprop --noc-badge-color - Text color for the badge
 */

function buildTemplate(attrs = {}) {
  const pill  = 'pill'  in attrs;
  const dot   = 'dot'   in attrs;
  const pulse = 'pulse' in attrs;

  return `
    <style>
      :host {
        display: inline-flex;
        vertical-align: middle;
        --noc-badge-bg: rgba(255, 255, 255, 0.1);
        --noc-badge-color: #eee;
      }

      :host([variant="primary"]) { --noc-badge-bg: var(--noc-accent-alpha, rgba(37, 99, 235, 0.2)); --noc-badge-color: var(--noc-accent, #60a5fa); }
      :host([variant="success"]) { --noc-badge-bg: rgba(34, 197, 94, 0.2); --noc-badge-color: #4ade80; }
      :host([variant="warning"]) { --noc-badge-bg: rgba(234, 179, 8, 0.2); --noc-badge-color: #facc15; }
      :host([variant="danger"])  { --noc-badge-bg: rgba(239, 68, 68, 0.2); --noc-badge-color: #f87171; }

      .badge {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.15rem 0.45rem;
        font-size: 0.7rem;
        font-weight: 600;
        line-height: 1;
        border-radius: ${pill ? '999px' : '4px'};
        background: var(--noc-badge-bg);
        color: var(--noc-badge-color);
        white-space: nowrap;
        border: 1px solid rgba(255, 255, 255, 0.05);
        isolation: isolate;
      }

      .badge.dot {
        width: 8px;
        height: 8px;
        padding: 0;
        min-width: 8px;
        border-radius: 50%;
        background: var(--noc-badge-color);
        border: none;
      }

      .pulse::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: inherit;
        background: var(--noc-badge-color);
        opacity: 0.6;
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        z-index: -1;
        pointer-events: none;
      }

      @keyframes pulse {
        0%   { transform: scale(1);   opacity: 0.6; }
        100% { transform: scale(2.5); opacity: 0; }
      }
    </style>

    <span class="badge ${dot ? 'dot' : ''} ${pulse ? 'pulse' : ''}" part="base">
      <slot></slot>
    </span>
  `;
}

class NocBadge extends HTMLElement {

  static get observedAttributes() {
    return ['variant', 'pill', 'dot', 'pulse'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = buildTemplate({
      variant: this.getAttribute('variant'),
      ...(this.hasAttribute('pill')  ? { pill:  true } : {}),
      ...(this.hasAttribute('dot')   ? { dot:   true } : {}),
      ...(this.hasAttribute('pulse') ? { pulse: true } : {}),
    });
  }
}

customElements.define('noc-badge', NocBadge);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
