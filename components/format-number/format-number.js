// nocturnal-components/components/format-number/format-number.js

/**
 * @customElement noc-format-number
 *
 * Formats a numeric value using the browser-native Intl.NumberFormat API.
 * The browser's current locale is used automatically — no locale attribute needed.
 *
 * Attributes:
 * @attr {number} value
 *   The number to format. Required.
 *
 * @attr {'decimal'|'currency'|'percent'|'unit'} type
 *   The formatting style.
 *   - decimal  : plain number with grouping/separators (default)
 *   - currency : monetary value — requires `currency` attr
 *   - percent  : multiplies by 100 and appends % — pass 0.75 to get "75%"
 *   - unit     : physical unit — requires `unit` attr (e.g. "kilometer-per-hour")
 *
 * @attr {string} currency
 *   ISO 4217 currency code. Only used when type="currency". e.g. "USD", "EUR", "GBP".
 *
 * @attr {'symbol'|'narrowSymbol'|'code'|'name'} currency-display
 *   How to render the currency label.
 *   - symbol       : "$" (default)
 *   - narrowSymbol : "$" with disambiguation suppressed
 *   - code         : "USD"
 *   - name         : "US dollar"
 *
 * @attr {string} unit
 *   An Intl-accepted unit identifier. Only used when type="unit".
 *   e.g. "kilometer-per-hour", "liter", "pound", "celsius", "degree".
 *
 * @attr {'long'|'short'|'narrow'} unit-display
 *   How to render the unit label. Only used when type="unit". Defaults to "short".
 *
 * @attr {number} min-fraction-digits
 *   Minimum decimal places shown.
 *
 * @attr {number} max-fraction-digits
 *   Maximum decimal places shown.
 *
 * @attr {boolean} no-grouping
 *   When present, disables the thousands separator (e.g. "1000" not "1,000").
 *
 * @attr {'standard'|'scientific'|'engineering'|'compact'} notation
 *   Number notation style. Defaults to "standard".
 *   - compact : short suffix form — "1.2M", "4.5B", etc.
 *
 * @attr {'short'|'long'} compact-display
 *   Controls compact suffix length. Only used when notation="compact". Defaults to "short".
 *
 * @attr {'always'|'exceptZero'|'never'|'auto'} sign-display
 *   Controls when the sign is shown. Defaults to "auto" (negative only).
 *   - always     : always show + or −
 *   - exceptZero : show sign except for 0
 */

function buildTemplate(attrs = {}) {
  const raw = attrs.value ?? '';

  if (raw === null || raw === '') {
    return `<span part="base">—</span>`;
  }

  const num = parseFloat(raw);

  if (isNaN(num)) {
    return `<span part="base">invalid</span>`;
  }

  const type            = attrs.type              || 'decimal';
  const currency        = attrs.currency          || 'USD';
  const currencyDisplay = attrs['currency-display'] || 'symbol';
  const unit            = attrs.unit              || '';
  const unitDisplay     = attrs['unit-display']   || 'short';
  const notation        = attrs.notation          || 'standard';
  const compactDisplay  = attrs['compact-display'] || 'short';
  const signDisplay     = attrs['sign-display']   || 'auto';
  const noGrouping      = 'no-grouping' in attrs;
  const minFrac         = attrs['min-fraction-digits'] ?? null;
  const maxFrac         = attrs['max-fraction-digits'] ?? null;

  const options = {
    style:          type,
    notation,
    compactDisplay,
    signDisplay,
    useGrouping:    !noGrouping,
  };

  if (type === 'currency') {
    options.currency        = currency;
    options.currencyDisplay = currencyDisplay;
  }

  if (type === 'unit') {
    options.unit        = unit;
    options.unitDisplay = unitDisplay;
  }

  if (minFrac !== null) {
    options.minimumFractionDigits = parseInt(minFrac, 10);
  }

  if (maxFrac !== null) {
    options.maximumFractionDigits = parseInt(maxFrac, 10);
  }

  let formatted;
  try {
    formatted = new Intl.NumberFormat(undefined, options).format(num);
  } catch (_) {
    formatted = String(num);
  }

  return `<span part="base">${formatted}</span>`;
}

class NocFormatNumber extends HTMLElement {

  static get observedAttributes() {
    return [
      'value', 'type', 'currency', 'currency-display',
      'unit', 'unit-display',
      'min-fraction-digits', 'max-fraction-digits',
      'no-grouping', 'notation', 'compact-display', 'sign-display',
    ];
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

  _format(num) {
    const type            = this.getAttribute('type')             || 'decimal';
    const currency        = this.getAttribute('currency')         || 'USD';
    const currencyDisplay = this.getAttribute('currency-display') || 'symbol';
    const unit            = this.getAttribute('unit')             || '';
    const unitDisplay     = this.getAttribute('unit-display')     || 'short';
    const notation        = this.getAttribute('notation')         || 'standard';
    const compactDisplay  = this.getAttribute('compact-display')  || 'short';
    const signDisplay     = this.getAttribute('sign-display')     || 'auto';
    const noGrouping      = this.hasAttribute('no-grouping');

    const minFrac = this.getAttribute('min-fraction-digits');
    const maxFrac = this.getAttribute('max-fraction-digits');

    const options = {
      style:          type,
      notation,
      compactDisplay,
      signDisplay,
      useGrouping:    !noGrouping,
    };

    if (type === 'currency') {
      options.currency        = currency;
      options.currencyDisplay = currencyDisplay;
    }

    if (type === 'unit') {
      options.unit        = unit;
      options.unitDisplay = unitDisplay;
    }

    if (minFrac !== null) {
      options.minimumFractionDigits = parseInt(minFrac, 10);
    }

    if (maxFrac !== null) {
      options.maximumFractionDigits = parseInt(maxFrac, 10);
    }

    try {
      return new Intl.NumberFormat(undefined, options).format(num);
    } catch (_) {
      return String(num);
    }
  }

  _render() {
    const raw = this.getAttribute('value');

    if (raw === null || raw === '') {
      this.shadowRoot.innerHTML = `<span part="base">—</span>`;
      return;
    }

    const num = parseFloat(raw);

    if (isNaN(num)) {
      this.shadowRoot.innerHTML = `<span part="base">invalid</span>`;
      return;
    }

    this.shadowRoot.innerHTML = `<span part="base">${this._format(num)}</span>`;
  }
}

customElements.define('noc-format-number', NocFormatNumber);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
