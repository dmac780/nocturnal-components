// nocturnal-components/components/format-date/format-date.js

/**
 * @customElement noc-format-date
 *
 * Formats a date/datetime value using the browser-native Intl.DateTimeFormat API.
 * The browser's current locale is used automatically — no locale attribute needed.
 * Pairs naturally with noc-date-picker output.
 *
 * Attributes:
 * @attr {string} value
 *   The date to format. Accepts any value parseable by new Date():
 *   ISO 8601 strings ("2026-03-15", "2026-03-15T14:30:00Z"), timestamps, etc.
 *   Required.
 *
 * @attr {'date'|'time'|'datetime'} type
 *   Which parts of the value to display.
 *   - date     : date portion only (default)
 *   - time     : time portion only
 *   - datetime : both date and time
 *
 * @attr {'full'|'long'|'medium'|'short'} date-style
 *   Preset date formatting style. Mutually exclusive with individual part attrs.
 *   - full   : "Monday, March 15, 2026"
 *   - long   : "March 15, 2026"
 *   - medium : "Mar 15, 2026"  (default)
 *   - short  : "3/15/26"
 *
 * @attr {'full'|'long'|'medium'|'short'} time-style
 *   Preset time formatting style. Used when type="time" or type="datetime".
 *   - full   : "2:30:00 PM Central Daylight Time"
 *   - long   : "2:30:00 PM CDT"
 *   - medium : "2:30:00 PM"
 *   - short  : "2:30 PM"  (default)
 *
 * @attr {'numeric'|'2-digit'} day
 *   Individual day part override. Overrides date-style when set.
 *
 * @attr {'numeric'|'2-digit'|'long'|'short'|'narrow'} month
 *   Individual month part override.
 *
 * @attr {'numeric'|'2-digit'} year
 *   Individual year part override.
 *
 * @attr {'numeric'|'2-digit'} hour
 *   Individual hour part override.
 *
 * @attr {'numeric'|'2-digit'} minute
 *   Individual minute part override.
 *
 * @attr {'numeric'|'2-digit'} second
 *   Individual second part override.
 *
 * @attr {boolean} hour12
 *   Force 12-hour clock. If omitted the locale default is used.
 *   Set to "false" for 24-hour.
 *
 * @attr {string} timezone
 *   IANA timezone name. e.g. "America/New_York", "Europe/London", "UTC".
 *   Defaults to the browser's local timezone.
 */

function buildTemplate(attrs = {}) {
  const raw = attrs.value ?? '';

  if (raw === null || raw === '') {
    return `<span part="base">—</span>`;
  }

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(String(raw).trim())
    ? String(raw).trim() + 'T00:00:00'
    : raw;

  const date = new Date(normalized);

  if (isNaN(date.getTime())) {
    return `<span part="base">invalid</span>`;
  }

  const type       = attrs.type       || 'date';
  const timezone   = attrs.timezone   || null;
  const hour12Attr = attrs.hour12     ?? null;
  const day        = attrs.day        || null;
  const month      = attrs.month      || null;
  const year       = attrs.year       || null;
  const hour       = attrs.hour       || null;
  const minute     = attrs.minute     || null;
  const second     = attrs.second     || null;

  const hasPartOverrides = day || month || year || hour || minute || second;
  const options = {};

  if (timezone)      { options.timeZone = timezone; }
  if (hour12Attr !== null) { options.hour12 = hour12Attr !== 'false' && hour12Attr !== false; }

  if (hasPartOverrides) {
    if (day)    { options.day    = day; }
    if (month)  { options.month  = month; }
    if (year)   { options.year   = year; }
    if (hour)   { options.hour   = hour; }
    if (minute) { options.minute = minute; }
    if (second) { options.second = second; }
  } else {
    const dateStyle = attrs['date-style'] || 'medium';
    const timeStyle = attrs['time-style'] || 'short';

    if (type === 'date' || type === 'datetime') {
      options.dateStyle = dateStyle;
    }
    if (type === 'time' || type === 'datetime') {
      options.timeStyle = timeStyle;
    }
  }

  let formatted;
  try {
    formatted = new Intl.DateTimeFormat(undefined, options).format(date);
  } catch (_) {
    formatted = date.toLocaleDateString();
  }

  return `<span part="base">${formatted}</span>`;
}

class NocFormatDate extends HTMLElement {

  static get observedAttributes() {
    return [
      'value', 'type',
      'date-style', 'time-style',
      'day', 'month', 'year',
      'hour', 'minute', 'second',
      'hour12', 'timezone',
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

  _format(date) {
    const type       = this.getAttribute('type')       || 'date';
    const timezone   = this.getAttribute('timezone');
    const hour12Attr = this.getAttribute('hour12');

    const day    = this.getAttribute('day');
    const month  = this.getAttribute('month');
    const year   = this.getAttribute('year');
    const hour   = this.getAttribute('hour');
    const minute = this.getAttribute('minute');
    const second = this.getAttribute('second');

    const hasPartOverrides = day || month || year || hour || minute || second;

    const options = {};

    if (timezone) {
      options.timeZone = timezone;
    }

    if (hour12Attr !== null) {
      options.hour12 = hour12Attr !== 'false';
    }

    if (hasPartOverrides) {
      if (day)    { options.day    = day; }
      if (month)  { options.month  = month; }
      if (year)   { options.year   = year; }
      if (hour)   { options.hour   = hour; }
      if (minute) { options.minute = minute; }
      if (second) { options.second = second; }
    } else {
      const dateStyle = this.getAttribute('date-style') || 'medium';
      const timeStyle = this.getAttribute('time-style') || 'short';

      if (type === 'date' || type === 'datetime') {
        options.dateStyle = dateStyle;
      }

      if (type === 'time' || type === 'datetime') {
        options.timeStyle = timeStyle;
      }
    }

    try {
      return new Intl.DateTimeFormat(undefined, options).format(date);
    } catch (_) {
      return date.toLocaleDateString();
    }
  }

  _render() {
    const raw = this.getAttribute('value');

    if (raw === null || raw === '') {
      this.shadowRoot.innerHTML = `<span part="base">—</span>`;
      return;
    }

    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw.trim())
      ? raw.trim() + 'T00:00:00'
      : raw;

    const date = new Date(normalized);

    if (isNaN(date.getTime())) {
      this.shadowRoot.innerHTML = `<span part="base">invalid</span>`;
      return;
    }

    this.shadowRoot.innerHTML = `<span part="base">${this._format(date)}</span>`;
  }
}

customElements.define('noc-format-date', NocFormatDate);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
