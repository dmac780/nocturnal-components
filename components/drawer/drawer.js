// nocturnal-components/components/drawer/drawer.js

/**
 * @customElement noc-drawer
 * 
 * @slot - The main content of the drawer.
 * @slot title - The title displayed in the header.
 * @slot header-actions - Optional actions displayed in the header next to the close button.
 * @slot footer - Content for the footer, typically action buttons.
 * 
 * Attributes:
 * @attr {boolean} open - Whether the drawer is visible.
 * @attr {'start' | 'end' | 'top' | 'bottom'} placement - Where the drawer slides in from. Defaults to 'end'.
 * @attr {boolean} contained - If present, the drawer will be contained within its nearest positioned ancestor instead of fixed to the viewport.
 * @attr {string} initial-focus - A selector for the element to receive focus when the drawer opens.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-drawer-size - The width (for start/end) or height (for top/bottom) of the drawer panel.
 * @cssprop --noc-bg - Background color of the drawer panel.
 * @cssprop --noc-color - Text color within the drawer.
 * @cssprop --noc-border - Border color for segments and edges.
 * @cssprop --noc-overlay-bg - Background color of the backdrop overlay.
 * @cssprop --noc-transition-speed - Animation duration for slide and fade.
 * 
 * Events:
 * @event noc-show - Emitted when the drawer opens.
 * @event noc-hide - Emitted when the drawer closes.
 * @event noc-request-close - Emitted when the drawer attempts to close (via close button, ESC, or overlay). Can be cancelled.
 */

function buildTemplate(attrs = {}) {
  const isContained = 'contained' in attrs;

  return `
    <style>
      :host {
        --noc-drawer-size: 300px;
        --noc-bg: #fff;
        --noc-color: #111;
        --noc-border: #e5e7eb;
        --noc-overlay-bg: rgba(0, 0, 0, 0.4);
        --noc-transition-speed: 0.3s;

        position: ${isContained ? 'absolute' : 'fixed'};
        inset: 0;
        z-index: ${isContained ? '1' : '1000'};
        display: flex;
        visibility: hidden;
        transition: visibility var(--noc-transition-speed);
        pointer-events: none;
        overflow: hidden;
      }

      :host([open]) {
        visibility: visible;
        pointer-events: auto;
      }

      .overlay {
        position: absolute;
        inset: 0;
        background: var(--noc-overlay-bg);
        backdrop-filter: blur(4px);
        opacity: 0;
        transition: opacity var(--noc-transition-speed);
        display: ${isContained ? 'none' : 'block'};
      }

      :host([open]) .overlay {
        opacity: 1;
      }

      .panel {
        position: absolute;
        background: var(--noc-bg);
        color: var(--noc-color);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        transition: transform var(--noc-transition-speed) cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        
        /* Default Placement (End/Right) */
        top: 0;
        bottom: 0;
        right: 0;
        width: var(--noc-drawer-size);
        transform: translateX(100%);
        border-left: 1px solid var(--noc-border);
      }

      /* Placements */
      :host([placement="start"]) .panel {
        right: auto;
        left: 0;
        transform: translateX(-100%);
        border-left: none;
        border-right: 1px solid var(--noc-border);
      }

      :host([placement="top"]) .panel {
        left: 0;
        right: 0;
        bottom: auto;
        width: 100%;
        height: var(--noc-drawer-size);
        transform: translateY(-100%);
        border-left: none;
        border-bottom: 1px solid var(--noc-border);
      }

      :host([placement="bottom"]) .panel {
        top: auto;
        left: 0;
        right: 0;
        width: 100%;
        height: var(--noc-drawer-size);
        transform: translateY(100%);
        border-left: none;
        border-top: 1px solid var(--noc-border);
      }

      :host([placement="end"]) .panel {
        /* Already handled by default, but explicitly defined here for clarity if needed */
        left: auto;
        right: 0;
        transform: translateX(100%);
      }

      :host([open]) .panel {
        transform: translate(0, 0);
      }

      header {
        padding: 1.25rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        border-bottom: 1px solid var(--noc-border);
      }

      .title {
        font-size: 1.1rem;
        font-weight: 600;
        flex: 1;
        margin: 0;
      }

      .close-btn {
        all: unset;
        cursor: pointer;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
        opacity: 0.5;
      }

      .close-btn:hover {
        background: rgba(0, 0, 0, 0.05);
        opacity: 1;
      }

      main {
        padding: 1.25rem;
        overflow-y: auto;
        flex: 1;
        -webkit-overflow-scrolling: touch;
      }

      footer {
        padding: 1.25rem;
        border-top: 1px solid var(--noc-border);
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }
    </style>

    <div class="overlay" id="overlay"></div>

    <div class="panel" part="panel" role="dialog" aria-modal="${!isContained}">
      <header part="header">
        <h2 class="title" part="title"><slot name="title">Drawer</slot></h2>
        <div class="actions"><slot name="header-actions"></slot></div>
        <button class="close-btn" id="close" aria-label="Close">✕</button>
      </header>

      <main part="body">
        <slot></slot>
      </main>

      <footer part="footer">
        <slot name="footer"></slot>
      </footer>
    </div>
  `;
}

class NocDrawer extends HTMLElement {

  static get observedAttributes() {
    return ['open', 'placement', 'contained', 'initial-focus'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.onKeydown = this.onKeydown.bind(this);
    this.handleOverlayClick = this.handleOverlayClick.bind(this);
    this._isRendered = false;
  }

  connectedCallback() {
    if (!this._isRendered) {
      this.render();
      this._isRendered = true;
    }
    document.addEventListener('keydown', this.onKeydown);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.onKeydown);
    if (!this.hasAttribute('contained')) {
      document.body.style.overflow = '';
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open') {
      const isOpen = newValue !== null;
      const isContained = this.hasAttribute('contained');

      if (!isContained) {
        document.body.style.overflow = isOpen ? 'hidden' : '';
      }

      if (isOpen) {
        requestAnimationFrame(() => this.trapFocus());
        this.dispatchEvent(new CustomEvent('noc-show', { bubbles: true, composed: true }));
      } else {
        this.dispatchEvent(new CustomEvent('noc-hide', { bubbles: true, composed: true }));
      }
    }
    
    if (this._isRendered && (name === 'placement' || name === 'contained')) {
      this.render();
    }
  }

  show() {
    this.setAttribute('open', '');
  }

  hide(source = 'api') {
    const ev = new CustomEvent('noc-request-close', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { source }
    });

    if (!this.dispatchEvent(ev)) {
      return;
    }
    this.removeAttribute('open');
  }

  onKeydown(e) {
    if (e.key === 'Escape' && this.hasAttribute('open') && !this.hasAttribute('contained')) {
      this.hide('escape');
    }
  }

  handleOverlayClick() {
    this.hide('overlay');
  }

  trapFocus() {
    if (this.hasAttribute('contained')) {
      return;
    }

    const selector = this.getAttribute('initial-focus');
    const el = selector
      ? this.shadowRoot.querySelector(selector)
      : this.shadowRoot.querySelector('[autofocus], button, input, [tabindex="0"]');

    el?.focus();
  }

  render() {
    this.shadowRoot.innerHTML = buildTemplate({
      ...(this.hasAttribute('contained') ? { contained: true } : {}),
    });

    this.shadowRoot.getElementById('overlay').addEventListener('click', this.handleOverlayClick);
    this.shadowRoot.getElementById('close').addEventListener('click', () => this.hide('close-button'));
  }
}

customElements.define('noc-drawer', NocDrawer);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
