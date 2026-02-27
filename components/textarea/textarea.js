// nocturnal-components/components/textarea/textarea.js

/**
 * @customElement noc-textarea
 * 
 * @slot - The content of the textarea.
 * 
 * Attributes:
 * @attr {string} label - The label of the textarea.
 * @attr {string} help-text - The help text of the textarea.
 * @attr {number} rows - The number of rows of the textarea.
 * @attr {string} placeholder - The placeholder of the textarea.
 * @attr {boolean} disabled - Whether the textarea is disabled.
 * @attr {'sm' | 'md' | 'lg'} size - The size of the textarea. Defaults to 'md'.
 * @attr {'none' | 'vertical' | 'horizontal' | 'both' | 'auto'} resize - The resize mode of the textarea. Defaults to 'none'.
 * @attr {string} value - The value of the textarea.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-textarea-bg - Background color of the textarea.
 * @cssprop --noc-textarea-color - Text color of the textarea.
 * @cssprop --noc-textarea-border - Border color of the textarea.
 * @cssprop --noc-textarea-border-focus - Border color when focused.
 * @cssprop --noc-textarea-label - Label color of the textarea.
 * @cssprop --noc-textarea-help - Help text color of the textarea.
 * 
 * Events:
 * @event noc-input - Emitted when the input value changes.
 * @event noc-change - Emitted when the change event is triggered.
 */

function buildTemplate(attrs = {}) {
  const label       = attrs.label       || '';
  const helpText    = attrs['help-text'] || '';
  const rows        = attrs.rows        || 3;
  const placeholder = attrs.placeholder || '';
  const disabled    = 'disabled' in attrs;
  const resize      = attrs.resize      || 'none';
  const value       = attrs.value       || '';

  return `
    <style>
      :host {
        display: block;
        font-family: inherit;
        --noc-textarea-bg: #1e1e1e;
        --noc-textarea-color: #fff;
        --noc-textarea-border: #333;
        --noc-textarea-border-focus: var(--noc-accent, #3b82f6);
        --noc-textarea-label: #aaa;
        --noc-textarea-help: #888;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      label {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--noc-textarea-label);
        user-select: none;
      }

      textarea {
        width: 100%;
        box-sizing: border-box;
        font-family: inherit;
        line-height: 1.5;
        padding: 0.625rem 0.75rem;
        border-radius: 6px;
        border: 1px solid var(--noc-textarea-border);
        background: var(--noc-textarea-bg);
        color: var(--noc-textarea-color);
        transition: border-color 0.2s, box-shadow 0.2s;
        font-size: 0.875rem;
      }

      :host([size="sm"]) textarea { padding: 0.4rem 0.6rem; font-size: 0.75rem; }
      :host([size="lg"]) textarea { padding: 0.8rem 1rem; font-size: 1rem; }

      textarea:focus {
        outline: none;
        border-color: var(--noc-textarea-border-focus);
        box-shadow: 0 0 0 3px var(--noc-accent-alpha, rgba(59, 130, 246, 0.2));
      }

      textarea:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: rgba(255, 255, 255, 0.05);
      }

      .help {
        font-size: 0.75rem;
        color: var(--noc-textarea-help);
      }

      /* Resize modes */
      .resize-none       { resize: none; }
      .resize-vertical   { resize: vertical; }
      .resize-horizontal { resize: horizontal; }
      .resize-both       { resize: both; }
      .resize-auto       { resize: none; overflow: hidden; }
    </style>

    <div class="field" part="base">
      ${label ? `<label id="label" part="label">${label}</label>` : '<label id="label" part="label" style="display:none"></label>'}
      <textarea id="textarea" part="textarea"
        rows="${rows}"
        placeholder="${placeholder}"
        class="resize-${resize}"
        ${disabled ? 'disabled' : ''}
      >${value}</textarea>
      ${helpText ? `<div id="help" class="help" part="help-text">${helpText}</div>` : '<div id="help" class="help" part="help-text" style="display:none"></div>'}
    </div>
  `;
}

class NocTextarea extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'help-text', 'rows', 'placeholder', 'disabled', 'size', 'resize', 'value'];
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
    this._updateUI();
    this._handleAutoResize();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (this._isRendered && oldVal !== newVal) {
      this._updateUI();
      if (name === 'resize' || name === 'rows') {
        this._handleAutoResize();
      }
    }
  }

  get value() {
    return this._textarea ? this._textarea.value : '';
  }

  set value(val) {
    if (this._textarea) {
      this._textarea.value = val;
      this._handleAutoResize();
    }
    this.setAttribute('value', val);
  }

  _setup() {
    this.shadowRoot.innerHTML = buildTemplate({
      label:       this.getAttribute('label'),
      'help-text': this.getAttribute('help-text'),
      rows:        this.getAttribute('rows'),
      placeholder: this.getAttribute('placeholder'),
      resize:      this.getAttribute('resize'),
      value:       this.getAttribute('value'),
      ...(this.hasAttribute('disabled') ? { disabled: true } : {}),
    });

    this._textarea = this.shadowRoot.getElementById('textarea');
    this._label    = this.shadowRoot.getElementById('label');
    this._help     = this.shadowRoot.getElementById('help');

    this._textarea.addEventListener('input', () => {
      this._handleAutoResize();
      this.dispatchEvent(new CustomEvent('noc-input', {
        bubbles: true,
        composed: true,
        detail: { value: this._textarea.value }
      }));
    });

    this._textarea.addEventListener('change', () => {
      this.dispatchEvent(new CustomEvent('noc-change', {
        bubbles: true,
        composed: true,
        detail: { value: this._textarea.value }
      }));
    });
  }

  _updateUI() {
    if (!this._isRendered) {
      return;
    }
    
    const label       = this.getAttribute('label');
    const help        = this.getAttribute('help-text');
    const rows        = this.getAttribute('rows') || 3;
    const placeholder = this.getAttribute('placeholder') || '';
    const disabled    = this.hasAttribute('disabled');
    const resize      = this.getAttribute('resize') || 'none';
    const value       = this.getAttribute('value') || '';

    this._label.textContent   = label || '';
    this._label.style.display = label ? 'block' : 'none';

    this._help.textContent   = help || '';
    this._help.style.display = help ? 'block' : 'none';

    this._textarea.rows        = rows;
    this._textarea.placeholder = placeholder;
    this._textarea.disabled    = disabled;
    this._textarea.className   = `resize-${resize}`;

    if (this._textarea.value !== value) {
      this._textarea.value = value;
    }
  }

  _handleAutoResize() {
    if (this.getAttribute('resize') !== 'auto' || !this._textarea) return;
    
    this._textarea.style.height = 'auto';
    this._textarea.style.height = this._textarea.scrollHeight + 'px';
  }
}

customElements.define('noc-textarea', NocTextarea);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
