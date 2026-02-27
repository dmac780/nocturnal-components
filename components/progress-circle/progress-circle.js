// nocturnal-components/components/progress-circle/progress-circle.js

/**
 * @customElement noc-progress-circle
 * 
 * Attributes:
 * @attr {number} value - The current value of the progress indicator.
 * @attr {number} max - The maximum value of the progress indicator. Defaults to 100.
 * @attr {boolean} pending - If present, shows an indeterminate spinning state.
 * @attr {string} label - A label to display below the progress circle.
 * @attr {boolean} show-value - If present, displays the percentage text in the center of the circle.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-progress-size - The diameter of the progress circle.
 * @cssprop --noc-progress-track - The color of the remaining/incomplete track.
 * @cssprop --noc-progress-fill - The color of the filled portion.
 * @cssprop --noc-progress-width - The thickness of the circle stroke.
 * @cssprop --noc-progress-text - The color of the value text in the center.
 */

function buildTemplate(attrs = {}) {
  const value     = Number(attrs.value || 0);
  const max       = Number(attrs.max   || 100);
  const pending   = 'pending' in attrs;
  const showValue = 'show-value' in attrs;
  const label     = attrs.label || '';

  const percent       = Math.min(100, Math.max(0, (value / max) * 100));
  const radius        = 45;
  const circumference = 2 * Math.PI * radius;
  const offset        = circumference * (1 - percent / 100);

  return `
    <style>
      :host {
        --noc-progress-size: 72px;
        --noc-progress-track: #f3f4f6;
        --noc-progress-fill: #111;
        --noc-progress-width: 6;
        --noc-progress-text: #111;

        display: inline-flex;
        flex-direction: column;
        align-items: center;
        font-family: inherit;
      }

      svg {
        width: var(--noc-progress-size);
        height: var(--noc-progress-size);
        transform: rotate(-90deg);
      }

      circle {
        fill: none;
        stroke-width: var(--noc-progress-width);
      }

      .track {
        stroke: var(--noc-progress-track);
      }

      .indicator {
        stroke: var(--noc-progress-fill);
        stroke-linecap: round;
        stroke-dasharray: ${circumference};
        stroke-dashoffset: ${pending ? circumference * 0.75 : offset};
        transition: stroke-dashoffset 0.25s ease;
      }

      .pending .indicator {
        animation: spin 1.2s linear infinite;
      }

      .center {
        position: absolute;
        top: 0;
        left: 0;
        width: var(--noc-progress-size);
        height: var(--noc-progress-size);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--noc-progress-text);
      }

      .label {
        margin-top: 0.25rem;
        font-size: 0.75rem;
        color: #6b7280;
      }

      @keyframes spin {
        0% { stroke-dashoffset: ${circumference}; }
        100% { stroke-dashoffset: 0; }
      }
    </style>

    <div class="${pending ? 'pending' : ''}" style="position: relative;">
      <svg viewBox="0 0 100 100">
        <circle class="track" cx="50" cy="50" r="${radius}" />
        <circle class="indicator" cx="50" cy="50" r="${radius}" />
      </svg>

      ${showValue && !pending ? `<div class="center">${Math.round(percent)}%</div>` : ''}
    </div>

    ${label ? `<div class="label">${label}</div>` : ''}
  `;
}

class NocProgressCircle extends HTMLElement {

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
      value: this.getAttribute('value'),
      max:   this.getAttribute('max'),
      label: this.getAttribute('label'),
      ...(this.hasAttribute('pending')    ? { pending: true }      : {}),
      ...(this.hasAttribute('show-value') ? { 'show-value': true } : {}),
    });
  }
}

customElements.define('noc-progress-circle', NocProgressCircle);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
