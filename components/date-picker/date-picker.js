// nocturnal-components/components/date-picker/date-picker.js

/**
 * @customElement noc-date-picker
 *
 * Attributes:
 * @attr {string}  value        - Selected date in YYYY-MM-DD format (single mode).
 * @attr {string}  value-start  - Range start date in YYYY-MM-DD format (range mode).
 * @attr {string}  value-end    - Range end date in YYYY-MM-DD format (range mode).
 * @attr {string}  placeholder  - Placeholder text for the trigger input. Defaults to 'Pick a date'.
 * @attr {string}  label        - Label displayed above the trigger input.
 * @attr {string}  help-text    - Help text displayed below the trigger input.
 * @attr {string}  min          - Minimum selectable date in YYYY-MM-DD format.
 * @attr {string}  max          - Maximum selectable date in YYYY-MM-DD format.
 * @attr {string}  format       - Display format token string. Supports: YYYY MM DD MMM.
 *                                Defaults to 'MMM DD, YYYY'.
 * @attr {boolean} range        - Enables date-range selection mode (start + end date).
 * @attr {boolean} disabled     - Disables the trigger input.
 * @attr {boolean} readonly     - Makes the trigger input read-only (calendar still opens).
 * @attr {boolean} clearable    - Shows a clear button when a value is set.
 * @attr {'top'|'bottom'} placement - Panel placement relative to the trigger. Defaults to 'bottom'.
 *
 * CSS Custom Properties:
 * @cssprop --noc-dp-bg              - Calendar panel background (default: #141414)
 * @cssprop --noc-dp-border          - Panel + trigger border colour (default: #2a2a2a)
 * @cssprop --noc-dp-radius          - Panel border radius (default: 12px)
 * @cssprop --noc-dp-shadow          - Panel box shadow
 * @cssprop --noc-dp-input-bg        - Trigger input background (default: #1a1a1a)
 * @cssprop --noc-dp-input-radius    - Trigger input border radius (default: 8px)
 * @cssprop --noc-dp-input-color     - Trigger input text colour (default: #eee)
 * @cssprop --noc-dp-focus           - Focus ring / active border colour (default: var(--noc-accent, #2563eb))
 * @cssprop --noc-dp-focus-alpha     - Focus ring shadow (default: rgba(37,99,235,.2))
 * @cssprop --noc-dp-label-color     - Label text colour (default: #fff)
 * @cssprop --noc-dp-helptext-color  - Help text colour (default: #666)
 * @cssprop --noc-dp-day-color       - Default day number colour (default: #ccc)
 * @cssprop --noc-dp-day-hover       - Day hover background (default: #2a2a2a)
 * @cssprop --noc-dp-day-muted       - Outside-month day colour (default: #333)
 * @cssprop --noc-dp-selected-bg     - Selected day background (default: var(--noc-accent, #2563eb))
 * @cssprop --noc-dp-selected-color  - Selected day text colour (default: #fff)
 * @cssprop --noc-dp-range-bg        - In-range day background (default: rgba(37,99,235,.15))
 * @cssprop --noc-dp-today-color     - Today indicator colour (default: var(--noc-accent, #2563eb))
 * @cssprop --noc-dp-nav-color       - Nav arrow colour (default: #666)
 * @cssprop --noc-dp-nav-hover       - Nav arrow hover colour (default: #eee)
 * @cssprop --noc-dp-header-color    - Month/year heading colour (default: #fff)
 * @cssprop --noc-dp-weekday-color   - Weekday label colour (default: #444)
 * @cssprop --noc-dp-z               - Panel z-index (default: 1000)
 *
 * Events:
 * @event noc-change - Emitted when the selected value changes.
 *   detail (single): { value: string }
 *   detail (range):  { valueStart: string, valueEnd: string }
 * @event noc-clear  - Emitted when the value is cleared.
 */
class NocDatePicker extends HTMLElement {

  static get observedAttributes() {
    return [
      'value', 'value-start', 'value-end',
      'placeholder', 'label', 'help-text',
      'min', 'max', 'format',
      'range', 'disabled', 'readonly', 'clearable', 'placement'
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._open        = false;
    this._viewYear    = new Date().getFullYear();
    this._viewMonth   = new Date().getMonth();
    this._rangeHover  = null;

    this._handleOutsideClick = this._handleOutsideClick.bind(this);
    this._handleKeyDown      = this._handleKeyDown.bind(this);
  }

  // ─── lifecycle ──────────────────────────────────────────────────────────────

  connectedCallback() {
    this._syncViewFromValue();
    this._render();
    document.addEventListener('click',   this._handleOutsideClick);
    document.addEventListener('keydown', this._handleKeyDown);
  }

  disconnectedCallback() {
    document.removeEventListener('click',   this._handleOutsideClick);
    document.removeEventListener('keydown', this._handleKeyDown);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this.isConnected) {
      return;
    }

    if (name === 'value' || name === 'value-start' || name === 'value-end') {
      this._syncViewFromValue();
    }

    this._render();
  }

  get value() {
    return this.getAttribute('value') || '';
  }

  set value(v) {
    this.setAttribute('value', v);
  }

  get valueStart() {
    return this.getAttribute('value-start') || '';
  }

  get valueEnd() {
    return this.getAttribute('value-end') || '';
  }

  _isRange() {
    return this.hasAttribute('range');
  }

  _parseDate(str) {
    if (!str) {
      return null;
    }
    const d = new Date(str + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }

  _toISO(date) {
    const y  = date.getFullYear();
    const m  = String(date.getMonth() + 1).padStart(2, '0');
    const d  = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  _formatDisplay(isoStr) {
    const d = this._parseDate(isoStr);

    if (!d) {
      return '';
    }

    const fmt    = this.getAttribute('format') || 'MMM DD, YYYY';
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const tokens = {
      'YYYY': String(d.getFullYear()),
      'MMM':  months[d.getMonth()],
      'MM':   String(d.getMonth() + 1).padStart(2, '0'),
      'DD':   String(d.getDate()).padStart(2, '0'),
    };

    return fmt.replace(/YYYY|MMM|MM|DD/g, token => tokens[token]);
  }

  _displayValue() {
    if (this._isRange()) {
      const s = this._formatDisplay(this.valueStart);
      const e = this._formatDisplay(this.valueEnd);

      if (s && e) {
        return `${s} – ${e}`;
      }

      if (s) {
        return `${s} – …`;
      }

      return '';
    }

    return this._formatDisplay(this.value);
  }

  _syncViewFromValue() {
    const iso = this._isRange() ? this.valueStart : this.value;
    const d   = this._parseDate(iso);

    if (d) {
      this._viewYear  = d.getFullYear();
      this._viewMonth = d.getMonth();
    }
  }

  _isDisabledDate(isoStr) {
    const min = this.getAttribute('min');
    const max = this.getAttribute('max');

    if (min && isoStr < min) {
      return true;
    }

    if (max && isoStr > max) {
      return true;
    }

    return false;
  }

  _isInRange(isoStr) {
    if (!this._isRange()) {
      return false;
    }

    const start = this.valueStart;
    const end   = this.valueEnd || this._rangeHover;

    if (!start || !end) {
      return false;
    }

    const lo = start < end ? start : end;
    const hi = start < end ? end   : start;

    return isoStr > lo && isoStr < hi;
  }

  _isRangeEdge(isoStr) {
    if (!this._isRange()) {
      return false;
    }

    return isoStr === this.valueStart || isoStr === this.valueEnd;
  }

  _isRangeStart(isoStr) {
    return this._isRange() && isoStr === this.valueStart;
  }

  _isRangeEnd(isoStr) {
    return this._isRange() && isoStr === this.valueEnd;
  }

  _buildDays() {
    const year  = this._viewYear;
    const month = this._viewMonth;

    const firstOfMonth = new Date(year, month, 1);
    const startOffset  = firstOfMonth.getDay();
    const gridStart    = new Date(year, month, 1 - startOffset);

    const days = [];

    for (let i = 0; i < 42; i++) {
      const d          = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const iso        = this._toISO(d);
      const inMonth    = d.getMonth() === month;
      const isToday    = iso === this._toISO(new Date());
      const isSelected = this._isRange()
        ? this._isRangeEdge(iso)
        : iso === this.value;
      const isStart    = this._isRangeStart(iso);
      const isEnd      = this._isRangeEnd(iso);
      const inRange    = this._isInRange(iso);
      const disabled   = this._isDisabledDate(iso);

      days.push({ iso, day: d.getDate(), inMonth, isToday, isSelected, isStart, isEnd, inRange, disabled });
    }

    return days;
  }

  _openPanel() {
    if (this.hasAttribute('disabled')) {
      return;
    }

    this._open = true;
    this._syncViewFromValue();
    this._renderPanel();
  }

  _closePanel() {
    this._open = false;
    this._rangeHover = null;

    const panel = this.shadowRoot.getElementById('panel');

    if (panel) {
      panel.classList.remove('open');
    }
  }

  _handleOutsideClick(e) {
    if (!this._open) {
      return;
    }

    if (!this.contains(e.target) && !this.shadowRoot.contains(e.target)) {
      this._closePanel();
    }
  }

  _handleKeyDown(e) {
    if (e.key === 'Escape' && this._open) {
      this._closePanel();
    }
  }

  _selectDate(iso) {
    if (this._isDisabledDate(iso)) {
      return;
    }

    if (!this._isRange()) {
      this.setAttribute('value', iso);
      this._closePanel();
      this.dispatchEvent(new CustomEvent('noc-change', {
        bubbles:  true,
        composed: true,
        detail:   { value: iso }
      }));
      this._renderTrigger();
      return;
    }

    const start = this.valueStart;
    const end   = this.valueEnd;

    if (!start || (start && end)) {
      this.setAttribute('value-start', iso);
      this.removeAttribute('value-end');
    } else {
      if (iso < start) {
        this.setAttribute('value-end',   start);
        this.setAttribute('value-start', iso);
      } else {
        this.setAttribute('value-end', iso);
      }

      this._closePanel();
      this.dispatchEvent(new CustomEvent('noc-change', {
        bubbles:  true,
        composed: true,
        detail:   { valueStart: this.valueStart, valueEnd: this.valueEnd }
      }));
    }

    this._renderTrigger();
    this._renderPanel();
  }

  _clear(e) {
    e.stopPropagation();
    this.removeAttribute('value');
    this.removeAttribute('value-start');
    this.removeAttribute('value-end');
    this._rangeHover = null;
    this.dispatchEvent(new CustomEvent('noc-clear', { bubbles: true, composed: true }));
    this._renderTrigger();
  }

  _prevMonth() {
    if (this._viewMonth === 0) {
      this._viewMonth = 11;
      this._viewYear--;
    } else {
      this._viewMonth--;
    }

    this._renderPanel();
  }

  _nextMonth() {
    if (this._viewMonth === 11) {
      this._viewMonth = 0;
      this._viewYear++;
    } else {
      this._viewMonth++;
    }

    this._renderPanel();
  }

  _renderTrigger() {
    const inputEl = this.shadowRoot.getElementById('trigger-input');

    if (!inputEl) {
      return;
    }

    const val = this._displayValue();
    inputEl.value = val;

    const clearBtn = this.shadowRoot.getElementById('clear-btn');

    if (clearBtn) {
      clearBtn.style.display = this._hasClearableValue() ? 'flex' : 'none';
    }
  }

  _hasClearableValue() {
    if (!this.hasAttribute('clearable')) {
      return false;
    }

    return !!(this.value || this.valueStart || this.valueEnd);
  }

  _renderPanel() {
    const panelHost = this.shadowRoot.getElementById('panel');

    if (!panelHost) {
      return;
    }

    if (!this._open) {
      panelHost.classList.remove('open');
      return;
    }

    panelHost.classList.add('open');
    panelHost.innerHTML = this._buildPanelHTML();
    this._bindPanelEvents(panelHost);
  }

  // Lightweight hover refresh — only patches class names on existing day
  // buttons so the DOM nodes are never replaced mid-hover. This prevents
  // the click event from being swallowed by an innerHTML wipe.
  _refreshDayClasses() {
    const panelHost = this.shadowRoot.getElementById('panel');

    if (!panelHost) {
      return;
    }

    const days = this._buildDays();

    panelHost.querySelectorAll('.day').forEach((btn, i) => {
      const d = days[i];

      if (!d) {
        return;
      }

      const classes = [
        'day',
        !d.inMonth   ? 'muted'       : '',
        d.isToday    ? 'today'       : '',
        d.isSelected ? 'selected'    : '',
        d.isStart    ? 'range-start' : '',
        d.isEnd      ? 'range-end'   : '',
        d.inRange    ? 'in-range'    : '',
        d.disabled   ? 'disabled'    : '',
      ].filter(Boolean).join(' ');

      btn.className = classes;
    });
  }

  _buildPanelHTML() {
    const months  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const weekdays = ['Su','Mo','Tu','We','Th','Fr','Sa'];
    const days    = this._buildDays();

    const dayCells = days.map(d => {
      const classes = [
        'day',
        !d.inMonth   ? 'muted'    : '',
        d.isToday    ? 'today'    : '',
        d.isSelected ? 'selected' : '',
        d.isStart    ? 'range-start' : '',
        d.isEnd      ? 'range-end'   : '',
        d.inRange    ? 'in-range' : '',
        d.disabled   ? 'disabled' : '',
      ].filter(Boolean).join(' ');

      return `<button class="${classes}" data-date="${d.iso}" tabindex="${d.disabled ? -1 : 0}" aria-label="${d.iso}"${d.disabled ? ' disabled' : ''}>${d.day}</button>`;
    }).join('');

    const weekdayHeaders = weekdays.map(w => `<span class="weekday">${w}</span>`).join('');

    return `
      <div class="panel-header">
        <button class="nav-btn" id="prev" aria-label="Previous month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="month-label">${months[this._viewMonth]} ${this._viewYear}</span>
        <button class="nav-btn" id="next" aria-label="Next month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <div class="grid">
        ${weekdayHeaders}
        ${dayCells}
      </div>
    `;
  }

  _bindPanelEvents(panel) {
    panel.querySelector('#prev').addEventListener('click', (e) => {
      e.stopPropagation();
      this._prevMonth();
    });

    panel.querySelector('#next').addEventListener('click', (e) => {
      e.stopPropagation();
      this._nextMonth();
    });

    panel.querySelectorAll('.day:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._selectDate(btn.dataset.date);
      });

      if (this._isRange()) {
        btn.addEventListener('mouseenter', () => {
          if (this.valueStart && !this.valueEnd) {
            this._rangeHover = btn.dataset.date;
            this._refreshDayClasses();
          }
        });
      }
    });

    if (this._isRange()) {
      const grid = panel.querySelector('.grid');

      if (grid) {
        grid.addEventListener('mouseleave', () => {
          if (this._rangeHover !== null) {
            this._rangeHover = null;
            this._refreshDayClasses();
          }
        });
      }
    }
  }

  _render() {
    const label      = this.getAttribute('label');
    const helpText   = this.getAttribute('help-text');
    const placeholder = this.getAttribute('placeholder') || (this._isRange() ? 'Pick a range' : 'Pick a date');
    const disabled   = this.hasAttribute('disabled');
    const readonly   = this.hasAttribute('readonly');
    const placement  = this.getAttribute('placement') || 'bottom';
    const displayVal = this._displayValue();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: inherit;
          width: 100%;
          position: relative;

          --noc-dp-bg:             #141414;
          --noc-dp-border:         #2a2a2a;
          --noc-dp-radius:         12px;
          --noc-dp-shadow:         0 16px 48px -8px rgba(0,0,0,.8), 0 0 1px rgba(255,255,255,.06);
          --noc-dp-input-bg:       #1a1a1a;
          --noc-dp-input-radius:   8px;
          --noc-dp-input-color:    #eee;
          --noc-dp-focus:          var(--noc-accent, #2563eb);
          --noc-dp-focus-alpha:    rgba(37,99,235,.2);
          --noc-dp-label-color:    #fff;
          --noc-dp-helptext-color: #666;

          --noc-dp-day-color:      #ccc;
          --noc-dp-day-hover:      #2a2a2a;
          --noc-dp-day-muted:      #333;
          --noc-dp-selected-bg:    var(--noc-accent, #2563eb);
          --noc-dp-selected-color: #fff;
          --noc-dp-range-bg:       rgba(37,99,235,.15);
          --noc-dp-today-color:    var(--noc-accent, #2563eb);
          --noc-dp-nav-color:      #666;
          --noc-dp-nav-hover:      #eee;
          --noc-dp-header-color:   #fff;
          --noc-dp-weekday-color:  #444;
          --noc-dp-z:              1000;
        }

        .dp-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .dp-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--noc-dp-label-color);
        }

        .dp-help {
          font-size: 0.75rem;
          color: var(--noc-dp-helptext-color);
        }

        .trigger-wrap {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--noc-dp-input-bg);
          border: 1px solid var(--noc-dp-border);
          border-radius: var(--noc-dp-input-radius);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
          overflow: hidden;
        }

        .trigger-wrap:hover:not(.disabled) {
          border-color: #444;
        }

        .trigger-wrap:focus-within:not(.disabled) {
          border-color: var(--noc-dp-focus);
          box-shadow: 0 0 0 3px var(--noc-dp-focus-alpha);
        }

        .trigger-wrap.disabled {
          opacity: 0.45;
          cursor: not-allowed;
          pointer-events: none;
        }

        .trigger-wrap.readonly {
          cursor: default;
        }

        .trigger-wrap.readonly input {
          cursor: default;
        }

        .cal-icon {
          display: flex;
          align-items: center;
          padding: 0 0.625rem 0 0.75rem;
          color: #555;
          flex-shrink: 0;
          pointer-events: none;
        }

        #trigger-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--noc-dp-input-color);
          font: inherit;
          font-size: 0.875rem;
          padding: 0.625rem 0 0.625rem 0;
          cursor: pointer;
          min-width: 0;
          caret-color: transparent;
          user-select: none;
        }

        #trigger-input::placeholder {
          color: #555;
        }

        #clear-btn {
          all: unset;
          cursor: pointer;
          width: 28px;
          height: 28px;
          display: none;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          color: #555;
          margin-right: 0.375rem;
          flex-shrink: 0;
          transition: color 0.15s ease, background 0.15s ease;
          font-size: 0.75rem;
        }

        #clear-btn:hover {
          color: #eee;
          background: rgba(255,255,255,.06);
        }

        #panel {
          position: absolute;
          ${placement === 'top' ? 'bottom: calc(100% + 0.5rem);' : 'top: calc(100% + 0.5rem);'}
          left: 0;
          z-index: var(--noc-dp-z);
          width: 280px;
          background: var(--noc-dp-bg);
          border: 1px solid var(--noc-dp-border);
          border-radius: var(--noc-dp-radius);
          box-shadow: var(--noc-dp-shadow);
          padding: 1rem;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);

          opacity: 0;
          visibility: hidden;
          transform: ${placement === 'top' ? 'translateY(8px)' : 'translateY(-8px)'} scale(0.97);
          transform-origin: ${placement === 'top' ? 'bottom left' : 'top left'};
          transition:
            opacity  0.18s cubic-bezier(0.4,0,0.2,1),
            transform 0.18s cubic-bezier(0.4,0,0.2,1),
            visibility 0s linear 0.18s;
          pointer-events: none;
        }

        #panel.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0) scale(1);
          transition:
            opacity  0.18s cubic-bezier(0.4,0,0.2,1),
            transform 0.18s cubic-bezier(0.4,0,0.2,1);
          pointer-events: auto;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.875rem;
        }

        .month-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--noc-dp-header-color);
          letter-spacing: 0.02em;
        }

        .nav-btn {
          all: unset;
          cursor: pointer;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          color: var(--noc-dp-nav-color);
          transition: color 0.15s ease, background 0.15s ease;
        }

        .nav-btn:hover {
          color: var(--noc-dp-nav-hover);
          background: rgba(255,255,255,.06);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .weekday {
          text-align: center;
          font-size: 0.65rem;
          font-weight: 600;
          color: var(--noc-dp-weekday-color);
          padding: 0.25rem 0 0.5rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .day {
          all: unset;
          display: flex;
          align-items: center;
          justify-content: center;
          aspect-ratio: 1;
          font-size: 0.8125rem;
          border-radius: 6px;
          cursor: pointer;
          color: var(--noc-dp-day-color);
          transition:
            background 0.12s ease,
            color 0.12s ease;
          position: relative;
          z-index: 0;
        }

        .day:hover:not(.disabled):not(.selected) {
          background: var(--noc-dp-day-hover);
          color: #fff;
        }

        .day.muted {
          color: var(--noc-dp-day-muted);
        }

        .day.today:not(.selected) {
          color: var(--noc-dp-today-color);
          font-weight: 700;
        }

        .day.today:not(.selected)::after {
          content: '';
          position: absolute;
          bottom: 3px;
          left: 50%;
          transform: translateX(-50%);
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--noc-dp-today-color);
        }

        .day.selected,
        .day.range-start,
        .day.range-end {
          background: var(--noc-dp-selected-bg);
          color: var(--noc-dp-selected-color);
          font-weight: 600;
          border-radius: 6px;
        }

        .day.in-range {
          background: var(--noc-dp-range-bg);
          border-radius: 0;
          color: var(--noc-dp-day-color);
        }

        .day.range-start {
          border-radius: 6px 0 0 6px;
        }

        .day.range-end {
          border-radius: 0 6px 6px 0;
        }

        .day.range-start.range-end {
          border-radius: 6px;
        }

        .day.disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }
      </style>

      <div class="dp-group">
        ${label ? `<span class="dp-label">${label}</span>` : ''}

        <div class="trigger-wrap ${disabled ? 'disabled' : ''} ${readonly ? 'readonly' : ''}" id="trigger-wrap">
          <span class="cal-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </span>
          <input
            id="trigger-input"
            type="text"
            readonly
            placeholder="${placeholder}"
            value="${displayVal}"
            ${disabled ? 'disabled' : ''}
            aria-haspopup="true"
            aria-expanded="${this._open}"
            autocomplete="off"
          />
          <button id="clear-btn" aria-label="Clear date" style="display:${this._hasClearableValue() ? 'flex' : 'none'};">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div id="panel" part="panel"></div>

        ${helpText ? `<span class="dp-help">${helpText}</span>` : ''}
      </div>
    `;

    this._bindTriggerEvents();

    if (this._open) {
      this._renderPanel();
    }
  }

  _bindTriggerEvents() {
    const wrap     = this.shadowRoot.getElementById('trigger-wrap');
    const input    = this.shadowRoot.getElementById('trigger-input');
    const clearBtn = this.shadowRoot.getElementById('clear-btn');

    if (wrap) {
      wrap.addEventListener('click', (e) => {
        e.stopPropagation();

        if (this.hasAttribute('disabled') || this.hasAttribute('readonly')) {
          return;
        }

        if (this._open) {
          this._closePanel();
        } else {
          this._openPanel();
        }
      });
    }

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();

          if (this.hasAttribute('disabled') || this.hasAttribute('readonly')) {
            return;
          }

          if (this._open) {
            this._closePanel();
          } else {
            this._openPanel();
          }
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => this._clear(e));
    }
  }
}

customElements.define('noc-date-picker', NocDatePicker);

export function ssrTemplate(attrs = {}) {
  const label     = attrs.label || '';
  const helpText  = attrs['help-text'] || '';
  const value     = attrs.value || '';
  const min       = attrs.min || '';
  const max       = attrs.max || '';
  const disabled  = 'disabled' in attrs;

  return `<template shadowrootmode="open">
    <style>
      :host { display: block; font-family: inherit; width: 100%; }
      .dp-group { display: flex; flex-direction: column; gap: 0.5rem; }
      .dp-label { font-size: 0.875rem; font-weight: 600; color: #fff; }
      .dp-help  { font-size: 0.75rem; color: #666; }
      input[type="date"] {
        width: 100%;
        padding: 0.625rem 0.75rem;
        background: #1a1a1a;
        border: 1px solid #2a2a2a;
        border-radius: 8px;
        color: #eee;
        font-family: inherit;
        font-size: 0.875rem;
        color-scheme: dark;
        cursor: pointer;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      input[type="date"]:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37,99,235,.2);
      }
      input[type="date"]:disabled { opacity: 0.45; cursor: not-allowed; }
    </style>
    <div class="dp-group">
      ${label ? `<span class="dp-label">${label}</span>` : ''}
      <input type="date"
        value="${value}"
        ${min ? `min="${min}"` : ''}
        ${max ? `max="${max}"` : ''}
        ${disabled ? 'disabled' : ''}
      />
      ${helpText ? `<span class="dp-help">${helpText}</span>` : ''}
    </div>
  </template>`;
}