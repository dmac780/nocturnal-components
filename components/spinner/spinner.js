// nocturnal-components/components/spinner/spinner.js

/**
 * @customElement noc-spinner
 * 
 * Attributes:
 * @attr {number} size - The diameter of the spinner in pixels. Defaults to 24.
 * @attr {number} track-width - The thickness of the spinner stroke in pixels. Defaults to 2.
 * @attr {string} color - The color of the spinning arc. Overrides --noc-spinner-color.
 * @attr {string} track-color - The color of the stationary track. Overrides --noc-spinner-track-color.
 * @attr {number} speed - The duration of one rotation in seconds. Defaults to 1.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-spinner-track-width - The thickness of the spinner stroke.
 * @cssprop --noc-spinner-color - The color of the spinning arc.
 * @cssprop --noc-spinner-track-color - The color of the stationary track.
 * @cssprop --noc-spinner-speed - The rotation speed.
 */

function buildTemplate(attrs = {}) {
  const size       = attrs.size         || '24';
  const trackWidth = attrs['track-width'] || '2';
  const color      = attrs.color        || 'var(--noc-accent, currentColor)';
  const trackColor = attrs['track-color'] || 'rgba(255, 255, 255, 0.1)';
  const speed      = attrs.speed        || '1';

  return `
    <style>
      :host {
        display: inline-block;
        width: ${size}px;
        height: ${size}px;
        vertical-align: middle;
        --noc-spinner-track-width: ${trackWidth}px;
        --noc-spinner-color: ${color};
        --noc-spinner-track-color: ${trackColor};
        --noc-spinner-speed: ${speed}s;
      }

      svg {
        width: 100%;
        height: 100%;
        display: block;
        animation: spin var(--noc-spinner-speed) linear infinite;
      }

      circle {
        fill: none;
        stroke-linecap: round;
      }

      .track {
        stroke: var(--noc-spinner-track-color);
        stroke-width: var(--noc-spinner-track-width);
      }

      .arc {
        stroke: var(--noc-spinner-color);
        stroke-width: var(--noc-spinner-track-width);
        stroke-dasharray: 150, 300;
        stroke-dashoffset: 0;
        animation: arc 1.5s ease-in-out infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      @keyframes arc {
        0% { stroke-dasharray: 1, 300; stroke-dashoffset: 0; }
        50% { stroke-dasharray: 150, 300; stroke-dashoffset: -50; }
        100% { stroke-dasharray: 1, 300; stroke-dashoffset: -280; }
      }
    </style>

    <svg viewBox="0 0 100 100">
      <circle class="track" cx="50" cy="50" r="45"/>
      <circle class="arc" cx="50" cy="50" r="45"/>
    </svg>
  `;
}

class NocSpinner extends HTMLElement {
  
  static get observedAttributes() {
    return ['size', 'track-width', 'color', 'track-color', 'speed'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (this.shadowRoot.innerHTML && oldVal !== newVal) {
      this.render();
    }
  }

  render() {
    this.shadowRoot.innerHTML = buildTemplate({
      size:          this.getAttribute('size'),
      'track-width': this.getAttribute('track-width'),
      color:         this.getAttribute('color'),
      'track-color': this.getAttribute('track-color'),
      speed:         this.getAttribute('speed'),
    });
  }
}

customElements.define('noc-spinner', NocSpinner);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
