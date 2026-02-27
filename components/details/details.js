// nocturnal-components/components/details/details.js

/**
 * @customElement noc-details
 *
 * @slot summary - The heading text or content shown in the trigger row.
 * @slot icon    - Optional icon rendered before the summary text.
 * @slot         - The body content shown when expanded.
 *
 * Attributes:
 * @attr {boolean} open     - Whether the content is currently expanded.
 * @attr {boolean} disabled - Prevents toggling.
 * @attr {string}  group    - Accordion key. Opening one member closes all others in the group.
 * @attr {'ghost'|'card'|'glass'} variant
 *   Visual style of the component.
 *   - card  : solid background + border, matching noc-card defaults (default)
 *   - ghost : no background, only a bottom border separator
 *   - glass : frosted-glass effect, good on colourful or image backgrounds
 *
 * CSS Custom Properties:
 * @cssprop --noc-details-bg             - Background colour (default: #1a1a1a)
 * @cssprop --noc-details-bg-open        - Background when expanded (default: #1a1a1a)
 * @cssprop --noc-details-border         - Border colour (default: #2a2a2a)
 * @cssprop --noc-details-border-open    - Border colour when expanded (default: var(--noc-accent))
 * @cssprop --noc-details-radius         - Border radius (default: 1rem)
 * @cssprop --noc-details-padding        - Header/summary padding (default: 1rem 1.25rem)
 * @cssprop --noc-details-body-padding   - Body content padding (default: 0 1.25rem 1.25rem)
 * @cssprop --noc-details-summary-color  - Summary text colour (default: #eee)
 * @cssprop --noc-details-summary-size   - Summary font size (default: 0.9375rem)
 * @cssprop --noc-details-content-color  - Body text colour (default: #888)
 * @cssprop --noc-details-content-size   - Body font size (default: 0.875rem)
 * @cssprop --noc-details-chevron-color  - Chevron icon colour (default: #555)
 * @cssprop --noc-details-icon-color     - Prefix icon colour (default: var(--noc-accent))
 * @cssprop --noc-details-divider-color  - Divider line colour (default: #2a2a2a)
 * @cssprop --noc-details-hover-bg       - Summary row hover background (default: rgba(255,255,255,.03))
 * @cssprop --noc-details-shadow-open    - Box shadow when expanded (default: 0 8px 32px rgba(0,0,0,.35))
 * @cssprop --noc-accent                 - Accent colour for chevron/focus/border (default: #2563eb)
 *
 * Events:
 * @event noc-show - Emitted when the panel opens.
 * @event noc-hide - Emitted when the panel closes.
 */

function buildTemplate(attrs = {}) {
  const variant = attrs.variant || 'card';
  const isGlass = variant === 'glass';
  const isGhost = variant === 'ghost';
  const isOpen  = 'open' in attrs;

  return `
    <style>
      :host {
        display: block;
        font-family: inherit;

        --noc-details-bg:            #1a1a1a;
        --noc-details-bg-open:       #1a1a1a;
        --noc-details-border:        #2a2a2a;
        --noc-details-border-open:   var(--noc-accent, #2563eb);
        --noc-details-radius:        1rem;
        --noc-details-padding:       1rem 1.25rem;
        --noc-details-body-padding:  0 1.25rem 1.25rem;
        --noc-details-summary-color: #eee;
        --noc-details-summary-size:  0.9375rem;
        --noc-details-content-color: #888;
        --noc-details-content-size:  0.875rem;
        --noc-details-chevron-color: #555;
        --noc-details-icon-color:    var(--noc-accent, #2563eb);
        --noc-details-divider-color: #2a2a2a;
        --noc-details-hover-bg:      rgba(255, 255, 255, 0.03);
        --noc-details-shadow-open:   0 8px 32px rgba(0, 0, 0, 0.35);
      }

      *, *::before, *::after { box-sizing: border-box; }

      .shell {
        border-radius: var(--noc-details-radius);
        overflow: hidden;
        transition:
          border-color  0.2s ease,
          box-shadow    0.2s ease,
          background    0.2s ease;
      }

      ${!isGhost ? `
      .shell {
        background: var(--noc-details-bg);
        border: 1px solid var(--noc-details-border);
      }
      ` : ''}

      ${isGhost ? `
      .shell {
        background: transparent;
        border: none;
        border-bottom: 1px solid var(--noc-details-border);
        border-radius: 0;
      }
      ` : ''}

      ${isGlass ? `
      .shell {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
      }
      ` : ''}

      .shell.open {
        background: var(--noc-details-bg-open);
        border-color: var(--noc-details-border-open);
        box-shadow: var(--noc-details-shadow-open);
      }

      ${isGhost ? `
      .shell.open {
        background: transparent;
        border-color: var(--noc-details-border-open);
        box-shadow: none;
      }
      ` : ''}

      ${isGlass ? `
      .shell.open {
        background: rgba(255, 255, 255, 0.08);
        border-color: var(--noc-details-border-open);
      }
      ` : ''}

      .summary {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        padding: var(--noc-details-padding);
        user-select: none;
        transition: background 0.15s ease;
        position: relative;
      }

      .summary:hover {
        background: var(--noc-details-hover-bg);
      }

      .summary:focus-visible {
        outline: 2px solid var(--noc-details-border-open);
        outline-offset: -2px;
        border-radius: calc(var(--noc-details-radius) - 2px);
      }

      :host([disabled]) .summary {
        opacity: 0.4;
        cursor: not-allowed;
        pointer-events: none;
      }

      .icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--noc-details-icon-color);
        flex-shrink: 0;
      }

      .label {
        flex: 1;
        font-size: var(--noc-details-summary-size);
        font-weight: 600;
        color: var(--noc-details-summary-color);
        line-height: 1.4;
      }

      .chevron {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        color: var(--noc-details-chevron-color);
        transition:
          transform 0.22s cubic-bezier(0.4, 0, 0.2, 1),
          color     0.15s ease;
      }

      .chevron.open {
        transform: rotate(180deg);
        color: var(--noc-details-border-open);
      }

      .divider {
        height: 1px;
        background: var(--noc-details-divider-color);
        margin: 0;
        opacity: 0;
        transition: opacity 0.15s ease;
      }

      .divider.open {
        opacity: 1;
      }

      .content {
        display: grid;
        grid-template-rows: 0fr;
        transition: grid-template-rows 0.22s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .content.open {
        grid-template-rows: 1fr;
      }

      .content-inner {
        overflow: hidden;
      }

      .body {
        padding: var(--noc-details-body-padding);
        color: var(--noc-details-content-color);
        font-size: var(--noc-details-content-size);
        line-height: 1.65;
      }
    </style>

    <div class="shell${isOpen ? ' open' : ''}" part="base">
      <div
        class="summary"
        id="trigger"
        part="summary"
        tabindex="0"
        role="button"
        aria-expanded="${isOpen ? 'true' : 'false'}"
      >
        <span class="icon-wrap" part="icon">
          <slot name="icon"></slot>
        </span>
        <span class="label" part="label">
          <slot name="summary"></slot>
        </span>
        <svg class="chevron${isOpen ? ' open' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      <div class="divider${isOpen ? ' open' : ''}"></div>

      <div class="content${isOpen ? ' open' : ''}" part="content">
        <div class="content-inner">
          <div class="body" part="body">
            <slot></slot>
          </div>
        </div>
      </div>
    </div>
  `;
}

class NocDetails extends HTMLElement {

  static get observedAttributes() {
    return ['open', 'disabled', 'group', 'variant'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._toggle = this._toggle.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this.isConnected) {
      return;
    }

    if (name === 'open') {
      this._updateOpenState();
      return;
    }

    this._render();
  }

  show() {
    if (this.hasAttribute('open') || this.hasAttribute('disabled')) {
      return;
    }

    this._closeGroup();
    this.setAttribute('open', '');
    this.dispatchEvent(new CustomEvent('noc-show', { bubbles: true, composed: true }));
  }

  hide() {
    if (!this.hasAttribute('open')) {
      return;
    }

    this.removeAttribute('open');
    this.dispatchEvent(new CustomEvent('noc-hide', { bubbles: true, composed: true }));
  }

  _closeGroup() {
    const group = this.getAttribute('group');

    if (!group) {
      return;
    }

    document
      .querySelectorAll(`noc-details[group="${group}"]`)
      .forEach(el => {
        if (el !== this) {
          el.removeAttribute('open');
        }
      });
  }

  _toggle() {
    if (this.hasAttribute('disabled')) {
      return;
    }

    if (this.hasAttribute('open')) {
      this.hide();
    } else {
      this.show();
    }
  }

  _onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._toggle();
    }
  }

  _updateOpenState() {
    const content = this.shadowRoot.querySelector('.content');
    const chevron = this.shadowRoot.querySelector('.chevron');
    const divider = this.shadowRoot.querySelector('.divider');
    const isOpen  = this.hasAttribute('open');

    if (content) { content.classList.toggle('open', isOpen); }
    if (chevron) { chevron.classList.toggle('open', isOpen); }
    if (divider) { divider.classList.toggle('open', isOpen); }
  }

  _render() {
    this.shadowRoot.innerHTML = buildTemplate({
      variant: this.getAttribute('variant'),
      ...(this.hasAttribute('open')     ? { open: true }     : {}),
      ...(this.hasAttribute('disabled') ? { disabled: true } : {}),
    });

    const trigger = this.shadowRoot.getElementById('trigger');
    trigger.addEventListener('click',   this._toggle);
    trigger.addEventListener('keydown', this._onKeyDown);
  }
}

customElements.define('noc-details', NocDetails);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
