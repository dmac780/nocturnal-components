// nocturnal-components/components/pie-chart/pie-chart.js

/**
 * @customElement noc-pie-chart
 *
 * A lightweight, dependency-free pie / donut chart. Data is passed as a JSON
 * array via the `data` attribute or the `data` property. Each item may carry
 * its own `color` field; items without one are assigned from the default palette.
 *
 * Attributes:
 * @attr {string}  data
 *   JSON array of data items. Each item shape:
 *   { label: string, value: number, color?: string }
 *
 * @attr {string}  title
 *   Heading displayed above the chart. Omit or leave empty to hide.
 *
 * @attr {boolean} donut
 *   Renders a donut chart. The centre shows total / hovered label by default.
 *
 * @attr {string}  donut-label
 *   Static label shown beneath the centre value in donut mode. Defaults to "total".
 *
 * @attr {boolean} no-bg
 *   Removes the card background, border-radius and padding entirely.
 *
 * @attr {boolean} no-legend
 *   Hides the legend row below the chart.
 *
 * @attr {boolean} no-title
 *   Hides the title even if the `title` attribute is set.
 *
 * @attr {'horizontal'|'vertical'} legend-layout
 *   Controls the legend direction. Defaults to 'vertical'.
 *
 * CSS Custom Properties:
 * @cssprop --noc-pie-size          - Diameter of the chart (default: 180px)
 * @cssprop --noc-pie-bg            - Card background (default: #1a1a1a)
 * @cssprop --noc-pie-border        - Card border colour (default: #222)
 * @cssprop --noc-pie-fg            - Primary text colour (default: #eee)
 * @cssprop --noc-pie-muted         - Secondary / label colour (default: #555)
 * @cssprop --noc-pie-radius        - Card border radius (default: 1rem)
 * @cssprop --noc-pie-padding       - Card inner padding (default: 1.25rem)
 * @cssprop --noc-pie-gap           - Gap between chart and legend (default: 1rem)
 * @cssprop --noc-pie-tooltip-bg    - Tooltip background (default: #1e1e1e)
 * @cssprop --noc-pie-tooltip-fg    - Tooltip text colour (default: #eee)
 * @cssprop --noc-pie-palette       - Comma-separated fallback colour list.
 *
 * Events:
 * @event noc-slice-enter - Fired when a slice is hovered/focused.
 *   detail: { index, label, value, percent, color }
 * @event noc-slice-leave - Fired when hover/focus leaves a slice.
 */

function buildTemplate(attrs = {}, slices = [], total = 0, isDonut = false, noBg = false, noLegend = false, title = '', donutLabel = 'total', legendLayout = 'vertical', paths = '', legendRows = '') {
  const legendHTML = noLegend
    ? ''
    : `<div class="legend legend--${legendLayout}">${legendRows}</div>`;

  return `
    <style>
      :host {
        display: inline-block;
        font-family: inherit;

        --noc-pie-size:       180px;
        --noc-pie-bg:         #1a1a1a;
        --noc-pie-border:     #222;
        --noc-pie-fg:         #eee;
        --noc-pie-muted:      #555;
        --noc-pie-radius:     1rem;
        --noc-pie-padding:    1.25rem;
        --noc-pie-gap:        1rem;
        --noc-pie-tooltip-bg: #1e1e1e;
        --noc-pie-tooltip-fg: #eee;
      }

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      .card {
        display: flex;
        flex-direction: column;
        gap: var(--noc-pie-gap);
        background: ${noBg ? 'transparent' : 'var(--noc-pie-bg)'};
        border: ${noBg ? 'none' : '1px solid var(--noc-pie-border)'};
        border-radius: ${noBg ? '0' : 'var(--noc-pie-radius)'};
        padding: ${noBg ? '0' : 'var(--noc-pie-padding)'};
      }

      .title {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--noc-pie-fg);
        letter-spacing: -0.01em;
      }

      .wrap {
        position: relative;
        width: var(--noc-pie-size);
        height: var(--noc-pie-size);
        align-self: center;
      }

      svg {
        width: 100%;
        height: 100%;
        overflow: visible;
        display: block;
      }

      .slice {
        cursor: pointer;
        transform-origin: center;
        transform-box: fill-box;
        transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), opacity 0.15s ease;
        outline: none;
      }

      .slice:hover,
      .slice:focus-visible,
      .slice.active {
        transform: scale(1.06);
        filter: brightness(1.15);
      }

      .wrap:has(.slice:hover) .slice:not(:hover):not(.active),
      .wrap:has(.slice:focus-visible) .slice:not(:focus-visible):not(.active) {
        opacity: 0.35;
      }

      .donut-center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }

      .donut-val {
        font-size: 1.375rem;
        font-weight: 600;
        color: var(--noc-pie-fg);
        line-height: 1;
      }

      .donut-sub {
        font-size: 0.5625rem;
        color: var(--noc-pie-muted);
        letter-spacing: 0.1em;
        text-transform: uppercase;
        margin-top: 4px;
        max-width: 76px;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .tooltip {
        position: fixed;
        background: var(--noc-pie-tooltip-bg);
        color: var(--noc-pie-tooltip-fg);
        font-size: 0.6875rem;
        padding: 6px 11px;
        border-radius: 6px;
        pointer-events: none;
        opacity: 0;
        transform: translateY(4px);
        transition: opacity 0.13s ease, transform 0.13s ease;
        white-space: nowrap;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 24px rgba(0,0,0,.45);
      }

      .tooltip.on {
        opacity: 1;
        transform: translateY(0);
      }

      .tt-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
      .tt-pct { opacity: 0.45; margin-left: 3px; }

      .legend--vertical {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .legend--horizontal {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 6px 14px;
      }

      .legend-row {
        display: flex;
        align-items: center;
        gap: 7px;
        cursor: pointer;
        transition: opacity 0.13s ease;
        padding: 2px 0;
      }

      .legend-row:hover { opacity: 0.6; }

      .swatch {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .lbl {
        font-size: 0.625rem;
        color: var(--noc-pie-fg);
        flex: 1;
      }

      .val {
        font-size: 0.625rem;
        color: var(--noc-pie-muted);
      }
    </style>

    <div class="card" part="base">
      ${title ? `<div class="title" part="title">${title}</div>` : ''}

      <div class="wrap" part="chart">
        <svg viewBox="0 0 200 200" aria-label="${title || 'Pie chart'}" role="img">
          ${paths}
        </svg>
        ${isDonut ? `
          <div class="donut-center" part="donut-center">
            <div class="donut-val" id="donut-val">${total.toLocaleString()}</div>
            <div class="donut-sub" id="donut-sub">${donutLabel}</div>
          </div>` : ''}
      </div>

      ${legendHTML}
    </div>

    <div class="tooltip" id="tooltip" part="tooltip">
      <span class="tt-dot"  id="tt-dot"></span>
      <span id="tt-label"></span>
      <span id="tt-value"></span>
      <span class="tt-pct"  id="tt-pct"></span>
    </div>
  `;
}

class NocPieChart extends HTMLElement {

  static get observedAttributes() {
    return ['data', 'title', 'donut', 'donut-label', 'no-legend', 'no-title', 'no-bg', 'legend-layout'];
  }

  static get _defaultPalette() {
    return ['#ff5500','#ff8c42','#ffcf77','#a8dadc','#457b9d','#e63946','#2ec4b6','#cbf3f0','#ffbf69','#ff9f1c','#a239ca'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal && this.isConnected) {
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

  _resolvePalette() {
    const raw = getComputedStyle(this).getPropertyValue('--noc-pie-palette').trim();

    if (raw) {
      return raw.split(',').map(s => s.trim()).filter(Boolean);
    }

    return NocPieChart._defaultPalette;
  }

  _colorFor(item, index, palette) {
    return item.color || palette[index % palette.length];
  }

  _buildSlices(items, palette) {
    const total = items.reduce((s, d) => s + (d.value || 0), 0);

    if (total === 0) {
      return { slices: [], total };
    }

    const isDonut = this.hasAttribute('donut');
    const cx = 100, cy = 100, r = 98;
    const inner = isDonut ? r * 0.58 : 0;

    let angle = -Math.PI / 2;

    const slices = items.map((item, i) => {
      const pct   = item.value / total;
      const sweep = pct * 2 * Math.PI;
      const x1    = cx + r * Math.cos(angle);
      const y1    = cy + r * Math.sin(angle);
      angle      += sweep;
      const x2    = cx + r * Math.cos(angle);
      const y2    = cy + r * Math.sin(angle);
      const ix1   = cx + inner * Math.cos(angle - sweep);
      const iy1   = cy + inner * Math.sin(angle - sweep);
      const ix2   = cx + inner * Math.cos(angle);
      const iy2   = cy + inner * Math.sin(angle);
      const large = sweep > Math.PI ? 1 : 0;
      const color = this._colorFor(item, i, palette);

      const d = inner > 0
        ? `M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${ix2} ${iy2} A${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1}Z`
        : `M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2}Z`;

      return { d, color, item, pct, index: i };
    });

    return { slices, total };
  }

  _render() {
    const items = this.data;

    if (!items.length) {
      this.shadowRoot.innerHTML = '';
      return;
    }

    const isDonut      = this.hasAttribute('donut');
    const noBg         = this.hasAttribute('no-bg');
    const noLegend     = this.hasAttribute('no-legend');
    const noTitle      = this.hasAttribute('no-title');
    const legendLayout = this.getAttribute('legend-layout') || 'vertical';
    const title        = noTitle ? '' : (this.getAttribute('title') || '');
    const donutLabel   = this.getAttribute('donut-label') || 'total';

    const palette           = this._resolvePalette();
    const { slices, total } = this._buildSlices(items, palette);

    const paths = slices.map(s =>
      `<path
        d="${s.d}"
        fill="${s.color}"
        class="slice"
        tabindex="0"
        role="img"
        aria-label="${s.item.label}: ${s.item.value} (${Math.round(s.pct * 100)}%)"
        data-index="${s.index}"
      />`
    ).join('');

    const legendRows = slices.map(s => `
      <div class="legend-row" data-index="${s.index}">
        <span class="swatch" style="background:${s.color}"></span>
        <span class="lbl">${s.item.label}</span>
        <span class="val">${Math.round(s.pct * 100)}%</span>
      </div>
    `).join('');

    this.shadowRoot.innerHTML = buildTemplate(
      {}, slices, total, isDonut, noBg, noLegend, title, donutLabel, legendLayout, paths, legendRows
    );

    this._bindEvents(slices, total, isDonut, donutLabel);
  }

  _bindEvents(slices, total, isDonut, donutLabel) {
    const sr      = this.shadowRoot;
    const tooltip = sr.getElementById('tooltip');
    const ttDot   = sr.getElementById('tt-dot');
    const ttLabel = sr.getElementById('tt-label');
    const ttValue = sr.getElementById('tt-value');
    const ttPct   = sr.getElementById('tt-pct');
    const dVal    = sr.getElementById('donut-val');
    const dSub    = sr.getElementById('donut-sub');

    const posTooltip = (e) => {
      let x = e.clientX + 14;
      let y = e.clientY + 14;
      if (x + 200 > window.innerWidth)  { x = e.clientX - 14 - 200; }
      if (y + 48  > window.innerHeight) { y = e.clientY - 14 - 48; }
      tooltip.style.left = `${x}px`;
      tooltip.style.top  = `${y}px`;
    };

    const showSlice = (e, s) => {
      ttDot.style.background = s.color;
      ttLabel.textContent    = s.item.label;
      ttValue.textContent    = s.item.value.toLocaleString();
      ttPct.textContent      = `${Math.round(s.pct * 100)}%`;
      tooltip.classList.add('on');
      posTooltip(e);

      if (dVal) { dVal.textContent = s.item.value.toLocaleString(); }
      if (dSub) { dSub.textContent = s.item.label; }

      this.dispatchEvent(new CustomEvent('noc-slice-enter', {
        bubbles:  true,
        composed: true,
        detail: {
          index:   s.index,
          label:   s.item.label,
          value:   s.item.value,
          percent: Math.round(s.pct * 100),
          color:   s.color,
        }
      }));
    };

    const hideSlice = () => {
      tooltip.classList.remove('on');

      if (dVal) { dVal.textContent = total.toLocaleString(); }
      if (dSub) { dSub.textContent = donutLabel; }

      this.dispatchEvent(new CustomEvent('noc-slice-leave', {
        bubbles: true, composed: true
      }));
    };

    sr.querySelectorAll('.slice').forEach((el, i) => {
      el.addEventListener('mouseenter', e => showSlice(e, slices[i]));
      el.addEventListener('mousemove',  posTooltip);
      el.addEventListener('mouseleave', hideSlice);
      el.addEventListener('focus',      e => showSlice(e, slices[i]));
      el.addEventListener('blur',       hideSlice);
    });

    sr.querySelectorAll('.legend-row').forEach((row, i) => {
      const getSlice = () => sr.querySelectorAll('.slice')[i];

      row.addEventListener('mouseenter', () => {
        const el = getSlice();
        if (el) { el.classList.add('active'); }
      });

      row.addEventListener('mouseleave', () => {
        const el = getSlice();
        if (el) { el.classList.remove('active'); }
      });
    });
  }
}

customElements.define('noc-pie-chart', NocPieChart);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
