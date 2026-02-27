// nocturnal-components/components/include/include.js

/**
 * @customElement noc-include
 * 
 * @slot - Default slot for content that will be displayed after loading.
 * @slot loading - Custom content to display while the remote resource is being fetched.
 * 
 * Attributes:
 * @attr {string} src - The URL of the HTML file to include.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-accent - Color of the default loading spinner.
 * 
 * Events:
 * @event noc-load-start - Emitted when a load operation begins.
 * @event noc-load - Emitted when the content has successfully loaded.
 * @event noc-error - Emitted when the content fails to load.
 */

function buildTemplate(attrs = {}, html = '', isLoading = false) {
  return `
    <style>
      :host {
        display: block;
        font-family: inherit;
      }

      .loader {
        display: ${isLoading ? 'flex' : 'none'};
        align-items: center;
        justify-content: center;
        padding: 2rem;
        color: var(--noc-accent, #2563eb);
      }

      .loader svg {
        animation: rotate 1s linear infinite;
      }

      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .error {
        padding: 1rem;
        border: 1px solid rgba(239, 68, 68, 0.2);
        background: rgba(239, 68, 68, 0.1);
        color: #f87171;
        border-radius: 8px;
        font-size: 0.875rem;
      }

      .content {
        display: ${isLoading ? 'none' : 'block'};
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    </style>

    ${isLoading ? `
      <div class="loader">
        <slot name="loading">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
        </slot>
      </div>
    ` : `
      <div class="content">
        <slot></slot>
        ${html}
      </div>
    `}
  `;
}

class NocInclude extends HTMLElement {

  static get observedAttributes() {
    return ['src', 'loading'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isLoading = false;
  }

  connectedCallback() {
    this.load();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal && name === 'src') {
      this.load();
    }
  }

  async load() {
    const src = this.getAttribute('src');
    if (!src) {
      return;
    }

    this._isLoading = true;
    this.render();

    this.dispatchEvent(new CustomEvent('noc-load-start', {
      bubbles: true,
      composed: true
    }));

    try {
      const res = await fetch(src);
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
      }
      
      const html = await res.text();
      this._isLoading = false;
      this.render(html);

      this.dispatchEvent(new CustomEvent('noc-load', {
        bubbles: true,
        composed: true
      }));
    } catch (err) {
      this._isLoading = false;
      this.render(`<div class="error">Failed to load content: ${err.message}</div>`);
      this.dispatchEvent(new CustomEvent('noc-error', {
        bubbles: true,
        composed: true,
        detail: { error: err }
      }));
    }
  }

  reload() {
    this.load();
  }

  render(html = '') {
    this.shadowRoot.innerHTML = buildTemplate({}, html, this._isLoading);

    if (!this._isLoading && html) {
      this.shadowRoot.querySelectorAll('script').forEach(oldScript => {
        const script = document.createElement('script');
        [...oldScript.attributes].forEach(attr =>
          script.setAttribute(attr.name, attr.value)
        );
        script.textContent = oldScript.textContent;
        oldScript.replaceWith(script);
      });
    }
  }
}

customElements.define('noc-include', NocInclude);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
