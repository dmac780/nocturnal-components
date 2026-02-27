// nocturnal-components/components/rating/rating.js

/**
 * @customElement noc-rating
 *
 * Attributes:
 * @attr {number}  value     - Current rating value. Defaults to 0.
 * @attr {number}  max       - Total number of stars. Defaults to 5.
 * @attr {number}  precision - Step precision for fractional ratings (e.g. 0.5).
 *                             Ignored when `whole` is set. Defaults to 1.
 * @attr {boolean} whole     - Snaps to whole integers only.
 * @attr {boolean} readonly  - Disables interaction; value is still displayed.
 * @attr {boolean} disabled  - Disables interaction and reduces opacity.
 * @attr {'sm'|'md'|'lg'} size - Star size preset. Defaults to 'md'.
 * @attr {string}  label     - Optional label displayed above the stars.
 *
 * CSS Custom Properties:
 * @cssprop --noc-star-active        - Fill colour of active / filled stars (default: #facc15)
 * @cssprop --noc-star-empty         - Fill colour of empty stars (default: #3a3a3a)
 * @cssprop --noc-star-size          - Override star width/height directly
 * @cssprop --noc-rating-label-color - Label text colour (default: #ccc)
 * @cssprop --noc-rating-label-size  - Label font size (default: 0.875rem)
 *
 * Events:
 * @event noc-change - Emitted when the rating value changes. detail: { value: number }
 */

function buildTemplate(attrs = {}) {
  const max   = Number(attrs.max) || 5;
  const value = parseFloat(attrs.value) || 0;
  const label = attrs.label || '';

  const stars = Array.from({ length: max }, (_, i) => {
    const starIndex = i + 1;
    let percent = 0;
    if (value >= starIndex) {
      percent = 100;
    } else if (value > starIndex - 1) {
      percent = (value - (starIndex - 1)) * 100;
    }
    return `
      <div class="star-box" data-index="${starIndex}">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path class="star-bg" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <div class="fill-layer" style="width:${percent}%">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path class="star-fill" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
      </div>`;
  }).join('');

  return `
    <style>
      :host {
        display: inline-block;
        font-family: inherit;
        user-select: none;
      }

      :host([size="sm"]) { --noc-star-size: 1.25rem; }
      :host([size="md"]) { --noc-star-size: 1.75rem; }
      :host([size="lg"]) { --noc-star-size: 2.25rem; }

      .label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: var(--noc-rating-label-size, 0.875rem);
        font-weight: 500;
        color: var(--noc-rating-label-color, #ccc);
      }

      .stars-container {
        display: flex;
        gap: 0.25rem;
        cursor: pointer;
      }

      :host([readonly]) .stars-container,
      :host([disabled]) .stars-container {
        cursor: default;
      }

      :host([disabled]) {
        opacity: 0.5;
      }

      .star-box {
        position: relative;
        width: var(--noc-star-size, 1.75rem);
        height: var(--noc-star-size, 1.75rem);
        flex-shrink: 0;
      }

      svg {
        width: 100%;
        height: 100%;
        display: block;
        position: absolute;
        top: 0;
        left: 0;
      }

      .star-bg   { fill: var(--noc-star-empty, #3a3a3a); }
      .star-fill { fill: var(--noc-star-active, #facc15); }

      .fill-layer {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        overflow: hidden;
        width: 0%;
        pointer-events: none;
      }

      .fill-layer svg {
        width: var(--noc-star-size, 1.75rem);
        height: var(--noc-star-size, 1.75rem);
      }
    </style>
    ${label ? `<span class="label">${label}</span>` : ''}
    <div class="stars-container" id="container">${stars}</div>
  `;
}

class NocRating extends HTMLElement {

  static formAssociated = true;

  static get observedAttributes() {
    return ['value', 'max', 'precision', 'whole', 'readonly', 'disabled', 'size', 'label'];
  }

  constructor() {
    super();
    // Only attach shadow root if it doesn't exist (SSR may have created one via DSD)
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }
    this._internals  = this.attachInternals();
    this._hoverValue = null;
    this._isRendered = false;
  }

  connectedCallback() {
    if (!this._isRendered) {
      this._setup();
      this._isRendered = true;
    }
    this._render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (this._isRendered && oldVal !== newVal) {
      this._render();
    }
  }

  get value() {
    return parseFloat(this.getAttribute('value')) || 0;
  }

  set value(val) {
    this.setAttribute('value', val);
    this._internals.setFormValue(String(val));
    this._render();
  }

  _setup() {
    // Check if SSR content already exists
    const hasSSRContent = this.shadowRoot.querySelector('.stars-container');
    
    if (!hasSSRContent) {
      this.shadowRoot.innerHTML = buildTemplate({
        max:   this.getAttribute('max'),
        value: this.getAttribute('value'),
        label: this.getAttribute('label'),
      });
    }

    this._container      = this.shadowRoot.getElementById('container');
    this._labelContainer = this.shadowRoot.querySelector('.label');

    this._container.addEventListener('click',      (e) => this._handleClick(e));
    this._container.addEventListener('mousemove',  (e) => this._handleMouseMove(e));
    this._container.addEventListener('mouseleave', ()  => this._handleMouseLeave());
  }

  _render() {
    if (!this._isRendered) {
      return;
    }

    const max   = Number(this.getAttribute('max')) || 5;
    const label = this.getAttribute('label');
    const value = this._hoverValue !== null ? this._hoverValue : this.value;

    const labelEl = this.shadowRoot.querySelector('.label');
    if (label && !labelEl) {
      const span = document.createElement('span');
      span.className = 'label';
      span.textContent = label;
      this.shadowRoot.insertBefore(span, this._container);
    } else if (label && labelEl) {
      labelEl.textContent = label;
    } else if (!label && labelEl) {
      labelEl.remove();
    }

    if (this._container.children.length !== max) {
      this._container.innerHTML = Array.from({ length: max }, (_, i) => `
        <div class="star-box" data-index="${i + 1}">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path class="star-bg" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <div class="fill-layer" id="fill-${i}">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path class="star-fill" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
        </div>
      `).join('');
    }

    const starBoxes = this._container.querySelectorAll('.star-box');
    starBoxes.forEach((box, i) => {
      const fillLayer = box.querySelector('.fill-layer');
      const starIndex = i + 1;
      let percent     = 0;

      if (value >= starIndex) {
        percent = 100;
      } else if (value > starIndex - 1) {
        percent = (value - (starIndex - 1)) * 100;
      }

      fillLayer.style.width = `${percent}%`;
    });
  }

  _handleClick(e) {
    if (this.hasAttribute('disabled') || this.hasAttribute('readonly')) {
      return;
    }

    const val = this._getValueFromEvent(e);

    if (val !== null) {
      this.value = val;
      this.dispatchEvent(new CustomEvent('noc-change', {
        bubbles:  true,
        composed: true,
        detail:   { value: val }
      }));
    }
  }

  _handleMouseMove(e) {
    if (this.hasAttribute('disabled') || this.hasAttribute('readonly')) {
      return;
    }

    const val = this._getValueFromEvent(e);

    if (val !== this._hoverValue) {
      this._hoverValue = val;
      this._render();
    }
  }

  _handleMouseLeave() {
    this._hoverValue = null;
    this._render();
  }

  _getValueFromEvent(e) {
    const starBox = e.target.closest('.star-box');

    if (!starBox) {
      return null;
    }

    const index = parseInt(starBox.dataset.index, 10);
    const max   = Number(this.getAttribute('max')) || 5;

    if (this.hasAttribute('whole')) {
      return Math.min(max, Math.max(1, index));
    }

    const rect      = starBox.getBoundingClientRect();
    const fraction  = (e.clientX - rect.left) / rect.width;
    const raw       = (index - 1) + fraction;
    const precision = Math.max(0.1, parseFloat(this.getAttribute('precision')) || 1);

    const snapped = Math.round(raw / precision) * precision;
    const floored = Math.max(precision, snapped);

    return parseFloat(Math.min(max, floored).toFixed(10));
  }
}

customElements.define('noc-rating', NocRating);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
