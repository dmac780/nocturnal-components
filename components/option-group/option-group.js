// nocturnal-components/components/option-group/option-group.js

/**
 * @customElement noc-option-group
 * 
 * @slot - List of noc-option components to be grouped.
 * 
 * Attributes:
 * @attr {string} label - The label to display for the group.
 * @attr {boolean} disabled - Whether the entire group (and its options) should be disabled.
 */

function buildTemplate(attrs = {}) {
  const label = attrs.label || '';

  return `
    <style>
      :host {
        display: block;
      }

      .group-label {
        padding: 0.5rem 1rem;
        font-size: 0.75rem;
        font-weight: 700;
        color: #9ca3af;
        text-transform: uppercase;
        background: #f9fafb;
      }

      .group-content {
        padding: 0;
      }

      :host([disabled]) .group-content {
        pointer-events: none;
        opacity: 0.5;
      }
    </style>

    ${label ? `<div class="group-label">${label}</div>` : ''}
    <div class="group-content">
      <slot></slot>
    </div>
  `;
}

class NocOptionGroup extends HTMLElement {

  static get observedAttributes() {
    return ['label', 'disabled'];
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
      label: this.getAttribute('label'),
      ...(this.hasAttribute('disabled') ? { disabled: true } : {}),
    });
  }
}

customElements.define('noc-option-group', NocOptionGroup);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
