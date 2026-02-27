// nocturnal-components/components/tag/tag.js

/**
 * @customElement noc-tag
 * 
 * @slot - The content of the tag.
 * @slot prefix - Content to display before the label.
 * 
 * Attributes:
 * @attr {'sm' | 'md' | 'lg'} size - The size of the tag. Defaults to 'md'.
 * @attr {boolean} pill - If present, the tag will have a pill shape.
 * @attr {boolean} removable - If present, adds a close button to the tag.
 * @attr {boolean} disabled - Whether the tag's remove button is disabled.
 * @attr {'neutral' | 'primary' | 'success' | 'warning' | 'danger'} variant - The visual style of the tag. Defaults to 'neutral'.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-tag-bg - Background color of the tag.
 * @cssprop --noc-tag-color - Text color of the tag.
 * @cssprop --noc-tag-border - Border color of the tag.
 * 
 * Events:
 * @event noc-remove - Emitted when the remove button is clicked.
 */

function buildTemplate(attrs = {}) {
  const size     = attrs.size || 'md';
  const pill     = 'pill' in attrs;
  const removable = 'removable' in attrs;
  const disabled = 'disabled' in attrs;

  return `
    <style>
      :host {
        display: inline-block;
        --noc-tag-bg: #2a2a2a;
        --noc-tag-color: #eee;
        --noc-tag-border: #444;
      }

      :host([variant="neutral"]) {
        --noc-tag-bg: #2a2a2a;
        --noc-tag-color: #eee;
        --noc-tag-border: #444;
      }

      :host([variant="primary"]) {
        --noc-tag-bg: rgba(37, 99, 235, 0.15);
        --noc-tag-color: #60a5fa;
        --noc-tag-border: rgba(37, 99, 235, 0.3);
      }

      :host([variant="success"]) {
        --noc-tag-bg: rgba(34, 197, 94, 0.15);
        --noc-tag-color: #4ade80;
        --noc-tag-border: rgba(34, 197, 94, 0.3);
      }

      :host([variant="warning"]) {
        --noc-tag-bg: rgba(234, 179, 8, 0.15);
        --noc-tag-color: #facc15;
        --noc-tag-border: rgba(234, 179, 8, 0.3);
      }

      :host([variant="danger"]) {
        --noc-tag-bg: rgba(239, 68, 68, 0.15);
        --noc-tag-color: #f87171;
        --noc-tag-border: rgba(239, 68, 68, 0.3);
      }

      .tag {
        display: inline-flex;
        align-items: center;
        gap: 0.35em;
        padding: 0.25em 0.75em;
        font-size: var(--noc-font-size-${size}, 0.8125rem);
        font-weight: 500;
        border-radius: ${pill ? '999px' : '4px'};
        background: var(--noc-tag-bg);
        color: var(--noc-tag-color);
        border: 1px solid var(--noc-tag-border);
        line-height: normal;
        user-select: none;
        opacity: ${disabled ? 0.5 : 1};
        pointer-events: ${disabled ? 'none' : 'auto'};
        white-space: nowrap;
      }

      :host([size="sm"]) .tag {
        padding: 0.15em 0.5em;
        font-size: 0.75rem;
      }

      :host([size="lg"]) .tag {
        padding: 0.4em 1em;
        font-size: 0.9375rem;
      }

      .remove {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 0;
        margin-left: 0.25rem;
        margin-right: -0.25rem;
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 50%;
        font-size: 1.125rem;
        transition: background 0.2s;
        opacity: 0.7;
      }

      .remove:hover {
        background: rgba(255, 255, 255, 0.1);
        opacity: 1;
      }

      :host([variant="neutral"]) .remove:hover { background: rgba(255, 255, 255, 0.1); }
      :host([variant="primary"]) .remove:hover { background: rgba(37, 99, 235, 0.2); }
      :host([variant="success"]) .remove:hover { background: rgba(34, 197, 94, 0.2); }
      :host([variant="warning"]) .remove:hover { background: rgba(234, 179, 8, 0.2); }
      :host([variant="danger"])  .remove:hover { background: rgba(239, 68, 68, 0.2); }

      ::slotted(*) {
        display: inline-flex;
        align-items: center;
      }
    </style>

    <span class="tag" part="base">
      <slot name="prefix"></slot>
      <slot></slot>

      ${removable
        ? `<button class="remove" part="remove" aria-label="Remove tag">&times;</button>`
        : ''}
    </span>
  `;
}

class NocTag extends HTMLElement {

  static get observedAttributes() {
    return ['size', 'pill', 'removable', 'disabled', 'variant'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal) {
      this.render();
    }
  }

  handleRemove(e) {
    if (this.disabled) {
      return;
    }
    
    this.dispatchEvent(new CustomEvent('noc-remove', {
      bubbles: true,
      composed: true
    }));

    this.remove();
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  render() {
    this.shadowRoot.innerHTML = buildTemplate({
      size:     this.getAttribute('size'),
      ...(this.hasAttribute('pill')     ? { pill: true }     : {}),
      ...(this.hasAttribute('removable') ? { removable: true } : {}),
      ...(this.hasAttribute('disabled') ? { disabled: true } : {}),
    });

    const removeBtn = this.shadowRoot.querySelector('.remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => this.handleRemove(e));
    }
  }
}

customElements.define('noc-tag', NocTag);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
