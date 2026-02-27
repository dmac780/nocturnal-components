// nocturnal-components/components/format-byte/format-byte.js

/**
 * @customElement noc-format-byte
 *
 * Formats a raw byte value into a human-readable string using the browser-native
 * Intl.NumberFormat API. No locale attribute needed, the browser's current
 * locale is used automatically.
 *
 * Attributes:
 * @attr {number} value
 *   The raw number of bytes to format. Required.
 *
 * @attr {'decimal'|'binary'} unit
 *   The unit system to use.
 *   - decimal : SI prefixes — 1 KB = 1,000 bytes  (default)
 *   - binary  : IEC prefixes — 1 KiB = 1,024 bytes
 *
 * @attr {'long'|'short'|'narrow'} display
 *   Controls how the unit label is rendered.
 *   - short  : "2.4 MB"   (default)
 *   - long   : "2.4 megabytes"
 *   - narrow : "2.4MB"
 *
 * @attr {number} max-fraction-digits
 *   Maximum decimal places shown. Defaults to 2.
 */

function buildTemplate(attrs = {}) {
  const raw     = attrs.value ?? '';
  const unit    = attrs.unit    || 'decimal';
  const display = attrs.display || 'short';
  const maxFrac = parseInt(attrs['max-fraction-digits'] ?? '2', 10);

  if (raw === null || raw === '') {
    return `<span part="base">—</span>`;
  }

  const bytes = parseFloat(raw);

  if (isNaN(bytes)) {
    return `<span part="base">invalid</span>`;
  }

  const isBinary = unit === 'binary';
  const base = isBinary ? 1024 : 1000;
  const decimalUnits = ['byte', 'kilobyte',  'megabyte',  'gigabyte',  'terabyte',  'petabyte'];
  const binaryUnits  = ['byte', 'kibibyte',  'mebibyte',  'gibibyte',  'tebibyte',  'pebibyte'];
  const unitList = isBinary ? binaryUnits : decimalUnits;

  let value = Math.abs(bytes);
  let tierIndex = 0;

  while (value >= base && tierIndex < unitList.length - 1) {
    value /= base;
    tierIndex++;
  }

  if (bytes < 0) {
    value = -value;
  }

  let formatted;
  try {
    formatted = new Intl.NumberFormat(undefined, {
      style:                 'unit',
      unit:                  unitList[tierIndex],
      unitDisplay:           display,
      maximumFractionDigits: maxFrac,
    }).format(value);
  } catch (_) {
    formatted = `${value.toFixed(maxFrac)} ${unitList[tierIndex]}`;
  }

  return `<span part="base">${formatted}</span>`;
}

class NocFormatByte extends HTMLElement {

  static get observedAttributes() {
    return ['value', 'unit', 'display', 'max-fraction-digits'];
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

  _format(bytes) {
    const unit     = this.getAttribute('unit')    || 'decimal';
    const display  = this.getAttribute('display') || 'short';
    const maxFrac  = parseInt(this.getAttribute('max-fraction-digits') ?? '2', 10);
    const isBinary = unit === 'binary';

    const base   = isBinary ? 1024 : 1000;

    const decimalUnits = ['byte', 'kilobyte',  'megabyte',  'gigabyte',  'terabyte',  'petabyte'];
    const binaryUnits  = ['byte', 'kibibyte',  'mebibyte',  'gibibyte',  'tebibyte',  'pebibyte'];
    const unitList     = isBinary ? binaryUnits : decimalUnits;

    let value     = Math.abs(bytes);
    let tierIndex = 0;

    while (value >= base && tierIndex < unitList.length - 1) {
      value /= base;
      tierIndex++;
    }

    if (bytes < 0) {
      value = -value;
    }

    try {
      return new Intl.NumberFormat(undefined, {
        style:                 'unit',
        unit:                  unitList[tierIndex],
        unitDisplay:           display,
        maximumFractionDigits: maxFrac,
      }).format(value);
    } catch (_) {
      return `${value.toFixed(maxFrac)} ${unitList[tierIndex]}`;
    }
  }

  _render() {
    const raw = this.getAttribute('value');

    if (raw === null || raw === '') {
      this.shadowRoot.innerHTML = `<span part="base">—</span>`;
      return;
    }

    const bytes = parseFloat(raw);

    if (isNaN(bytes)) {
      this.shadowRoot.innerHTML = `<span part="base">invalid</span>`;
      return;
    }

    this.shadowRoot.innerHTML = `<span part="base">${this._format(bytes)}</span>`;
  }
}

customElements.define('noc-format-byte', NocFormatByte);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
