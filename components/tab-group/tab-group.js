// nocturnal-components/components/tab-group/tab-group.js

/**
 * @customElement noc-tab-group
 *
 * Container that coordinates a set of noc-tab and noc-tab-panel elements.
 * Handles keyboard navigation, scroll overflow, and panel switching.
 *
 * @slot nav - Place noc-tab elements here.
 * @slot     - Place noc-tab-panel elements here.
 *
 * Attributes:
 * @attr {'top'|'bottom'|'start'|'end'} placement
 *   Position of the tab nav relative to the panels. Default: 'top'.
 * @attr {boolean} no-scroll
 *   Disables overflow scrolling on the nav strip; tabs wrap instead.
 *
 * CSS Custom Properties:
 * @cssprop --noc-tab-group-bg          - Background of the whole component (default: transparent)
 * @cssprop --noc-tab-group-border      - Colour of the nav/panel divider line (default: #222)
 * @cssprop --noc-tab-group-nav-bg      - Background of the nav strip (default: transparent)
 * @cssprop --noc-tab-group-nav-padding - Inline padding of the nav strip (default: 0 0.25rem)
 * @cssprop --noc-tab-scroll-button-size - Width of the overflow scroll buttons (default: 2rem)
 * @cssprop --noc-accent                - Accent colour forwarded to tabs (default: #2563eb)
 *
 * Events:
 * @event noc-tab-show - Fired when a tab is activated. detail: { tab, name }
 */

function buildTemplate(attrs = {}) {
  const placement  = attrs.placement || 'top';
  const isVertical = placement === 'start' || placement === 'end';

  const borderSide = {
    top:    'border-bottom',
    bottom: 'border-top',
    start:  'border-right',
    end:    'border-left',
  }[placement] || 'border-bottom';

  return `
    <style>
      :host {
        display: flex;
        flex-direction: ${isVertical ? 'row' : 'column'};
        width: 100%;
        font-family: inherit;

        --noc-tab-group-bg:           transparent;
        --noc-tab-group-border:       #222;
        --noc-tab-group-nav-bg:       transparent;
        --noc-tab-group-nav-padding:  0 0.25rem;
        --noc-tab-scroll-button-size: 2rem;
      }

      *, *::before, *::after { box-sizing: border-box; }

      .tabs-header {
        position: relative;
        display: flex;
        align-items: stretch;
        order: ${placement === 'bottom' || placement === 'end' ? 2 : 1};
        ${borderSide}: 1px solid var(--noc-tab-group-border);
        background: var(--noc-tab-group-nav-bg);
      }

      .nav-container {
        display: flex;
        flex: 1;
        flex-direction: ${isVertical ? 'column' : 'row'};
        padding: ${isVertical ? '0.25rem 0' : 'var(--noc-tab-group-nav-padding)'};
        overflow-x: ${isVertical ? 'hidden' : 'auto'};
        overflow-y: ${isVertical ? 'auto' : 'hidden'};
        scrollbar-width: none;
        scroll-behavior: smooth;
      }

      .nav-container::-webkit-scrollbar { display: none; }

      .scroll-button {
        display: none;
        align-items: center;
        justify-content: center;
        width: var(--noc-tab-scroll-button-size);
        background: transparent;
        border: none;
        color: #444;
        cursor: pointer;
        transition: color 0.15s ease, background 0.15s ease;
        flex-shrink: 0;
        font-size: 1rem;
        line-height: 1;
      }

      .scroll-button:hover:not([disabled]) {
        color: var(--noc-accent, #2563eb);
        background: rgba(255, 255, 255, 0.04);
      }

      .scroll-button[disabled] {
        opacity: 0.2;
        cursor: not-allowed;
      }

      :host(:not([no-scroll])) .scroll-button.visible { display: flex; }

      .panels-container {
        order: ${placement === 'bottom' || placement === 'end' ? 1 : 2};
        flex: 1;
        background: var(--noc-tab-group-bg);
      }

      ::slotted(noc-tab) {
        ${placement === 'bottom' ? 'border-bottom: none; border-top: 2px solid transparent; margin-top: -1px;' : ''}
        ${placement === 'start'  ? 'border-bottom: none; border-right: 2px solid transparent; margin-right: -1px;' : ''}
        ${placement === 'end'    ? 'border-bottom: none; border-left: 2px solid transparent; margin-left: -1px;' : ''}
      }

      ::slotted(noc-tab[active]) {
        ${placement === 'bottom' ? 'border-top-color:   var(--noc-accent, #2563eb);' : ''}
        ${placement === 'start'  ? 'border-right-color: var(--noc-accent, #2563eb);' : ''}
        ${placement === 'end'    ? 'border-left-color:  var(--noc-accent, #2563eb);' : ''}
      }

      :host([no-scroll]) .nav-container {
        overflow: hidden;
        flex-wrap: wrap;
      }
    </style>

    <div class="tabs-header" part="nav-header">
      <button class="scroll-button" id="prev" aria-label="Previous tab">
        ${isVertical ? '↑' : '←'}
      </button>

      <div class="nav-container" id="nav" role="tablist">
        <slot name="nav"></slot>
      </div>

      <button class="scroll-button" id="next" aria-label="Next tab">
        ${isVertical ? '↓' : '→'}
      </button>
    </div>

    <div class="panels-container" part="panels">
      <slot></slot>
    </div>
  `;
}

class NocTabGroup extends HTMLElement {

  static get observedAttributes() {
    return ['placement', 'no-scroll'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isRendered = false;
  }

  connectedCallback() {
    if (!this._isRendered) {
      this._setup();
      this._isRendered = true;
    }

    this._syncTabs();
    this._initResizeObserver();
  }

  disconnectedCallback() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
  }

  attributeChangedCallback(name) {
    if (!this._isRendered) {
      return;
    }

    if (name === 'placement') {
      this._setup();
      this._updateScrollButtons();
    }
  }

  _setup() {
    this.shadowRoot.innerHTML = buildTemplate({
      placement: this.getAttribute('placement'),
    });

    this._nav     = this.shadowRoot.getElementById('nav');
    this._btnPrev = this.shadowRoot.getElementById('prev');
    this._btnNext = this.shadowRoot.getElementById('next');

    this._nav.addEventListener('click',   e => this._handleTabClick(e));
    this._nav.addEventListener('keydown', e => this._handleKeyDown(e));
    this._nav.addEventListener('scroll',  () => this._updateScrollButtons());

    this._btnPrev.addEventListener('click', () => this._scroll('prev'));
    this._btnNext.addEventListener('click', () => this._scroll('next'));

    this.addEventListener('noc-close', e => this._handleTabClose(e));
  }

  _initResizeObserver() {
    this._resizeObserver = new ResizeObserver(() => this._updateScrollButtons());
    this._resizeObserver.observe(this._nav);
  }

  _updateScrollButtons() {
    if (!this._nav || !this._btnPrev || !this._btnNext) {
      return;
    }

    const placement  = this.getAttribute('placement') || 'top';
    const isVertical = placement === 'start' || placement === 'end';

    let hasOverflow, isAtStart, isAtEnd;

    if (isVertical) {
      hasOverflow = this._nav.scrollHeight > this._nav.clientHeight;
      isAtStart   = this._nav.scrollTop <= 0;
      isAtEnd     = this._nav.scrollTop + this._nav.clientHeight >= this._nav.scrollHeight - 1;
    } else {
      hasOverflow = this._nav.scrollWidth > this._nav.clientWidth;
      isAtStart   = this._nav.scrollLeft <= 0;
      isAtEnd     = this._nav.scrollLeft + this._nav.clientWidth >= this._nav.scrollWidth - 1;
    }

    this._btnPrev.classList.toggle('visible', hasOverflow);
    this._btnNext.classList.toggle('visible', hasOverflow);
    this._btnPrev.disabled = isAtStart;
    this._btnNext.disabled = isAtEnd;
  }

  _scroll(direction) {
    const placement  = this.getAttribute('placement') || 'top';
    const isVertical = placement === 'start' || placement === 'end';
    const amount     = isVertical ? this._nav.clientHeight * 0.8 : this._nav.clientWidth * 0.8;

    if (isVertical) {
      this._nav.scrollTop += direction === 'next' ? amount : -amount;
    } else {
      this._nav.scrollLeft += direction === 'next' ? amount : -amount;
    }
  }

  _syncTabs() {
    const tabs      = this._getTabs();
    const activeTab = tabs.find(t => t.active) || tabs.find(t => !t.disabled);

    if (activeTab) {
      this._setActiveTab(activeTab, false);
    }
  }

  _getTabs() {
    const slot = this.shadowRoot.querySelector('slot[name="nav"]');
    if (!slot) {
      return [];
    }

    return slot.assignedElements().filter(el => el.tagName === 'NOC-TAB');
  }

  _getPanels() {
    const slot = this.shadowRoot.querySelector('slot:not([name])');
    if (!slot) {
      return [];
    }

    return slot.assignedElements().filter(el => el.tagName === 'NOC-TAB-PANEL');
  }

  _handleTabClick(e) {
    const tab = e.target.closest('noc-tab');

    if (tab && !tab.disabled) {
      this._setActiveTab(tab, true);
    }
  }

  _setActiveTab(tab, shouldFocus = true) {
    const tabs   = this._getTabs();
    const panels = this._getPanels();

    tabs.forEach(t => {
      t.active = t === tab;
      t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      t.setAttribute('tabindex',      t === tab ? '0' : '-1');
    });

    panels.forEach(p => {
      p.toggleAttribute('active', p.getAttribute('name') === tab.getAttribute('panel'));
    });

    if (shouldFocus) {
      tab.focus({ preventScroll: true });
    }

    this.dispatchEvent(new CustomEvent('noc-tab-show', {
      bubbles:  true,
      composed: true,
      detail:   { tab, name: tab.getAttribute('panel') },
    }));
  }

  _handleKeyDown(e) {
    const tabs        = this._getTabs().filter(t => !t.disabled);
    const activeIndex = tabs.indexOf(document.activeElement);

    if (activeIndex === -1) {
      return;
    }

    const placement  = this.getAttribute('placement') || 'top';
    const isVertical = placement === 'start' || placement === 'end';
    let nextIndex;

    if (isVertical) {
      if (e.key === 'ArrowDown') { nextIndex = (activeIndex + 1) % tabs.length; }
      if (e.key === 'ArrowUp')   { nextIndex = (activeIndex - 1 + tabs.length) % tabs.length; }
    } else {
      if (e.key === 'ArrowRight') { nextIndex = (activeIndex + 1) % tabs.length; }
      if (e.key === 'ArrowLeft')  { nextIndex = (activeIndex - 1 + tabs.length) % tabs.length; }
    }

    if (nextIndex !== undefined) {
      e.preventDefault();
      this._setActiveTab(tabs[nextIndex], true);
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._setActiveTab(tabs[activeIndex], true);
    }
  }

  _handleTabClose(e) {
    const tabToRemove = e.detail.tab;
    const tabs        = this._getTabs();

    if (tabToRemove.active) {
      const remaining = tabs.filter(t => t !== tabToRemove && !t.disabled);
      if (remaining.length > 0) {
        this._setActiveTab(remaining[0], true);
      }
    }

    tabToRemove.remove();

    const panelName     = tabToRemove.getAttribute('panel');
    const panelToRemove = this._getPanels().find(p => p.getAttribute('name') === panelName);

    if (panelToRemove) {
      panelToRemove.remove();
    }

    this._updateScrollButtons();
  }
}

customElements.define('noc-tab-group', NocTabGroup);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
