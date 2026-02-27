// nocturnal-components/components/split-panel/split-panel.js

/**
 * @customElement noc-split-panel
 *
 * Divides a container into two resizable panels separated by a draggable
 * divider. Supports horizontal and vertical splits, pixel or percent
 * positions, primary-panel pinning, snap-to-grid, keyboard nudging, and
 * fully scrollable panel content.
 *
 * @slot start   - Content for the first (left or top) panel.
 * @slot end     - Content for the second (right or bottom) panel.
 * @slot divider - Optional custom content rendered inside the divider bar.
 *
 * Attributes:
 * @attr {string}         position        - Initial split position. Accepts % or px. Default: '50%'.
 * @attr {boolean}        vertical        - Stack panels top/bottom instead of left/right.
 * @attr {'start'|'end'}  primary         - Which panel keeps its explicit size; the other fills remaining space.
 * @attr {string}         snap            - Space-separated snap positions, e.g. '25% 50% 75%'.
 *                                          Supports repeat() notation: 'repeat(4, 25%)' expands to
 *                                          cumulative grid points '25% 50% 75% 100%' — like a DAW grid.
 * @attr {number}         snap-threshold  - Pixel distance at which snapping activates. Default: 30.
 * @attr {string}         min-size        - Minimum size of either panel. Default: '50px'.
 * @attr {boolean}        disabled        - Prevents resizing.
 *
 * CSS Custom Properties:
 * @cssprop --noc-sp-divider-width        - Width (or height if vertical) of the divider bar. Default: 4px.
 * @cssprop --noc-sp-divider-hit-area    - Invisible pointer target around the bar. Default: 16px.
 * @cssprop --noc-sp-divider-color       - Resting bar colour. Default: var(--noc-border, #222).
 * @cssprop --noc-sp-divider-color-hover - Bar colour on hover / drag. Default: var(--noc-accent, #2563eb).
 * @cssprop --noc-sp-handle-size         - Length of the grip handle. Default: 28px.
 * @cssprop --noc-sp-handle-color        - Grip dot colour. Default: #555.
 * @cssprop --noc-sp-handle-color-hover  - Grip dot colour on hover / drag. Default: #aaa.
 * @cssprop --noc-sp-panel-bg            - Background applied to both panels. Default: transparent.
 *
 * Events:
 * @event noc-reposition - Fired while dragging. detail: { position: string, value: number }
 */

function buildTemplate(attrs = {}) {
  const vertical = 'vertical' in attrs;

  return `
    <style>
      :host {
        display: flex;
        flex-direction: ${vertical ? 'column' : 'row'};
        width: 100%;
        height: 100%;
        overflow: hidden;
        box-sizing: border-box;

        --noc-sp-divider-width:        4px;
        --noc-sp-divider-hit-area:     16px;
        --noc-sp-divider-color:        var(--noc-border, #222);
        --noc-sp-divider-color-hover:  var(--noc-accent, #2563eb);
        --noc-sp-handle-size:          28px;
        --noc-sp-handle-color:         #555;
        --noc-sp-handle-color-hover:   #aaa;
        --noc-sp-panel-bg:             transparent;
      }

      *, *::before, *::after { box-sizing: border-box; }

      .panel {
        position: relative;
        overflow: hidden;
        background: var(--noc-sp-panel-bg);
        min-width: 0;
        min-height: 0;
      }

      .panel-inner {
        width: 100%;
        height: 100%;
        overflow: auto;
        scrollbar-width: none;
      }

      .panel-inner::-webkit-scrollbar {
        display: none;
      }

      #divider {
        flex: 0 0 var(--noc-sp-divider-width);
        background: var(--noc-sp-divider-color);
        position: relative;
        cursor: ${vertical ? 'row-resize' : 'col-resize'};
        transition: background 0.15s ease;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        outline: none;
      }

      #divider:hover,
      #divider.dragging {
        background: var(--noc-sp-divider-color-hover);
      }

      #divider:focus-visible {
        background: var(--noc-sp-divider-color-hover);
        box-shadow: 0 0 0 2px var(--noc-sp-divider-color-hover);
      }

      #divider::after {
        content: '';
        position: absolute;
        ${vertical
          ? 'left:0; top:50%; width:100%; height:var(--noc-sp-divider-hit-area); transform:translateY(-50%);'
          : 'top:0; left:50%; height:100%; width:var(--noc-sp-divider-hit-area); transform:translateX(-50%);'
        }
      }

      .handle {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        z-index: 11;
        ${vertical
          ? `width: var(--noc-sp-handle-size); height: 8px;`
          : `height: var(--noc-sp-handle-size); width: 8px;`
        }
      }

      .dots {
        display: flex;
        gap: 3px;
        flex-direction: ${vertical ? 'row' : 'column'};
      }

      .dot {
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background: var(--noc-sp-handle-color);
        transition: background 0.15s ease;
      }

      #divider:hover .dot,
      #divider.dragging .dot {
        background: var(--noc-sp-handle-color-hover);
      }

      :host([disabled]) #divider {
        cursor: not-allowed;
        opacity: 0.4;
        pointer-events: none;
      }
    </style>

    <div class="panel" id="start" part="start">
      <div class="panel-inner">
        <slot name="start"></slot>
      </div>
    </div>

    <div id="divider" part="divider" role="separator" tabindex="0"
      aria-label="Resize panels"
      aria-valuenow="50"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-orientation="${vertical ? 'horizontal' : 'vertical'}">
      <div class="handle">
        <div class="dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
      <slot name="divider"></slot>
    </div>

    <div class="panel" id="end" part="end">
      <div class="panel-inner">
        <slot name="end"></slot>
      </div>
    </div>
  `;
}

class NocSplitPanel extends HTMLElement {

  static get observedAttributes() {
    return ['position', 'vertical', 'primary', 'snap', 'snap-threshold', 'min-size', 'disabled'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isDragging        = false;
    this._position          = 50;
    this._isPositionPercent = true;
    this._isRendered        = false;

    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp   = this._onMouseUp.bind(this);
    this._onKeyDown   = this._onKeyDown.bind(this);
  }

  connectedCallback() {
    if (!this._isRendered) {
      this._render();
      this._isRendered = true;
    }
    this._updatePositionFromAttr();
    this._bindEvents();
  }

  disconnectedCallback() {
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);
    const divider = this.shadowRoot.getElementById('divider');
    if (divider) {
      divider.removeEventListener('mousedown', this._onMouseDown);
      divider.removeEventListener('keydown', this._onKeyDown);
    }
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this.isConnected) {
      return;
    }
    if (name === 'position') {
      this._updatePositionFromAttr();
      return;
    }
    if (name === 'vertical' || name === 'primary') {
      this._render();
      this._updatePositionFromAttr();
      this._bindEvents();
      return;
    }
    this._applyPosition();
  }

  _updatePositionFromAttr() {
    const attr = this.getAttribute('position') || '50%';
    this._isPositionPercent = attr.includes('%');
    this._position = parseFloat(attr);
    this._applyPosition();
  }

  _applyPosition() {
    if (!this._startPanel || !this._endPanel) {
      return;
    }

    const vertical = this.hasAttribute('vertical');
    const primary  = this.getAttribute('primary');
    const minSize  = this.getAttribute('min-size') || '50px';
    const prop     = vertical ? 'height' : 'width';
    const minProp  = vertical ? 'minHeight' : 'minWidth';
    const maxProp  = vertical ? 'maxHeight' : 'maxWidth';
    const value    = this._isPositionPercent
      ? `${this._position}%`
      : `${this._position}px`;

    // Update ARIA value for screen readers
    const divider = this.shadowRoot.getElementById('divider');
    if (divider) {
      const ariaValue = this._isPositionPercent 
        ? Math.round(this._position) 
        : Math.round((this._position / (vertical ? this.offsetHeight : this.offsetWidth)) * 100);
      divider.setAttribute('aria-valuenow', String(ariaValue));
    }

    this._startPanel.style.removeProperty('width');
    this._startPanel.style.removeProperty('height');
    this._startPanel.style.removeProperty('min-width');
    this._startPanel.style.removeProperty('min-height');
    this._startPanel.style.removeProperty('max-width');
    this._startPanel.style.removeProperty('max-height');
    this._startPanel.style.removeProperty('flex');
    this._endPanel.style.removeProperty('width');
    this._endPanel.style.removeProperty('height');
    this._endPanel.style.removeProperty('min-width');
    this._endPanel.style.removeProperty('min-height');
    this._endPanel.style.removeProperty('max-width');
    this._endPanel.style.removeProperty('max-height');
    this._endPanel.style.removeProperty('flex');

    if (primary === 'end') {
      this._startPanel.style.flex      = '1 1 0';
      this._startPanel.style[minProp]  = minSize;
      this._endPanel.style.flex        = '0 0 auto';
      this._endPanel.style[prop]       = value;
      this._endPanel.style[minProp]    = minSize;
      this._endPanel.style[maxProp]    = `calc(100% - ${minSize})`;
    } else if (primary === 'start') {
      this._startPanel.style.flex      = '0 0 auto';
      this._startPanel.style[prop]     = value;
      this._startPanel.style[minProp]  = minSize;
      this._startPanel.style[maxProp]  = `calc(100% - ${minSize})`;
      this._endPanel.style.flex        = '1 1 0';
      this._endPanel.style[minProp]    = minSize;
    } else {
      this._startPanel.style.flex      = `0 0 ${value}`;
      this._startPanel.style[minProp]  = minSize;
      this._startPanel.style[maxProp]  = `calc(100% - ${minSize})`;
      this._endPanel.style.flex        = '1 1 0';
      this._endPanel.style[minProp]    = minSize;
    }
  }

  _bindEvents() {
    const divider = this.shadowRoot.getElementById('divider');
    if (!divider) {
      return;
    }
    divider.removeEventListener('mousedown', this._onMouseDown);
    divider.removeEventListener('keydown', this._onKeyDown);
    divider.addEventListener('mousedown', this._onMouseDown);
    divider.addEventListener('keydown', this._onKeyDown);
  }

  _onMouseDown(e) {
    if (this.hasAttribute('disabled')) {
      return;
    }
    this._isDragging = true;
    this.shadowRoot.getElementById('divider').classList.add('dragging');
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mouseup', this._onMouseUp);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = this.hasAttribute('vertical') ? 'row-resize' : 'col-resize';
    e.preventDefault();
  }

  _onMouseMove(e) {
    if (!this._isDragging) {
      return;
    }

    const vertical = this.hasAttribute('vertical');
    const primary  = this.getAttribute('primary');
    const rect     = this.getBoundingClientRect();
    const total    = vertical ? rect.height : rect.width;
    let pos        = vertical ? e.clientY - rect.top : e.clientX - rect.left;

    if (primary === 'end') {
      pos = total - pos;
    }

    pos = this._applySnap(pos, total);

    const minSize = parseFloat(this.getAttribute('min-size') || '50');
    pos = Math.max(minSize, Math.min(pos, total - minSize));

    if (this._isPositionPercent) {
      this._position = (pos / total) * 100;
      this.setAttribute('position', `${this._position.toFixed(2)}%`);
    } else {
      this._position = pos;
      this.setAttribute('position', `${Math.round(pos)}px`);
    }

    this._applyPosition();

    this.dispatchEvent(new CustomEvent('noc-reposition', {
      bubbles:  true,
      composed: true,
      detail:   { position: this.getAttribute('position'), value: this._position },
    }));
  }

  _onMouseUp() {
    this._isDragging = false;
    const divider = this.shadowRoot.getElementById('divider');
    if (divider) {
      divider.classList.remove('dragging');
    }
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }

  _onKeyDown(e) {
    if (this.hasAttribute('disabled')) {
      return;
    }

    const vertical = this.hasAttribute('vertical');
    const nudge    = e.shiftKey ? 10 : 1;
    const rect     = this.getBoundingClientRect();
    const total    = vertical ? rect.height : rect.width;
    const keys     = vertical
      ? { ArrowUp: -nudge, ArrowDown: nudge }
      : { ArrowLeft: -nudge, ArrowRight: nudge };

    if (!(e.key in keys)) {
      return;
    }

    e.preventDefault();

    const delta = keys[e.key];

    if (this._isPositionPercent) {
      this._position = Math.max(0, Math.min(100, this._position + (delta / total) * 100));
      this.setAttribute('position', `${this._position.toFixed(2)}%`);
    } else {
      this._position = Math.max(0, Math.min(total, this._position + delta));
      this.setAttribute('position', `${Math.round(this._position)}px`);
    }

    this._applyPosition();
  }

  _applySnap(pos, total) {
    const snapAttr = this.getAttribute('snap');
    if (!snapAttr) {
      return pos;
    }

    const threshold = parseInt(this.getAttribute('snap-threshold') || '30', 10);

    const expanded = snapAttr.replace(/repeat\(\s*(\d+)\s*,\s*([^)]+)\)/g, (_, countStr, valueStr) => {
      const count    = parseInt(countStr, 10);
      const value    = valueStr.trim();
      const isPercent = value.includes('%');
      const unit     = parseFloat(value);
      const points   = [];
      for (let i = 1; i <= count; i++) {
        points.push(isPercent ? `${unit * i}%` : `${unit * i}px`);
      }
      return points.join(' ');
    });

    const snapPositions = expanded.split(/\s+/).filter(Boolean).map(s => {
      if (s.includes('%')) {
        return (parseFloat(s) / 100) * total;
      }
      return parseFloat(s);
    });

    for (const snapPos of snapPositions) {
      if (Math.abs(pos - snapPos) <= threshold) {
        return snapPos;
      }
    }

    return pos;
  }

  _render() {
    this.shadowRoot.innerHTML = buildTemplate({
      ...(this.hasAttribute('vertical') ? { vertical: true } : {}),
    });

    this._startPanel = this.shadowRoot.getElementById('start');
    this._endPanel   = this.shadowRoot.getElementById('end');
  }
}

customElements.define('noc-split-panel', NocSplitPanel);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
