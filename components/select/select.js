// nocturnal-components/components/select/select.js

/**
 * @customElement noc-select
 * 
 * @slot - The list of options (noc-option) or option groups (noc-option-group).
 * @slot prefix - Content to display before the selected value(s).
 * @slot suffix - Content to display after the selected value(s) and before the chevron.
 * 
 * Attributes:
 * @attr {string} label - A label to display above the select.
 * @attr {string} help-text - Help text to display below the select.
 * @attr {string} placeholder - Placeholder text to display when no value is selected.
 * @attr {boolean} clearable - If present, shows a clear button when a value is selected.
 * @attr {boolean} multiple - If present, allows selecting multiple options.
 * @attr {boolean} disabled - Whether the select is disabled.
 * @attr {boolean} pill - If present, the select will have a pill shape.
 * @attr {boolean} filled - Whether the select should use a filled visual style.
 * @attr {'sm' | 'md' | 'lg'} size - The size of the select. Defaults to 'md'.
 * @attr {number} max-options-visible - In multiple mode, the max number of tags to show before truncating.
 * @attr {'top' | 'bottom'} placement - Where to position the dropdown. Defaults to 'bottom'.
 * @attr {string} value - The current value or comma-separated values (for multiple) of the select.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-select-bg - Background color of the select control.
 * @cssprop --noc-select-border - Border color of the select control.
 * @cssprop --noc-select-color - Text color of the selected value.
 * @cssprop --noc-select-radius - Border radius of the select control.
 * @cssprop --noc-select-accent - Accent color for focus states and selected items.
 * @cssprop --noc-select-shadow - Box shadow for the dropdown panel.
 * 
 * Events:
 * @event noc-change - Emitted when the selected value(s) change.
 * @event noc-clear - Emitted when the selection is cleared via the clear button.
 */

function buildTemplate(attrs = {}) {
  const label       = attrs.label       || '';
  const helpText    = attrs['help-text'] || '';
  const placeholder = attrs.placeholder || 'Select...';
  const disabled    = 'disabled' in attrs;
  const pill        = 'pill' in attrs;
  const filled      = 'filled' in attrs;
  const size        = attrs.size        || 'md';

  return `
    <style>
      :host {
        display: block;
        font-family: inherit;
        --noc-select-bg: rgba(26, 26, 26, 0.5);
        --noc-select-border: rgba(255, 255, 255, 0.1);
        --noc-select-color: #eee;
        --noc-select-radius: 10px;
        --noc-select-accent: var(--noc-accent, #2563eb);
        --noc-select-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      }

      .label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #fff;
      }

      .help-text {
        font-size: 0.75rem;
        color: #888;
        margin-top: 0.5rem;
      }

      .select-container {
        position: relative;
      }

      .control {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-height: 2.75rem;
        padding: 0 1rem;
        border: 1px solid var(--noc-select-border);
        border-radius: var(--noc-select-radius);
        background: var(--noc-select-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-sizing: border-box;
        user-select: none;
        color: var(--noc-select-color);
      }

      .control:hover:not(.disabled) {
        border-color: rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.05);
      }

      .control.open {
        border-color: var(--noc-select-accent);
        background: rgba(26, 26, 26, 0.8);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
      }

      .control.disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .control.pill { border-radius: 9999px; }
      .control.sm { min-height: 2.25rem; padding: 0 0.75rem; font-size: 0.875rem; }
      .control.lg { min-height: 3.5rem; padding: 0 1.25rem; font-size: 1.125rem; }

      .display {
        flex: 1;
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .placeholder { color: #555; }

      .chevron {
        width: 20px;
        height: 20px;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
      }

      .control.open .chevron { transform: rotate(180deg); color: var(--noc-select-accent); }

      .clear {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        display: none;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 10px;
        transition: all 0.2s;
      }

      .clear:hover { background: rgba(239, 68, 68, 0.2); color: #f87171; }

      .tag {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        background: rgba(255, 255, 255, 0.05);
        color: #eee;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 0 0.5rem;
        font-size: 0.75rem;
        line-height: 1.5rem;
        transition: all 0.2s;
      }

      .tag:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2); }

      .tag-remove { 
        display: flex;
        align-items: center;
        cursor: pointer; 
        opacity: 0.5;
        transition: opacity 0.2s;
      }

      .tag-remove:hover { opacity: 1; color: #f87171; }
      .tag-remove svg { width: 12px; height: 12px; }

      .dropdown {
        position: absolute;
        z-index: 1000;
        background: rgba(26, 26, 26, 0.95);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        box-shadow: var(--noc-select-shadow);
        max-height: 15rem;
        overflow-y: auto;
        min-width: 100%;
        opacity: 0;
        visibility: hidden;
        transform: translateY(10px) scale(0.95);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        top: 100%;
        left: 0;
        margin-top: 0.5rem;
      }

      .dropdown.visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(0) scale(1);
      }

      :host([placement="top"]) .dropdown {
        top: auto;
        bottom: 100%;
        margin-top: 0;
        margin-bottom: 0.5rem;
        transform: translateY(-10px) scale(0.95);
      }

      :host([placement="top"]) .dropdown.visible {
        transform: translateY(0) scale(1);
      }

      .dropdown::-webkit-scrollbar { width: 6px; }
      .dropdown::-webkit-scrollbar-track { background: transparent; }
      .dropdown::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 3px; }
      .dropdown::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
    </style>

    <div id="label-container">${label ? `<label class="label" id="select-label">${label}</label>` : ''}</div>

    <div class="select-container">
      <div class="control ${size} ${disabled ? 'disabled' : ''} ${filled ? 'filled' : ''} ${pill ? 'pill' : ''}" 
           id="trigger" 
           role="combobox" 
           aria-haspopup="listbox"
           aria-expanded="false"
           aria-controls="dropdown"
           ${label ? 'aria-labelledby="select-label"' : `aria-label="${placeholder || 'Select an option'}"`}>
        <slot name="prefix"></slot>
        <div class="display"><span class="placeholder">${placeholder}</span></div>
        <slot name="suffix"></slot>
        <span class="clear" id="clear">✕</span>
        <span class="chevron">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </div>

      <div class="dropdown" id="dropdown" role="listbox">
        <slot></slot>
      </div>
    </div>

    <div id="help-container">${helpText ? `<div class="help-text">${helpText}</div>` : ''}</div>
  `;
}

class NocSelect extends HTMLElement {
  static get observedAttributes() {
    return [
      'label', 'help-text', 'placeholder', 'clearable', 'multiple',
      'disabled', 'pill', 'filled', 'size', 'max-options-visible', 'placement', 'value'
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isOpen = false;
    this._selectedOptions = [];
    this._value = '';
    this._isRendered = false;

    this._toggleDropdown     = this._toggleDropdown.bind(this);
    this._handleOutsideClick = this._handleOutsideClick.bind(this);
    this._handleOptionClick  = this._handleOptionClick.bind(this);
    this._handleClear        = this._handleClear.bind(this);
    this._handleSlotChange   = this._handleSlotChange.bind(this);
  }

  get value() {
    if (this.hasAttribute('multiple')) {
      return this._selectedOptions.map(opt => opt.value);
    }
    return this._value;
  }

  set value(val) {
    this._value = val;
    this.setAttribute('value', Array.isArray(val) ? val.join(',') : val);
  }

  connectedCallback() {
    if (!this._isRendered) {
      this.render();
      this._isRendered = true;
    }
    document.addEventListener('click', this._handleOutsideClick);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._handleOutsideClick);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'value' && oldValue !== newValue) {
      this._value = newValue || '';
      this._syncSelectedOptions();
    }
    if (this._isRendered && name !== 'value') {
      this._updateUI();
    }
  }

  _handleSlotChange() {
    this._syncSelectedOptions();
  }

  _syncSelectedOptions() {
    const options  = Array.from(this.querySelectorAll('noc-option'));
    const rawValue = this.getAttribute('value') || '';
    const values   = this.hasAttribute('multiple')
      ? (Array.isArray(rawValue) ? rawValue : rawValue.split(',').filter(v => v))
      : [rawValue];

    this._selectedOptions = options.filter(opt => {
      const isSelected = values.includes(opt.value);
      opt.selected = isSelected;
      return isSelected;
    });

    this._updateDisplay();
  }

  _toggleDropdown(e) {
    if (this.hasAttribute('disabled')) {
      return;
    }
    e.stopPropagation();
    this._isOpen = !this._isOpen;
    this._updateUI();
  }

  _handleOutsideClick(e) {
    const path = e.composedPath();
    if (!path.includes(this)) {
      this._isOpen = false;
      this._updateUI();
    }
  }

  _handleOptionClick(e) {
    const opt = e.target.closest('noc-option');
    if (!opt || opt.hasAttribute('disabled')) {
      return;
    }
    
    if (this.hasAttribute('multiple')) {
      const index = this._selectedOptions.findIndex(o => o.value === opt.value);
      if (index > -1) {
        this._selectedOptions.splice(index, 1);
      } else {
        this._selectedOptions.push(opt);
      }
      this.value = this._selectedOptions.map(o => o.value).join(',');
    } else {
      this._selectedOptions = [opt];
      this.value = opt.value;
      this._isOpen = false;
    }

    this._syncSelectedOptions();
    this.dispatchEvent(new CustomEvent('noc-change', {
      bubbles: true,
      composed: true,
      detail: { value: this.value }
    }));
  }

  _handleClear(e) {
    e.stopPropagation();
    this.value = '';
    this._isOpen = false;
    this._selectedOptions = [];
    this._syncSelectedOptions();
    this.dispatchEvent(new CustomEvent('noc-clear', {
      bubbles: true,
      composed: true
    }));
  }

  _updateUI() {
    if (!this._isRendered) return;
    
    const control  = this.shadowRoot.querySelector('.control');
    const dropdown = this.shadowRoot.querySelector('.dropdown');
    
    if (!control || !dropdown) return;
    
    if (this._isOpen) {
      control.classList.add('open');
      dropdown.classList.add('visible');
    } else {
      control.classList.remove('open');
      dropdown.classList.remove('visible');
    }

    control.className = `control ${this.getAttribute('size') || 'md'} ${this._isOpen ? 'open' : ''} ${this.hasAttribute('disabled') ? 'disabled' : ''} ${this.hasAttribute('filled') ? 'filled' : ''} ${this.hasAttribute('pill') ? 'pill' : ''}`;
    
    this._updateDisplay();
  }

  _updateDisplay() {
    if (!this._isRendered) return;
    
    const display = this.shadowRoot.querySelector('.display');
    if (!display) return;
    
    const isMultiple  = this.hasAttribute('multiple');
    const placeholder = this.getAttribute('placeholder') || 'Select...';

    if (isMultiple) {
      if (this._selectedOptions.length === 0) {
        display.innerHTML = `<span class="placeholder">${placeholder}</span>`;
      } else {
        const maxVisible     = parseInt(this.getAttribute('max-options-visible')) || Infinity;
        const visibleOptions = this._selectedOptions.slice(0, maxVisible);
        const hiddenCount    = this._selectedOptions.length - maxVisible;

        let html = visibleOptions.map(opt => `
          <span class="tag">
            <span class="tag-label">${opt.textContent.trim()}</span>
            <span class="tag-remove" data-value="${opt.value}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </span>
          </span>
        `).join('');

        if (hiddenCount > 0) {
          html += `<span class="tag-more">+${hiddenCount} more</span>`;
        }
        display.innerHTML = html;

        display.querySelectorAll('.tag-remove').forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            const val = btn.dataset.value;
            const opt = Array.from(this.querySelectorAll('noc-option')).find(o => o.value === val);
            if (opt) {
              this._handleOptionClick({ target: opt });
            }
          };
        });
      }
    } else {
      const displayValue = this._selectedOptions.length > 0 ? this._selectedOptions[0].textContent.trim() : '';
      display.innerHTML  = displayValue ? displayValue : `<span class="placeholder">${placeholder}</span>`;
    }

    const clearBtn = this.shadowRoot.querySelector('.clear');
    if (clearBtn) {
      clearBtn.style.display = (this.hasAttribute('clearable') && this._selectedOptions.length > 0) ? 'flex' : 'none';
    }
  }

  render() {
    this.shadowRoot.innerHTML = buildTemplate({
      label:       this.getAttribute('label'),
      'help-text': this.getAttribute('help-text'),
      placeholder: this.getAttribute('placeholder'),
      size:        this.getAttribute('size'),
      ...(this.hasAttribute('disabled') ? { disabled: true } : {}),
      ...(this.hasAttribute('pill')     ? { pill: true }     : {}),
      ...(this.hasAttribute('filled')   ? { filled: true }   : {}),
    });

    this._updateLabel();
    this._updateHelp();
    
    this.shadowRoot.getElementById('trigger').onclick  = this._toggleDropdown;
    this.shadowRoot.getElementById('clear').onclick    = this._handleClear;
    this.shadowRoot.getElementById('dropdown').onclick = this._handleOptionClick;
    this.shadowRoot.addEventListener('slotchange', this._handleSlotChange);

    this._updateUI();
  }

  _updateLabel() {
    const label     = this.getAttribute('label');
    const container = this.shadowRoot.getElementById('label-container');
    if (container) {
      container.innerHTML = label ? `<label class="label">${label}</label>` : '';
    }
  }

  _updateHelp() {
    const helpText  = this.getAttribute('help-text');
    const container = this.shadowRoot.getElementById('help-container');
    if (container) {
      container.innerHTML = helpText ? `<div class="help-text">${helpText}</div>` : '';
    }
  }
}

customElements.define('noc-select', NocSelect);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
