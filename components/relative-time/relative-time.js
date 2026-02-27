// nocturnal-components/components/relative-time/relative-time.js

/**
 * @customElement noc-relative-time
 * 
 * Attributes:
 * @attr {string} datetime - The ISO 8601 date string to display.
 * @attr {'relative' | 'absolute'} format - How to format the date. Defaults to 'relative'.
 * @attr {boolean} sync - If present, the component will update periodically to reflect the passage of time.
 */

function buildTemplate(attrs = {}) {
  const raw    = attrs.datetime || '';
  const format = attrs.format   || 'relative';

  if (!raw) {
    return `<span>Invalid date</span>`;
  }

  const date = new Date(raw);

  if (isNaN(date)) {
    return `<span>Invalid date</span>`;
  }

  let text;

  if (format === 'absolute') {
    text = date.toLocaleString();
  } else {
    const rtf  = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    const diff = date - Date.now();

    const units = [
      ['year',   1000 * 60 * 60 * 24 * 365],
      ['month',  1000 * 60 * 60 * 24 * 30],
      ['day',    1000 * 60 * 60 * 24],
      ['hour',   1000 * 60 * 60],
      ['minute', 1000 * 60],
      ['second', 1000],
    ];

    text = 'just now';
    for (const [unit, ms] of units) {
      const value = Math.round(diff / ms);
      if (Math.abs(value) >= 1) {
        text = rtf.format(value, unit);
        break;
      }
    }
  }

  return `<span part="time">${text}</span>`;
}

class NocRelativeTime extends HTMLElement {

  static get observedAttributes() {
    return ['datetime', 'format', 'sync'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._timer = null;
  }

  connectedCallback() {
    this.render();
    if (this.hasAttribute('sync')) this.startSync();
  }

  disconnectedCallback() {
    this.stopSync();
  }

  attributeChangedCallback() {
    this.render();
    if (this.hasAttribute('sync')) {
      this.startSync();
    } else {
      this.stopSync();
    }
  }

  get date() {
    const value = this.getAttribute('datetime');
    const date  = new Date(value);
    return isNaN(date) ? null : date;
  }

  startSync() {
    this.stopSync();

    const update = () => this.render();
    update();

    const diff = Math.abs(Date.now() - (this.date?.getTime() || 0));

    let interval = 1000;
    if (diff > 60_000)      { interval = 60_000; }
    if (diff > 3_600_000)   { interval = 3_600_000; }
    
    this._timer = setInterval(update, interval);
  }

  stopSync() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  formatRelative(date) {
    const rtf  = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    const diff = date - Date.now();

    const units = [
      ['year',   1000 * 60 * 60 * 24 * 365],
      ['month',  1000 * 60 * 60 * 24 * 30],
      ['day',    1000 * 60 * 60 * 24],
      ['hour',   1000 * 60 * 60],
      ['minute', 1000 * 60],
      ['second', 1000],
    ];

    for (const [unit, ms] of units) {
      const value = Math.round(diff / ms);
      if (Math.abs(value) >= 1) {
        return rtf.format(value, unit);
      }
    }

    return 'just now';
  }

  render() {
    if (!this.date) {
      this.shadowRoot.innerHTML = `<span>Invalid date</span>`;
      return;
    }

    const format = this.getAttribute('format') || 'relative';
    const text   = format === 'absolute'
      ? this.date.toLocaleString()
      : this.formatRelative(this.date);

    this.shadowRoot.innerHTML = `<span part="time">${text}</span>`;
  }
}

customElements.define('noc-relative-time', NocRelativeTime);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
