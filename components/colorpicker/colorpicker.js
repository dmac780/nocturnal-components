// nocturnal-components/components/colorpicker/colorpicker.js

/**
 * @customElement noc-color-picker
 * 
 * @slot - Default slot for custom content (not typically used).
 * 
 * Attributes:
 * @attr {string} value - The initial color value (hex, rgb, hsl, or hsv). Defaults to '#ff0000'.
 * @attr {string} format - Output format: 'hex', 'rgb', 'hsl', or 'hsv'. Defaults to 'hex'.
 * @attr {string} swatches - Comma-separated list of color swatches (e.g., "#ff0000,#00ff00,#0000ff").
 * @attr {string} label - Label text to display on the trigger button in popup mode.
 * @attr {boolean} inline - If present, the picker is always visible (no trigger button).
 * @attr {boolean} disabled - Whether the picker is disabled.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-picker-border-radius - Border radius for picker elements. Defaults to 10px.
 * @cssprop --noc-picker-panel-bg - Background color of the picker panel. Defaults to #1a1a20.
 * @cssprop --noc-picker-panel-border - Border style for the panel. Defaults to 1px solid #2e2e38.
 * @cssprop --noc-picker-panel-shadow - Box shadow for the popup panel.
 * @cssprop --noc-picker-trigger-bg - Background color of the trigger button.
 * @cssprop --noc-picker-trigger-border - Border style for the trigger button.
 * @cssprop --noc-picker-trigger-color - Text color of the trigger button.
 * @cssprop --noc-picker-input-bg - Background color of input fields.
 * @cssprop --noc-picker-input-border - Border style for input fields.
 * @cssprop --noc-picker-input-color - Text color of input fields.
 * @cssprop --noc-picker-input-radius - Border radius for input fields.
 * @cssprop --noc-picker-focus-ring - Focus ring style.
 * @cssprop --noc-picker-swatch-size - Size of swatch buttons. Defaults to 24px.
 * @cssprop --noc-picker-swatch-radius - Border radius of swatch buttons. Defaults to 6px.
 * @cssprop --noc-picker-thumb-size - Size of slider thumbs. Defaults to 14px.
 * @cssprop --noc-picker-track-height - Height of slider tracks. Defaults to 12px.
 * 
 * Events:
 * @event color-change - Emitted when the color value changes. Detail contains hex, rgb, alpha, value, h, s, v.
 * @event noc-change - Alias for color-change, for consistency with other noc components.
 */

function buildTemplate(attrs = {}) {
  const value    = attrs.value || '#ff0000';
  const label    = attrs.label || 'Pick color';
  const disabled = 'disabled' in attrs;

  return `
    <style>
      :host { display: inline-block; }
      .fallback {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0.75rem;
        background: #2a2a2a;
        border: 1px solid #444;
        border-radius: 6px;
        font-family: inherit;
        font-size: 0.875rem;
        color: #eee;
        cursor: pointer;
      }
      .swatch {
        width: 16px;
        height: 16px;
        border-radius: 3px;
        background: ${value};
        border: 1px solid rgba(255,255,255,0.15);
        flex-shrink: 0;
      }
      input[type="color"] {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
        pointer-events: none;
      }
    </style>
    <label class="fallback" part="base">
      <div class="swatch" part="swatch"></div>
      <span>${label}</span>
      <input type="color" value="${value}" ${disabled ? 'disabled' : ''} />
    </label>
  `;
}

class NocColorPicker extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'format', 'swatches', 'label', 'inline', 'disabled'];
  }


  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hue = 0;
    this._sat = 100;
    this._val = 100;
    this._alpha = 1;
    this._format = 'hex';
    this._open = false;
    this._dragging = null;
    this._initialized = false;
  }

  connectedCallback() {
    this._format = this.getAttribute('format') || 'hex';
    const initColor = this.getAttribute('value') || '#ff0000';
    this._setFromHex(this._parseToHex(initColor));
    this._render();
    this._bind();
    this._initialized = true;
  }

  disconnectedCallback() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this._initialized) return;
    if (name === 'value' && newVal) {
      this._setFromHex(this._parseToHex(newVal));
      this._updateAll();
    }
    if (name === 'format') {
      this._format = newVal;
      this._updateInput();
    }
  }

  _hsvToRgb(h, s, v) {
    s /= 100; v /= 100;
    const k = (n) => (n + h / 60) % 6;
    const f = (n) => v - v * s * Math.max(0, Math.min(k(n), 4 - k(n), 1));
    return [Math.round(f(5)*255), Math.round(f(3)*255), Math.round(f(1)*255)];
  }

  _rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
    let h = 0, s = max === 0 ? 0 : d/max, v = max;
    if (d) {
      if (max === r) h = ((g-b)/d) % 6;
      else if (max === g) h = (b-r)/d + 2;
      else h = (r-g)/d + 4;
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }
    return [h, Math.round(s*100), Math.round(v*100)];
  }

  _rgbToHex(r, g, b) {
    return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
  }

  _hexToRgb(hex) {
    hex = hex.replace('#','');
    if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
    const n = parseInt(hex, 16);
    return [(n>>16)&255, (n>>8)&255, n&255];
  }

  _parseToHex(color) {
    color = color.trim();
    if (/^#[0-9a-f]{3,6}$/i.test(color)) {
      let h = color.replace('#','');
      if (h.length === 3) h = h.split('').map(c=>c+c).join('');
      return '#' + h.slice(0,6);
    }
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbMatch) {
      this._alpha = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1;
      return this._rgbToHex(+rgbMatch[1], +rgbMatch[2], +rgbMatch[3]);
    }
    const hslMatch = color.match(/hsla?\(([\d.]+),\s*([\d.]+)%?,\s*([\d.]+)%?(?:,\s*([\d.]+))?\)/);
    if (hslMatch) {
      this._alpha = hslMatch[4] !== undefined ? parseFloat(hslMatch[4]) : 1;
      const [r,g,b] = this._hslToRgb(+hslMatch[1], +hslMatch[2], +hslMatch[3]);
      return this._rgbToHex(r,g,b);
    }
    return '#ff0000';
  }

  _hslToRgb(h, s, l) {
    s/=100; l/=100;
    const k = n => (n + h/30) % 12;
    const a = s * Math.min(l, 1-l);
    const f = n => l - a * Math.max(-1, Math.min(k(n)-3, 9-k(n), 1));
    return [Math.round(f(0)*255), Math.round(f(8)*255), Math.round(f(4)*255)];
  }

  _rgbToHsl(r, g, b) {
    r/=255; g/=255; b/=255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    let h=0, s=0, l=(max+min)/2;
    if (max!==min) {
      const d=max-min;
      s=l>.5 ? d/(2-max-min) : d/(max+min);
      if (max===r) h=((g-b)/d+(g<b?6:0))/6;
      else if (max===g) h=((b-r)/d+2)/6;
      else h=((r-g)/d+4)/6;
    }
    return [Math.round(h*360), Math.round(s*100), Math.round(l*100)];
  }

  _setFromHex(hex) {
    const [r,g,b] = this._hexToRgb(hex);
    const [h,s,v] = this._rgbToHsv(r,g,b);
    this._hue = h;
    this._sat = s;
    this._val = v;
  }

  _currentRgb() { return this._hsvToRgb(this._hue, this._sat, this._val); }
  _currentHex() { return this._rgbToHex(...this._currentRgb()); }

  _currentFormatted() {
    const [r,g,b] = this._currentRgb();
    const a = this._alpha;
    switch(this._format) {
      case 'rgb':
        return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
      case 'hsl': {
        const [h,s,l] = this._rgbToHsl(r,g,b);
        return a < 1 ? `hsla(${h}, ${s}%, ${l}%, ${a})` : `hsl(${h}, ${s}%, ${l}%)`;
      }
      case 'hsv':
        return `hsv(${this._hue}, ${this._sat}%, ${this._val}%)`;
      default: {
        const hex = this._currentHex();
        if (a < 1) {
          const aa = Math.round(a*255).toString(16).padStart(2,'0');
          return hex + aa;
        }
        return hex;
      }
    }
  }

  _render() {
    const isInline = this.hasAttribute('inline');
    const swatchList = this.getAttribute('swatches') || '';
    const swatches = swatchList ? swatchList.split(',').map(s=>s.trim()).filter(Boolean) : [];
    const label = this.getAttribute('label') || 'Color';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          font-family: inherit;
          font-size: inherit;
          --luna-picker-border-radius: 8px;
          --luna-picker-panel-bg: #1a1a20;
          --luna-picker-panel-border: 1px solid #2e2e38;
          --luna-picker-panel-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4);
          --luna-picker-trigger-bg: rgba(255, 255, 255, 0.08);
          --luna-picker-trigger-border: 1px solid rgba(255, 255, 255, 0.1);
          --luna-picker-trigger-color: #eee;
          --luna-picker-input-bg: #13131a;
          --luna-picker-input-border: 1px solid #2e2e38;
          --luna-picker-input-color: #d0cec8;
          --luna-picker-input-radius: 6px;
          --luna-picker-focus-ring: 0 0 0 2px rgba(120,120,255,0.4);
          --luna-picker-swatch-size: 24px;
          --luna-picker-swatch-radius: 6px;
          --luna-picker-thumb-size: 14px;
          --luna-picker-track-height: 12px;
          position: relative;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .trigger {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.5rem 0.875rem;
          background: var(--luna-picker-trigger-bg);
          border: var(--luna-picker-trigger-border);
          border-radius: var(--luna-picker-border-radius);
          cursor: pointer;
          color: var(--luna-picker-trigger-color);
          font-family: inherit;
          font-size: inherit;
          font-weight: 500;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
          white-space: nowrap;
          width: 100%;
          justify-content: space-between;
          min-height: 2.5rem;
        }
        .trigger:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .trigger:active {
          transform: translateY(1px);
        }
        .trigger-left { display: flex; align-items: center; gap: 0.55rem; }
        .trigger-swatch {
          width: 22px;
          height: 22px;
          border-radius: 5px;
          border: 1px solid rgba(255,255,255,0.1);
          flex-shrink: 0;
        }
        .trigger-caret {
          opacity: 0.5;
          font-size: 0.65rem;
          transition: transform 0.2s;
        }
        .trigger-caret.open { transform: rotate(180deg); }

        .panel {
          background: var(--luna-picker-panel-bg);
          border: var(--luna-picker-panel-border);
          border-radius: var(--luna-picker-border-radius);
          box-shadow: var(--luna-picker-panel-shadow);
          overflow: hidden;
          width: 260px;
        }

        .popup-wrapper {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          z-index: 9999;
          opacity: 0;
          transform: translateY(-6px) scale(0.97);
          pointer-events: none;
          transition: opacity 0.18s, transform 0.18s;
          transform-origin: top left;
        }
        .popup-wrapper.open {
          opacity: 1;
          transform: none;
          pointer-events: all;
        }

        :host([inline]) .panel {
          width: 100%;
        }

        .canvas-area {
          position: relative;
          width: 100%;
          height: 180px;
          cursor: crosshair;
          flex-shrink: 0;
        }
        canvas#sv-canvas {
          width: 100%;
          height: 100%;
          display: block;
        }
        .sv-thumb {
          position: absolute;
          width: var(--luna-picker-thumb-size);
          height: var(--luna-picker-thumb-size);
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.5);
          transform: translate(-50%, -50%);
          pointer-events: none;
          transition: transform 0.05s;
        }

        .sliders {
          padding: 10px 12px 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .slider-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .color-preview-dot {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.12);
          flex-shrink: 0;
        }
        .slider-stack {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .slider-track {
          position: relative;
          height: var(--luna-picker-track-height);
          border-radius: 999px;
          cursor: pointer;
          overflow: visible;
        }
        .slider-track.hue {
          background: linear-gradient(to right,
            hsl(0,100%,50%),hsl(30,100%,50%),hsl(60,100%,50%),hsl(90,100%,50%),
            hsl(120,100%,50%),hsl(150,100%,50%),hsl(180,100%,50%),hsl(210,100%,50%),
            hsl(240,100%,50%),hsl(270,100%,50%),hsl(300,100%,50%),hsl(330,100%,50%),hsl(360,100%,50%)
          );
        }
        .slider-track.alpha {
          background-image:
            linear-gradient(45deg, #555 25%, transparent 25%),
            linear-gradient(-45deg, #555 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #555 75%),
            linear-gradient(-45deg, transparent 75%, #555 75%);
          background-size: 8px 8px;
          background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
          background-color: #333;
        }
        .alpha-gradient {
          position: absolute;
          inset: 0;
          border-radius: 999px;
        }
        .slider-thumb {
          position: absolute;
          top: 50%;
          width: var(--luna-picker-thumb-size);
          height: var(--luna-picker-thumb-size);
          border-radius: 50%;
          background: #fff;
          border: 2px solid #fff;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.4);
          transform: translate(-50%, -50%);
          pointer-events: none;
          cursor: grab;
        }

        .inputs-row {
          padding: 10px 12px 12px;
          display: flex;
          gap: 6px;
          align-items: stretch;
        }
        .format-btn {
          background: var(--luna-picker-input-bg);
          border: var(--luna-picker-input-border);
          border-radius: var(--luna-picker-input-radius);
          color: #666;
          font: 0.65rem inherit;
          cursor: pointer;
          padding: 0 8px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: color 0.15s, border-color 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .format-btn:hover { color: var(--luna-picker-input-color); border-color: #4a4a60; }
        .value-input {
          flex: 1;
          background: var(--luna-picker-input-bg);
          border: var(--luna-picker-input-border);
          border-radius: var(--luna-picker-input-radius);
          color: var(--luna-picker-input-color);
          font: 0.75rem inherit;
          padding: 6px 10px;
          outline: none;
          min-width: 0;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .value-input:focus {
          border-color: #4a4a70;
          box-shadow: var(--luna-picker-focus-ring);
        }
        .copy-btn {
          background: var(--luna-picker-input-bg);
          border: var(--luna-picker-input-border);
          border-radius: var(--luna-picker-input-radius);
          color: #555;
          cursor: pointer;
          padding: 0 9px;
          font-size: 0.85rem;
          transition: color 0.15s;
          flex-shrink: 0;
        }
        .copy-btn:hover { color: #aaa; }
        .copy-btn.copied { color: #6dde8a; }

        .swatches {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          padding: 0 12px 12px;
          border-top: var(--luna-picker-panel-border);
          padding-top: 10px;
          margin-top: 0;
        }
        .swatch {
          width: var(--luna-picker-swatch-size);
          height: var(--luna-picker-swatch-size);
          border-radius: var(--luna-picker-swatch-radius);
          border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer;
          transition: transform 0.12s, box-shadow 0.12s;
          flex-shrink: 0;
        }
        .swatch:hover {
          transform: scale(1.2);
          box-shadow: 0 2px 10px rgba(0,0,0,0.5);
          z-index: 1;
          position: relative;
        }
        .swatch.active {
          box-shadow: 0 0 0 2px #fff, 0 0 0 3px rgba(0,0,0,0.3);
        }
      </style>

      ${isInline ? `
        <div class="panel">
          ${this._renderPanelContent(swatches)}
        </div>
      ` : `
        <button class="trigger" id="trigger" aria-haspopup="dialog" aria-expanded="false">
          <span class="trigger-left">
            <span class="trigger-swatch" id="trigger-swatch"></span>
            <span class="trigger-label" id="trigger-label">${label}</span>
          </span>
          <span class="trigger-caret" id="trigger-caret">▼</span>
        </button>
        <div class="popup-wrapper" id="popup" role="dialog">
          <div class="panel">
            ${this._renderPanelContent(swatches)}
          </div>
        </div>
      `}
    `;
  }

  _renderPanelContent(swatches) {
    const swatchHtml = swatches.length ? `
      <div class="swatches" id="swatches">
        ${swatches.map(s => `<div class="swatch" style="background:${s}" data-color="${s}" title="${s}"></div>`).join('')}
      </div>
    ` : '';

    return `
      <div class="canvas-area" id="canvas-area">
        <canvas id="sv-canvas"></canvas>
        <div class="sv-thumb" id="sv-thumb"></div>
      </div>
      <div class="sliders">
        <div class="slider-row">
          <div class="color-preview-dot" id="preview-dot"></div>
          <div class="slider-stack">
            <div class="slider-track hue" id="hue-track">
              <div class="slider-thumb" id="hue-thumb"></div>
            </div>
            <div class="slider-track alpha" id="alpha-track">
              <div class="alpha-gradient" id="alpha-gradient"></div>
              <div class="slider-thumb" id="alpha-thumb"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="inputs-row">
        <button class="format-btn" id="format-btn">${(this._format||'hex').toUpperCase()}</button>
        <input class="value-input" id="value-input" type="text" spellcheck="false" />
        <button class="copy-btn" id="copy-btn" title="Copy">⎘</button>
      </div>
      ${swatchHtml}
    `;
  }

  _bind() {
    const root = this.shadowRoot;
    const isInline = this.hasAttribute('inline');

    if (!isInline) {
      const trigger = root.getElementById('trigger');
      const popup = root.getElementById('popup');
      const caret = root.getElementById('trigger-caret');
      trigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        this._open = !this._open;
        popup.classList.toggle('open', this._open);
        caret.classList.toggle('open', this._open);
        trigger.setAttribute('aria-expanded', this._open);
        if (this._open) this._updateAll();
      });
      document.addEventListener('click', (e) => {
        if (!this.contains(e.target) && !root.contains(e.target)) {
          this._open = false;
          popup?.classList.remove('open');
          caret?.classList.remove('open');
          trigger?.setAttribute('aria-expanded', 'false');
        }
      });
    }

    const canvasArea = root.getElementById('canvas-area');
    const canvas = root.getElementById('sv-canvas');
    if (canvas && canvasArea) {
      this._resizeCanvas();
      this._resizeObserver = new ResizeObserver(() => this._resizeCanvas());
      this._resizeObserver.observe(canvasArea);

      const onSVMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        this._sat = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        this._val = Math.max(0, Math.min(100, 100 - ((clientY - rect.top) / rect.height) * 100));
        this._updateAll();
      };
      canvas.addEventListener('mousedown', (e) => {
        this._dragging = 'sv';
        onSVMove(e);
      });
      canvas.addEventListener('touchstart', (e) => { e.preventDefault(); this._dragging='sv'; onSVMove(e); }, {passive:false});
      document.addEventListener('mousemove', (e) => { if (this._dragging==='sv') onSVMove(e); });
      document.addEventListener('touchmove', (e) => { if (this._dragging==='sv') onSVMove(e); }, {passive:false});
      document.addEventListener('mouseup', () => { this._dragging=null; });
      document.addEventListener('touchend', () => { this._dragging=null; });
    }

    const hueTrack = root.getElementById('hue-track');
    if (hueTrack) {
      const onHueMove = (e) => {
        const rect = hueTrack.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        this._hue = Math.max(0, Math.min(360, ((clientX - rect.left) / rect.width) * 360));
        this._updateAll();
      };
      hueTrack.addEventListener('mousedown', (e) => { this._dragging='hue'; onHueMove(e); });
      hueTrack.addEventListener('touchstart', (e) => { e.preventDefault(); this._dragging='hue'; onHueMove(e); }, {passive:false});
      document.addEventListener('mousemove', (e) => { if (this._dragging==='hue') onHueMove(e); });
      document.addEventListener('touchmove', (e) => { if (this._dragging==='hue') onHueMove(e); }, {passive:false});
    }

    const alphaTrack = root.getElementById('alpha-track');
    if (alphaTrack) {
      const onAlphaMove = (e) => {
        const rect = alphaTrack.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        this._alpha = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        this._updateAll();
      };
      alphaTrack.addEventListener('mousedown', (e) => { this._dragging='alpha'; onAlphaMove(e); });
      alphaTrack.addEventListener('touchstart', (e) => { e.preventDefault(); this._dragging='alpha'; onAlphaMove(e); }, {passive:false});
      document.addEventListener('mousemove', (e) => { if (this._dragging==='alpha') onAlphaMove(e); });
      document.addEventListener('touchmove', (e) => { if (this._dragging==='alpha') onAlphaMove(e); }, {passive:false});
    }

    const formatBtn = root.getElementById('format-btn');
    if (formatBtn) {
      const formats = ['hex','rgb','hsl','hsv'];
      formatBtn.addEventListener('click', () => {
        const idx = formats.indexOf(this._format);
        this._format = formats[(idx + 1) % formats.length];
        formatBtn.textContent = this._format.toUpperCase();
        this._updateInput();
      });
    }

    const valueInput = root.getElementById('value-input');
    if (valueInput) {
      valueInput.addEventListener('change', () => {
        try {
          const hex = this._parseToHex(valueInput.value);
          this._setFromHex(hex);
          this._updateAll();
        } catch(e) {}
      });
      valueInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') valueInput.blur();
      });
    }

    const copyBtn = root.getElementById('copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard?.writeText(this._currentFormatted()).then(() => {
          copyBtn.textContent = '✓';
          copyBtn.classList.add('copied');
          setTimeout(() => { copyBtn.textContent = '⎘'; copyBtn.classList.remove('copied'); }, 1500);
        });
      });
    }

    const swatchesEl = root.getElementById('swatches');
    if (swatchesEl) {
      swatchesEl.addEventListener('click', (e) => {
        const sw = e.target.closest('.swatch');
        if (!sw) return;
        const hex = this._parseToHex(sw.dataset.color);
        this._setFromHex(hex);
        this._updateAll();
      });
    }

    this._updateAll();
  }

  _resizeCanvas() {
    const canvas = this.shadowRoot?.getElementById('sv-canvas');
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width || 260;
    canvas.height = rect.height || 180;
    this._drawCanvas();
  }

  _drawCanvas() {
    const canvas = this.shadowRoot?.getElementById('sv-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    const satGrad = ctx.createLinearGradient(0,0,W,0);
    satGrad.addColorStop(0, 'rgba(255,255,255,1)');
    satGrad.addColorStop(1, `hsl(${this._hue},100%,50%)`);
    ctx.fillStyle = satGrad;
    ctx.fillRect(0,0,W,H);

    const valGrad = ctx.createLinearGradient(0,0,0,H);
    valGrad.addColorStop(0, 'rgba(0,0,0,0)');
    valGrad.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = valGrad;
    ctx.fillRect(0,0,W,H);
  }

  _updateAll() {
    this._drawCanvas();
    this._updateSVThumb();
    this._updateHueThumb();
    this._updateAlpha();
    this._updateInput();
    this._updatePreviews();
    this._updateSwatchActive();
    this._dispatch();
  }

  _updateSVThumb() {
    const thumb = this.shadowRoot?.getElementById('sv-thumb');
    const canvas = this.shadowRoot?.getElementById('sv-canvas');
    if (!thumb || !canvas) return;
    const W = canvas.getBoundingClientRect().width || canvas.width;
    const H = canvas.getBoundingClientRect().height || canvas.height;
    const x = (this._sat / 100) * W;
    const y = (1 - this._val / 100) * H;
    thumb.style.left = x + 'px';
    thumb.style.top = y + 'px';
    const [r,g,b] = this._currentRgb();
    const brightness = (r*299+g*587+b*114)/1000;
    thumb.style.borderColor = brightness > 128 ? 'rgba(0,0,0,0.6)' : '#fff';
  }

  _updateHueThumb() {
    const thumb = this.shadowRoot?.getElementById('hue-thumb');
    const track = this.shadowRoot?.getElementById('hue-track');
    if (!thumb || !track) return;
    thumb.style.left = (this._hue / 360 * 100) + '%';
    thumb.style.background = `hsl(${this._hue},100%,50%)`;
  }

  _updateAlpha() {
    const thumb = this.shadowRoot?.getElementById('alpha-thumb');
    const grad = this.shadowRoot?.getElementById('alpha-gradient');
    if (!thumb || !grad) return;
    thumb.style.left = (this._alpha * 100) + '%';
    const [r,g,b] = this._currentRgb();
    grad.style.background = `linear-gradient(to right, rgba(${r},${g},${b},0), rgb(${r},${g},${b}))`;
  }

  _updateInput() {
    const input = this.shadowRoot?.getElementById('value-input');
    if (input) input.value = this._currentFormatted();
  }

  _updatePreviews() {
    const [r,g,b] = this._currentRgb();
    const dot = this.shadowRoot?.getElementById('preview-dot');
    if (dot) dot.style.background = `rgba(${r},${g},${b},${this._alpha})`;

    const triggerSwatch = this.shadowRoot?.getElementById('trigger-swatch');
    if (triggerSwatch) triggerSwatch.style.background = `rgba(${r},${g},${b},${this._alpha})`;
  }

  _updateSwatchActive() {
    const hex = this._currentHex().toLowerCase();
    this.shadowRoot?.querySelectorAll('.swatch').forEach(sw => {
      try {
        const swHex = this._parseToHex(sw.dataset.color).toLowerCase();
        sw.classList.toggle('active', swHex === hex);
      } catch(e) {}
    });
  }

  _dispatch() {
    const detail = {
      hex: this._currentHex(),
      rgb: this._hsvToRgb(this._hue, this._sat, this._val),
      alpha: this._alpha,
      value: this._currentFormatted(),
      h: this._hue,
      s: this._sat,
      v: this._val,
    };

    this.dispatchEvent(new CustomEvent('color-change', {
      detail,
      bubbles: true,
      composed: true,
    }));

    this.dispatchEvent(new CustomEvent('noc-change', {
      detail,
      bubbles: true,
      composed: true,
    }));
  }
}

customElements.define('noc-color-picker', NocColorPicker);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
