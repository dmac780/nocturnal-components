// nocturnal-components/components/sparkline/sparkline.js

/**
 * @customElement noc-sparkline
 * 
 * Attributes:
 * @attr {string} data - Space-separated numeric values to visualize. Minimum 2 values required.
 * @attr {string} label - Descriptive label for accessibility (not visible, announced by screen readers).
 * @attr {'solid' | 'gradient' | 'line'} appearance - How the sparkline fills. Defaults to 'solid'.
 * @attr {'positive' | 'neutral' | 'negative'} trend - Color theme based on data trend. Defaults to 'neutral'.
 * @attr {'linear' | 'natural' | 'step'} curve - How data points connect. Defaults to 'linear'.
 * @attr {'sm' | 'md' | 'lg'} size - The size of the sparkline. Defaults to 'md'.
 * @attr {string} color - Custom color for the sparkline (overrides trend colors).
 * @attr {boolean} show-dots - If present, shows dots at each data point.
 * @attr {boolean} show-area - If present, fills the area under the line.
 * @attr {number} min - Minimum value for the Y-axis scale. If not set, uses data minimum.
 * @attr {number} max - Maximum value for the Y-axis scale. If not set, uses data maximum.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-sparkline-width - The width of the sparkline. Defaults to 100px.
 * @cssprop --noc-sparkline-height - The height of the sparkline. Defaults to 32px.
 * @cssprop --noc-sparkline-color - The color of the sparkline stroke and fill.
 * @cssprop --noc-sparkline-stroke-width - The width of the sparkline stroke.
 * @cssprop --noc-sparkline-opacity - The opacity of the filled area.
 * 
 * Events:
 * @event noc-sparkline-render - Emitted when the sparkline is rendered. Detail contains { data: number[], min: number, max: number }.
 */

function buildTemplate(attrs = {}, svgContent = '') {
  const label      = attrs.label      || 'Sparkline chart';
  const appearance = attrs.appearance || 'solid';
  const trend      = attrs.trend      || 'neutral';
  const size       = attrs.size       || 'md';
  const color      = attrs.color      || (trend === 'positive' ? '#10b981' : trend === 'negative' ? '#ef4444' : '#6b7280');
  const gradientId = attrs.gradientId || 'gradient-ssr';

  if (!svgContent) {
    return `
      <style>
        :host {
          display: inline-block;
          font-family: inherit;
        }
        .empty {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          color: #999;
          font-style: italic;
        }
      </style>
      <span class="empty">No data</span>
    `;
  }

  return `
    <style>
      :host {
        display: inline-block;
        font-family: inherit;
        --noc-sparkline-width: 100px;
        --noc-sparkline-height: 32px;
        --noc-sparkline-color: ${color};
        --noc-sparkline-stroke-width: 1.5;
        --noc-sparkline-opacity: 0.2;
      }

      :host([size="sm"]) {
        --noc-sparkline-width: 60px;
        --noc-sparkline-height: 20px;
        --noc-sparkline-stroke-width: 1;
      }

      :host([size="lg"]) {
        --noc-sparkline-width: 140px;
        --noc-sparkline-height: 48px;
        --noc-sparkline-stroke-width: 2;
      }

      .sparkline {
        display: inline-block;
        width: var(--noc-sparkline-width);
        height: var(--noc-sparkline-height);
        vertical-align: middle;
      }

      svg {
        display: block;
        width: 100%;
        height: 100%;
      }

      .area {
        fill: var(--noc-sparkline-color);
        opacity: var(--noc-sparkline-opacity);
      }

      .area.gradient {
        fill: url(#${gradientId});
        opacity: 1;
      }

      .line {
        fill: none;
        stroke: var(--noc-sparkline-color);
        stroke-width: var(--noc-sparkline-stroke-width);
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .dot {
        fill: var(--noc-sparkline-color);
        stroke: #000;
        stroke-width: 0.5;
      }

      :host([trend="positive"]) {
        --noc-sparkline-color: #10b981;
      }

      :host([trend="negative"]) {
        --noc-sparkline-color: #ef4444;
      }

      :host([trend="neutral"]) {
        --noc-sparkline-color: #6b7280;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }
    </style>

    ${svgContent}
  `;
}

class NocSparkline extends HTMLElement {
  static get observedAttributes() {
    return [
      'data', 'label', 'appearance', 'trend', 'curve',
      'size', 'color', 'show-dots', 'show-area', 'min', 'max'
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._data = [];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  _parseData() {
    const dataAttr = this.getAttribute('data') || '';
    const values = dataAttr.trim().split(/\s+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
    
    if (values.length < 2) {
      console.warn('noc-sparkline: At least 2 data values are required');
      return [];
    }
    
    return values;
  }

  _getMinMax(data) {
    const minAttr = this.getAttribute('min');
    const maxAttr = this.getAttribute('max');
    
    const dataMin = Math.min(...data);
    const dataMax = Math.max(...data);
    
    const min = minAttr !== null ? parseFloat(minAttr) : dataMin;
    const max = maxAttr !== null ? parseFloat(maxAttr) : dataMax;
    
    return { min, max };
  }

  _createPath(data, width, height, curve) {
    if (data.length === 0) {
      return '';
    }

    const { min, max } = this._getMinMax(data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return { x, y };
    });

    if (curve === 'step') {
      return this._createStepPath(points);
    } else if (curve === 'natural') {
      return this._createNaturalPath(points);
    } else {
      return this._createLinearPath(points);
    }
  }

  _createLinearPath(points) {
    if (points.length === 0) {
      return '';
    }
    
    let path = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x},${points[i].y}`;
    }
    
    return path;
  }

  _createStepPath(points) {
    if (points.length === 0) {
      return '';
    }
    
    let path = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currPoint = points[i];
      path += ` L ${currPoint.x},${prevPoint.y}`;
      path += ` L ${currPoint.x},${currPoint.y}`;
    }
    
    return path;
  }

  _createNaturalPath(points) {
    if (points.length === 0) {
      return '';
    }
    
    if (points.length === 2) {
      return this._createLinearPath(points);
    }

    let path = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;
      
      path += ` Q ${controlX},${current.y} ${controlX},${(current.y + next.y) / 2}`;
      path += ` Q ${controlX},${next.y} ${next.x},${next.y}`;
    }
    
    return path;
  }

  _createAreaPath(linePath, width, height) {
    if (!linePath) {
      return '';
    }
    
    return `${linePath} L ${width},${height} L 0,${height} Z`;
  }

  _getTrendColor(trend) {
    const colors = {
      positive: '#10b981',
      negative: '#ef4444',
      neutral: '#6b7280'
    };
    
    return colors[trend] || colors.neutral;
  }

  render() {
    const data = this._parseData();
    
    if (data.length < 2) {
      this.shadowRoot.innerHTML = buildTemplate({});
      return;
    }

    this._data = data;
    const { min, max } = this._getMinMax(data);
    
    const label      = this.getAttribute('label')      || 'Sparkline chart';
    const appearance = this.getAttribute('appearance') || 'solid';
    const trend      = this.getAttribute('trend')      || 'neutral';
    const curve      = this.getAttribute('curve')      || 'linear';
    const size       = this.getAttribute('size')       || 'md';
    const customColor = this.getAttribute('color');
    const showDots   = this.hasAttribute('show-dots');
    const showArea   = this.hasAttribute('show-area');

    const width  = 100;
    const height = 32;
    const padding = 2;
    const actualWidth  = width  - padding * 2;
    const actualHeight = height - padding * 2;

    const linePath = this._createPath(data, actualWidth, actualHeight, curve);
    const areaPath = (showArea || appearance !== 'line') ? this._createAreaPath(linePath, actualWidth, actualHeight) : '';

    const color = customColor || this._getTrendColor(trend);

    const points = data.map((value, index) => {
      const range = max - min || 1;
      const x = (index / (data.length - 1)) * actualWidth + padding;
      const y = actualHeight - ((value - min) / range) * actualHeight + padding;
      return { x, y };
    });

    const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

    const svgContent = `
      <div class="sparkline" role="img" aria-label="${label}">
        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
          <defs>
            <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color: ${color}; stop-opacity: 0.4" />
              <stop offset="100%" style="stop-color: ${color}; stop-opacity: 0.05" />
            </linearGradient>
          </defs>
          
          ${areaPath && appearance !== 'line' ? `
            <path 
              class="area ${appearance === 'gradient' ? 'gradient' : ''}" 
              d="${areaPath}"
            />
          ` : ''}
          
          <path 
            class="line" 
            d="${linePath}"
          />
          
          ${showDots ? points.map(p => `
            <circle 
              class="dot" 
              cx="${p.x}" 
              cy="${p.y}" 
              r="${size === 'sm' ? '1.5' : size === 'lg' ? '2.5' : '2'}"
            />
          `).join('') : ''}
        </svg>
        <span class="sr-only">${label}: ${data.join(', ')}</span>
      </div>
    `;

    this.shadowRoot.innerHTML = buildTemplate(
      { label, appearance, trend, size, color, gradientId },
      svgContent
    );

    this.dispatchEvent(new CustomEvent('noc-sparkline-render', {
      bubbles: true,
      composed: true,
      detail: { data, min, max }
    }));
  }
}

customElements.define('noc-sparkline', NocSparkline);

export function ssrTemplate(attrs = {}) {
  const dataAttr = attrs.data || '';
  const values   = dataAttr.trim().split(/\s+/).map(v => parseFloat(v)).filter(v => !isNaN(v));

  if (values.length < 2) {
    return `<template shadowrootmode="open">${buildTemplate({})}</template>`;
  }

  const label      = attrs.label      || 'Sparkline chart';
  const appearance = attrs.appearance || 'solid';
  const trend      = attrs.trend      || 'neutral';
  const curve      = attrs.curve      || 'linear';
  const size       = attrs.size       || 'md';
  const customColor = attrs.color;
  const showDots   = 'show-dots' in attrs;
  const showArea   = 'show-area' in attrs;

  const colors = { positive: '#10b981', negative: '#ef4444', neutral: '#6b7280' };
  const color  = customColor || colors[trend] || colors.neutral;

  const width  = 100;
  const height = 32;
  const padding = 2;
  const actualWidth  = width  - padding * 2;
  const actualHeight = height - padding * 2;

  const minVal  = attrs.min !== undefined ? parseFloat(attrs.min) : Math.min(...values);
  const maxVal  = attrs.max !== undefined ? parseFloat(attrs.max) : Math.max(...values);
  const range   = maxVal - minVal || 1;

  const points = values.map((value, index) => ({
    x: (index / (values.length - 1)) * actualWidth,
    y: actualHeight - ((value - minVal) / range) * actualHeight,
  }));

  let linePath = `M ${points[0].x},${points[0].y}`;
  if (curve === 'step') {
    for (let i = 1; i < points.length; i++) {
      linePath += ` L ${points[i].x},${points[i - 1].y} L ${points[i].x},${points[i].y}`;
    }
  } else if (curve === 'natural' && points.length > 2) {
    for (let i = 0; i < points.length - 1; i++) {
      const c = points[i], n = points[i + 1];
      const cx = (c.x + n.x) / 2;
      linePath += ` Q ${cx},${c.y} ${cx},${(c.y + n.y) / 2} Q ${cx},${n.y} ${n.x},${n.y}`;
    }
  } else {
    for (let i = 1; i < points.length; i++) {
      linePath += ` L ${points[i].x},${points[i].y}`;
    }
  }

  const areaPath = (showArea || appearance !== 'line')
    ? `${linePath} L ${actualWidth},${actualHeight} L 0,${actualHeight} Z`
    : '';

  const dotPoints = points.map(p => ({
    x: p.x + padding,
    y: p.y + padding,
  }));

  const gradientId = 'gradient-ssr';

  const svgContent = `
    <div class="sparkline" role="img" aria-label="${label}">
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: ${color}; stop-opacity: 0.4" />
            <stop offset="100%" style="stop-color: ${color}; stop-opacity: 0.05" />
          </linearGradient>
        </defs>
        
        ${areaPath && appearance !== 'line' ? `
          <path 
            class="area ${appearance === 'gradient' ? 'gradient' : ''}" 
            d="${areaPath}"
          />
        ` : ''}
        
        <path class="line" d="${linePath}" />
        
        ${showDots ? dotPoints.map(p => `
          <circle 
            class="dot" 
            cx="${p.x}" 
            cy="${p.y}" 
            r="${size === 'sm' ? '1.5' : size === 'lg' ? '2.5' : '2'}"
          />
        `).join('') : ''}
      </svg>
      <span class="sr-only">${label}: ${values.join(', ')}</span>
    </div>
  `;

  return `<template shadowrootmode="open">${buildTemplate({ label, appearance, trend, size, color, gradientId }, svgContent)}</template>`;
}
