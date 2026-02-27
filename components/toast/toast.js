// nocturnal-components/components/toast/toast.js

/**
 * @customElement noc-toast
 *
 * Attributes:
 * @attr {'info' | 'success' | 'warning' | 'danger'} variant - Visual style. Defaults to 'info'.
 * @attr {number} duration - Auto-dismiss after this many ms. Omit for persistent.
 *
 * Events:
 * @event noc-dismiss - Emitted when the toast is dismissed.
 */

function buildTemplate(attrs = {}) {
  const variant = attrs.variant || 'info';

  return `
    <style>
      :host {
        display: block;
        animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      :host(.dismissing) {
        animation: fade-out 0.2s ease-in forwards;
        pointer-events: none;
      }

      .toast {
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
        padding: 0.75rem 1rem;
        border-radius: var(--noc-radius, 0.5rem);
        background: var(--noc-bg);
        color: var(--noc-color);
        border: 1px solid var(--noc-border);
        box-shadow: 0 10px 20px rgba(0,0,0,0.15);
        font: inherit;
      }

      .content {
        flex: 1;
        line-height: 1.4;
      }

      button {
        all: unset;
        cursor: pointer;
        opacity: 0.6;
        font-size: 1.25rem;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        margin-top: -2px;
      }

      button:hover {
        opacity: 1;
      }

      /* Variants */
      .info {
        --noc-bg: #eef4ff;
        --noc-color: #1e3a8a;
        --noc-border: #c7d2fe;
      }

      .success {
        --noc-bg: #ecfdf5;
        --noc-color: #065f46;
        --noc-border: #a7f3d0;
      }

      .warning {
        --noc-bg: #fffbeb;
        --noc-color: #92400e;
        --noc-border: #fde68a;
      }

      .danger {
        --noc-bg: #fef2f2;
        --noc-color: #991b1b;
        --noc-border: #fecaca;
      }

      @keyframes slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes fade-out {
        from {
          opacity: 1;
          transform: scale(1);
        }
        to {
          opacity: 0;
          transform: scale(0.95);
        }
      }
    </style>

    <div class="toast ${variant}" part="toast" role="status">
      <div class="content" part="content">
        <slot></slot>
      </div>
      <button part="close" aria-label="Dismiss">×</button>
    </div>
  `;
}

class NocToast extends HTMLElement {

  static get observedAttributes() {
    return ['variant', 'duration'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.dismiss = this.dismiss.bind(this);
  }

  connectedCallback() {
    this.render();

    const duration = parseInt(this.getAttribute('duration'), 10);
    if (!isNaN(duration) && duration > 0) {
      this._timer = setTimeout(this.dismiss, duration);
    }
  }

  disconnectedCallback() {
    clearTimeout(this._timer);
  }

  dismiss() {
    if (this._isDismissing) {
      return;
    }
    
    this._isDismissing = true;

    this.dispatchEvent(new CustomEvent('noc-dismiss', {
      bubbles: true,
      composed: true
    }));

    this.classList.add('dismissing');
    
    this.addEventListener('animationend', () => {
      this.remove();
    }, { once: true });

    setTimeout(() => {
      if (this.parentNode) this.remove();
    }, 500);
  }

  render() {
    this.shadowRoot.innerHTML = buildTemplate({
      variant: this.getAttribute('variant'),
    });

    this.shadowRoot.querySelector('button')
      .addEventListener('click', () => this.dismiss());
  }
}

customElements.define('noc-toast', NocToast);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
