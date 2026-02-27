// nocturnal-components/components/breadcrumb-item/breadcrumb-item.js

/**
 * @customElement noc-breadcrumb-item
 * @slot - Breadcrumb item content
 * 
 * Attributes:
 * @attr href - Link URL
 * @attr target - Link target
 * @attr rel - Link relationship
 * 
 * CSS Custom Properties:
 * @cssprop --noc-breadcrumb-font-size - Font size for the breadcrumb
 * @cssprop --noc-breadcrumb-color - Text color for the breadcrumb
 * @cssprop --noc-breadcrumb-separator-color - Separator color for the breadcrumb
 * @cssprop --noc-breadcrumb-active-color - Active color for the breadcrumb
 */

function buildTemplate(attrs = {}) {
  const href   = attrs.href   || '';
  const target = attrs.target || '_self';
  const rel    = attrs.rel    || 'noreferrer noopener';
  const isLink = !!href;

  return `
    <style>
      :host {
        display: inline-flex;
        align-items: center;
        overflow: visible;
        position: relative;
      }

      .breadcrumb-item {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--noc-breadcrumb-color, #888);
        font-size: var(--noc-breadcrumb-font-size, 0.875rem);
        transition: color 0.2s;
        overflow: visible;
      }

      .label {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        text-decoration: none;
        color: inherit;
        cursor: default;
        overflow: visible;
        position: relative;
      }

      :host([href]) .label {
        cursor: pointer;
      }

      :host([href]) .label:hover {
        color: var(--noc-accent, #60a5fa);
      }

      .separator {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin: 0 0.5rem;
        color: var(--noc-breadcrumb-separator-color, #444);
        user-select: none;
      }

      :host(:last-of-type) .separator {
        display: none;
      }

      :host(:last-of-type) .breadcrumb-item {
        color: var(--noc-breadcrumb-active-color, #eee);
        font-weight: 500;
      }

      ::slotted([slot="prefix"]), ::slotted([slot="suffix"]) {
        display: inline-flex;
        align-items: center;
      }
    </style>

    <div class="breadcrumb-item" part="base">
      <${isLink ? 'a' : 'span'}
        class="label"
        part="label"
        ${isLink ? `href="${href}" target="${target}" rel="${rel}"` : ''}
      >
        <slot name="prefix"></slot>
        <slot></slot>
        <slot name="suffix"></slot>
      </${isLink ? 'a' : 'span'}>

      <div class="separator" part="separator" aria-hidden="true">
        <slot name="separator"></slot>
      </div>
    </div>
  `;
}

class NocBreadcrumbItem extends HTMLElement {

  static get observedAttributes() {
    return ['href', 'target', 'rel'];
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
      href:   this.getAttribute('href'),
      target: this.getAttribute('target'),
      rel:    this.getAttribute('rel'),
    });
  }
}

customElements.define('noc-breadcrumb-item', NocBreadcrumbItem);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
