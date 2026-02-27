// nocturnal-components/components/carousel-item/carousel-item.js

/**
 * @customElement noc-carousel-item
 * @slot - Carousel item content
 * 
 * Attributes:
 * @attr current - Current slide index
 * 
 * CSS Custom Properties:
 * @cssprop --noc-carousel-slide-bg - Slide background color
 */

function buildTemplate() {
  return `
    <style>
      :host {
        flex: 0 0 100%;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        background-color: var(--noc-carousel-slide-bg, transparent);
      }

      ::slotted(*) {
        max-width: 100%;
        max-height: 100%;
      }
    </style>

    <slot></slot>
  `;
}

class NocCarouselItem extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = buildTemplate();
  }
}

customElements.define('noc-carousel-item', NocCarouselItem);

export function ssrTemplate() {
  return `<template shadowrootmode="open">${buildTemplate()}</template>`;
}
