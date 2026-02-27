// nocturnal-components/components/tab-panel/tab-panel.js

/**
 * @customElement noc-tab-panel
 *
 * Content panel associated with a noc-tab. Hidden unless `active` is set by
 * the parent noc-tab-group.
 *
 * @slot - The panel body content.
 *
 * Attributes:
 * @attr {string}  name   - Unique identifier matched by the `panel` attr on noc-tab.
 * @attr {boolean} active - Whether this panel is currently visible.
 *
 * CSS Custom Properties:
 * @cssprop --noc-panel-padding - Inner padding of the panel (default: 1.5rem 0)
 * @cssprop --noc-panel-color   - Text colour of the panel (default: inherit)
 */

function buildTemplate(attrs = {}) {
  return `
    <style>
      :host {
        display: block;
        padding: var(--noc-panel-padding, 1.5rem 0);
        color: var(--noc-panel-color, inherit);
        font-family: inherit;
      }

      :host(:not([active])) {
        display: none;
      }
    </style>
    <slot></slot>
  `;
}

class NocTabPanel extends HTMLElement {

  static get observedAttributes() {
    return ['name', 'active'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this._render();
    }
  }

  get name() {
    return this.getAttribute('name');
  }

  get active() {
    return this.hasAttribute('active');
  }

  _render() {
    this.shadowRoot.innerHTML = buildTemplate({
      active: this.hasAttribute('active'),
    });

    this.setAttribute('role', 'tabpanel');
  }
}

customElements.define('noc-tab-panel', NocTabPanel);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
