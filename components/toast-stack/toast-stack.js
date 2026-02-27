// nocturnal-components/components/toast-stack/toast-stack.js

/**
 * @customElement noc-toast-stack
 * 
 * @slot - The content of the toast stack.
 * 
 * Attributes:
 * @attr {string} variant - The variant of the toast.
 * @attr {number} duration - The duration of the toast.
 */

function buildTemplate(attrs = {}) {
  return `
    <style>
      :host {
        position: fixed;
        top: 1rem;
        right: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        z-index: 1000;
        pointer-events: none;
      }
      ::slotted(*) {
        pointer-events: auto;
      }
    </style>
    
    <slot></slot>
  `;
}

class NocToastStack extends HTMLElement {

  static get instance() {
    return document.querySelector('noc-toast-stack');
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = buildTemplate();
  }

  show(message, options = {}) {
    const toast = document.createElement('noc-toast');
    if (options.variant) {
      toast.setAttribute('variant', options.variant);
    }

    if (options.duration) {
      toast.setAttribute('duration', options.duration);
    }
    
    toast.textContent = message;

    this.appendChild(toast);
  }
}

customElements.define('noc-toast-stack', NocToastStack);

// Global API
window.Noc = window.Noc || {};
window.Noc.toast = (message, options) => {
  let stack = NocToastStack.instance;
  if (!stack) {
    stack = document.createElement('noc-toast-stack');
    document.body.appendChild(stack);
  }
  stack.show(message, options);
};

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
