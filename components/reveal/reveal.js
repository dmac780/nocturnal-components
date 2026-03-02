// nocturnal-components/components/reveal/reveal.js

/**
 * @customElement noc-reveal
 * 
 * Reveals content with fade-in animation when it enters the viewport.
 * Uses IntersectionObserver for performance.
 * 
 * @slot - The content to reveal
 * 
 * Attributes:
 * @attr {number} threshold - Percentage of element that must be visible (0-1, default: 0.15)
 * @attr {string} margin - Root margin for observer (default: '0px')
 * 
 * CSS Custom Properties:
 * @cssprop --noc-reveal-duration - Animation duration (default: 0.4s)
 * @cssprop --noc-reveal-easing - Animation timing function (default: ease)
 * @cssprop --noc-reveal-translate - Initial Y offset (default: 1rem)
 */

function buildTemplate() {
  return `
    <style>
      :host {
        display: block;
        opacity: 0;
        transform: translateY(var(--noc-reveal-translate, 1rem));
        transition: 
          opacity var(--noc-reveal-duration, 0.4s) var(--noc-reveal-easing, ease),
          transform var(--noc-reveal-duration, 0.4s) var(--noc-reveal-easing, ease);
      }

      :host(.is-visible) {
        opacity: 1;
        transform: translateY(0);
      }

      :host(.no-animation) {
        opacity: 1;
        transform: none;
        transition: none;
      }
    </style>
    
    <slot></slot>
  `;
}

class NocReveal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = buildTemplate();

    // Fallback for no IntersectionObserver support
    if (!('IntersectionObserver' in window)) {
      this.classList.add('no-animation', 'is-visible');
      return;
    }

    const threshold = parseFloat(this.getAttribute('threshold')) || 0.15;
    const margin = this.getAttribute('margin') || '0px';

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { 
        rootMargin: margin, 
        threshold: threshold 
      }
    );

    observer.observe(this);
  }
}

customElements.define('noc-reveal', NocReveal);

export function ssrTemplate() {
  return `<template shadowrootmode="open">${buildTemplate()}</template>`;
}
