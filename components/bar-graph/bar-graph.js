// nocturnal-components/components/bar-graph/bar-graph.js

/**
 * @customElement noc-bar-graph
 * 
 * @slot - Not used (data provided via attribute).
 * 
 * Attributes:
 * @attr {string} data - JSON string array of {label, value} or {label, values:{...}} for multi-series.
 * @attr {string} direction - Bar direction: 'vertical' (default) or 'horizontal'.
 * @attr {boolean} stacked - If present, stack multi-series bars.
 * @attr {boolean} stacked-percentage - If present with stacked, display as 100% stacked.
 * @attr {boolean} sorted - If present, sort bars by value descending (single series only).
 * @attr {boolean} legend - If present, show legend for multi-series data.
 * @attr {boolean} value-labels - If present, show value labels on bars.
 * @attr {number} goal - Draw a goal/reference line at this value.
 * @attr {string} goal-label - Label text for the goal line. Defaults to 'Goal'.
 * @attr {string} x-label - Label for the x-axis.
 * @attr {string} y-label - Label for the y-axis.
 * @attr {number} height - Explicit height in pixels. Defaults to 240.
 * @attr {number} gap - Bar gap ratio 0-1. Defaults to 0.25.
 * @attr {boolean} animate - If present (default true), animate bars on connect. Set to 'false' to disable.
 * @attr {number} precision - Decimal places for value labels. Auto-calculated if not provided.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-bar-graph-bg - Background color of the graph. Defaults to transparent.
 * @cssprop --noc-bar-graph-bar-color - Primary bar fill color. Defaults to #3b82f6.
 * @cssprop --noc-bar-graph-bar-negative-color - Color for negative value bars. Defaults to #ef4444.
 * @cssprop --noc-bar-graph-bar-hover-color - Bar color on hover. Defaults to #2563eb.
 * @cssprop --noc-bar-graph-bar-radius - Border radius for bar tips. Defaults to 3px.
 * @cssprop --noc-bar-graph-series-colors - Comma-separated color list for multi-series (overrides default palette).
 * @cssprop --noc-bar-graph-grid-color - Grid line color. Defaults to rgba(255,255,255,0.05).
 * @cssprop --noc-bar-graph-axis-color - Axis line color. Defaults to rgba(255,255,255,0.1).
 * @cssprop --noc-bar-graph-text-color - Axis label and tick text color. Defaults to inherit.
 * @cssprop --noc-bar-graph-value-label-color - Value label text color on bars. Defaults to inherit.
 * @cssprop --noc-bar-graph-goal-color - Goal line color. Defaults to #f59e0b.
 * @cssprop --noc-bar-graph-goal-dash - SVG stroke-dasharray for goal line. Defaults to '5,4'.
 * @cssprop --noc-bar-graph-transition - Animation duration. Defaults to 0.35s.
 * @cssprop --noc-bar-graph-legend-gap - Gap between legend items. Defaults to 1rem.
 * 
 * Events:
 * @event noc-bar-click - Emitted when a bar is clicked. Detail: { label, value, series, index }.
 * @event noc-bar-hover - Emitted when a bar is hovered or unhovered. Detail: { label, value, series, index } or null.
 */

function buildTemplate() {
  return `
    <style>
      :host {
        display: block;
        width: 100%;
        font-family: inherit;
        font-size: inherit;
        color: var(--noc-bar-graph-text-color, #aaa);
        background: var(--noc-bar-graph-bg, transparent);
        --noc-bar-graph-bar-color: #3b82f6;
        --noc-bar-graph-bar-negative-color: #ef4444;
        --noc-bar-graph-bar-hover-color: #2563eb;
        --noc-bar-graph-bar-radius: 3px;
        --noc-bar-graph-grid-color: rgba(255,255,255,0.05);
        --noc-bar-graph-axis-color: rgba(255,255,255,0.1);
        --noc-bar-graph-text-color: #aaa;
        --noc-bar-graph-value-label-color: #eee;
        --noc-bar-graph-goal-color: #f59e0b;
        --noc-bar-graph-goal-dash: 5,4;
        --noc-bar-graph-transition: 0.35s cubic-bezier(.4,0,.2,1);
        --noc-bar-graph-legend-gap: 1rem;
        position: relative;
        box-sizing: border-box;
      }
      
      *, *::before, *::after { box-sizing: border-box; }

      .root { display: flex; flex-direction: column; gap: 0.5rem; width: 100%; height: 100%; }
      svg { width: 100%; display: block; overflow: visible; }

      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem var(--noc-bar-graph-legend-gap);
        font-size: 0.78em;
        opacity: 0.85;
        padding: 0 4px;
      }
      .legend-item { display: flex; align-items: center; gap: 0.35rem; cursor: default; user-select: none; }
      .legend-swatch { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }

      .tooltip {
        position: absolute;
        background: rgba(0,0,0,0.9);
        color: #fff;
        font-size: 0.75em;
        border-radius: 5px;
        padding: 5px 9px;
        pointer-events: none;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.12s;
        z-index: 10;
        transform: translate(-50%, -110%);
        line-height: 1.5;
        border: 1px solid rgba(255,255,255,0.1);
      }
      .tooltip.visible { opacity: 1; }

      .bar { transition: opacity var(--noc-bar-graph-transition); cursor: pointer; }
      .bar:hover { opacity: 0.82; }
      .bar.dimmed { opacity: 0.35; }

      .axis-label { font-size: 0.72em; fill: currentColor; opacity: 0.55; }
      .tick-label { font-size: 0.7em; fill: currentColor; opacity: 0.6; }
      .value-label { font-size: 0.68em; fill: var(--noc-bar-graph-value-label-color, #eee); pointer-events: none; font-weight: 500; }
      .goal-label-text { font-size: 0.68em; fill: var(--noc-bar-graph-goal-color, #f59e0b); }
    </style>
    <div class="root">
      <svg id="chart" aria-label="Bar graph"></svg>
      <div class="legend" id="legend" style="display:none"></div>
    </div>
    <div class="tooltip" id="tooltip"></div>
  `;
}

class NocBarGraph extends HTMLElement {
  static get observedAttributes() {
    return [
      'data', 'direction', 'stacked', 'stacked-percentage', 'sorted',
      'legend', 'value-labels', 'goal', 'goal-label', 'x-label', 'y-label',
      'height', 'gap', 'animate', 'precision'
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._resizeObserver = null;
    this._tooltip = null;
    this._initialized = false;
  }

  connectedCallback() {
    this._initialized = true;
    this._render();
    this._resizeObserver = new ResizeObserver(() => this._draw());
    this._resizeObserver.observe(this.shadowRoot.host);
  }

  disconnectedCallback() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
  }

  attributeChangedCallback() {
    if (this._initialized) {
      this._render();
    }
  }

  _parseData() {
    try {
      const raw = JSON.parse(this.getAttribute('data') || '[]');
      
      if (!Array.isArray(raw) || raw.length === 0) {
        return { items: [], series: [], multiSeries: false };
      }

      const multiSeries = raw[0] && raw[0].values !== undefined;
      
      if (multiSeries) {
        const series = Object.keys(raw[0].values);
        return { items: raw, series, multiSeries: true };
      }
      
      return { items: raw, series: ['value'], multiSeries: false };
    } catch (e) {
      return { items: [], series: [], multiSeries: false };
    }
  }

  _cssVar(name, fallback = '') {
    return getComputedStyle(this).getPropertyValue(name).trim() || fallback;
  }

  _palette() {
    const custom = this._cssVar('--noc-bar-graph-series-colors');
    if (custom) {
      return custom.split(',').map(s => s.trim());
    }
    return [
      this._cssVar('--noc-bar-graph-bar-color', '#3b82f6'),
      '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316',
    ];
  }

  _bool(attr) {
    return this.hasAttribute(attr);
  }

  _num(attr, def) {
    const v = parseFloat(this.getAttribute(attr));
    if (isNaN(v)) {
      return def;
    }
    return v;
  }

  _str(attr, def = '') {
    return this.getAttribute(attr) || def;
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

  _render() {
    this.shadowRoot.innerHTML = buildTemplate();

    this._tooltip = this.shadowRoot.getElementById('tooltip');
    this._draw();
  }

  _draw() {
    const svg = this.shadowRoot.getElementById('chart');
    const legendEl = this.shadowRoot.getElementById('legend');
    
    if (!svg) {
      return;
    }

    const { items, series, multiSeries } = this._parseData();
    
    if (items.length === 0) {
      svg.innerHTML = '';
      return;
    }

    const direction = this._str('direction', 'vertical');
    const isH = direction === 'horizontal';
    const stacked = this._bool('stacked');
    const stackedPct = this._bool('stacked-percentage');
    const showLegend = this._bool('legend');
    const showValueLabels = this._bool('value-labels');
    const sorted = this._bool('sorted') && !multiSeries;
    const goalVal = parseFloat(this.getAttribute('goal'));
    const goalLabel = this._str('goal-label', 'Goal');
    const xLabel = this._str('x-label');
    const yLabel = this._str('y-label');
    const explicitH = this._num('height', 0);
    const gapRatio = this._num('gap', 0.25);
    const precisionAttr = this.getAttribute('precision');
    const precision = precisionAttr !== null ? this._num('precision', 0) : null;
    const palette = this._palette();
    const negativeColor = this._cssVar('--noc-bar-graph-bar-negative-color', '#ef4444');
    const barRadius = this._cssVar('--noc-bar-graph-bar-radius', '3px');
    const rx = parseFloat(barRadius) || 0;

    let drawItems = [...items];
    
    if (sorted && !multiSeries) {
      drawItems.sort((a, b) => b.value - a.value);
    }

    let minVal = 0;
    let maxVal = 0;
    
    if (multiSeries && stacked) {
      drawItems.forEach(item => {
        const sum = Object.values(item.values).reduce((a, b) => a + b, 0);
        const sumNeg = Object.values(item.values).filter(v => v < 0).reduce((a, b) => a + b, 0);
        
        if (stackedPct) {
          maxVal = Math.max(maxVal, 100);
          minVal = Math.min(minVal, 0);
        } else {
          maxVal = Math.max(maxVal, sum);
          minVal = Math.min(minVal, sumNeg);
        }
      });
    } else if (multiSeries) {
      drawItems.forEach(item => {
        Object.values(item.values).forEach(v => {
          maxVal = Math.max(maxVal, v);
          minVal = Math.min(minVal, v);
        });
      });
    } else {
      drawItems.forEach(item => {
        maxVal = Math.max(maxVal, item.value);
        minVal = Math.min(minVal, item.value);
      });
    }
    
    if (!isNaN(goalVal)) {
      maxVal = Math.max(maxVal, goalVal);
    }

    const rawRange = maxVal - minVal;
    const niceStep = this._niceStep(rawRange);
    const axiMax = Math.ceil(maxVal / niceStep) * niceStep;
    const axiMin = Math.floor(minVal / niceStep) * niceStep;
    const axiRange = axiMax - axiMin || 1;
    const tickCount = Math.round(axiRange / niceStep);

    const hostW = this.shadowRoot.host.getBoundingClientRect().width || 400;
    const svgH = explicitH || 240;
    const PAD_LEFT = isH ? (this._longestLabel(drawItems) * 6.5 + 12) : 42;
    const PAD_RIGHT = isH ? 16 : 16;
    const PAD_TOP = 14;
    const PAD_BOTTOM = isH ? 36 : 38;
    const yLabelOffset = yLabel ? 14 : 0;
    const xLabelOffset = xLabel ? 14 : 0;
    const chartL = PAD_LEFT + yLabelOffset;
    const chartT = PAD_TOP;
    const chartW = hostW - chartL - PAD_RIGHT;
    const chartH = svgH - chartT - PAD_BOTTOM - xLabelOffset;

    svg.setAttribute('height', svgH);
    svg.setAttribute('width', hostW);

    if (showLegend && multiSeries) {
      legendEl.style.display = 'flex';
      legendEl.innerHTML = series.map((s, i) =>
        `<span class="legend-item">
          <span class="legend-swatch" style="background:${palette[i % palette.length]}"></span>
          <span>${s}</span>
        </span>`
      ).join('');
    } else {
      legendEl.style.display = 'none';
    }

    let out = '';

    const gridColor = this._cssVar('--noc-bar-graph-grid-color', 'rgba(255,255,255,0.05)');
    const axisColor = this._cssVar('--noc-bar-graph-axis-color', 'rgba(255,255,255,0.1)');

    if (!isH) {
      for (let i = 0; i <= tickCount; i++) {
        const v = axiMin + i * niceStep;
        const y = chartT + chartH - ((v - axiMin) / axiRange) * chartH;
        const strokeColor = i === 0 ? axisColor : gridColor;
        const strokeWidth = i === 0 ? 1.5 : 1;
        out += `<line x1="${chartL}" x2="${chartL + chartW}" y1="${y}" y2="${y}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
        out += `<text class="tick-label" x="${chartL - 6}" y="${y}" text-anchor="end" dominant-baseline="middle">${this._formatVal(v, precision)}</text>`;
      }
      out += `<line x1="${chartL}" x2="${chartL + chartW}" y1="${chartT + chartH}" y2="${chartT + chartH}" stroke="${axisColor}" stroke-width="1.5"/>`;
      out += `<line x1="${chartL}" x2="${chartL}" y1="${chartT}" y2="${chartT + chartH}" stroke="${axisColor}" stroke-width="1.5"/>`;
    } else {
      for (let i = 0; i <= tickCount; i++) {
        const v = axiMin + i * niceStep;
        const x = chartL + ((v - axiMin) / axiRange) * chartW;
        const strokeColor = i === 0 ? axisColor : gridColor;
        const strokeWidth = i === 0 ? 1.5 : 1;
        out += `<line x1="${x}" x2="${x}" y1="${chartT}" y2="${chartT + chartH}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
        out += `<text class="tick-label" x="${x}" y="${chartT + chartH + 14}" text-anchor="middle">${this._formatVal(v, precision)}</text>`;
      }
      out += `<line x1="${chartL}" x2="${chartL}" y1="${chartT}" y2="${chartT + chartH}" stroke="${axisColor}" stroke-width="1.5"/>`;
    }

    const n = drawItems.length;
    const groupCount = multiSeries && !stacked ? series.length : 1;
    const slotSize = isH ? chartH / n : chartW / n;
    const barGroupW = slotSize * (1 - gapRatio);
    const barW = barGroupW / groupCount;
    const barEvents = [];

    drawItems.forEach((item, i) => {
      const slotStart = isH
        ? chartT + i * slotSize + (slotSize - barGroupW) / 2
        : chartL + i * slotSize + (slotSize - barGroupW) / 2;

      const label = item.label;

      if (!isH) {
        out += `<text class="tick-label" x="${slotStart + barGroupW / 2}" y="${chartT + chartH + 14}" text-anchor="middle">${label}</text>`;
      } else {
        out += `<text class="tick-label" x="${chartL - 8}" y="${slotStart + barGroupW / 2}" text-anchor="end" dominant-baseline="middle">${label}</text>`;
      }

      if (multiSeries && stacked) {
        let posOffset = 0;
        let negOffset = 0;
        const totalPos = Object.values(item.values).filter(v => v >= 0).reduce((a, b) => a + b, 0);

        series.forEach((s, si) => {
          let v = item.values[s];
          
          if (stackedPct) {
            if (totalPos > 0) {
              v = (v / totalPos) * 100;
            } else {
              v = 0;
            }
          }
          
          const isNeg = v < 0;
          const offset = isNeg ? negOffset : posOffset;
          const pxLen = Math.abs(v / axiRange) * (isH ? chartW : chartH);
          const zeroY = chartT + chartH - ((0 - axiMin) / axiRange) * chartH;
          const zeroX = chartL + ((0 - axiMin) / axiRange) * chartW;
          let bx, by, bw, bh;
          
          if (!isH) {
            bh = pxLen;
            bw = barGroupW;
            bx = slotStart;
            
            if (isNeg) {
              by = zeroY + (negOffset / axiRange) * chartH;
              negOffset += Math.abs(v);
            } else {
              by = zeroY - posOffset / axiRange * chartH - pxLen;
              posOffset += v;
            }
          } else {
            bw = pxLen;
            bh = barGroupW;
            by = slotStart;
            
            if (isNeg) {
              bx = zeroX - (negOffset / axiRange) * chartW - pxLen;
              negOffset += Math.abs(v);
            } else {
              bx = zeroX + posOffset / axiRange * chartW;
              posOffset += v;
            }
          }
          
          const color = palette[si % palette.length];
          const isFirst = si === 0;
          const isLast = si === series.length - 1;
          const topRadius = isH ? (isLast ? rx : 0) : (isLast ? rx : 0);
          const bottomRadius = isH ? (isFirst ? rx : 0) : (isFirst ? rx : 0);
          const barId = `bar-${i}-${si}`;
          out += this._barRect(bx, by, bw, bh, color, topRadius, bottomRadius, isH, isNeg, barId);
          barEvents.push({ id: barId, label, value: item.values[s], series: s, index: i });

          if (showValueLabels && pxLen > 14) {
            const lx = isH ? bx + bw / 2 : bx + bw / 2;
            const ly = isH ? by + bh / 2 : by + bh / 2;
            const suffix = stackedPct ? '%' : '';
            out += `<text class="value-label" x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle">${this._formatVal(v, precision)}${suffix}</text>`;
          }
        });

      } else if (multiSeries) {
        series.forEach((s, si) => {
          const v = item.values[s];
          const isNeg = v < 0;
          const pxLen = Math.abs(v / axiRange) * (isH ? chartW : chartH);
          const zeroPos = isH
            ? chartL + ((0 - axiMin) / axiRange) * chartW
            : chartT + chartH - ((0 - axiMin) / axiRange) * chartH;
          let bx, by, bw, bh;
          
          if (!isH) {
            bx = slotStart + si * barW;
            bh = pxLen;
            bw = barW;
            
            if (isNeg) {
              by = zeroPos;
            } else {
              by = zeroPos - pxLen;
            }
          } else {
            by = slotStart + si * barW;
            bw = pxLen;
            bh = barW;
            
            if (isNeg) {
              bx = zeroPos - pxLen;
            } else {
              bx = zeroPos;
            }
          }
          
          const color = palette[si % palette.length];
          const barId = `bar-${i}-${si}`;
          out += this._barRect(bx, by, bw, bh, color, rx, rx, isH, isNeg, barId);
          barEvents.push({ id: barId, label, value: v, series: s, index: i });

          if (showValueLabels && pxLen > 8) {
            const PADDING = 3;
            
            if (!isH) {
              const ly = isNeg ? by + pxLen + 10 : by - PADDING - 2;
              out += `<text class="value-label" x="${bx + bw / 2}" y="${ly}" text-anchor="middle">${this._formatVal(v, precision)}</text>`;
            } else {
              const lx = isNeg ? bx - PADDING - 2 : bx + bw + PADDING + 2;
              const anchor = isNeg ? 'end' : 'start';
              out += `<text class="value-label" x="${lx}" y="${by + bh / 2}" text-anchor="${anchor}" dominant-baseline="middle">${this._formatVal(v, precision)}</text>`;
            }
          }
        });

      } else {
        const v = item.value;
        const isNeg = v < 0;
        const pxLen = Math.abs(v / axiRange) * (isH ? chartW : chartH);
        const zeroPos = isH
          ? chartL + ((0 - axiMin) / axiRange) * chartW
          : chartT + chartH - ((0 - axiMin) / axiRange) * chartH;
        let bx, by, bw, bh;
        
        if (!isH) {
          bx = slotStart;
          bw = barGroupW;
          bh = pxLen;
          
          if (isNeg) {
            by = zeroPos;
          } else {
            by = zeroPos - pxLen;
          }
        } else {
          by = slotStart;
          bh = barGroupW;
          bw = pxLen;
          
          if (isNeg) {
            bx = zeroPos - pxLen;
          } else {
            bx = zeroPos;
          }
        }
        
        const color = isNeg ? negativeColor : palette[0];
        const barId = `bar-${i}-0`;
        out += this._barRect(bx, by, bw, bh, color, rx, rx, isH, isNeg, barId);
        barEvents.push({ id: barId, label, value: v, series: 'value', index: i });

        if (showValueLabels && pxLen > 8) {
          const PADDING = 4;
          
          if (!isH) {
            const ly = isNeg ? by + pxLen + 11 : by - PADDING;
            out += `<text class="value-label" x="${bx + bw / 2}" y="${ly}" text-anchor="middle">${this._formatVal(v, precision)}</text>`;
          } else {
            const lx = isNeg ? bx - PADDING - 2 : bx + bw + PADDING + 2;
            const anchor = isNeg ? 'end' : 'start';
            out += `<text class="value-label" x="${lx}" y="${by + bh / 2}" text-anchor="${anchor}" dominant-baseline="middle">${this._formatVal(v, precision)}</text>`;
          }
        }
      }
    });

    if (!isNaN(goalVal)) {
      const gc = this._cssVar('--noc-bar-graph-goal-color', '#f59e0b');
      const gd = this._cssVar('--noc-bar-graph-goal-dash', '5,4');
      
      if (!isH) {
        const gy = chartT + chartH - ((goalVal - axiMin) / axiRange) * chartH;
        out += `<line x1="${chartL}" x2="${chartL + chartW}" y1="${gy}" y2="${gy}" stroke="${gc}" stroke-width="1.5" stroke-dasharray="${gd}" />`;
        out += `<text class="goal-label-text" x="${chartL + chartW + 4}" y="${gy}" dominant-baseline="middle">${goalLabel}</text>`;
      } else {
        const gx = chartL + ((goalVal - axiMin) / axiRange) * chartW;
        out += `<line x1="${gx}" x2="${gx}" y1="${chartT}" y2="${chartT + chartH}" stroke="${gc}" stroke-width="1.5" stroke-dasharray="${gd}" />`;
        out += `<text class="goal-label-text" x="${gx}" y="${chartT - 5}" text-anchor="middle">${goalLabel}</text>`;
      }
    }

    if (xLabel && !isH) {
      out += `<text class="axis-label" x="${chartL + chartW / 2}" y="${svgH - 4}" text-anchor="middle">${xLabel}</text>`;
    }
    
    if (yLabel && !isH) {
      out += `<text class="axis-label" transform="rotate(-90)" x="${-(chartT + chartH / 2)}" y="${yLabelOffset - 2}" text-anchor="middle">${yLabel}</text>`;
    }

    svg.innerHTML = out;

    barEvents.forEach(({ id, label, value, series, index }) => {
      const el = svg.getElementById(id);
      
      if (!el) {
        return;
      }
      
      el.addEventListener('mouseenter', (e) => {
        this._showTooltip(e, label, value, series, multiSeries, precision);
        this.dispatchEvent(new CustomEvent('noc-bar-hover', {
          detail: { label, value, series, index },
          bubbles: true,
          composed: true
        }));
      });
      
      el.addEventListener('mousemove', (e) => this._moveTooltip(e));
      
      el.addEventListener('mouseleave', () => {
        this._hideTooltip();
        this.dispatchEvent(new CustomEvent('noc-bar-hover', {
          detail: null,
          bubbles: true,
          composed: true
        }));
      });
      
      el.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('noc-bar-click', {
          detail: { label, value, series, index },
          bubbles: true,
          composed: true
        }));
      });
    });

    if (this.getAttribute('animate') !== 'false') {
      this._animateBars(svg, isH, chartL, chartT, chartH, chartW, axiMin, axiRange);
    }
  }

  _barRect(x, y, w, h, color, tipR, baseR, isH, isNeg, id) {
    const maxR = isH ? Math.min(tipR, w / 2) : Math.min(tipR, h / 2);
    const r = Math.max(0, maxR);

    if (r === 0) {
      return `<rect id="${id}" class="bar" x="${x}" y="${y}" width="${Math.max(0,w)}" height="${Math.max(0,h)}" fill="${color}" rx="0" />`;
    }

    const W = Math.max(0, w);
    const H = Math.max(0, h);
    let d;
    
    if (!isH) {
      const rr = isNeg ? 0 : r;
      const br = isNeg ? r : 0;
      d = `M${x + br},${y + H}
           L${x + br},${y + rr}
           Q${x},${y} ${x + rr},${y}
           L${x + W - rr},${y}
           Q${x + W},${y} ${x + W},${y + rr}
           L${x + W},${y + H - br}
           Q${x + W},${y + H} ${x + W - br},${y + H}
           L${x + br},${y + H}
           Q${x},${y + H} ${x},${y + H - br}
           Z`;
    } else {
      const tr = isNeg ? 0 : r;
      const lr = isNeg ? r : 0;
      d = `M${x},${y + lr}
           Q${x},${y} ${x + lr},${y}
           L${x + W - tr},${y}
           Q${x + W},${y} ${x + W},${y + tr}
           L${x + W},${y + H - tr}
           Q${x + W},${y + H} ${x + W - tr},${y + H}
           L${x + lr},${y + H}
           Q${x},${y + H} ${x},${y + H - lr}
           Z`;
    }
    
    return `<path id="${id}" class="bar" d="${d}" fill="${color}" />`;
  }

  _animateBars(svg, isH, chartL, chartT, chartH, chartW, axiMin, axiRange) {
    const bars = svg.querySelectorAll('.bar');
    const zeroV = isH ? chartL + ((0 - axiMin) / axiRange) * chartW : chartT + chartH - ((0 - axiMin) / axiRange) * chartH;

    bars.forEach((bar, i) => {
      bar.style.transformOrigin = isH ? `${zeroV}px center` : `center ${zeroV}px`;
      bar.style.transform = isH ? 'scaleX(0)' : 'scaleY(0)';
      bar.style.opacity = '0';
      bar.style.transition = 'none';
      
      requestAnimationFrame(() => {
        setTimeout(() => {
          bar.style.transition = `transform 0.4s cubic-bezier(.4,0,.2,1) ${i * 30}ms, opacity 0.2s ease ${i * 30}ms`;
          bar.style.transform = 'none';
          bar.style.opacity = '1';
        }, 20);
      });
    });
  }

  _showTooltip(e, label, value, series, multi, precision) {
    const tip = this._tooltip;
    
    if (!tip) {
      return;
    }
    
    const seriesText = multi ? ` · ${series}` : '';
    tip.innerHTML = `<strong>${label}</strong>${seriesText}<br/>${this._formatVal(value, precision)}`;
    tip.classList.add('visible');
    this._moveTooltip(e);
  }

  _moveTooltip(e) {
    const tip = this._tooltip;
    
    if (!tip) {
      return;
    }
    
    const rect = this.shadowRoot.host.getBoundingClientRect();
    tip.style.left = (e.clientX - rect.left) + 'px';
    tip.style.top = (e.clientY - rect.top) + 'px';
  }

  _hideTooltip() {
    if (this._tooltip) {
      this._tooltip.classList.remove('visible');
    }
  }

  _niceStep(range) {
    if (range === 0) {
      return 1;
    }
    
    const rough = range / 5;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const normed = rough / mag;
    
    if (normed < 1.5) {
      return mag;
    }
    if (normed < 3) {
      return 2 * mag;
    }
    if (normed < 7) {
      return 5 * mag;
    }
    return 10 * mag;
  }

  _longestLabel(items) {
    return Math.max(...items.map(it => (it.label || '').length));
  }
}

customElements.define('noc-bar-graph', NocBarGraph);

export function ssrTemplate() {
  return `<template shadowrootmode="open">${buildTemplate()}</template>`;
}
