// nocturnal-components/components/breadcrumb/breadcrumb.js

/**
 * @customElement noc-breadcrumb
 * @slot - Breadcrumb content
 * 
 * Attributes:
 * @attr label - Breadcrumb label
 */

function buildTemplate(attrs = {}) {
  const label = attrs.label || 'Breadcrumb';

  return `
    <style>
      :host {
        display: block;
      }

      nav {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        line-height: 1;
      }
    </style>

    <nav aria-label="${label}" part="base">
      <slot></slot>
    </nav>

    <slot name="separator" hidden></slot>
  `;
}

class NocBreadcrumb extends HTMLElement {

  static get observedAttributes() {
    return ['label'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.shadowRoot.querySelector('slot').addEventListener('slotchange', () => this._syncSeparators());
  }

  _syncSeparators() {
    const items = Array.from(this.querySelectorAll('noc-breadcrumb-item'));

    items.forEach((item) => {
      const existingSeparator = item.querySelector('[slot="separator"]');
      if (!existingSeparator && this.querySelector('[slot="separator"]')) {
        const sep = this.querySelector('[slot="separator"]').cloneNode(true);
        item.appendChild(sep);
      }
    });
  }

  render() {
    this.shadowRoot.innerHTML = buildTemplate({
      label: this.getAttribute('label'),
    });
  }
}

customElements.define('noc-breadcrumb', NocBreadcrumb);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
