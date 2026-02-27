// nocturnal-components/components/tooltip/tooltip.js

/**
 * @customElement noc-tooltip
 *
 * @slot         - The trigger element (when not using the `for` attribute).
 * @slot content - Rich HTML content for the tooltip body.
 *
 * Attributes:
 * @attr {string}  content   - Plain-text tooltip content (alternative to slot).
 * @attr {string}  for       - ID of an external element to attach the tooltip to.
 * @attr {'top'|'bottom'|'left'|'right'} placement - Where to show the tooltip. Default: 'top'.
 * @attr {'hover'|'click'}  trigger   - How the tooltip is triggered. Default: 'hover'.
 * @attr {number}  delay     - Delay in ms before showing. Default: 0.
 * @attr {number}  offset    - Distance in px from the target. Default: 10.
 * @attr {boolean} open      - Present when the tooltip is visible.
 *
 * CSS Custom Properties:
 * @cssprop --noc-tooltip-bg      - Background colour. Default: rgba(20,20,20,0.95).
 * @cssprop --noc-tooltip-color   - Text colour. Default: #eee.
 * @cssprop --noc-tooltip-radius  - Border radius. Default: 7px.
 * @cssprop --noc-tooltip-size    - Font size. Default: 0.75rem.
 * @cssprop --noc-tooltip-padding - Inner padding. Default: 0.4rem 0.8rem.
 */

function buildTemplate(attrs = {}) {
  const content   = attrs.content || '';
  const isForMode = 'for' in attrs;
  const isOpen    = 'open' in attrs;

  return `
    <style>
      :host {
        display: ${isForMode ? 'none' : 'inline-block'};
        vertical-align: middle;
        font-family: inherit;
      }

      :host([for][open]) {
        display: block;
      }

      *, *::before, *::after { box-sizing: border-box; }

      .tooltip {
        position: fixed;
        z-index: 99999;
        background: var(--noc-tooltip-bg, rgba(20, 20, 20, 0.95));
        color: var(--noc-tooltip-color, #eee);
        padding: var(--noc-tooltip-padding, 0.4rem 0.8rem);
        border-radius: var(--noc-tooltip-radius, 7px);
        font-size: var(--noc-tooltip-size, 0.75rem);
        font-weight: 500;
        line-height: 1.4;
        white-space: nowrap;
        width: max-content;
        max-width: 280px;
        pointer-events: none;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s;
        transform: scale(0.95);
        top: 0;
        left: 0;
      }

      .tooltip.visible {
        opacity: 1;
        visibility: visible;
        transform: scale(1);
      }

      .arrow {
        position: fixed;
        z-index: 99998;
        width: 8px;
        height: 8px;
        background: var(--noc-tooltip-bg, rgba(20, 20, 20, 0.95));
        border: 1px solid rgba(255, 255, 255, 0.08);
        transform: rotate(45deg);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease;
        top: 0;
        left: 0;
      }

      .arrow.visible { opacity: 1; }

      :host([placement="top"]) .arrow,
      :host(:not([placement])) .arrow {
        border-top: none;
        border-left: none;
      }

      :host([placement="bottom"]) .arrow {
        border-bottom: none;
        border-right: none;
      }

      :host([placement="left"]) .arrow {
        border-left: none;
        border-bottom: none;
      }

      :host([placement="right"]) .arrow {
        border-right: none;
        border-top: none;
      }
    </style>

    <slot></slot>
    <div class="tooltip ${isOpen ? 'visible' : ''}" part="tooltip">${content || '<slot name="content"></slot>'}</div>
    <div class="arrow  ${isOpen ? 'visible' : ''}" part="arrow"></div>
  `;
}

class NocTooltip extends HTMLElement {

  static get observedAttributes() {
    return ['open', 'placement', 'trigger', 'for', 'content', 'delay', 'offset'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._timer         = null;
    this._onScrollBound = this._onScroll.bind(this);
    this.show           = this.show.bind(this);
    this.hide           = this.hide.bind(this);
    this.toggle         = this.toggle.bind(this);
  }

  connectedCallback() {
    this._render();
    this._bindTrigger();
    if (this.hasAttribute('open')) {
      this._positionFixed();
    }
  }

  disconnectedCallback() {
    this._removeTrigger();
    clearTimeout(this._timer);
    window.removeEventListener('scroll', this._onScrollBound, true);
    window.removeEventListener('resize', this._onScrollBound);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) {
      return;
    }
    if (name === 'open') {
      this._updateVisibility();
      return;
    }
    if (name === 'for' || name === 'trigger') {
      this._removeTrigger();
      this._bindTrigger();
      return;
    }
    if (name === 'content') {
      const tip = this.shadowRoot.querySelector('.tooltip');
      if (tip) {
        tip.textContent = newVal || '';
      }
      return;
    }
    this._render();
  }

  show() {
    const delay = parseInt(this.getAttribute('delay') || '0', 10);
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      this.setAttribute('open', '');
    }, delay);
  }

  hide() {
    clearTimeout(this._timer);
    this.removeAttribute('open');
  }

  toggle(e) {
    if (e) {
      e.stopPropagation();
    }
    if (this.hasAttribute('open')) {
      this.hide();
    } else {
      this.show();
    }
  }

  _getTarget() {
    const id = this.getAttribute('for');
    if (id) {
      return document.getElementById(id);
    }
    return this.querySelector('*');
  }

  _removeTrigger() {
    const target = this._triggerTarget;
    if (target) {
      target.removeEventListener('mouseenter', this.show);
      target.removeEventListener('mouseleave', this.hide);
      target.removeEventListener('focus',      this.show);
      target.removeEventListener('blur',       this.hide);
      target.removeEventListener('click',      this.toggle);
    }
    this._triggerTarget = null;
  }

  _bindTrigger() {
    const target  = this._getTarget();
    const trigger = this.getAttribute('trigger') || 'hover';

    if (!target) {
      return;
    }

    this._triggerTarget = target;

    if (trigger === 'hover') {
      target.addEventListener('mouseenter', this.show);
      target.addEventListener('mouseleave', this.hide);
      target.addEventListener('focus',      this.show);
      target.addEventListener('blur',       this.hide);
    } else if (trigger === 'click') {
      target.addEventListener('click', this.toggle);
    }
  }

  _onScroll() {
    if (this.hasAttribute('open')) {
      this._positionFixed();
    }
  }

  _updateVisibility() {
    const tip = this.shadowRoot.querySelector('.tooltip');
    if (!tip) {
      return;
    }
    if (this.hasAttribute('open')) {
      this._positionFixed();
      tip.classList.add('visible');
      window.addEventListener('scroll', this._onScrollBound, true);
      window.addEventListener('resize', this._onScrollBound);
    } else {
      tip.classList.remove('visible');
      window.removeEventListener('scroll', this._onScrollBound, true);
      window.removeEventListener('resize', this._onScrollBound);
    }
  }

  _positionFixed() {
    const tip   = this.shadowRoot.querySelector('.tooltip');
    const arrow = this.shadowRoot.querySelector('.arrow');
    if (!tip) {
      return;
    }

    const target = this._getTarget();
    if (!target) {
      return;
    }

    const rect      = target.getBoundingClientRect();
    const placement = this.getAttribute('placement') || 'top';
    const offset    = parseInt(this.getAttribute('offset') || '10', 10);

    tip.style.top  = '';
    tip.style.left = '';

    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;

    let tipTop, tipLeft, arrowTop, arrowLeft;

    if (placement === 'bottom') {
      tipTop    = rect.bottom + offset;
      tipLeft   = rect.left + rect.width / 2 - tw / 2;
      arrowTop  = rect.bottom + offset - 5;
      arrowLeft = rect.left + rect.width / 2 - 4;
    } else if (placement === 'left') {
      tipTop    = rect.top + rect.height / 2 - th / 2;
      tipLeft   = rect.left - tw - offset;
      arrowTop  = rect.top + rect.height / 2 - 4;
      arrowLeft = rect.left - offset - 3;
    } else if (placement === 'right') {
      tipTop    = rect.top + rect.height / 2 - th / 2;
      tipLeft   = rect.right + offset;
      arrowTop  = rect.top + rect.height / 2 - 4;
      arrowLeft = rect.right + offset - 5;
    } else {
      tipTop    = rect.top - th - offset;
      tipLeft   = rect.left + rect.width / 2 - tw / 2;
      arrowTop  = rect.top - offset - 3;
      arrowLeft = rect.left + rect.width / 2 - 4;
    }

    tipLeft = Math.max(8, Math.min(tipLeft, window.innerWidth  - tw - 8));
    tipTop  = Math.max(8, Math.min(tipTop,  window.innerHeight - th - 8));

    tip.style.top  = tipTop  + 'px';
    tip.style.left = tipLeft + 'px';

    if (arrow) {
      arrow.style.top  = arrowTop  + 'px';
      arrow.style.left = arrowLeft + 'px';
    }
  }

  _render() {
    this.shadowRoot.innerHTML = buildTemplate({
      content: this.getAttribute('content'),
      ...(this.hasAttribute('for')  ? { for: true }  : {}),
      ...(this.hasAttribute('open') ? { open: true }  : {}),
    });

    if (this.hasAttribute('open')) {
      this._positionFixed();
    }
  }
}

customElements.define('noc-tooltip', NocTooltip);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
