// nocturnal-components/components/range/range.js

/**
 * @customElement noc-range
 *
 * Attributes:
 * @attr {number}  min               - Minimum value. Defaults to 0.
 * @attr {number}  max               - Maximum value. Defaults to 100.
 * @attr {number}  step              - Increment step. Defaults to 1.
 * @attr {number}  value             - Current value. Defaults to 0.
 * @attr {boolean} disabled          - Disables the input.
 * @attr {string}  label             - Label displayed above the slider.
 * @attr {string}  help-text         - Help text displayed below the slider.
 * @attr {'top'|'bottom'} tooltip-placement - Tooltip position. Defaults to 'top'.
 * @attr {boolean} no-tooltip        - Hides the value tooltip entirely.
 * @attr {boolean} no-glow           - Disables the progress fill glow/shadow.
 *
 * CSS Custom Properties:
 * @cssprop --noc-range-track           - Track background colour (default: #1a1a1a)
 * @cssprop --noc-range-track-border    - Track border colour (default: #333)
 * @cssprop --noc-range-track-height    - Track height (default: 4px)
 * @cssprop --noc-range-track-active    - Filled progress colour (default: var(--noc-accent, #2563eb))
 * @cssprop --noc-range-glow-color      - Glow / shadow colour for the progress fill.
 * @cssprop --noc-range-thumb-bg        - Thumb background colour (default: #fff)
 * @cssprop --noc-range-thumb-size      - Thumb diameter (default: 18px)
 * @cssprop --noc-range-thumb-ring      - Colour of the thumb focus ring (default: rgba(0,0,0,.3))
 * @cssprop --noc-range-label-color     - Label text colour (default: #ccc)
 * @cssprop --noc-range-label-size      - Label font size (default: 0.875rem)
 * @cssprop --noc-range-helptext-color  - Help text colour (default: #666)
 * @cssprop --noc-range-helptext-size   - Help text font size (default: 0.75rem)
 *
 * Events:
 * @event noc-input  - Emitted continuously while dragging. detail: { value: string }
 * @event noc-change - Emitted when the value is committed. detail: { value: string }
 */

function buildTemplate(attrs = {}) {
  const min       = attrs.min               || '0';
  const max       = attrs.max               || '100';
  const step      = attrs.step              || '1';
  const value     = attrs.value             || '0';
  const disabled  = 'disabled' in attrs;
  const label     = attrs.label             || '';
  const helpText  = attrs['help-text']      || '';
  const noTooltip = 'no-tooltip' in attrs;
  const noGlow    = 'no-glow' in attrs;
  const placement = attrs['tooltip-placement'] || 'top';

  return `
    <style>
      :host {
        display: block;
        font-family: inherit;
        width: 100%;

        --noc-range-track:          #1a1a1a;
        --noc-range-track-border:   #333;
        --noc-range-track-height:   4px;
        --noc-range-track-active:   var(--noc-accent, #2563eb);
        --noc-range-glow-color:     color-mix(in srgb, var(--noc-range-track-active) 40%, transparent);
        --noc-range-thumb-bg:       #fff;
        --noc-range-thumb-size:     18px;
        --noc-range-thumb-ring:     rgba(0, 0, 0, 0.3);
        --noc-range-label-color:    #ccc;
        --noc-range-label-size:     0.875rem;
        --noc-range-helptext-color: #666;
        --noc-range-helptext-size:  0.75rem;
        --noc-range-progress:       0%;
      }

      .container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .label {
        font-size: var(--noc-range-label-size);
        font-weight: 600;
        color: var(--noc-range-label-color);
      }

      .help-text {
        font-size: var(--noc-range-helptext-size);
        color: var(--noc-range-helptext-color);
      }

      .slider-wrapper {
        position: relative;
        width: 100%;
        display: flex;
        align-items: center;
        height: 32px;
      }

      input[type="range"] {
        -webkit-appearance: none;
        width: 100%;
        background: transparent;
        margin: 0;
        cursor: pointer;
        z-index: 2;
        position: relative;
      }

      input[type="range"]:disabled {
        cursor: not-allowed;
        opacity: 0.4;
      }

      input[type="range"]:focus {
        outline: none;
      }

      input[type="range"]::-webkit-slider-runnable-track {
        width: 100%;
        height: var(--noc-range-track-height);
        background: var(--noc-range-track);
        border-radius: 999px;
        border: 1px solid var(--noc-range-track-border);
      }

      input[type="range"]::-moz-range-track {
        width: 100%;
        height: var(--noc-range-track-height);
        background: var(--noc-range-track);
        border-radius: 999px;
        border: 1px solid var(--noc-range-track-border);
      }

      .progress-fill {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        height: var(--noc-range-track-height);
        background: var(--noc-range-track-active);
        width: var(--noc-range-progress);
        border-radius: 999px;
        pointer-events: none;
        z-index: 1;
        box-shadow: ${noGlow ? 'none' : '0 0 10px var(--noc-range-glow-color)'};
        transition: width 0.05s linear;
      }

      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: var(--noc-range-thumb-size);
        width: var(--noc-range-thumb-size);
        border-radius: 50%;
        background: var(--noc-range-thumb-bg);
        border: none;
        box-shadow:
          0 0 0 4px var(--noc-range-thumb-ring),
          0 2px 4px rgba(0, 0, 0, 0.5);
        margin-top: calc(
          (var(--noc-range-track-height) / 2) -
          (var(--noc-range-thumb-size) / 2) + 1px
        );
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: grab;
        position: relative;
        z-index: 3;
      }

      input[type="range"]::-moz-range-thumb {
        height: var(--noc-range-thumb-size);
        width: var(--noc-range-thumb-size);
        border-radius: 50%;
        background: var(--noc-range-thumb-bg);
        border: none;
        box-shadow:
          0 0 0 4px var(--noc-range-thumb-ring),
          0 2px 4px rgba(0, 0, 0, 0.5);
        cursor: grab;
      }

      input[type="range"]:active::-webkit-slider-thumb {
        transform: scale(1.25);
        cursor: grabbing;
      }

      input[type="range"]:active::-moz-range-thumb {
        transform: scale(1.25);
        cursor: grabbing;
      }

      noc-tooltip {
        position: absolute;
        pointer-events: none;
        transform: translateX(-50%);
        --noc-tooltip-bg: #222;
        --noc-tooltip-radius: 6px;
      }

      noc-tooltip[placement="top"] {
        bottom: calc(100% + 8px);
      }

      noc-tooltip[placement="bottom"] {
        top: calc(100% + 8px);
      }
    </style>

    <div class="container">
      ${label ? `<label class="label" for="range-input">${label}</label>` : ''}

      <div class="slider-wrapper">
        <div class="progress-fill"></div>

        ${!noTooltip ? `
          <noc-tooltip id="tooltip" placement="${placement}" trigger="manual">
            <div slot="content"></div>
          </noc-tooltip>
        ` : ''}

        <input
          id="range-input"
          type="range"
          min="${min}"
          max="${max}"
          step="${step}"
          value="${value}"
          ${disabled ? 'disabled' : ''}
        />
      </div>

      ${helpText ? `<span class="help-text">${helpText}</span>` : ''}
    </div>
  `;
}

class NocRange extends HTMLElement {

  static get observedAttributes() {
    return [
      'min', 'max', 'step', 'value',
      'disabled', 'label', 'help-text',
      'tooltip-placement', 'no-tooltip', 'no-glow'
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isRendered      = false;
    this._handleInput     = this._handleInput.bind(this);
    this.tooltipFormatter = (val) => val;
  }

  connectedCallback() {
    if (!this._isRendered) {
      this._render();
      this._isRendered = true;
    }
    this._updateProgress();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this._isRendered) {
      return;
    }

    if (name === 'value' && oldVal !== newVal) {
      if (this._inputEl) {
        this._inputEl.value = newVal;
      }
      this._updateProgress();
    } else {
      this._render();
    }
  }

  get value() {
    return this._inputEl
      ? this._inputEl.value
      : (this.getAttribute('value') || '0');
  }

  set value(v) {
    this.setAttribute('value', v);

    if (this._inputEl) {
      this._inputEl.value = v;
      this._updateProgress();
    }
  }

  _updateProgress() {
    if (!this._inputEl) {
      return;
    }

    const min     = parseFloat(this.getAttribute('min')  || '0');
    const max     = parseFloat(this.getAttribute('max')  || '100');
    const val     = parseFloat(this._inputEl.value);
    const percent = ((val - min) / (max - min)) * 100;

    this.style.setProperty('--noc-range-progress', `${percent}%`);

    if (this._tooltip) {
      this._tooltip.setAttribute('content', this.tooltipFormatter(val));
      this._updateTooltipPosition(percent);
    }
  }

  _updateTooltipPosition(percent) {
    if (!this._tooltip) {
      return;
    }

    const thumbSize = parseFloat(
      getComputedStyle(this).getPropertyValue('--noc-range-thumb-size') || '18'
    );

    const offset = thumbSize / 2 - (percent / 100) * thumbSize;
    this._tooltip.style.left = `calc(${percent}% + ${offset}px)`;
  }

  _handleInput(e) {
    const val = e.target.value;
    this.setAttribute('value', val);
    this._updateProgress();

    this.dispatchEvent(new CustomEvent('noc-input', {
      bubbles:  true,
      composed: true,
      detail:   { value: val }
    }));

    this.dispatchEvent(new CustomEvent('noc-change', {
      bubbles:  true,
      composed: true,
      detail:   { value: val }
    }));
  }

  _render() {
    this.shadowRoot.innerHTML = buildTemplate({
      min:                  this.getAttribute('min'),
      max:                  this.getAttribute('max'),
      step:                 this.getAttribute('step'),
      value:                this.getAttribute('value'),
      label:                this.getAttribute('label'),
      'help-text':          this.getAttribute('help-text'),
      'tooltip-placement':  this.getAttribute('tooltip-placement'),
      ...(this.hasAttribute('disabled')   ? { disabled: true }    : {}),
      ...(this.hasAttribute('no-tooltip') ? { 'no-tooltip': true } : {}),
      ...(this.hasAttribute('no-glow')    ? { 'no-glow': true }    : {}),
    });

    this._inputEl = this.shadowRoot.querySelector('input');
    this._tooltip = this.shadowRoot.getElementById('tooltip');

    this._inputEl.addEventListener('input', this._handleInput);

    if (this._tooltip) {
      this._inputEl.addEventListener('mouseenter', () => this._tooltip.show());
      this._inputEl.addEventListener('mouseleave', () => this._tooltip.hide());
      this._inputEl.addEventListener('mousedown',  () => this._tooltip.show());
      this._inputEl.addEventListener('mouseup',    () => this._tooltip.hide());
      this._inputEl.addEventListener('touchstart', () => this._tooltip.show(), { passive: true });
      this._inputEl.addEventListener('touchend',   () => this._tooltip.hide());
    }

    this._updateProgress();
  }
}

customElements.define('noc-range', NocRange);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
