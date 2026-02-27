// nocturnal-components/components/data-grid/data-grid.js

/**
 * @customElement noc-data-grid
 *
 * Attributes:
 * @attr {string}  page-size    - Rows per page. Default 10. Set to 0 to disable pagination.
 * @attr {string}  filter       - Initial filter query string.
 * @attr {boolean} selectable   - Enable row checkboxes and selection state.
 * @attr {boolean} striped      - Alternating row background tint.
 * @attr {boolean} no-border    - Remove outer card border and radius.
 * @attr {boolean} loading      - Shows a skeleton loading state over the grid.
 * @attr {string}  empty-label  - Text shown when no rows match. Default: "No results".
 *
 * CSS Custom Properties:
 * @cssprop --noc-grid-bg              - Card background (default: #1a1a1a)
 * @cssprop --noc-grid-border          - Card / cell border colour (default: #222)
 * @cssprop --noc-grid-radius          - Card border radius (default: 1rem)
 * @cssprop --noc-grid-header-bg       - Header row background (default: #111)
 * @cssprop --noc-grid-header-color    - Header text colour (default: #555)
 * @cssprop --noc-grid-header-size     - Header font size (default: 0.6875rem)
 * @cssprop --noc-grid-row-bg          - Row background (default: transparent)
 * @cssprop --noc-grid-row-hover       - Row hover background (default: rgba(255,255,255,.03))
 * @cssprop --noc-grid-row-selected    - Selected row background (default: rgba(37,99,235,.1))
 * @cssprop --noc-grid-row-stripe      - Stripe row tint (default: rgba(255,255,255,.015))
 * @cssprop --noc-grid-cell-color      - Cell text colour (default: #ccc)
 * @cssprop --noc-grid-cell-size       - Cell font size (default: 0.8125rem)
 * @cssprop --noc-grid-cell-padding    - Cell padding (default: 0.625rem 1rem)
 * @cssprop --noc-grid-accent          - Sort arrow / checkbox accent (default: #2563eb)
 * @cssprop --noc-grid-divider         - Divider between header and body (default: #222)
 * @cssprop --noc-grid-pagination-color - Pagination text colour (default: #555)
 * @cssprop --noc-grid-scrollbar-color  - Scrollbar thumb colour (default: #2a2a2a)
 *
 * Properties (JS only):
 * @prop {Array}  columns   - Array of column definition objects (see above).
 * @prop {Array}  rows      - Array of plain data objects.
 * @prop {Set}    selected  - Read-only. Set of selected row indices (original data order).
 *
 * Events:
 * @event noc-sort     - Fired when the sort column or direction changes.
 *   detail: { key: string, direction: 'asc'|'desc' }
 * @event noc-filter   - Fired when the filter query changes.
 *   detail: { query: string, count: number }
 * @event noc-select   - Fired when row selection changes.
 *   detail: { selected: number[], rows: object[] }
 * @event noc-page     - Fired when the active page changes.
 *   detail: { page: number, pageSize: number, total: number }
 * @event noc-row-click - Fired when a row is clicked (not on an interactive child).
 *   detail: { index: number, row: object }
 * 
 *   {
 *     key:       string,           — row property key (required)
 *     label:     string,           — header text
 *     sortable:  boolean,          — enable click-to-sort on this column
 *     filterable: boolean,         — include this column in text filter matching
 *     width:     string,           — CSS width / flex-basis (e.g. "120px", "1fr")
 *     align:     'left'|'center'|'right',
 *     render:    (value, row, index) => string   — return an HTML string
 *   }
 * 
 */
class NocDataGrid extends HTMLElement {

  static get observedAttributes() {
    return ['page-size', 'filter', 'selectable', 'striped', 'no-border', 'loading', 'empty-label'];
  }

  constructor() {
    super();
    // Only attach shadow root if it doesn't exist (SSR may have created one via DSD)
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    this._columns     = [];
    this._rows        = [];
    this._filter      = '';
    this._sortKey     = null;
    this._sortDir     = 'asc';
    this._page        = 1;
    this._selected    = new Set();
    this._initialized = false;

    this._onFilterInput = this._onFilterInput.bind(this);
  }

  connectedCallback() {
    this._initialized = true;
    this._filter = this.getAttribute('filter') || '';
    this._render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this._initialized) {
      return;
    }

    if (name === 'filter') {
      this._filter = newVal || '';
      this._page   = 1;
    }

    if (name === 'page-size') {
      this._page = 1;
    }

    this._render();
  }

  get columns() {
    return this._columns;
  }

  set columns(v) {
    this._columns  = Array.isArray(v) ? v : [];
    this._sortKey  = null;
    this._page     = 1;
    this._selected = new Set();

    if (this._initialized) {
      this._render();
    }
  }

  get rows() {
    return this._rows;
  }

  set rows(v) {
    this._rows     = Array.isArray(v) ? v : [];
    this._page     = 1;
    this._selected = new Set();

    if (this._initialized) {
      this._render();
    }
  }

  get selected() {
    return new Set(this._selected);
  }

  _pageSize() {
    const v = parseInt(this.getAttribute('page-size'), 10);
    return isNaN(v) ? 10 : v;
  }

  _filtered() {
    const q = this._filter.trim().toLowerCase();

    if (!q) {
      return this._rows.map((r, i) => ({ row: r, origIdx: i }));
    }

    return this._rows
      .map((r, i) => ({ row: r, origIdx: i }))
      .filter(({ row }) => {
        return this._columns.some(col => {
          if (col.filterable === false) {
            return false;
          }
          const val = row[col.key];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
        });
      });
  }

  _sorted(items) {
    if (!this._sortKey) {
      return items;
    }

    const key = this._sortKey;
    const dir = this._sortDir === 'asc' ? 1 : -1;

    return [...items].sort((a, b) => {
      const av = a.row[key];
      const bv = b.row[key];

      if (av === null || av === undefined) { return 1; }
      if (bv === null || bv === undefined) { return -1; }

      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * dir;
      }

      return String(av).localeCompare(String(bv)) * dir;
    });
  }

  _paginated(items) {
    const ps = this._pageSize();

    if (ps === 0) {
      return items;
    }

    const start = (this._page - 1) * ps;
    return items.slice(start, start + ps);
  }

  /**
   * Wire a <noc-input> (or any element that emits input events) to this
   * grid's filter. Call once after both elements are connected.
   *
   * @param {HTMLElement} inputEl
   */
  connectFilter(inputEl) {
    if (this._externalFilter) {
      this._externalFilter.removeEventListener('input', this._onFilterInput);
    }
    this._externalFilter = inputEl;
    inputEl.addEventListener('input', this._onFilterInput);
  }

  _onFilterInput(e) {
    const val      = e.target.value !== undefined ? e.target.value : '';
    this._filter   = val.trim().toLowerCase();
    this._page     = 1;
    this._render();

    const visible = this._filtered();
    this.dispatchEvent(new CustomEvent('noc-filter', {
      bubbles: true, composed: true,
      detail: { query: this._filter, count: visible.length },
    }));
  }

  // ─── sort ────────────────────────────────────────────────────────────────────

  _toggleSort(key) {
    if (this._sortKey === key) {
      this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortKey = key;
      this._sortDir = 'asc';
    }

    this._page = 1;
    this._render();

    this.dispatchEvent(new CustomEvent('noc-sort', {
      bubbles: true, composed: true,
      detail: { key: this._sortKey, direction: this._sortDir },
    }));
  }

  // ─── selection ───────────────────────────────────────────────────────────────

  _toggleRow(origIdx) {
    if (this._selected.has(origIdx)) {
      this._selected.delete(origIdx);
    } else {
      this._selected.add(origIdx);
    }

    this._updateSelectionUI();
    this._emitSelect();
  }

  _toggleAll(checked, visibleIdxs) {
    if (checked) {
      visibleIdxs.forEach(i => this._selected.add(i));
    } else {
      visibleIdxs.forEach(i => this._selected.delete(i));
    }

    this._updateSelectionUI();
    this._emitSelect();
  }

  _emitSelect() {
    const idxs = [...this._selected];
    this.dispatchEvent(new CustomEvent('noc-select', {
      bubbles: true, composed: true,
      detail: {
        selected: idxs,
        rows:     idxs.map(i => this._rows[i]),
      },
    }));
  }

  _updateSelectionUI() {
    const root = this.shadowRoot;

    root.querySelectorAll('input[data-row-idx]').forEach(cb => {
      const idx = parseInt(cb.dataset.rowIdx, 10);
      cb.checked = this._selected.has(idx);
      const row  = cb.closest('tr');
      if (row) {
        row.classList.toggle('selected', this._selected.has(idx));
      }
    });

    const allCb     = root.querySelector('input[data-select-all]');
    const visible   = root.querySelectorAll('input[data-row-idx]');
    const allChecked = visible.length > 0 && [...visible].every(cb => cb.checked);
    const anyChecked = [...visible].some(cb => cb.checked);

    if (allCb) {
      allCb.checked       = allChecked;
      allCb.indeterminate = !allChecked && anyChecked;
    }
  }

  _render() {
    const selectable  = this.hasAttribute('selectable');
    const striped     = this.hasAttribute('striped');
    const noBorder    = this.hasAttribute('no-border');
    const loading     = this.hasAttribute('loading');
    const emptyLabel  = this.getAttribute('empty-label') || 'No results';
    const pageSize    = this._pageSize();

    const filtered    = this._filtered();
    const sorted      = this._sorted(filtered);
    const total       = sorted.length;
    const totalPages  = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;

    if (this._page > totalPages) {
      this._page = totalPages;
    }

    const pageItems   = this._paginated(sorted);
    const cols        = this._columns;

    const colWidths   = cols.map(c => c.width || '1fr').join(' ');

    const skeletonRows = Array.from({ length: Math.min(pageSize || 5, 5) }).map(() => `
      <tr class="skeleton-row">
        ${selectable ? '<td class="td-check"><span class="skel skel-check"></span></td>' : ''}
        ${cols.map(() => `<td><span class="skel"></span></td>`).join('')}
      </tr>`).join('');

    const headerCells = cols.map(col => {
      const isSorted = this._sortKey === col.key;
      const arrow    = isSorted
        ? (this._sortDir === 'asc'
            ? `<svg class="sort-icon asc" viewBox="0 0 10 10"><path d="M5 2 L8 7 L2 7Z"/></svg>`
            : `<svg class="sort-icon desc" viewBox="0 0 10 10"><path d="M5 8 L2 3 L8 3Z"/></svg>`)
        : (col.sortable
            ? `<svg class="sort-icon idle" viewBox="0 0 10 10"><path d="M5 2 L8 7 L2 7Z" opacity=".25"/><path d="M5 8 L2 3 L8 3Z" opacity=".25"/></svg>`
            : '');

      const align    = col.align || 'left';

      return `
        <th
          class="th${col.sortable ? ' sortable' : ''}"
          data-key="${col.key}"
          style="text-align:${align}"
        >
          <span class="th-inner">
            <span class="th-label">${col.label || col.key}</span>
            ${arrow}
          </span>
        </th>`;
    }).join('');

    const bodyRows = loading ? skeletonRows : pageItems.map(({ row, origIdx }, rowPos) => {
      const isSelected = this._selected.has(origIdx);
      const isStripe   = striped && rowPos % 2 !== 0;

      const cells = cols.map(col => {
        const val      = row[col.key];
        const align    = col.align || 'left';
        const rendered = col.render ? col.render(val, row, origIdx) : (val === null || val === undefined ? '' : String(val));

        return `<td class="td" style="text-align:${align}" data-key="${col.key}">${rendered}</td>`;
      }).join('');

      return `
        <tr
          class="tr${isSelected ? ' selected' : ''}${isStripe ? ' stripe' : ''}"
          data-orig-idx="${origIdx}"
        >
          ${selectable
            ? `<td class="td td-check">
                 <label class="check-wrap">
                   <input type="checkbox" class="cb" data-row-idx="${origIdx}" ${isSelected ? 'checked' : ''} />
                   <span class="cb-box"></span>
                 </label>
               </td>`
            : ''}
          ${cells}
        </tr>`;
    }).join('');

    const emptyRow = !loading && pageItems.length === 0
      ? `<tr><td class="td td-empty" colspan="${cols.length + (selectable ? 1 : 0)}">${emptyLabel}</td></tr>`
      : '';

    const paginationHTML = (pageSize > 0 && total > 0) ? (() => {
      const start = Math.min((this._page - 1) * pageSize + 1, total);
      const end   = Math.min(this._page * pageSize, total);
      const pages = [];

      const addPage = p => pages.push(
        `<button class="pg-btn${p === this._page ? ' pg-active' : ''}" data-page="${p}">${p}</button>`
      );

      if (totalPages <= 7) {
        for (let p = 1; p <= totalPages; p++) { addPage(p); }
      } else {
        addPage(1);
        if (this._page > 3) { pages.push(`<span class="pg-ellipsis">…</span>`); }
        const lo = Math.max(2, this._page - 1);
        const hi = Math.min(totalPages - 1, this._page + 1);
        for (let p = lo; p <= hi; p++) { addPage(p); }
        if (this._page < totalPages - 2) { pages.push(`<span class="pg-ellipsis">…</span>`); }
        addPage(totalPages);
      }

      return `
        <div class="pagination" part="pagination">
          <span class="pg-info">${start}–${end} of ${total}</span>
          <div class="pg-controls">
            <button class="pg-btn pg-arrow" data-page="${this._page - 1}" ${this._page === 1 ? 'disabled' : ''}>
              <svg viewBox="0 0 16 16"><path d="M10 3 L5 8 L10 13" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            ${pages.join('')}
            <button class="pg-btn pg-arrow" data-page="${this._page + 1}" ${this._page === totalPages ? 'disabled' : ''}>
              <svg viewBox="0 0 16 16"><path d="M6 3 L11 8 L6 13" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>`;
    })() : '';

    const selectAllCell = selectable
      ? `<th class="th th-check">
           <label class="check-wrap">
             <input type="checkbox" class="cb" data-select-all />
             <span class="cb-box"></span>
           </label>
         </th>`
      : '';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: inherit;
          font-size: inherit;

          --noc-grid-bg:               #1a1a1a;
          --noc-grid-border:           #222;
          --noc-grid-radius:           1rem;
          --noc-grid-header-bg:        #111;
          --noc-grid-header-color:     #555;
          --noc-grid-header-size:      0.6875rem;
          --noc-grid-row-bg:           transparent;
          --noc-grid-row-hover:        rgba(255, 255, 255, 0.03);
          --noc-grid-row-selected:     rgba(37, 99, 235, 0.08);
          --noc-grid-row-stripe:       rgba(255, 255, 255, 0.015);
          --noc-grid-cell-color:       #ccc;
          --noc-grid-cell-size:        0.8125rem;
          --noc-grid-cell-padding:     0.625rem 1rem;
          --noc-grid-accent:           #2563eb;
          --noc-grid-divider:          #1e1e1e;
          --noc-grid-pagination-color: #555;
          --noc-grid-scrollbar-color:  #2a2a2a;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .shell {
          background:    ${noBorder ? 'transparent' : 'var(--noc-grid-bg)'};
          border:        ${noBorder ? 'none'        : '1px solid var(--noc-grid-border)'};
          border-radius: ${noBorder ? '0'           : 'var(--noc-grid-radius)'};
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .scroll-wrap {
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: var(--noc-grid-scrollbar-color) transparent;
        }

        .scroll-wrap::-webkit-scrollbar        { height: 5px; }
        .scroll-wrap::-webkit-scrollbar-track  { background: transparent; }
        .scroll-wrap::-webkit-scrollbar-thumb  { background: var(--noc-grid-scrollbar-color); border-radius: 3px; }

        table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          min-width: 400px;
        }

        thead { background: var(--noc-grid-header-bg); }

        thead tr {
          border-bottom: 1px solid var(--noc-grid-divider);
        }

        .th {
          padding: var(--noc-grid-cell-padding);
          font-size: var(--noc-grid-header-size);
          font-weight: 600;
          color: var(--noc-grid-header-color);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          white-space: nowrap;
          user-select: none;
        }

        .th-check, .td-check {
          width: 40px;
          padding: 0.625rem 0.625rem 0.625rem 1rem;
        }

        .th.sortable { cursor: pointer; }
        .th.sortable:hover { color: #888; }

        .th-inner {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .th-label { line-height: 1; }

        .sort-icon {
          width: 9px;
          height: 9px;
          fill: var(--noc-grid-accent);
          flex-shrink: 0;
        }

        .sort-icon.idle { fill: var(--noc-grid-header-color); }

        tbody tr.tr {
          background:  var(--noc-grid-row-bg);
          border-bottom: 1px solid var(--noc-grid-divider);
          transition: background 0.1s ease;
          cursor: default;
        }

        tbody tr.tr:last-child { border-bottom: none; }

        tbody tr.tr:hover  { background: var(--noc-grid-row-hover); }
        tbody tr.selected  { background: var(--noc-grid-row-selected) !important; }
        tbody tr.stripe    { background: var(--noc-grid-row-stripe); }

        .td {
          padding: var(--noc-grid-cell-padding);
          font-size: var(--noc-grid-cell-size);
          color: var(--noc-grid-cell-color);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          vertical-align: middle;
          max-width: 0;
        }

        .td-empty {
          text-align: center;
          color: #333;
          font-size: 0.75rem;
          padding: 2.5rem 1rem;
          letter-spacing: 0.05em;
          max-width: none;
        }

        /* ── checkbox ── */
        .check-wrap {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .check-wrap input[type="checkbox"] {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .cb-box {
          width: 14px;
          height: 14px;
          border: 1px solid #3a3a3a;
          border-radius: 3px;
          background: #111;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: border-color 0.1s ease, background 0.1s ease;
        }

        .check-wrap:hover .cb-box { border-color: #555; }

        .check-wrap input:checked  ~ .cb-box {
          background:    var(--noc-grid-accent);
          border-color:  var(--noc-grid-accent);
        }

        .check-wrap input:checked  ~ .cb-box::after {
          content: '';
          display: block;
          width: 8px;
          height: 5px;
          border-left:   2px solid #fff;
          border-bottom: 2px solid #fff;
          transform: rotate(-45deg) translate(1px, -1px);
        }

        .check-wrap input:indeterminate ~ .cb-box {
          background:   var(--noc-grid-accent);
          border-color: var(--noc-grid-accent);
        }

        .check-wrap input:indeterminate ~ .cb-box::after {
          content: '';
          display: block;
          width: 8px;
          height: 2px;
          background: #fff;
          border-radius: 1px;
        }

        /* ── skeleton ── */
        .skeleton-row td { border-bottom: 1px solid var(--noc-grid-divider); }

        .skel {
          display: block;
          height: 10px;
          border-radius: 4px;
          background: linear-gradient(90deg, #1e1e1e 25%, #2a2a2a 50%, #1e1e1e 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          width: 70%;
        }

        .skel-check { width: 14px; height: 14px; border-radius: 3px; }

        @keyframes shimmer {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── pagination ── */
        .pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.625rem 1rem;
          border-top: 1px solid var(--noc-grid-divider);
          gap: 0.5rem;
        }

        .pg-info {
          font-size: 0.6875rem;
          color: var(--noc-grid-pagination-color);
          white-space: nowrap;
        }

        .pg-controls {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .pg-btn {
          min-width: 28px;
          height: 28px;
          padding: 0 6px;
          border: 1px solid transparent;
          border-radius: 5px;
          background: none;
          color: var(--noc-grid-pagination-color);
          font-family: inherit;
          font-size: 0.6875rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.1s ease, color 0.1s ease, border-color 0.1s ease;
        }

        .pg-btn:hover:not(:disabled):not(.pg-active) {
          background:    rgba(255, 255, 255, 0.04);
          border-color:  #2a2a2a;
          color:         #aaa;
        }

        .pg-btn.pg-active {
          background:   rgba(37, 99, 235, 0.15);
          border-color: rgba(37, 99, 235, 0.3);
          color:        #93b4fb;
          font-weight:  600;
        }

        .pg-btn:disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }

        .pg-arrow svg { width: 14px; height: 14px; }
        .pg-ellipsis  { font-size: 0.6875rem; color: #333; padding: 0 4px; }
      </style>

      <div class="shell" part="base">
        <div class="scroll-wrap" part="scroll">
          <table part="table">
            <thead part="head">
              <tr>
                ${selectAllCell}
                ${headerCells}
              </tr>
            </thead>
            <tbody id="tbody" part="body">
              ${bodyRows}
              ${emptyRow}
            </tbody>
          </table>
        </div>
        ${paginationHTML}
      </div>
    `;

    this._bindEvents(pageItems, sorted.map(s => s.origIdx), selectable);
  }

  _bindEvents(pageItems, visibleOrigIdxs, selectable) {
    const root = this.shadowRoot;

    root.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => this._toggleSort(th.dataset.key));
    });

    if (selectable) {
      root.querySelectorAll('input[data-row-idx]').forEach(cb => {
        cb.addEventListener('change', () => {
          this._toggleRow(parseInt(cb.dataset.rowIdx, 10));
        });
      });

      const allCb = root.querySelector('input[data-select-all]');
      if (allCb) {
        allCb.addEventListener('change', () => {
          this._toggleAll(allCb.checked, visibleOrigIdxs);
        });
      }
    }

    root.querySelectorAll('tr[data-orig-idx]').forEach(tr => {
      tr.addEventListener('click', e => {
        if (e.target.closest('input, button, a, noc-button')) {
          return;
        }

        const origIdx = parseInt(tr.dataset.origIdx, 10);
        this.dispatchEvent(new CustomEvent('noc-row-click', {
          bubbles: true, composed: true,
          detail: { index: origIdx, row: this._rows[origIdx] },
        }));
      });
    });

    root.querySelectorAll('.pg-btn[data-page]').forEach(btn => {
      if (btn.disabled) {
        return;
      }

      btn.addEventListener('click', () => {
        const p         = parseInt(btn.dataset.page, 10);
        const pageSize  = this._pageSize();
        const total     = this._sorted(this._filtered()).length;
        const maxPage   = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;

        if (p < 1 || p > maxPage) {
          return;
        }

        this._page = p;
        this._render();

        this.dispatchEvent(new CustomEvent('noc-page', {
          bubbles: true, composed: true,
          detail: { page: this._page, pageSize, total },
        }));
      });
    });
  }
}

customElements.define('noc-data-grid', NocDataGrid);

export function ssrTemplate(attrs = {}) {
  const columns   = JSON.parse(attrs.columns || '[]');
  const data      = JSON.parse(attrs.data    || '[]');
  const emptyLabel = attrs['empty-label'] || 'No results';
  const striped   = 'striped' in attrs;

  const theadCells = columns.map(col => `
    <th style="padding:0.75rem 1rem;font-size:0.6875rem;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.06em;text-align:${col.align||'left'};background:#111;border-bottom:1px solid #1e1e1e;">
      ${col.label || col.key}
    </th>`).join('');

  const tbodyRows = data.length === 0
    ? `<tr><td colspan="${columns.length}" style="text-align:center;padding:2.5rem 1rem;color:#333;font-size:0.75rem;">${emptyLabel}</td></tr>`
    : data.map((row, i) => {
        const bg = striped && i % 2 !== 0 ? 'background:rgba(255,255,255,0.015);' : '';
        const cells = columns.map(col =>
          `<td style="padding:0.625rem 1rem;font-size:0.8125rem;color:#ccc;border-bottom:1px solid #1e1e1e;text-align:${col.align||'left'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:0;">${row[col.key] ?? ''}</td>`
        ).join('');
        return `<tr style="${bg}">${cells}</tr>`;
      }).join('');

  return `<template shadowrootmode="open">
    <style>
      :host { display:block; }
      .shell { background:#1a1a1a; border:1px solid #222; border-radius:1rem; overflow:hidden; }
      .scroll-wrap { overflow-x:auto; }
      table { width:100%; border-collapse:collapse; font-family:inherit; font-size:0.8125rem; min-width:400px; }
    </style>
    <div class="shell" part="base">
      <div class="scroll-wrap" part="scroll">
        <table part="table">
          <thead part="head"><tr>${theadCells}</tr></thead>
          <tbody part="body">${tbodyRows}</tbody>
        </table>
      </div>
    </div>
  </template>`;
}