// nocturnal-components/components/menu/menu.js

/**
 * @customElement noc-menu
 * 
 * @slot - List of noc-menu-item or noc-divider components.
 * 
 * Attributes:
 * @attr {string} max-width - The maximum width of the menu. Defaults to '250px'.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-menu-bg - Background color of the menu.
 * @cssprop --noc-menu-border - Border color of the menu.
 * @cssprop --noc-menu-radius - Border radius for the menu corners.
 * @cssprop --noc-menu-shadow - Box shadow for the menu.
 */

function buildTemplate(attrs = {}) {
  const maxWidth = attrs['max-width'] || '250px';

  return `
    <style>
      :host {
        display: block;
        font-family: inherit;
        --noc-menu-bg: rgba(22, 22, 22, 0.95);
        --noc-menu-border: rgba(255, 255, 255, 0.08);
        --noc-menu-radius: 12px;
        --noc-menu-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.7), 
                           0 0 1px 1px rgba(255, 255, 255, 0.05);
      }

      .menu {
        display: flex;
        flex-direction: column;
        background: var(--noc-menu-bg);
        border: 1px solid var(--noc-menu-border);
        border-radius: var(--noc-menu-radius);
        max-width: ${maxWidth};
        padding: 0.5rem;
        box-sizing: border-box;
        box-shadow: var(--noc-menu-shadow);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
      }

      ::slotted(noc-menu-item) {
        margin-bottom: 2px;
      }

      ::slotted(noc-menu-item:last-child) {
        margin-bottom: 0;
      }

      ::slotted(noc-divider) {
        margin: 0.5rem -0.5rem;
        --noc-divider-color: rgba(255, 255, 255, 0.06);
      }
    </style>

    <div class="menu" part="base">
      <slot></slot>
    </div>
  `;
}

class NocMenu extends HTMLElement {

  static get observedAttributes() {
    return ['max-width'];
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
      'max-width': this.getAttribute('max-width'),
    });
  }
}

customElements.define('noc-menu', NocMenu);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
