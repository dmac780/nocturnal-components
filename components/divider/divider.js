// nocturnal-components/components/divider/divider.js

/**
 * @customElement noc-divider
 *
 * @slot - Optional label text displayed at the midpoint of the divider.
 *
 * Attributes:
 * @attr {boolean} vertical
 *   Renders a vertical divider. Host must have an explicit height set.
 *
 * @attr {'subtle'|'default'|'strong'|'gradient'} variant
 *   Visual weight of the line.
 *   - subtle   : near-invisible, great for tight spacing (default)
 *   - default  : standard 1 px separator (alias: omit the attr)
 *   - strong   : 2 px, more visible
 *   - gradient : fades out toward both ends — elegant section break
 *
 * @attr {'solid'|'dashed'|'dotted'} style-line
 *   Line style. Defaults to 'solid'.
 *
 * @attr {'start'|'center'|'end'} label-position
 *   Where the label sits along the line. Defaults to 'center'.
 *
 * @attr {string} spacing
 *   Vertical margin above and below a horizontal divider (CSS length).
 *   e.g. spacing="1rem". Defaults to 0.
 *
 * CSS Custom Properties:
 * @cssprop --noc-divider-color       - Line colour (default: #2a2a2a)
 * @cssprop --noc-divider-thickness   - Line thickness (default: 1px)
 * @cssprop --noc-divider-radius      - Border radius of the line (default: 999px)
 * @cssprop --noc-divider-gap         - Gap between label and line ends (default: 0.75rem)
 * @cssprop --noc-divider-spacing     - Block margin (overrides `spacing` attr)
 * @cssprop --noc-divider-label-color - Label text colour (default: #555)
 * @cssprop --noc-divider-label-size  - Label font size (default: 0.7rem)
 * @cssprop --noc-divider-gradient    - Custom gradient for the 'gradient' variant
 */

function buildTemplate(attrs = {}) {
  const vertical      = 'vertical' in attrs;
  const variant       = attrs.variant         || 'default';
  const styleLine     = attrs['style-line']   || 'solid';
  const labelPosition = attrs['label-position'] || 'center';
  const spacing       = attrs.spacing         || '0';
  const hasLabel      = !!(attrs._label);

  const justifyMap = { start: 'flex-start', center: 'center', end: 'flex-end' };
  const justify    = justifyMap[labelPosition] || 'center';
  const isGradient = variant === 'gradient';

  return `
    <style>
      :host {
        --noc-divider-color:       #2a2a2a;
        --noc-divider-thickness:   1px;
        --noc-divider-radius:      999px;
        --noc-divider-gap:         0.75rem;
        --noc-divider-spacing:     ${spacing};
        --noc-divider-label-color: #555;
        --noc-divider-label-size:  0.7rem;
        --noc-divider-gradient:
          linear-gradient(
            ${vertical ? 'to bottom' : 'to right'},
            transparent 0%,
            var(--noc-divider-color) 30%,
            var(--noc-divider-color) 70%,
            transparent 100%
          );

        display: ${vertical ? 'inline-flex' : 'flex'};
        align-items: center;
        justify-content: ${justify};
        ${vertical ? 'flex-direction: column; height: 100%;' : 'width: 100%;'}
        margin-block: var(--noc-divider-spacing);
      }

      :host([variant="subtle"]) {
        --noc-divider-color: #1c1c1c;
      }

      :host([variant="strong"]) {
        --noc-divider-color: #444;
        --noc-divider-thickness: 2px;
      }

      :host([variant="gradient"]) {
        --noc-divider-color: #3a3a3a;
      }

      .line {
        flex: 1;
        border-radius: var(--noc-divider-radius);
        min-${vertical ? 'height' : 'width'}: 0;
      }

      .line.horizontal {
        height: var(--noc-divider-thickness);
        background-color: ${isGradient ? 'transparent' : 'var(--noc-divider-color)'};
        background-image: ${isGradient ? 'var(--noc-divider-gradient)' : 'none'};
        border-top: ${styleLine !== 'solid' ? `var(--noc-divider-thickness) ${styleLine} var(--noc-divider-color)` : 'none'};
      }

      .line.horizontal.solid-line {
        background-color: ${isGradient ? 'transparent' : 'var(--noc-divider-color)'};
        background-image: ${isGradient ? 'var(--noc-divider-gradient)' : 'none'};
        border: none;
        height: var(--noc-divider-thickness);
      }

      .line.horizontal.styled-line {
        background: transparent;
        height: 0;
        border-top: var(--noc-divider-thickness) ${styleLine} var(--noc-divider-color);
      }

      .line.vertical {
        width: var(--noc-divider-thickness);
        height: 100%;
        min-height: 1rem;
        background-color: ${isGradient ? 'transparent' : 'var(--noc-divider-color)'};
        background-image: ${isGradient ? 'var(--noc-divider-gradient)' : 'none'};
      }

      .line.vertical.styled-line {
        background: transparent;
        width: 0;
        border-left: var(--noc-divider-thickness) ${styleLine} var(--noc-divider-color);
      }

      /* hide the second line when label is positioned at start or end */
      ${labelPosition === 'start' ? '.line:last-child { flex: 0; min-width: 0; min-height: 0; }' : ''}
      ${labelPosition === 'end'   ? '.line:first-child { flex: 0; min-width: 0; min-height: 0; }' : ''}

      .label {
        flex-shrink: 0;
        padding: ${vertical ? 'var(--noc-divider-gap) 0' : '0 var(--noc-divider-gap)'};
        font-size: var(--noc-divider-label-size);
        font-weight: 500;
        color: var(--noc-divider-label-color);
        white-space: nowrap;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
    </style>

    <div class="line ${vertical ? 'vertical' : 'horizontal'} ${styleLine !== 'solid' ? 'styled-line' : 'solid-line'}"></div>
    ${hasLabel ? `<span class="label"><slot></slot></span>` : ''}
    ${hasLabel ? `<div class="line ${vertical ? 'vertical' : 'horizontal'} ${styleLine !== 'solid' ? 'styled-line' : 'solid-line'}"></div>` : ''}
  `;
}

class NocDivider extends HTMLElement {

  static get observedAttributes() {
    return ['vertical', 'variant', 'style-line', 'label-position', 'spacing'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this._render();
    this._bindSlot();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal && this.isConnected) {
      this._render();
      this._bindSlot();
    }
  }

  _bindSlot() {
    const slot = this.shadowRoot.querySelector('slot');

    if (!slot) {
      return;
    }

    slot.addEventListener('slotchange', () => this._render());
  }

  _hasLabel() {
    return this.textContent.trim().length > 0;
  }

  _render() {
    this.shadowRoot.innerHTML = buildTemplate({
      ...(this.hasAttribute('vertical')  ? { vertical: true } : {}),
      variant:          this.getAttribute('variant'),
      'style-line':     this.getAttribute('style-line'),
      'label-position': this.getAttribute('label-position'),
      spacing:          this.getAttribute('spacing'),
      _label:           this._hasLabel() ? true : undefined,
    });
  }
}

customElements.define('noc-divider', NocDivider);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
