// nocturnal-components/components/code/code.js

/**
 * @customElement noc-code
 * 
 * @slot - The code content to be displayed and syntax-highlighted.
 * 
 * Attributes:
 * @attr {string} language - The programming language for syntax highlighting (html, js, css, etc.). Defaults to 'html'.
 * @attr {boolean} no-toolbar - If present, hides the toolbar with dots and copy button.
 * @attr {boolean} no-lines - If present, hides line numbers.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-code-bg - Background color of the code block. Defaults to #161618.
 * @cssprop --noc-code-border - Border color. Defaults to #2a2a2d.
 * @cssprop --noc-code-toolbar-bg - Background color of the toolbar. Defaults to #1c1c1f.
 * @cssprop --noc-code-text - Text color for code. Defaults to #b0b8c4.
 * @cssprop --noc-code-comment - Color for comments. Defaults to #5a8f5a.
 * @cssprop --noc-code-line-number - Color for line numbers. Defaults to #333.
 * @cssprop --noc-code-radius - Border radius. Defaults to 8px.
 * @cssprop --noc-code-font-size - Font size for code. Defaults to 0.82rem.
 * @cssprop --noc-code-line-height - Line height for code. Defaults to 1.65.
 * @cssprop --noc-code-padding - Padding inside code area. Defaults to 1.2rem 1.4rem.
 * 
 * Events:
 * @event noc-copy - Emitted when code is copied to clipboard.
 */

function buildTemplate(attrs = {}, linesHtml = '', lang = 'html') {
  const hasToolbar     = !('no-toolbar' in attrs);
  const hasLineNumbers = !('no-lines'   in attrs);

  return `
    <style>
      :host {
        display: block;
        font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
        --noc-code-bg: #161618;
        --noc-code-border: #2a2a2d;
        --noc-code-toolbar-bg: #1c1c1f;
        --noc-code-text: #b0b8c4;
        --noc-code-comment: #5a8f5a;
        --noc-code-line-number: #333;
        --noc-code-radius: 8px;
        --noc-code-font-size: 0.82rem;
        --noc-code-line-height: 1.65;
        --noc-code-padding: 1.2rem 1.4rem;
      }

      .wrapper {
        background: var(--noc-code-bg);
        border: 1px solid var(--noc-code-border);
        border-radius: var(--noc-code-radius);
        overflow: hidden;
        box-shadow: 0 4px 24px rgba(0,0,0,0.4);
      }

      .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.55rem 1rem;
        background: var(--noc-code-toolbar-bg);
        border-bottom: 1px solid var(--noc-code-border);
        user-select: none;
      }

      .toolbar.hidden { display: none; }

      .dots { display: flex; gap: 6px; }

      .dot { width: 11px; height: 11px; border-radius: 50%; }
      .dot-r { background: #ff5f57; }
      .dot-y { background: #ffbd2e; }
      .dot-g { background: #28c840; }

      .lang-badge {
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #444;
        font-family: inherit;
      }

      .copy-btn {
        background: none;
        border: 1px solid #333;
        border-radius: 4px;
        color: #555;
        font-size: 0.65rem;
        font-family: inherit;
        letter-spacing: 0.06em;
        padding: 2px 8px;
        cursor: pointer;
        transition: color 0.15s, border-color 0.15s;
      }

      .copy-btn:hover        { color: #aaa; border-color: #555; }
      .copy-btn.copied       { color: #4caf7d; border-color: #4caf7d; }

      .scroll {
        overflow-x: auto;
        padding: var(--noc-code-padding);
      }

      pre {
        margin: 0;
        padding: 0;
        white-space: pre;
        tab-size: 2;
        font-size: var(--noc-code-font-size);
        line-height: var(--noc-code-line-height);
      }

      code { color: #ffffff; display: block; }

      .cm  { color: #5a9e5a; font-style: italic; }
      .tg  { color: #6ab0f5; }
      .str { color: #e06c6c; }
      .pl  { color: #ffffff; }

      .line {
        display: ${hasLineNumbers ? 'grid' : 'block'};
        grid-template-columns: ${hasLineNumbers ? '2.4em 1fr' : '1fr'};
        gap: ${hasLineNumbers ? '0.8em' : '0'};
        min-height: calc(var(--noc-code-line-height) * 1em);
      }

      .ln {
        color: var(--noc-code-line-number);
        text-align: right;
        user-select: none;
        flex-shrink: 0;
      }
    </style>

    <div class="wrapper">
      <div class="toolbar ${hasToolbar ? '' : 'hidden'}">
        <div class="dots">
          <div class="dot dot-r"></div>
          <div class="dot dot-y"></div>
          <div class="dot dot-g"></div>
        </div>
        <span class="lang-badge" id="langBadge">${lang}</span>
        <button class="copy-btn" id="copyBtn">copy</button>
      </div>
      <div class="scroll">
        <pre><code id="codeEl">${linesHtml}</code></pre>
      </div>
    </div>
  `;
}

class NocCode extends HTMLElement {

  static get observedAttributes() {
    return ['language', 'no-toolbar', 'no-lines'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isRendered  = false;
    this._originalCode = '';
  }

  connectedCallback() {
    if (!this._isRendered) {
      this._originalCode = this.textContent;
      this._setup();
      this._isRendered = true;
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this._isRendered && oldValue !== newValue) {
      this._update();
    }
  }

  _setup() {
    const lang        = this.getAttribute('language') || 'html';
    const code        = this._dedent(this._originalCode).trim();
    const highlighted = this._highlight(code);
    const linesHtml   = this._buildLines(highlighted);
    this.shadowRoot.innerHTML = buildTemplate(
      {
        ...(this.hasAttribute('no-toolbar') ? { 'no-toolbar': true } : {}),
        ...(this.hasAttribute('no-lines')   ? { 'no-lines':   true } : {}),
      },
      linesHtml,
      this._escape(lang)
    );
    const copyBtn = this.shadowRoot.getElementById('copyBtn');
    if (copyBtn) copyBtn.addEventListener('click', () => this._handleCopy());
  }

  _update() {
    const lang        = this.getAttribute('language') || 'html';
    const code        = this._dedent(this._originalCode).trim();
    const highlighted = this._highlight(code);
    const codeEl      = this.shadowRoot.getElementById('codeEl');
    if (codeEl) codeEl.innerHTML = this._buildLines(highlighted);
    const langBadge = this.shadowRoot.getElementById('langBadge');
    if (langBadge) langBadge.textContent = this._escape(lang);
  }

  _dedent(str) {
    const lines = str.split('\n');
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    if (lines.length === 0) return '';
    const indent = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^(\s*)/)[1].length));
    return lines.map(l => l.slice(indent)).join('\n');
  }

  _escape(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  _highlight(code) { return this._tokenize(code); }

  _tokenize(src) {
    let out = '';
    let i = 0;
    const len = src.length;
    const peek = (n = 0) => src[i + n] || '';
    const slice = (a, b) => src.slice(a, b);

    while (i < len) {
      const ch = src[i];

      if (ch === '/' && peek(1) === '/') {
        const end = src.indexOf('\n', i);
        const raw = end === -1 ? slice(i) : slice(i, end);
        out += `<span class="cm">${this._escape(raw)}</span>`;
        i += raw.length;
        continue;
      }

      if (ch === '/' && peek(1) === '*') {
        const end = src.indexOf('*/', i + 2);
        const raw = end === -1 ? slice(i) : slice(i, end + 2);
        out += this._spanMultiline(raw, 'cm');
        i += raw.length;
        continue;
      }

      if (ch === '<' && slice(i, i + 4) === '<!--') {
        const end = src.indexOf('-->', i);
        const raw = end === -1 ? slice(i) : slice(i, end + 3);
        out += this._spanMultiline(raw, 'cm');
        i += raw.length;
        continue;
      }

      if (ch === '<' && (peek(1) === '/' || /[a-zA-Z!]/.test(peek(1)))) {
        const end = src.indexOf('>', i);
        if (end !== -1) {
          const tagSrc = slice(i, end + 1);
          out += this._colorTag(tagSrc);
          i += tagSrc.length;
          continue;
        }
      }

      if (ch === '"' || ch === "'") {
        const quote = ch;
        let j = i + 1;
        while (j < len && src[j] !== quote) {
          if (src[j] === '\\') j++;
          j++;
        }
        const raw = slice(i, j + 1);
        out += this._spanMultiline(raw, 'str');
        i = j + 1;
        continue;
      }

      if (ch === '\n') { out += '\n'; i++; continue; }

      out += `<span class="pl">${this._escape(ch)}</span>`;
      i++;
    }

    return out;
  }

  _spanMultiline(raw, cls) {
    return raw.split('\n').map(part => `<span class="${cls}">${this._escape(part)}</span>`).join('\n');
  }

  _colorTag(tagSrc) {
    let out = '<span class="tg">';
    let i = 0;

    while (i < tagSrc.length) {
      const ch = tagSrc[i];
      if (ch === '\n') { out += '</span>\n<span class="tg">'; i++; continue; }
      if (ch === '"' || ch === "'") {
        const q = ch;
        let j = i + 1;
        while (j < tagSrc.length && tagSrc[j] !== q) {
          if (tagSrc[j] === '\\') j++;
          j++;
        }
        const strRaw = tagSrc.slice(i, j + 1);
        out += `</span>${this._spanMultiline(strRaw, 'str')}<span class="tg">`;
        i = j + 1;
        continue;
      }
      out += this._escape(ch);
      i++;
    }

    out += '</span>';
    return out;
  }

  _buildLines(highlighted) {
    const hasLineNumbers = !this.hasAttribute('no-lines');
    if (hasLineNumbers) {
      return highlighted.split('\n').map((line, i) =>
        `<span class="line"><span class="ln">${i + 1}</span><span>${line || ' '}</span></span>`
      ).join('');
    }
    return highlighted.split('\n').map(line =>
      `<span class="line"><span>${line || ' '}</span></span>`
    ).join('');
  }

  _handleCopy() {
    const code = this._dedent(this._originalCode).trim();
    navigator.clipboard.writeText(code).then(() => {
      const btn = this.shadowRoot.getElementById('copyBtn');
      if (btn) {
        btn.textContent = 'copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove('copied'); }, 1800);
      }
      this.dispatchEvent(new CustomEvent('noc-copy', { bubbles: true, composed: true, detail: { code } }));
    });
  }
}

customElements.define('noc-code', NocCode);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
