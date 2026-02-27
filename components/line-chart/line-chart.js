// nocturnal-components/components/line-chart/line-chart.js

/**
 * @customElement noc-line-chart
 *
 * Single-series data shape:
 *   [{ label: string, value: number }, …]
 *
 * Multi-series data shape:
 *   [{ label: string, values: { seriesA: number, seriesB: number, … } }, …]
 *
 * Attributes:
 * @attr {string}  data             - JSON array of data points (see shapes above).
 * @attr {number}  height           - Chart SVG height in px. Default: 240.
 * @attr {string}  x-label          - Label text rendered below the x-axis.
 * @attr {string}  y-label          - Label text rendered along the y-axis.
 * @attr {number}  min              - Force the y-axis minimum value.
 * @attr {number}  max              - Force the y-axis maximum value.
 * @attr {number}  goal             - Draw a horizontal reference / goal line at this value.
 * @attr {string}  goal-label       - Label shown on the goal line. Defaults to "Goal".
 * @attr {boolean} area             - Fill the area under each line.
 * @attr {boolean} smooth           - Render lines as cubic bezier curves instead of straight segments.
 * @attr {boolean} dots             - Show data-point dots on the lines.
 * @attr {boolean} legend           - Show the series legend (only visible in multi-series mode).
 * @attr {boolean} no-grid          - Hide horizontal grid lines.
 * @attr {boolean} animate          - Animate lines on first render (default: true). Set attribute to "false" to disable.
 * @attr {number}  precision        - Decimal places for axis tick labels. Auto-detected when omitted.
 *
 * CSS Custom Properties:
 * @cssprop --noc-line-bg              - Component background (default: transparent)
 * @cssprop --noc-line-grid-color      - Horizontal grid line colour (default: rgba(255,255,255,.05))
 * @cssprop --noc-line-axis-color      - Axis line colour (default: rgba(255,255,255,.1))
 * @cssprop --noc-line-text-color      - Tick and axis label colour (default: #666)
 * @cssprop --noc-line-color           - Primary series stroke colour (default: #2563eb)
 * @cssprop --noc-line-area-opacity    - Area fill opacity (default: 0.12)
 * @cssprop --noc-line-stroke-width    - Line stroke width in px (default: 2)
 * @cssprop --noc-line-dot-r           - Dot radius in SVG units (default: 3)
 * @cssprop --noc-line-dot-border      - Dot border/stroke colour (default: var(--noc-line-bg, #0a0a0a))
 * @cssprop --noc-line-series-colors   - Comma-separated colour list for multi-series lines.
 *                                       Overrides the built-in palette.
 * @cssprop --noc-line-goal-color      - Reference line colour (default: #f59e0b)
 * @cssprop --noc-line-goal-dash       - SVG stroke-dasharray for the goal line (default: 5,4)
 * @cssprop --noc-line-tooltip-bg      - Tooltip background (default: #1e1e1e)
 * @cssprop --noc-line-tooltip-fg      - Tooltip text colour (default: #eee)
 * @cssprop --noc-line-tooltip-border  - Tooltip border colour (default: #333)
 * @cssprop --noc-line-legend-gap      - Gap between legend items (default: 1rem)
 * @cssprop --noc-line-cursor-color    - Vertical crosshair line colour (default: rgba(255,255,255,.1))
 *
 * Events:
 * @event noc-line-hover - Fired on data-point hover. detail: { label, value, series, index } or null on leave.
 * @event noc-line-click - Fired on data-point click. detail: { label, value, series, index }.
 */

function buildTemplate(attrs = {}) {
  return `
    <style>
      :host {
        display: block;
        width: 100%;
        font-family: inherit;
        font-size: inherit;
        position: relative;

        --noc-line-bg:             transparent;
        --noc-line-grid-color:     rgba(255, 255, 255, 0.05);
        --noc-line-axis-color:     rgba(255, 255, 255, 0.1);
        --noc-line-text-color:     #666;
        --noc-line-color:          #2563eb;
        --noc-line-area-opacity:   0.12;
        --noc-line-stroke-width:   2;
        --noc-line-dot-r:          3;
        --noc-line-dot-border:     #0a0a0a;
        --noc-line-goal-color:     #f59e0b;
        --noc-line-goal-dash:      5, 4;
        --noc-line-tooltip-bg:     #1e1e1e;
        --noc-line-tooltip-fg:     #eee;
        --noc-line-tooltip-border: #333;
        --noc-line-legend-gap:     1rem;
        --noc-line-cursor-color:   rgba(255, 255, 255, 0.1);
      }

      *, *::before, *::after { box-sizing: border-box; }

      .root {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
        background: var(--noc-line-bg);
      }

      svg {
        width: 100%;
        display: block;
        overflow: visible;
      }

      .line {
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: var(--noc-line-stroke-width);
      }

      .area {
        stroke: none;
        opacity: var(--noc-line-area-opacity);
      }

      .dot {
        stroke-width: 2;
        transition: r 0.15s ease, opacity 0.15s ease;
        cursor: pointer;
      }

      .hit {
        fill: transparent;
        cursor: pointer;
      }

      .cursor-line {
        stroke: var(--noc-line-cursor-color);
        stroke-width: 1;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.1s ease;
      }

      .cursor-line.on { opacity: 1; }

      .tick-label {
        font-size: 0.7em;
        fill: var(--noc-line-text-color);
      }

      .axis-label {
        font-size: 0.72em;
        fill: var(--noc-line-text-color);
        opacity: 0.6;
      }

      .goal-label-text {
        font-size: 0.68em;
        fill: var(--noc-line-goal-color);
      }

      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem var(--noc-line-legend-gap);
        font-size: 0.78em;
        color: var(--noc-line-text-color);
        padding: 0 4px;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        cursor: default;
        user-select: none;
      }

      .legend-swatch {
        width: 18px;
        height: 3px;
        border-radius: 2px;
        flex-shrink: 0;
      }

      .tooltip {
        position: fixed;
        background: var(--noc-line-tooltip-bg);
        color: var(--noc-line-tooltip-fg);
        font-family: inherit;
        font-size: 0.6875rem;
        padding: 6px 11px;
        border-radius: 6px;
        border: 1px solid var(--noc-line-tooltip-border);
        pointer-events: none;
        white-space: nowrap;
        opacity: 0;
        transform: translateY(4px);
        transition: opacity 0.13s ease, transform 0.13s ease;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45);
      }

      .tooltip.on {
        opacity: 1;
        transform: translateY(0);
      }

      .tt-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .tt-sep { opacity: 0.3; }
      .tt-val { font-weight: 600; }
    </style>

    <div class="root" part="base">
      <svg id="chart" aria-label="Line chart" role="img"></svg>
      <div class="legend" id="legend" style="display:none" part="legend"></div>
    </div>

    <div class="tooltip" id="tooltip" part="tooltip">
      <span class="tt-dot"  id="tt-dot"></span>
      <span id="tt-label"></span>
      <span class="tt-sep">·</span>
      <span class="tt-val" id="tt-value"></span>
    </div>
  `;
}

class NocLineChart extends HTMLElement {

  static get observedAttributes() {
    return [
      'data', 'height', 'x-label', 'y-label', 'min', 'max',
      'goal', 'goal-label', 'area', 'smooth', 'dots', 'legend',
      'no-grid', 'animate', 'precision',
    ];
  }

  static get _defaultPalette() {
    return [
      '#2563eb', '#ff5500', '#22c55e', '#a855f7',
      '#f59e0b', '#06b6d4', '#e63946', '#a8dadc',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._ro = null;
    this._initialized = false;
  }

  connectedCallback() {
    this._initialized = true;
    this._render();
    this._ro = new ResizeObserver(() => this._draw());
    this._ro.observe(this.shadowRoot.host);
  }

  disconnectedCallback() {
    if (this._ro) {
      this._ro.disconnect();
    }
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal && this._initialized) {
      this._render();
    }
  }

  get data() {
    try {
      return JSON.parse(this.getAttribute('data') || '[]');
    } catch (_) {
      return [];
    }
  }

  set data(v) {
    this.setAttribute('data', typeof v === 'string' ? v : JSON.stringify(v));
  }

  _cssVar(name, fallback) {
    return getComputedStyle(this).getPropertyValue(name).trim() || fallback;
  }

  _bool(attr) {
    const val = this.getAttribute(attr);
    return val !== null && val !== 'false';
  }

  _num(attr, def) {
    const v = parseFloat(this.getAttribute(attr));
    return isNaN(v) ? def : v;
  }

  _palette() {
    const custom = this._cssVar('--noc-line-series-colors', '');
    if (custom) {
      return custom.split(',').map(s => s.trim()).filter(Boolean);
    }
    return NocLineChart._defaultPalette;
  }

  _parseData() {
    try {
      const raw = JSON.parse(this.getAttribute('data') || '[]');
      if (!Array.isArray(raw) || raw.length === 0) {
        return { items: [], series: [], isMulti: false };
      }
      const isMulti = raw[0] && raw[0].values !== undefined;
      if (isMulti) {
        return { items: raw, series: Object.keys(raw[0].values), isMulti: true };
      }
      return { items: raw, series: ['value'], isMulti: false };
    } catch (_) {
      return { items: [], series: [], isMulti: false };
    }
  }

  _formatVal(v, precision) {
    if (precision !== null && precision !== undefined) {
      return v.toFixed(precision);
    }
    if (Number.isInteger(v)) {
      return v.toString();
    }
    return parseFloat(v.toFixed(2)).toString();
  }

  _niceStep(range) {
    if (range === 0) {
      return 1;
    }
    const rough  = range / 5;
    const mag    = Math.pow(10, Math.floor(Math.log10(rough)));
    const normed = rough / mag;
    if (normed < 1.5) { return mag; }
    if (normed < 3)   { return 2 * mag; }
    if (normed < 7)   { return 5 * mag; }
    return 10 * mag;
  }

  _buildPath(pts, smooth) {
    if (pts.length === 0) {
      return '';
    }
    if (!smooth || pts.length < 2) {
      return 'M' + pts.map(p => `${p[0]},${p[1]}`).join(' L');
    }
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const cp1x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * 0.45;
      const cp1y = pts[i][1];
      const cp2x = pts[i + 1][0] - (pts[i + 1][0] - pts[i][0]) * 0.45;
      const cp2y = pts[i + 1][1];
      d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${pts[i + 1][0]},${pts[i + 1][1]}`;
    }
    return d;
  }

  _buildAreaPath(pts, baseY, smooth) {
    if (pts.length === 0) {
      return '';
    }
    const linePart = this._buildPath(pts, smooth);
    const last     = pts[pts.length - 1];
    const first    = pts[0];
    return `${linePart} L${last[0]},${baseY} L${first[0]},${baseY} Z`;
  }

  _render() {
    this.shadowRoot.innerHTML = buildTemplate();
    this._draw();
  }

  _draw() {
    const svg      = this.shadowRoot.getElementById('chart');
    const legendEl = this.shadowRoot.getElementById('legend');

    if (!svg) {
      return;
    }

    const { items, series, isMulti } = this._parseData();

    if (items.length === 0) {
      svg.innerHTML = '';
      return;
    }

    const svgH       = this._num('height', 240);
    const showArea   = this._bool('area');
    const smooth     = this._bool('smooth');
    const showDots   = this._bool('dots');
    const showLegend = this._bool('legend') && isMulti;
    const noGrid     = this._bool('no-grid');
    const xLabel     = this.getAttribute('x-label') || '';
    const yLabel     = this.getAttribute('y-label') || '';
    const goalVal    = parseFloat(this.getAttribute('goal'));
    const goalLabel  = this.getAttribute('goal-label') || 'Goal';
    const precAttr   = this.getAttribute('precision');
    const precision  = precAttr !== null ? this._num('precision', 0) : null;
    const palette    = this._palette();

    const hostW = this.shadowRoot.host.getBoundingClientRect().width || 400;

    const PAD_LEFT   = 48;
    const PAD_RIGHT  = 24;
    const PAD_TOP    = 14;
    const PAD_BOTTOM = 36 + (xLabel ? 14 : 0);
    const Y_LABEL_W  = yLabel ? 14 : 0;

    const chartL = PAD_LEFT + Y_LABEL_W;
    const chartT = PAD_TOP;
    const chartW = Math.max(1, hostW - chartL - PAD_RIGHT);
    const chartH = Math.max(1, svgH - chartT - PAD_BOTTOM);

    let allVals = [];

    if (isMulti) {
      items.forEach(it => series.forEach(s => allVals.push(it.values[s] || 0)));
    } else {
      items.forEach(it => allVals.push(it.value || 0));
    }

    const forceMin = parseFloat(this.getAttribute('min'));
    const forceMax = parseFloat(this.getAttribute('max'));
    const rawMin   = isNaN(forceMin) ? Math.min(...allVals) : forceMin;
    const rawMax   = isNaN(forceMax) ? Math.max(...allVals, ...(!isNaN(goalVal) ? [goalVal] : [])) : forceMax;

    const step     = this._niceStep(rawMax - rawMin);
    const axiMin   = Math.floor(rawMin / step) * step;
    const axiMax   = Math.ceil(rawMax  / step) * step;
    const axiRange = axiMax - axiMin || 1;
    const ticks    = Math.round((axiMax - axiMin) / step);

    const xAt = i => chartL + (i / (items.length - 1 || 1)) * chartW;
    const yAt = v => chartT + chartH - ((v - axiMin) / axiRange) * chartH;

    let out = '';

    const gridColor = this._cssVar('--noc-line-grid-color', 'rgba(255,255,255,.05)');
    const axisColor = this._cssVar('--noc-line-axis-color', 'rgba(255,255,255,.1)');

    if (!noGrid) {
      for (let i = 0; i <= ticks; i++) {
        const v     = axiMin + i * step;
        const y     = yAt(v);
        const color = i === 0 ? axisColor : gridColor;
        const sw    = i === 0 ? 1.5 : 1;
        out += `<line x1="${chartL}" x2="${chartL + chartW}" y1="${y}" y2="${y}" stroke="${color}" stroke-width="${sw}" />`;
        out += `<text class="tick-label" x="${chartL - 8}" y="${y}" text-anchor="end" dominant-baseline="middle">${this._formatVal(v, precision)}</text>`;
      }
    }

    out += `<line x1="${chartL}" x2="${chartL + chartW}" y1="${chartT + chartH}" y2="${chartT + chartH}" stroke="${axisColor}" stroke-width="1.5" />`;
    out += `<line x1="${chartL}" x2="${chartL}" y1="${chartT}" y2="${chartT + chartH}" stroke="${axisColor}" stroke-width="1.5" />`;

    items.forEach((it, i) => {
      const x     = xAt(i);
      const y     = chartT + chartH + 14;
      const label = it.label;
      const step  = Math.max(1, Math.floor(items.length / 12));

      if (i % step === 0 || i === items.length - 1) {
        out += `<text class="tick-label" x="${x}" y="${y}" text-anchor="middle">${label}</text>`;
      }
    });

    const hitTargets = [];
    const gradIds    = [];

    if (isMulti) {
      series.forEach((s, si) => {
        const color = palette[si % palette.length];
        const pts   = items.map((it, i) => [xAt(i), yAt(it.values[s] || 0)]);

        if (showArea) {
          const gradId = `lg-${si}-${this._uid}`;
          gradIds.push({ gradId, color });
          out += `
            <defs>
              <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
              </linearGradient>
            </defs>`;
          out += `<path class="area" d="${this._buildAreaPath(pts, chartT + chartH, smooth)}" fill="url(#${gradId})" />`;
        }

        out += `<path class="line" id="line-${si}" d="${this._buildPath(pts, smooth)}" stroke="${color}" />`;

        if (showDots) {
          pts.forEach((p, i) => {
            const dotBorder = this._cssVar('--noc-line-dot-border', '#0a0a0a');
            out += `<circle cx="${p[0]}" cy="${p[1]}" r="${this._cssVar('--noc-line-dot-r', '3')}" class="dot" fill="${color}" stroke="${dotBorder}" data-series="${si}" data-idx="${i}" />`;
          });
        }

        pts.forEach((p, i) => {
          hitTargets.push({ x: p[0], y: p[1], si, i, s, color });
        });
      });

    } else {
      const color = this._cssVar('--noc-line-color', '#2563eb');
      const pts   = items.map((it, i) => [xAt(i), yAt(it.value || 0)]);

      if (showArea) {
        const gradId = `lg-0-${this._uid}`;
        out += `
          <defs>
            <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
            </linearGradient>
          </defs>`;
        out += `<path class="area" d="${this._buildAreaPath(pts, chartT + chartH, smooth)}" fill="url(#${gradId})" />`;
      }

      out += `<path class="line" id="line-0" d="${this._buildPath(pts, smooth)}" stroke="${color}" />`;

      if (showDots) {
        pts.forEach((p, i) => {
          const dotBorder = this._cssVar('--noc-line-dot-border', '#0a0a0a');
          out += `<circle cx="${p[0]}" cy="${p[1]}" r="${this._cssVar('--noc-line-dot-r', '3')}" class="dot" fill="${color}" stroke="${dotBorder}" data-series="0" data-idx="${i}" />`;
        });
      }

      pts.forEach((p, i) => {
        hitTargets.push({ x: p[0], y: p[1], si: 0, i, s: 'value', color });
      });
    }

    if (!isNaN(goalVal)) {
      const gc  = this._cssVar('--noc-line-goal-color', '#f59e0b');
      const gd  = this._cssVar('--noc-line-goal-dash', '5,4');
      const gy  = yAt(goalVal);
      out += `<line x1="${chartL}" x2="${chartL + chartW}" y1="${gy}" y2="${gy}" stroke="${gc}" stroke-width="1.5" stroke-dasharray="${gd}" />`;
      out += `<text class="goal-label-text" x="${chartL + chartW + 4}" y="${gy}" dominant-baseline="middle">${goalLabel}</text>`;
    }

    if (xLabel) {
      out += `<text class="axis-label" x="${chartL + chartW / 2}" y="${svgH - 4}" text-anchor="middle">${xLabel}</text>`;
    }

    if (yLabel) {
      out += `<text class="axis-label" transform="rotate(-90)" x="${-(chartT + chartH / 2)}" y="${Y_LABEL_W - 2}" text-anchor="middle">${yLabel}</text>`;
    }

    out += `<line id="cursor" class="cursor-line" x1="0" x2="0" y1="${chartT}" y2="${chartT + chartH}" />`;

    hitTargets.forEach(ht => {
      out += `<circle class="hit" cx="${ht.x}" cy="${ht.y}" r="12" data-si="${ht.si}" data-i="${ht.i}" />`;
    });

    svg.setAttribute('height', svgH);
    svg.setAttribute('width', hostW);
    svg.innerHTML = out;

    if (showLegend) {
      legendEl.style.display = 'flex';
      legendEl.innerHTML = series.map((s, si) => {
        const color = palette[si % palette.length];
        return `
          <span class="legend-item">
            <span class="legend-swatch" style="background:${color}"></span>
            <span>${s}</span>
          </span>`;
      }).join('');
    } else {
      legendEl.style.display = 'none';
    }

    this._bindEvents(svg, items, series, isMulti, precision, palette);

    if (this.getAttribute('animate') !== 'false') {
      this._animate(svg, series, isMulti);
    }
  }

  _bindEvents(svg, items, series, isMulti, precision, palette) {
    const tooltip  = this.shadowRoot.getElementById('tooltip');
    const ttDot    = this.shadowRoot.getElementById('tt-dot');
    const ttLabel  = this.shadowRoot.getElementById('tt-label');
    const ttValue  = this.shadowRoot.getElementById('tt-value');
    const cursor   = svg.getElementById('cursor');

    const defaultColor = this._cssVar('--noc-line-color', '#2563eb');

    const posTooltip = (e) => {
      let x = e.clientX + 14;
      let y = e.clientY + 14;
      if (x + 200 > window.innerWidth)  { x = e.clientX - 14 - 200; }
      if (y + 44  > window.innerHeight) { y = e.clientY - 14 - 44; }
      tooltip.style.left = `${x}px`;
      tooltip.style.top  = `${y}px`;
    };

    svg.querySelectorAll('.hit').forEach(el => {
      el.addEventListener('mouseenter', e => {
        const si    = parseInt(el.dataset.si, 10);
        const idx   = parseInt(el.dataset.i, 10);
        const item  = items[idx];
        const value = isMulti ? (item.values[series[si]] || 0) : (item.value || 0);
        const color = isMulti ? (palette[si % palette.length]) : defaultColor;
        const label = isMulti ? `${series[si]} · ${item.label}` : item.label;

        ttDot.style.background = color;
        ttLabel.textContent    = label;
        ttValue.textContent    = this._formatVal(value, precision);
        tooltip.classList.add('on');
        posTooltip(e);

        const dot = svg.querySelector(`.dot[data-series="${si}"][data-idx="${idx}"]`);
        if (dot) { dot.setAttribute('r', '5'); }

        if (cursor) {
          cursor.setAttribute('x1', el.getAttribute('cx'));
          cursor.setAttribute('x2', el.getAttribute('cx'));
          cursor.classList.add('on');
        }

        this.dispatchEvent(new CustomEvent('noc-line-hover', {
          bubbles:  true,
          composed: true,
          detail: { label: item.label, value, series: isMulti ? series[si] : 'value', index: idx },
        }));
      });

      el.addEventListener('mousemove', posTooltip);

      el.addEventListener('mouseleave', () => {
        const si  = parseInt(el.dataset.si, 10);
        const idx = parseInt(el.dataset.i, 10);

        tooltip.classList.remove('on');
        if (cursor) { cursor.classList.remove('on'); }

        const dot = svg.querySelector(`.dot[data-series="${si}"][data-idx="${idx}"]`);
        if (dot) { dot.setAttribute('r', this._cssVar('--noc-line-dot-r', '3')); }

        this.dispatchEvent(new CustomEvent('noc-line-hover', {
          bubbles: true, composed: true, detail: null,
        }));
      });

      el.addEventListener('click', () => {
        const si    = parseInt(el.dataset.si, 10);
        const idx   = parseInt(el.dataset.i, 10);
        const item  = items[idx];
        const value = isMulti ? (item.values[series[si]] || 0) : (item.value || 0);

        this.dispatchEvent(new CustomEvent('noc-line-click', {
          bubbles:  true,
          composed: true,
          detail: { label: item.label, value, series: isMulti ? series[si] : 'value', index: idx },
        }));
      });
    });
  }

  _animate(svg, series, isMulti) {
    const count = isMulti ? series.length : 1;

    for (let si = 0; si < count; si++) {
      const line = svg.getElementById(`line-${si}`);

      if (!line) {
        continue;
      }

      const len = line.getTotalLength();

      line.style.strokeDasharray  = `${len}`;
      line.style.strokeDashoffset = `${len}`;
      line.style.transition       = 'none';

      requestAnimationFrame(() => {
        setTimeout(() => {
          line.style.transition       = `stroke-dashoffset 0.7s cubic-bezier(.4,0,.2,1) ${si * 80}ms`;
          line.style.strokeDashoffset = '0';
        }, 20);
      });
    }
  }

  get _uid() {
    if (!this.__uid) {
      this.__uid = Math.random().toString(36).slice(2, 7);
    }
    return this.__uid;
  }
}

customElements.define('noc-line-chart', NocLineChart);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
