// nocturnal-components/components/combobox/combobox.js

/**
 * @customElement noc-combobox
 * 
 * @slot - The list of options (noc-option) or option groups (noc-option-group).
 * @slot prefix - Content to display before the input text (e.g., an icon).
 * @slot suffix - Content to display after the input text and before the chevron.
 * 
 * Attributes:
 * @attr {string} label - A label to display above the combobox.
 * @attr {string} help-text - Help text to display below the combobox.
 * @attr {string} placeholder - Placeholder text to display when no value is entered.
 * @attr {boolean} clearable - If present, shows a clear button when the input has a value.
 * @attr {boolean} multiple - If present, allows selecting multiple options. Values are comma-separated.
 * @attr {boolean} disabled - Whether the combobox is disabled.
 * @attr {boolean} pill - If present, the combobox will have a pill shape.
 * @attr {boolean} autocomplete - If present, filters options as the user types. Defaults to true.
 * @attr {boolean} allow-custom-value - If present, allows entering values not in the options list.
 * @attr {'outline' | 'filled' | 'filled-outline'} appearance - The visual style of the combobox. Defaults to 'outline'.
 * @attr {'sm' | 'md' | 'lg'} size - The size of the combobox. Defaults to 'md'.
 * @attr {number} max-options-visible - In multiple mode, the maximum number of tags to show before truncating.
 * @attr {'top' | 'bottom'} placement - Where to position the dropdown. Defaults to 'bottom'.
 * @attr {string} value - The current value or comma-separated values (for multiple) of the combobox.
 * @attr {string} filter-mode - How to filter options: 'contains' (default), 'startsWith', 'custom'.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-combobox-bg - Background color of the combobox control.
 * @cssprop --noc-combobox-border - Border color of the combobox control.
 * @cssprop --noc-combobox-color - Text color of the input.
 * @cssprop --noc-combobox-radius - Border radius of the combobox control.
 * @cssprop --noc-combobox-accent - Accent color for focus states and selected items.
 * @cssprop --noc-combobox-shadow - Box shadow for the dropdown panel.
 * 
 * Events:
 * @event noc-change - Emitted when the selected value(s) change.
 * @event noc-clear - Emitted when the input is cleared via the clear button.
 * @event noc-input - Emitted when the input value changes.
 * @event noc-filter - Emitted when options are filtered, passes filtered options in detail.
 * 
 * Properties:
 * @property {Function} customFilter - Custom filter function(option: HTMLElement, query: string) => boolean.
 */
function buildTemplate(attrs = {}) {
  const placeholder = attrs.placeholder || '';
  const disabled    = 'disabled' in attrs;
  const pill        = 'pill' in attrs;

  return `
    <style>
      :host { display: block; font-family: inherit; }
      select {
        width: 100%;
        padding: 0.625rem 2rem 0.625rem 0.875rem;
        background: var(--noc-combobox-bg, #1e1e1e);
        border: 1px solid var(--noc-combobox-border, #444);
        border-radius: var(--noc-combobox-radius, ${pill ? '999px' : '6px'});
        color: var(--noc-combobox-color, #eee);
        font-family: inherit;
        font-size: 0.875rem;
        appearance: none;
        -webkit-appearance: none;
        cursor: pointer;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23888'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.75rem center;
        transition: border-color 0.2s;
      }
      select:focus { outline: none; border-color: var(--noc-combobox-accent, #2563eb); }
      select:disabled { opacity: 0.5; cursor: not-allowed; }
    </style>
    <select ${disabled ? 'disabled' : ''} placeholder="${placeholder}">
      <slot></slot>
    </select>
  `;
}

class NocCombobox extends HTMLElement {
  static get observedAttributes() {
    return [
      'label',
      'help-text',
      'placeholder',
      'clearable',
      'multiple',
      'disabled',
      'pill',
      'autocomplete',
      'allow-custom-value',
      'appearance',
      'size',
      'max-options-visible',
      'placement',
      'value',
      'filter-mode'
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isOpen = false;
    this._selectedOptions = [];
    this._value = '';
    this._inputValue = '';
    this._isRendered = false;
    this._customFilter = null;

    this._onInput           = this._onInput.bind(this);
    this._onFocus           = this._onFocus.bind(this);
    this._onKeyDown         = this._onKeyDown.bind(this);
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

  get customFilter() {
    return this._customFilter;
  }

  set customFilter(fn) {
    if (typeof fn === 'function') {
      this._customFilter = fn;
      this.setAttribute('filter-mode', 'custom');
    } else {
      this._customFilter = null;
      if (this.getAttribute('filter-mode') === 'custom') {
        this.removeAttribute('filter-mode');
      }
    }
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

    this._updateInputDisplay();
  }

  _onInput(e) {
    this._inputValue = this._input.value;
    
    if (!this._isOpen) {
      this._isOpen = true;
      this._updateUI();
    }

    const autocompleteEnabled = this.hasAttribute('autocomplete') || !this.hasAttribute('autocomplete');
    
    if (autocompleteEnabled) {
      this._filterOptions(this._inputValue);
    }

    this.dispatchEvent(new CustomEvent('noc-input', {
      bubbles: true,
      composed: true,
      detail: { value: this._inputValue }
    }));
  }

  _onFocus() {
    if (!this.hasAttribute('disabled')) {
      this._isOpen = true;
      this._updateUI();
      this._filterOptions(this._inputValue);
    }
  }

  _onKeyDown(e) {
    if (e.key === 'Escape') {
      this._isOpen = false;
      this._updateUI();
      this._input.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._focusNextOption();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this._focusPreviousOption();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this._selectFocusedOption();
    }
  }

  _focusNextOption() {
    const visibleOptions = this._getVisibleOptions();
    if (visibleOptions.length === 0) return;

    const currentIndex = visibleOptions.findIndex(opt => opt.classList.contains('keyboard-focus'));
    visibleOptions.forEach(opt => opt.classList.remove('keyboard-focus'));

    const nextIndex = currentIndex < visibleOptions.length - 1 ? currentIndex + 1 : 0;
    visibleOptions[nextIndex].classList.add('keyboard-focus');
    visibleOptions[nextIndex].scrollIntoView({ block: 'nearest' });
  }

  _focusPreviousOption() {
    const visibleOptions = this._getVisibleOptions();
    if (visibleOptions.length === 0) return;

    const currentIndex = visibleOptions.findIndex(opt => opt.classList.contains('keyboard-focus'));
    visibleOptions.forEach(opt => opt.classList.remove('keyboard-focus'));

    const prevIndex = currentIndex > 0 ? currentIndex - 1 : visibleOptions.length - 1;
    visibleOptions[prevIndex].classList.add('keyboard-focus');
    visibleOptions[prevIndex].scrollIntoView({ block: 'nearest' });
  }

  _selectFocusedOption() {
    const visibleOptions = this._getVisibleOptions();
    const focusedOption = visibleOptions.find(opt => opt.classList.contains('keyboard-focus'));
    
    if (focusedOption) {
      this._handleOptionClick({ target: focusedOption });
    } else if (this.hasAttribute('allow-custom-value') && this._inputValue) {
      this._handleCustomValue();
    }
  }

  _getVisibleOptions() {
    return Array.from(this.querySelectorAll('noc-option')).filter(opt => {
      return opt.style.display !== 'none' && !opt.hasAttribute('disabled');
    });
  }

  _handleCustomValue() {
    if (!this.hasAttribute('allow-custom-value')) return;

    const customValue = this._inputValue.trim();
    if (!customValue) return;

    if (this.hasAttribute('multiple')) {
      const values = this.value || [];
      if (!values.includes(customValue)) {
        this.value = [...values, customValue].join(',');
      }
    } else {
      this.value = customValue;
    }

    this._isOpen = false;
    this._updateUI();
    this._syncSelectedOptions();

    this.dispatchEvent(new CustomEvent('noc-change', {
      bubbles: true,
      composed: true,
      detail: { value: this.value }
    }));
  }

  _filterOptions(query) {
    const options = Array.from(this.querySelectorAll('noc-option'));
    const filterMode = this.getAttribute('filter-mode') || 'contains';
    const lowerQuery = query.toLowerCase();

    let visibleCount = 0;

    options.forEach(opt => {
      const optionText = opt.textContent.trim().toLowerCase();
      const optionValue = opt.value.toLowerCase();
      let isVisible = false;

      if (!query) {
        isVisible = true;
      } else if (filterMode === 'custom' && this._customFilter) {
        isVisible = this._customFilter(opt, query);
      } else if (filterMode === 'startsWith') {
        isVisible = optionText.startsWith(lowerQuery) || optionValue.startsWith(lowerQuery);
      } else {
        isVisible = optionText.includes(lowerQuery) || optionValue.includes(lowerQuery);
      }

      opt.style.display = isVisible ? '' : 'none';
      if (isVisible) visibleCount++;
    });

    const groups = Array.from(this.querySelectorAll('noc-option-group'));
    groups.forEach(group => {
      const groupOptions = Array.from(group.querySelectorAll('noc-option'));
      const hasVisibleOptions = groupOptions.some(opt => opt.style.display !== 'none');
      group.style.display = hasVisibleOptions ? '' : 'none';
    });

    this.dispatchEvent(new CustomEvent('noc-filter', {
      bubbles: true,
      composed: true,
      detail: { query, visibleCount }
    }));
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

    opt.classList.remove('keyboard-focus');

    if (this.hasAttribute('multiple')) {
      const index = this._selectedOptions.findIndex(o => o.value === opt.value);
      if (index > -1) {
        this._selectedOptions.splice(index, 1);
      } else {
        this._selectedOptions.push(opt);
      }
      this.value = this._selectedOptions.map(o => o.value).join(',');
      this._inputValue = '';
      if (this._input) this._input.value = '';
    } else {
      this._selectedOptions = [opt];
      this.value = opt.value;
      this._inputValue = opt.textContent.trim();
      if (this._input) this._input.value = this._inputValue;
      this._isOpen = false;
    }

    this._syncSelectedOptions();
    this._updateUI();

    this.dispatchEvent(new CustomEvent('noc-change', {
      bubbles: true,
      composed: true,
      detail: { value: this.value }
    }));

    if (!this.hasAttribute('multiple')) {
      this._input.blur();
    }
  }

  _handleClear(e) {
    e.stopPropagation();
    this.value = '';
    this._inputValue = '';
    this._isOpen = false;
    this._selectedOptions = [];
    
    if (this._input) {
      this._input.value = '';
      this._input.focus();
    }

    this._syncSelectedOptions();
    this._updateUI();

    this.dispatchEvent(new CustomEvent('noc-clear', {
      bubbles: true,
      composed: true
    }));
  }

  _updateUI() {
    const control  = this.shadowRoot.querySelector('.control');
    const dropdown = this.shadowRoot.querySelector('.dropdown');
    
    if (this._isOpen) {
      control.classList.add('open');
      dropdown.classList.add('visible');
      this._filterOptions(this._inputValue);
    } else {
      control.classList.remove('open');
      dropdown.classList.remove('visible');
      this._resetOptions();
    }

    const appearance = this.getAttribute('appearance') || 'outline';
    const size = this.getAttribute('size') || 'md';
    const disabled = this.hasAttribute('disabled');
    const pill = this.hasAttribute('pill');

    control.className = `control ${size} ${appearance} ${this._isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''} ${pill ? 'pill' : ''}`;
    
    this._updateInputDisplay();
    this._updateClearButton();
  }

  _resetOptions() {
    const options = Array.from(this.querySelectorAll('noc-option'));
    options.forEach(opt => {
      opt.style.display = '';
      opt.classList.remove('keyboard-focus');
    });

    const groups = Array.from(this.querySelectorAll('noc-option-group'));
    groups.forEach(group => {
      group.style.display = '';
    });
  }

  _updateInputDisplay() {
    if (!this._input) return;

    const isMultiple = this.hasAttribute('multiple');
    const placeholder = this.getAttribute('placeholder') || 'Type to search...';

    if (isMultiple) {
      this._input.placeholder = placeholder;
      this._renderTags();
    } else {
      this._input.placeholder = placeholder;
    }
  }

  _renderTags() {
    const tagsContainer = this.shadowRoot.querySelector('.tags');
    if (!tagsContainer) return;

    const maxVisible = parseInt(this.getAttribute('max-options-visible')) || Infinity;
    const visibleOptions = this._selectedOptions.slice(0, maxVisible);
    const hiddenCount = this._selectedOptions.length - maxVisible;

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

    tagsContainer.innerHTML = html;

    tagsContainer.querySelectorAll('.tag-remove').forEach(btn => {
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

  _updateClearButton() {
    const clearBtn = this.shadowRoot.querySelector('.clear');
    if (clearBtn) {
      const hasValue = this.hasAttribute('multiple') 
        ? this._selectedOptions.length > 0 
        : this._inputValue || this._selectedOptions.length > 0;
      clearBtn.style.display = (this.hasAttribute('clearable') && hasValue) ? 'flex' : 'none';
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: inherit;
          --noc-combobox-bg: rgba(26, 26, 26, 0.5);
          --noc-combobox-border: rgba(255, 255, 255, 0.1);
          --noc-combobox-color: #eee;
          --noc-combobox-radius: 10px;
          --noc-combobox-accent: var(--noc-accent, #2563eb);
          --noc-combobox-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
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

        .combobox-container {
          position: relative;
        }

        .control {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-height: 2.75rem;
          padding: 0 1rem;
          border: 1px solid var(--noc-combobox-border);
          border-radius: var(--noc-combobox-radius);
          background: var(--noc-combobox-bg);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
          color: var(--noc-combobox-color);
        }

        .control:hover:not(.disabled) {
          border-color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.05);
        }

        .control.open {
          border-color: var(--noc-combobox-accent);
          background: rgba(26, 26, 26, 0.8);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
        }

        .control.disabled {
          opacity: 0.4;
          cursor: not-allowed;
          pointer-events: none;
        }

        .control.pill { border-radius: 9999px; }
        .control.sm { min-height: 2.25rem; padding: 0 0.75rem; font-size: 0.875rem; }
        .control.lg { min-height: 3.5rem; padding: 0 1.25rem; font-size: 1.125rem; }

        .control.filled {
          background: rgba(10, 10, 10, 0.8);
          border-color: rgba(255, 255, 255, 0.05);
        }

        .control.filled-outline {
          background: rgba(10, 10, 10, 0.8);
          border-width: 2px;
        }

        .input-wrapper {
          flex: 1;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.35rem;
          min-width: 0;
        }

        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        input {
          flex: 1;
          min-width: 80px;
          background: transparent;
          border: none;
          outline: none;
          color: var(--noc-combobox-color);
          font: inherit;
          padding: 0;
        }

        input::placeholder { color: #555; }

        .chevron {
          width: 20px;
          height: 20px;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          flex-shrink: 0;
        }

        .control.open .chevron { transform: rotate(180deg); color: var(--noc-combobox-accent); }

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
          flex-shrink: 0;
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

        .tag-more {
          display: inline-flex;
          align-items: center;
          padding: 0 0.5rem;
          font-size: 0.75rem;
          color: #666;
          line-height: 1.5rem;
        }

        .dropdown {
          position: absolute;
          z-index: 1000;
          background: rgba(26, 26, 26, 0.95);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: var(--noc-combobox-shadow);
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

        ::slotted(noc-option) {
          cursor: pointer;
        }

        ::slotted(noc-option.keyboard-focus) {
          background: rgba(255, 255, 255, 0.08);
        }

        ::slotted([slot="prefix"]), ::slotted([slot="suffix"]) {
          display: flex;
          align-items: center;
          color: #666;
          flex-shrink: 0;
        }
      </style>

      <div id="label-container"></div>

      <div class="combobox-container">
        <div class="control" id="trigger" role="combobox" aria-haspopup="listbox" aria-expanded="false">
          <slot name="prefix"></slot>
          <div class="input-wrapper">
            <div class="tags"></div>
            <input 
              type="text" 
              id="input"
              autocomplete="off"
              spellcheck="false"
            />
          </div>
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

      <div id="help-container"></div>
    `;

    this._updateLabel();
    this._updateHelp();
    
    this._input = this.shadowRoot.getElementById('input');
    const trigger = this.shadowRoot.getElementById('trigger');
    const clearBtn = this.shadowRoot.getElementById('clear');
    const dropdown = this.shadowRoot.getElementById('dropdown');

    if (this._input) {
      this._input.addEventListener('input', this._onInput);
      this._input.addEventListener('focus', this._onFocus);
      this._input.addEventListener('keydown', this._onKeyDown);
      
      const placeholder = this.getAttribute('placeholder') || 'Type to search...';
      this._input.placeholder = placeholder;

      if (this.hasAttribute('disabled')) {
        this._input.disabled = true;
      }
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', this._handleClear);
    }

    if (dropdown) {
      dropdown.addEventListener('click', this._handleOptionClick);
    }

    this.shadowRoot.addEventListener('slotchange', this._handleSlotChange);

    this._updateUI();
  }

  _updateLabel() {
    const label = this.getAttribute('label');
    const container = this.shadowRoot.getElementById('label-container');
    if (container) {
      container.innerHTML = label ? `<label class="label">${label}</label>` : '';
    }
  }

  _updateHelp() {
    const helpText = this.getAttribute('help-text');
    const container = this.shadowRoot.getElementById('help-container');
    if (container) {
      container.innerHTML = helpText ? `<div class="help-text">${helpText}</div>` : '';
    }
  }
}

customElements.define('noc-combobox', NocCombobox);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
