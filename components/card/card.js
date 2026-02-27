// nocturnal-components/components/card/card.js

/**
 * @customElement noc-card
 *
 * @slot image   - Card hero image / media area. Omit to collapse the image region.
 * @slot header  - Card title / heading content.
 * @slot         - (default) Card body content.
 * @slot footer  - Card footer content (actions, meta, etc.). Omit to hide the divider + footer.
 *
 * Attributes:
 * @attr {string}  size    - CSS max-width value (default: 350px)
 * @attr {boolean} glass   - Enables glassmorphism variant
 *
 * CSS Custom Properties:
 * @cssprop --noc-card-bg          - Background color (default: #1a1a1a)
 * @cssprop --noc-card-color       - Body text color (default: #bbb)
 * @cssprop --noc-card-border      - Border color (default: #333)
 * @cssprop --noc-card-radius      - Border radius (default: 1rem)
 * @cssprop --noc-card-padding     - Inner padding shorthand (default: 1.5rem)
 * @cssprop --noc-footer-justify   - justify-content for footer slot (default: flex-start)
 * @cssprop --noc-footer-align     - align-items for footer slot (default: center)
 * @cssprop --noc-accent           - Accent colour used on hover border highlight
 */

function buildTemplate(attrs = {}) {
  const size  = attrs.size || '350px';
  const glass = 'glass' in attrs;

  return `
    <style>
      :host {
        display: block;
        width: 100%;
        max-width: ${size};
      }

      .card {
        position: relative;
        background: var(--noc-card-bg, #1a1a1a);
        color: var(--noc-card-color, #bbb);
        border: 1px solid var(--noc-card-border, #333);
        border-radius: var(--noc-card-radius, 1rem);
        font-family: inherit;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 30px rgba(0,0,0,.4);
        transition:
          transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
          box-shadow 0.2s ease,
          border-color 0.2s ease;
        overflow: hidden;
      }

      :host(:hover) .card {
        transform: translateY(-4px);
        box-shadow: 0 20px 40px rgba(0,0,0,.6);
        border-color: #444;
      }

      .card.glass {
        background: rgba(255,255,255,0.04);
        border-color: rgba(255,255,255,0.12);
      }

      .card.glass::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        backdrop-filter: blur(16px) saturate(1.6);
        -webkit-backdrop-filter: blur(16px) saturate(1.6);
        z-index: 0;
        pointer-events: none;
      }

      .image-container, .header, .body, .footer {
        position: relative;
        z-index: 1;
      }

      :host(:hover) .card.glass {
        border-color: rgba(255,255,255,0.22);
        background: rgba(255,255,255,0.07);
      }

      .image-container {
        width: 100%;
        aspect-ratio: 16 / 9;
        overflow: hidden;
        background: #222;
      }

      .image-container[hidden] { display: none; }

      ::slotted([slot="image"]) {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: transform 0.3s ease;
      }

      :host(:hover) ::slotted([slot="image"]) { transform: scale(1.05); }

      .header {
        padding: var(--noc-card-padding, 1.5rem) var(--noc-card-padding, 1.5rem) 0.5rem;
        font-size: 1.25rem;
        font-weight: 600;
        color: #fff;
      }

      .card:not(.has-image) .header { padding-top: var(--noc-card-padding, 1.5rem); }

      .body {
        padding: 0.75rem var(--noc-card-padding, 1.5rem) var(--noc-card-padding, 1.5rem);
        font-size: 0.9375rem;
        line-height: 1.6;
        flex: 1;
      }

      .footer {
        padding: 1rem var(--noc-card-padding, 1.5rem) var(--noc-card-padding, 1.5rem);
        display: flex;
        gap: 0.75rem;
        align-items: var(--noc-footer-align, center);
        justify-content: var(--noc-footer-justify, flex-start);
        border-top: 1px solid var(--noc-card-border, #333);
      }

      .footer[hidden] { display: none; }

      ::slotted([slot="footer"]) { display: contents; }
    </style>

    <div class="card ${glass ? 'glass' : ''}" part="base">
      <div class="image-container" part="image-container">
        <slot name="image"></slot>
      </div>
      <div class="header" part="header">
        <slot name="header"></slot>
      </div>
      <div class="body" part="body">
        <slot></slot>
      </div>
      <div class="footer" part="footer">
        <slot name="footer"></slot>
      </div>
    </div>
  `;
}

class NocCard extends HTMLElement {

  static get observedAttributes() {
    return ['size', 'glass'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._onSlotChange = this._onSlotChange.bind(this);
  }

  connectedCallback() {
    this._render();
    this._bindSlotListeners();
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this._render();
      this._bindSlotListeners();
    }
  }

  _bindSlotListeners() {
    const slots = this.shadowRoot.querySelectorAll('slot');
    slots.forEach(slot => {
      slot.removeEventListener('slotchange', this._onSlotChange);
      slot.addEventListener('slotchange', this._onSlotChange);
    });
    this._updateSlotVisibility();
  }

  _onSlotChange() {
    this._updateSlotVisibility();
  }

  _hasSlotContent(slotName) {
    const selector = slotName ? `slot[name="${slotName}"]` : 'slot:not([name])';
    const slot = this.shadowRoot.querySelector(selector);
    if (!slot) return false;
    return slot.assignedNodes({ flatten: true }).length > 0;
  }

  _updateSlotVisibility() {
    const imageWrap  = this.shadowRoot.querySelector('.image-container');
    const footerWrap = this.shadowRoot.querySelector('.footer');
    if (imageWrap)  imageWrap.hidden  = !this._hasSlotContent('image');
    if (footerWrap) footerWrap.hidden = !this._hasSlotContent('footer');
  }

  _render() {
    this.shadowRoot.innerHTML = buildTemplate({
      size:  this.getAttribute('size'),
      ...(this.hasAttribute('glass') ? { glass: true } : {}),
    });
  }
}

customElements.define('noc-card', NocCard);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
