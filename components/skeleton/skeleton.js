// nocturnal-components/components/skeleton/skeleton.js

/**
 * @customElement noc-skeleton
 * 
 * Attributes:
 * @attr {'sheen' | 'pulse' | 'none'} effect - The animation effect to use. Defaults to 'sheen'.
 * @attr {'rect' | 'circle' | 'text' | 'avatar'} variant - The shape of the skeleton. Defaults to 'rect'.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-skeleton-bg - The background color of the skeleton.
 * @cssprop --noc-skeleton-accent - The color of the animation effect (sheen).
 * @cssprop --noc-skeleton-speed - The duration of the animation cycle.
 * @cssprop --noc-skeleton-radius - The border radius of the skeleton.
 * @cssprop --noc-skeleton-clip-path - An optional clip-path to apply to the skeleton.
 */

function buildTemplate(attrs = {}) {
  return `
    <style>
      :host {
        --noc-skeleton-bg: #2a2a2a;
        --noc-skeleton-accent: #3a3a3a;
        --noc-skeleton-speed: 2s;
        --noc-skeleton-radius: 0.25rem;
        --noc-skeleton-clip-path: none;
        
        display: block;
        position: relative;
        width: 100%;
        height: 100%;
      }

      .skeleton {
        position: relative;
        width: 100%;
        height: 100%;
        background: var(--noc-skeleton-bg);
        border-radius: var(--noc-skeleton-radius);
        clip-path: var(--noc-skeleton-clip-path);
        overflow: hidden;
      }

      /* Variants */
      :host([variant="circle"]) { --noc-skeleton-radius: 50%; }
      
      :host([variant="text"]) {
        width: 100%;
        height: 1.2em;
        margin-bottom: 0.5em;
      }

      :host([variant="avatar"]) {
        width: 3rem;
        height: 3rem;
        --noc-skeleton-radius: 50%;
      }

      /* Effects */
      .skeleton::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
      }

      /* Pulse */
      :host([effect="pulse"]) .skeleton {
        animation: pulse var(--noc-skeleton-speed) ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }

      /* Sheen */
      :host([effect="sheen"]) .skeleton::after {
        background: linear-gradient(
          90deg,
          transparent,
          var(--noc-skeleton-accent),
          transparent
        );
        transform: translateX(-100%);
        animation: sheen var(--noc-skeleton-speed) infinite;
      }

      @keyframes sheen {
        100% { transform: translateX(100%); }
      }

      /* None */
      :host([effect="none"]) .skeleton::after {
        display: none;
      }
    </style>

    <div class="skeleton" part="indicator"></div>
  `;
}

class NocSkeleton extends HTMLElement {

  static get observedAttributes() {
    return ['effect', 'variant'];
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
      effect:  this.getAttribute('effect'),
      variant: this.getAttribute('variant'),
    });
  }
}

customElements.define('noc-skeleton', NocSkeleton);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
