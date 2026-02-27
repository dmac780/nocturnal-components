// nocturnal-components/components/file-input/file-input.js

/**
 * @customElement noc-file-input
 * 
 * @slot - The default label text.
 * @slot label - Custom label content (alternative to using the label attribute).
 * @slot hint - Custom hint content with HTML support (alternative to using the hint attribute).
 * @slot dropzone - Custom content to display inside the dropzone area.
 * @slot file-icon - Custom icon to display for each file in the list.
 * 
 * Attributes:
 * @attr {string} label - Label text to display above the file input.
 * @attr {string} hint - Hint text to display below the file input.
 * @attr {string} accept - Comma-separated list of unique file type specifiers (e.g., '.jpg,.png,image/*').
 * @attr {boolean} multiple - If present, allows selecting multiple files.
 * @attr {boolean} disabled - Whether the file input is disabled.
 * @attr {boolean} required - Whether the file input is required for form validation.
 * @attr {'sm' | 'md' | 'lg'} size - The size of the file input. Defaults to 'md'.
 * @attr {string} name - The name attribute for form submission.
 * 
 * CSS Custom Properties:
 * @cssprop --noc-file-input-bg - Background color of the dropzone.
 * @cssprop --noc-file-input-border - Border color of the dropzone.
 * @cssprop --noc-file-input-color - Text color inside the dropzone.
 * @cssprop --noc-file-input-radius - Border radius of the dropzone.
 * @cssprop --noc-file-input-accent - Accent color for drag-over state.
 * @cssprop --noc-file-input-shadow - Box shadow when dragging over.
 * 
 * Events:
 * @event noc-change - Emitted when files are selected or removed. Detail contains { files: File[] }.
 * @event noc-remove - Emitted when a file is removed. Detail contains { file: File, index: number }.
 * 
 * Properties:
 * @property {File[]} files - Array of selected files. Must be reassigned (not mutated) to trigger updates.
 */

function buildTemplate(attrs = {}) {
  const label    = attrs.label    || '';
  const hint     = attrs.hint     || '';
  const accept   = attrs.accept   || '';
  const multiple = 'multiple' in attrs;
  const disabled = 'disabled' in attrs;
  const required = 'required' in attrs;
  const name     = attrs.name     || '';
  const size     = attrs.size     || 'md';

  return `
    <style>
      :host {
        display: block;
        font-family: inherit;
        --noc-file-input-bg: rgba(26, 26, 26, 0.5);
        --noc-file-input-border: rgba(255, 255, 255, 0.1);
        --noc-file-input-color: #eee;
        --noc-file-input-radius: 12px;
        --noc-file-input-accent: var(--noc-accent, #2563eb);
        --noc-file-input-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
      }

      .file-input-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        margin-bottom: 0.25rem;
        color: #fff;
      }

      .hint {
        font-size: 0.75rem;
        color: #888;
        margin-top: 0.25rem;
      }

      .dropzone {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        min-height: 180px;
        padding: 2rem;
        border: 2px dashed var(--noc-file-input-border);
        border-radius: var(--noc-file-input-radius);
        background: var(--noc-file-input-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        text-align: center;
        color: var(--noc-file-input-color);
      }

      .dropzone:hover:not(.disabled) {
        border-color: rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.03);
      }

      .dropzone.dragging {
        border-color: var(--noc-file-input-accent);
        background: rgba(37, 99, 235, 0.05);
        box-shadow: var(--noc-file-input-shadow);
        transform: scale(1.01);
      }

      .dropzone.disabled {
        opacity: 0.4;
        cursor: not-allowed;
        pointer-events: none;
      }

      .file-input-wrapper.invalid .dropzone {
        border-color: #ef4444;
      }

      .dropzone-icon {
        width: 48px;
        height: 48px;
        color: #666;
        transition: color 0.2s;
      }

      .dropzone:hover:not(.disabled) .dropzone-icon,
      .dropzone.dragging .dropzone-icon {
        color: var(--noc-file-input-accent);
      }

      .dropzone-text {
        font-size: 0.9375rem;
        color: #aaa;
      }

      .dropzone-hint {
        font-size: 0.8125rem;
        color: #666;
      }

      .file-input-wrapper.sm .dropzone {
        min-height: 140px;
        padding: 1.5rem;
      }

      .file-input-wrapper.sm .dropzone-icon {
        width: 36px;
        height: 36px;
      }

      .file-input-wrapper.sm .dropzone-text {
        font-size: 0.875rem;
      }

      .file-input-wrapper.lg .dropzone {
        min-height: 220px;
        padding: 2.5rem;
      }

      .file-input-wrapper.lg .dropzone-icon {
        width: 60px;
        height: 60px;
      }

      .file-input-wrapper.lg .dropzone-text {
        font-size: 1.0625rem;
      }

      input[type="file"] {
        display: none;
      }

      .file-list {
        display: none;
        flex-direction: column;
        gap: 0.5rem;
      }

      .file-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        transition: all 0.2s;
      }

      .file-item:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.12);
      }

      .file-icon {
        width: 32px;
        height: 32px;
        color: var(--noc-file-input-accent);
        flex-shrink: 0;
      }

      .file-icon svg {
        width: 100%;
        height: 100%;
      }

      .file-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .file-name {
        font-size: 0.875rem;
        font-weight: 500;
        color: #fff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .file-size {
        font-size: 0.75rem;
        color: #666;
      }

      .file-item-remove {
        all: unset;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        cursor: pointer;
        color: #666;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .file-item-remove:hover {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }

      .file-item-remove svg {
        width: 16px;
        height: 16px;
      }

      ::slotted([slot="label"]),
      ::slotted([slot="hint"]) {
        display: block;
      }

      ::slotted([slot="dropzone"]) {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
      }
    </style>

    <div class="file-input-wrapper ${size}">
      <div id="label-container">
        <slot name="label">
          ${label ? `<label class="label">${label}</label>` : ''}
        </slot>
      </div>

      <div class="dropzone ${disabled ? 'disabled' : ''}" role="button" tabindex="0" aria-label="File upload area">
        <slot name="dropzone">
          <div class="dropzone-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <div class="dropzone-text">
            <strong>Click to upload</strong> or drag and drop
          </div>
          <div class="dropzone-hint">
            ${accept ? `Accepts: ${accept}` : 'Any file type'}
          </div>
        </slot>
      </div>

      <input 
        type="file" 
        ${multiple ? 'multiple' : ''} 
        ${accept ? `accept="${accept}"` : ''}
        ${disabled ? 'disabled' : ''}
        ${required ? 'required' : ''}
        ${name ? `name="${name}"` : ''}
        aria-label="File input"
      />

      <div class="file-list"></div>

      <div id="hint-container">
        <slot name="hint">
          ${hint ? `<div class="hint">${hint}</div>` : ''}
        </slot>
      </div>
    </div>
  `;
}

class NocFileInput extends HTMLElement {

  static get observedAttributes() {
    return [
      'label',
      'hint',
      'accept',
      'multiple',
      'disabled',
      'required',
      'size',
      'name'
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._files = [];
    this._isDragging = false;
    this._validationMessage = '';

    this._onClick = this._onClick.bind(this);
    this._onDragEnter = this._onDragEnter.bind(this);
    this._onDragOver = this._onDragOver.bind(this);
    this._onDragLeave = this._onDragLeave.bind(this);
    this._onDrop = this._onDrop.bind(this);
    this._onChange = this._onChange.bind(this);
  }

  get files() {
    return [...this._files];
  }

  set files(filesArray) {
    if (!Array.isArray(filesArray)) {
      console.warn('noc-file-input: files must be an array');
      return;
    }
    this._files = [...filesArray];
    this._updateFileList();
    this._updateValidity();
    this._syncInputFiles();
  }

  get value() {
    return this._files.map(f => f.name).join(', ');
  }

  connectedCallback() {
    this.render();
    this._setupEventListeners();
  }

  disconnectedCallback() {
    this._removeEventListeners();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) {
      return;
    }
    switch (name) {
      case 'label':
      case 'hint':
        this._updateLabels();
        break;
      case 'disabled':
        this._updateDisabledState();
        break;
      case 'required':
        this._updateValidity();
        break;
      case 'size':
        this._updateSize();
        break;
    }
  }

  setCustomValidity(message) {
    this._validationMessage = message;
    this._updateValidity();
  }

  reportValidity() {
    if (this._inputEl) {
      return this._inputEl.reportValidity();
    }
    return true;
  }

  checkValidity() {
    if (this._inputEl) {
      return this._inputEl.checkValidity();
    }
    return true;
  }

  _setupEventListeners() {
    const dropzone = this.shadowRoot.querySelector('.dropzone');
    const input = this.shadowRoot.querySelector('input[type="file"]');

    if (dropzone) {
      dropzone.addEventListener('click', this._onClick);
      dropzone.addEventListener('dragenter', this._onDragEnter);
      dropzone.addEventListener('dragover', this._onDragOver);
      dropzone.addEventListener('dragleave', this._onDragLeave);
      dropzone.addEventListener('drop', this._onDrop);
    }

    if (input) {
      input.addEventListener('change', this._onChange);
      this._inputEl = input;
    }
  }

  _removeEventListeners() {
    const dropzone = this.shadowRoot.querySelector('.dropzone');
    const input = this.shadowRoot.querySelector('input[type="file"]');

    if (dropzone) {
      dropzone.removeEventListener('click', this._onClick);
      dropzone.removeEventListener('dragenter', this._onDragEnter);
      dropzone.removeEventListener('dragover', this._onDragOver);
      dropzone.removeEventListener('dragleave', this._onDragLeave);
      dropzone.removeEventListener('drop', this._onDrop);
    }

    if (input) {
      input.removeEventListener('change', this._onChange);
    }
  }

  _onClick(e) {
    if (this.hasAttribute('disabled')) {
      return;
    }

    if (e.target.closest('.file-item-remove')) {
      return;
    }

    this._inputEl?.click();
  }

  _onDragEnter(e) {
    if (this.hasAttribute('disabled')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    this._isDragging = true;
    this._updateDragState();
  }

  _onDragOver(e) {
    if (this.hasAttribute('disabled')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  }

  _onDragLeave(e) {
    if (this.hasAttribute('disabled')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    
    const dropzone = this.shadowRoot.querySelector('.dropzone');
    if (!dropzone.contains(e.relatedTarget)) {
      this._isDragging = false;
      this._updateDragState();
    }
  }

  _onDrop(e) {
    if (this.hasAttribute('disabled')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    
    this._isDragging = false;
    this._updateDragState();

    const droppedFiles = Array.from(e.dataTransfer.files);
    this._handleFiles(droppedFiles);
  }

  _onChange(e) {
    const selectedFiles = Array.from(e.target.files);
    this._handleFiles(selectedFiles);
  }

  _handleFiles(newFiles) {
    if (!newFiles.length) {
      return;
    }

    const accept = this.getAttribute('accept');
    let validFiles = newFiles;

    if (accept) {
      validFiles = newFiles.filter(file => this._isFileTypeAccepted(file, accept));
    }

    if (this.hasAttribute('multiple')) {
      this._files = [...this._files, ...validFiles];
    } else {
      this._files = validFiles.slice(0, 1);
    }

    this._updateFileList();
    this._updateValidity();

    this.dispatchEvent(new CustomEvent('noc-change', {
      bubbles: true,
      composed: true,
      detail: { files: this.files }
    }));
  }

  _isFileTypeAccepted(file, acceptString) {
    const acceptTypes = acceptString.split(',').map(t => t.trim().toLowerCase());
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();

    return acceptTypes.some(type => {
      if (type.startsWith('.')) {
        return fileName.endsWith(type);
      }
      if (type.endsWith('/*')) {
        const category = type.split('/')[0];
        return fileType.startsWith(category + '/');
      }
      return fileType === type;
    });
  }

  _removeFile(index) {
    const removedFile = this._files[index];
    this._files = this._files.filter((_, i) => i !== index);
    this._updateFileList();
    this._updateValidity();

    this.dispatchEvent(new CustomEvent('noc-remove', {
      bubbles: true,
      composed: true,
      detail: { file: removedFile, index }
    }));

    this.dispatchEvent(new CustomEvent('noc-change', {
      bubbles: true,
      composed: true,
      detail: { files: this.files }
    }));
  }

  _updateFileList() {
    const fileList = this.shadowRoot.querySelector('.file-list');
    if (!fileList) return;

    if (this._files.length === 0) {
      fileList.innerHTML = '';
      fileList.style.display = 'none';
      return;
    }

    fileList.style.display = 'block';
    fileList.innerHTML = this._files.map((file, index) => `
      <div class="file-item">
        <div class="file-icon">
          <slot name="file-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
              <polyline points="13 2 13 9 20 9"></polyline>
            </svg>
          </slot>
        </div>
        <div class="file-info">
          <div class="file-name">${this._escapeHtml(file.name)}</div>
          <div class="file-size">${this._formatFileSize(file.size)}</div>
        </div>
        <button type="button" class="file-item-remove" data-index="${index}" aria-label="Remove file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `).join('');

    fileList.querySelectorAll('.file-item-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        this._removeFile(index);
      });
    });
  }

  _updateDragState() {
    const dropzone = this.shadowRoot.querySelector('.dropzone');
    if (dropzone) {
      if (this._isDragging) {
        dropzone.classList.add('dragging');
      } else {
        dropzone.classList.remove('dragging');
      }
    }
  }

  _updateDisabledState() {
    const dropzone = this.shadowRoot.querySelector('.dropzone');
    if (dropzone) {
      if (this.hasAttribute('disabled')) {
        dropzone.classList.add('disabled');
      } else {
        dropzone.classList.remove('disabled');
      }
    }
    if (this._inputEl) {
      this._inputEl.disabled = this.hasAttribute('disabled');
    }
  }

  _updateSize() {
    const wrapper = this.shadowRoot.querySelector('.file-input-wrapper');
    if (wrapper) {
      wrapper.className = `file-input-wrapper ${this.getAttribute('size') || 'md'}`;
    }
  }

  _updateLabels() {
    const labelContainer = this.shadowRoot.getElementById('label-container');
    const hintContainer = this.shadowRoot.getElementById('hint-container');
    const label = this.getAttribute('label');
    const hint = this.getAttribute('hint');

    if (labelContainer) {
      labelContainer.innerHTML = label ? `<label class="label">${label}</label>` : '';
    }

    if (hintContainer) {
      hintContainer.innerHTML = hint ? `<div class="hint">${hint}</div>` : '';
    }
  }

  _updateValidity() {
    if (!this._inputEl) return;

    if (this._validationMessage) {
      this._inputEl.setCustomValidity(this._validationMessage);
    } else if (this.hasAttribute('required') && this._files.length === 0) {
      this._inputEl.setCustomValidity('Please select at least one file.');
    } else {
      this._inputEl.setCustomValidity('');
    }

    const wrapper = this.shadowRoot.querySelector('.file-input-wrapper');
    if (wrapper) {
      if (!this._inputEl.checkValidity()) {
        wrapper.classList.add('invalid');
      } else {
        wrapper.classList.remove('invalid');
      }
    }
  }

  _syncInputFiles() {
    if (!this._inputEl) return;
    
    const dt = new DataTransfer();
    this._files.forEach(file => dt.items.add(file));
    this._inputEl.files = dt.files;
  }

  _formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  render() {
    this.shadowRoot.innerHTML = buildTemplate({
      label:    this.getAttribute('label'),
      hint:     this.getAttribute('hint'),
      accept:   this.getAttribute('accept'),
      multiple: this.hasAttribute('multiple') ? true : undefined,
      disabled: this.hasAttribute('disabled') ? true : undefined,
      required: this.hasAttribute('required') ? true : undefined,
      name:     this.getAttribute('name'),
      size:     this.getAttribute('size'),
    });

    this._updateFileList();
    this._updateValidity();
  }
}

customElements.define('noc-file-input', NocFileInput);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
