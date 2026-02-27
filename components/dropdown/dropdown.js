// nocturnal-components/components/dropdown/dropdown.js

/**
 * @customElement noc-dropdown
 * 
 * @slot - The content of the dropdown panel (typically noc-menu).
 * @slot trigger - The element that triggers the dropdown when clicked.
 * 
 * Attributes:
 * @attr {boolean} open - Whether the dropdown panel is currently visible.
 * @attr {'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'right-start' | 'left-start'} placement - Where to position the dropdown relative to the trigger. Defaults to 'bottom-start'.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-dropdown-bg - Background color of the dropdown panel.
 * @cssprop --noc-dropdown-border - Border color of the dropdown panel.
 * @cssprop --noc-dropdown-radius - Border radius for the panel corners.
 * @cssprop --noc-dropdown-shadow - Box shadow for the panel.
 * @cssprop --noc-dropdown-z - Z-index for the panel.
 * 
 * Events:
 * @event noc-show - Emitted when the dropdown panel opens.
 * @event noc-hide - Emitted when the dropdown panel closes.
 */

function buildTemplate(attrs = {}) {
  const placement = attrs.placement || 'bottom-start';
  const isOpen    = 'open' in attrs;

  return `
    <style>
      :host {
        position: relative;
        display: inline-flex;
        align-items: stretch;
        font-family: inherit;
        --noc-dropdown-bg: rgba(22, 22, 22, 0.95);
        --noc-dropdown-border: rgba(255, 255, 255, 0.08);
        --noc-dropdown-radius: 12px;
        --noc-dropdown-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.7), 
                               0 0 1px 1px rgba(255, 255, 255, 0.05);
        --noc-dropdown-z: 1000;
      }

      .trigger {
        display: inline-flex;
        align-items: stretch;
        cursor: pointer;
      }

      ::slotted(noc-button) {
        --noc-button-radius: var(--noc-button-radius, inherit);
        height: 100%;
      }

      .panel {
        position: absolute;
        min-width: 12rem;
        background: var(--noc-dropdown-bg);
        border: 1px solid var(--noc-dropdown-border);
        border-radius: var(--noc-dropdown-radius);
        box-shadow: var(--noc-dropdown-shadow);
        z-index: var(--noc-dropdown-z);
        padding: 0.5rem;
        margin: 0;
        list-style: none;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        opacity: 0;
        visibility: hidden;
        transform: translateY(10px) scale(0.95);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
      }

      .panel.open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      /* Placement logic */
      .bottom-start { top: 100%; left: 0; margin-top: 0.5rem; transform-origin: top left; }
      .bottom-end { top: 100%; right: 0; margin-top: 0.5rem; transform-origin: top right; }
      .top-start { bottom: 100%; left: 0; margin-bottom: 0.5rem; transform-origin: bottom left; }
      .top-end { bottom: 100%; right: 0; margin-bottom: 0.5rem; transform-origin: bottom right; }
      .right-start { top: 0; left: 100%; margin-left: 0.5rem; transform-origin: left top; }
      .left-start { top: 0; right: 100%; margin-right: 0.5rem; transform-origin: right top; }
      
      /* Adjust transform for side placements */
      .right-start.panel { transform: translateX(-10px) scale(0.95); }
      .right-start.panel.open { transform: translateX(0) scale(1); }
      .left-start.panel { transform: translateX(10px) scale(0.95); }
      .left-start.panel.open { transform: translateX(0) scale(1); }
    </style>

    <div class="trigger" id="trigger" part="trigger">
      <slot name="trigger"></slot>
    </div>

    <div class="panel ${placement}${isOpen ? ' open' : ''}" id="panel" part="panel">
      <slot></slot>
    </div>
  `;
}

class NocDropdown extends HTMLElement {

  static get observedAttributes() {
    return ['open', 'placement'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.toggle = this.toggle.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
  }

  connectedCallback() {
    this.render();
    document.addEventListener('click', this.handleOutsideClick);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.handleOutsideClick);
  }

  attributeChangedCallback() {
    this.update();
  }

  toggle(e) {
    e.stopPropagation();
    this.toggleAttribute('open');
    
    if (this.hasAttribute('open')) {
      this.dispatchEvent(new CustomEvent('noc-show', { bubbles: true, composed: true }));
    } else {
      this.dispatchEvent(new CustomEvent('noc-hide', { bubbles: true, composed: true }));
    }
  }

  handleOutsideClick(e) {
    if (!this.contains(e.target) && !this.shadowRoot.contains(e.target)) {
      if (this.hasAttribute('open')) {
        this.removeAttribute('open');
        this.dispatchEvent(new CustomEvent('noc-hide', { bubbles: true, composed: true }));
      }
    }
  }

  update() {
    if (!this.panel) {
      return;
    }
    
    const isOpen = this.hasAttribute('open');
    if (isOpen) {
      this.panel.classList.add('open');
    } else {
      this.panel.classList.remove('open');
    }
  }

  render() {
    this.shadowRoot.innerHTML = buildTemplate({
      placement: this.getAttribute('placement'),
      ...(this.hasAttribute('open') ? { open: true } : {}),
    });

    this.panel     = this.shadowRoot.getElementById('panel');
    this.triggerEl = this.shadowRoot.getElementById('trigger');
    
    this.triggerEl.addEventListener('click', this.toggle);

    this.update();
  }
}

customElements.define('noc-dropdown', NocDropdown);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
