// nocturnal-components/components/progress/progress.js

/**
 * @customElement noc-progress
 * 
 * Attributes:
 * @attr {number} value - The current value of the progress bar.
 * @attr {number} max - The maximum value of the progress bar. Defaults to 100.
 * @attr {boolean} pending - If present, shows an indeterminate animated state.
 * @attr {string} label - A label to display above the progress bar.
 * @attr {boolean} show-value - If present, displays the percentage text inside the bar.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-progress-height - The height of the progress bar track.
 * @cssprop --noc-progress-bg - The background color of the track.
 * @cssprop --noc-progress-fill - The color of the filled portion of the bar.
 * @cssprop --noc-progress-text - The color of the value text inside the bar.
 * @cssprop --noc-progress-radius - The border radius of the track and bar.
 */

function buildTemplate(attrs = {}) {
  const value     = Number(attrs.value || 0);
  const max       = Number(attrs.max   || 100);
  const pending   = 'pending' in attrs;
  const showValue = 'show-value' in attrs;
  const label     = attrs.label || '';
  const percent   = Math.min(100, Math.max(0, (value / max) * 100));

  return `
    <style>
      :host {
        --noc-progress-height: 8px;
        --noc-progress-bg: #f3f4f6;
        --noc-progress-fill: #111;
        --noc-progress-text: #fff;
        --noc-progress-radius: 999px;

        display: block;
        font-family: inherit;
      }

      .label {
        margin-bottom: 0.25rem;
        font-size: 0.75rem;
        color: #6b7280;
      }

      .track {
        position: relative;
        height: var(--noc-progress-height);
        background: var(--noc-progress-bg);
        border-radius: var(--noc-progress-radius);
        overflow: hidden;
      }

      .bar {
        height: 100%;
        background: var(--noc-progress-fill);
        border-radius: inherit;
        width: ${pending ? '50%' : `${percent}%`};
        transition: width 0.2s ease;
      }

      .pending .bar {
        position: absolute;
        animation: slide 1.2s infinite linear;
      }

      .value {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        color: var(--noc-progress-text);
        pointer-events: none;
      }

      @keyframes slide {
        from { left: -50%; }
        to { left: 100%; }
      }
    </style>

    ${label ? `<div class="label">${label}</div>` : ''}

    <div class="track ${pending ? 'pending' : ''}">
      <div class="bar"></div>
      ${showValue && !pending ? `<div class="value">${Math.round(percent)}%</div>` : ''}
    </div>
  `;
}

class NocProgress extends HTMLElement {

  static get observedAttributes() {
    return ['value', 'max', 'pending', 'label', 'show-value'];
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
      value:       this.getAttribute('value'),
      max:         this.getAttribute('max'),
      label:       this.getAttribute('label'),
      ...(this.hasAttribute('pending')    ? { pending: true }      : {}),
      ...(this.hasAttribute('show-value') ? { 'show-value': true } : {}),
    });
  }
}

customElements.define('noc-progress', NocProgress);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
