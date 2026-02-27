// nocturnal-components/components/button-group/button-group.js

/**
 * @customElement noc-button-group
 *
 * @slot - noc-button and/or noc-dropdown children.
 *
 * Attributes:
 * @attr {string}  spacing   - Gap between items, e.g. '0.5rem'. Default '0' (connected).
 * @attr {boolean} vertical  - Stack items vertically.
 * @attr {boolean} fullwidth - Stretch to fill parent width.
 * @attr {boolean} pill      - Pill-shaped outer corners.
 *
 * CSS Custom Properties:
 * @cssprop --noc-button-group-gap    - Gap between items (overrides spacing attribute).
 * @cssprop --noc-button-group-radius - Outer corner radius (overrides pill default).
 */

function buildTemplate(attrs = {}) {
  const spacing   = attrs.spacing || '0';
  const connected = spacing === '0';
  const vertical  = 'vertical'  in attrs;
  const fullwidth = 'fullwidth' in attrs;
  const pill      = 'pill'      in attrs;
  const outerR    = pill ? '9999px' : '8px';
  const flex      = fullwidth ? '1' : 'none';
  const negMargin = vertical ? 'margin-top: -1px !important;' : 'margin-left: -1px !important;';
  const firstR    = vertical ? `${outerR} ${outerR} 0 0` : `${outerR} 0 0 ${outerR}`;
  const lastR     = vertical ? `0 0 ${outerR} ${outerR}` : `0 ${outerR} ${outerR} 0`;

  return `
    <style>
      :host {
        display: ${vertical ? 'flex' : 'inline-flex'};
        flex-direction: ${vertical ? 'column' : 'row'};
        align-items: stretch;
        gap: var(--noc-button-group-gap, ${spacing});
        width: ${fullwidth ? '100%' : 'auto'};
        --noc-button-group-radius: ${outerR};
        position: relative;
      }

      ::slotted(noc-button),
      ::slotted(noc-dropdown) {
        margin: 0 !important;
        flex: ${flex};
        --noc-button-radius: 0;
        position: relative;
      }

      ::slotted(noc-button:hover)  { z-index: 2; }
      ::slotted(noc-button:active) { z-index: 3; }

      ${connected ? `
        ::slotted(noc-button:not(:first-child)),
        ::slotted(noc-dropdown:not(:first-child)) {
          ${negMargin}
        }
      ` : ''}

      ::slotted(noc-button:first-child),
      ::slotted(noc-dropdown:first-child) {
        --noc-button-radius: ${firstR};
      }

      ::slotted(noc-button:last-child),
      ::slotted(noc-dropdown:last-child) {
        --noc-button-radius: ${lastR};
      }

      ::slotted(noc-button:first-child:last-child),
      ::slotted(noc-dropdown:first-child:last-child) {
        --noc-button-radius: ${outerR};
      }

      ${!connected ? `
        ::slotted(noc-button),
        ::slotted(noc-dropdown) {
          --noc-button-radius: ${outerR} !important;
        }
      ` : ''}
    </style>

    <slot></slot>
  `;
}

class NocButtonGroup extends HTMLElement {

  static get observedAttributes() {
    return ['spacing', 'vertical', 'fullwidth', 'pill'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isRendered = false;
  }

  connectedCallback() {
    if (!this._isRendered) {
      this._render();
      this._isRendered = true;
    }
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (this._isRendered && oldVal !== newVal) {
      this._render();
    }
  }

  _render() {
    this.shadowRoot.innerHTML = buildTemplate({
      spacing:   this.getAttribute('spacing'),
      ...(this.hasAttribute('vertical')  ? { vertical:  true } : {}),
      ...(this.hasAttribute('fullwidth') ? { fullwidth: true } : {}),
      ...(this.hasAttribute('pill')      ? { pill:      true } : {}),
    });
  }
}

customElements.define('noc-button-group', NocButtonGroup);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
