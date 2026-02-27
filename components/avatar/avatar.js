// nocturnal-components/components/avatar/avatar.js

/**
 * @customElement noc-avatar
 *
 * @slot         - Avatar content (image / initials fallback handled internally)
 * @slot status  - Custom status content. Activated when status="slot".
 *                 Typically an emoji, optionally followed by a short text label.
 *                 The pill collapses to show only the emoji at rest and expands
 *                 on hover to reveal the full label — identical to GitHub's pattern.
 *
 * Attributes:
 * @attr {string}  src     - Image source URL
 * @attr {string}  alt     - Image alt text (also used to derive initials)
 * @attr {string}  size    - CSS length value for width/height  (default: 3rem)
 * @attr {'circle'|'rounded'|'square'} variant - Shape variant (default: circle)
 * @attr {'online'|'busy'|'away'|'offline'|'slot'} status
 *   - Standard badge dot values: online | busy | away | offline
 *   - Use "slot" to replace the badge with the slotted custom status pill
 * @attr {boolean} no-zoom - Disables the scale(1.05) hover zoom. Border highlight
 *   and status pill expansion still animate as normal.
 *
 * CSS Custom Properties:
 * @cssprop --noc-avatar-size    - Override width/height (takes precedence over the `size` attr)
 * @cssprop --noc-accent         - Accent colour used on hover border
 * @cssprop --noc-avatar-bg      - Avatar background (default: #2a2a2a)
 * @cssprop --noc-avatar-color   - Initials text colour (default: #888)
 * @cssprop --noc-avatar-border  - Avatar border colour (default: #333)
 * @cssprop --noc-status-border  - Badge / pill border colour (default: #0a0a0a)
 * @cssprop --noc-pill-font-size - Font size of the custom status pill text (default: 0.75rem)
 */

function initials(alt) {
  return (alt || '')
    .trim()
    .split(/\s+/)
    .map(n => n[0] || '')
    .join('')
    .toUpperCase()
    .substring(0, 2) || '??';
}

function buildTemplate(attrs = {}) {
  const src     = attrs.src     || '';
  const alt     = attrs.alt     || '';
  const size    = attrs.size    || '3rem';
  const variant = attrs.variant || 'circle';
  const status  = attrs.status  || null;
  const noZoom  = 'no-zoom' in attrs;

  const useCustomStatus = status === 'slot';
  const useBadge        = status && !useCustomStatus;

  return `
    <style>
      :host {
        display: inline-block;
        vertical-align: middle;
        position: relative;
        width: var(--noc-avatar-size, ${size});
        height: var(--noc-avatar-size, ${size});
      }

      .avatar {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: var(--noc-avatar-bg, #2a2a2a);
        color: var(--noc-avatar-color, #888);
        font-weight: 600;
        font-size: calc(var(--noc-avatar-size, ${size}) * 0.4);
        user-select: none;
        border: 1px solid var(--noc-avatar-border, #333);
        transition: ${noZoom ? '' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),'}
                    border-color 0.2s ease;
      }

      :host(:hover) .avatar {
        ${noZoom ? '' : 'transform: scale(1.05);'}
        border-color: var(--noc-accent, #60a5fa);
      }

      .avatar.circle  { border-radius: 50%; }
      .avatar.rounded { border-radius: 20%; }
      .avatar.square  { border-radius: 8px; }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .initials { letter-spacing: -0.05em; }

      .badge {
        position: absolute;
        bottom: 4%;
        right: 4%;
        width: 25%;
        height: 25%;
        border-radius: 50%;
        border: 2px solid var(--noc-status-border, #0a0a0a);
        pointer-events: none;
      }

      .badge-online  { background: #22c55e; box-shadow: 0 0 8px rgba(34,197,94,.4); }
      .badge-busy    { background: #ef4444; }
      .badge-away    { background: #eab308; }
      .badge-offline { background: #444; }

      .status-pill {
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);

        display: inline-flex;
        align-items: center;
        gap: 0;
        overflow: hidden;

        background: var(--noc-pill-bg, #1c1c1c);
        border: 1px solid var(--noc-status-border, #333);
        border-radius: 999px;
        white-space: nowrap;

        max-width: 1.6em;
        padding: 2px 4px;
        transition:
          max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
          padding   0.25s cubic-bezier(0.4, 0, 0.2, 1),
          border-color 0.15s ease;

        cursor: default;
        font-size: var(--noc-pill-font-size, 0.75rem);
        line-height: 1;
        z-index: 1;
      }

      :host(:hover) .status-pill {
        max-width: 12em;
        padding: 2px 6px;
        border-color: var(--noc-accent, #60a5fa);
      }

      .status-pill ::slotted(*) {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      }
    </style>

    <div class="avatar ${variant}" part="base">
      ${src
        ? `<img src="${src}" alt="${alt}" part="image">`
        : `<span class="initials" part="initials">${initials(alt)}</span>`
      }
    </div>

    ${useBadge
      ? `<div class="badge badge-${status}" part="status" aria-label="${status}"></div>`
      : ''
    }

    ${useCustomStatus
      ? `<div class="status-pill" part="status-pill" role="status">
           <slot name="status"></slot>
         </div>`
      : ''
    }
  `;
}

class NocAvatar extends HTMLElement {

  static get observedAttributes() {
    return ['src', 'alt', 'size', 'variant', 'status', 'no-zoom'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this._render();
    }
  }

  _render() {
    this.shadowRoot.innerHTML = buildTemplate({
      src:      this.getAttribute('src'),
      alt:      this.getAttribute('alt'),
      size:     this.getAttribute('size'),
      variant:  this.getAttribute('variant'),
      status:   this.getAttribute('status'),
      'no-zoom': this.hasAttribute('no-zoom') ? true : undefined,
    });
  }
}

customElements.define('noc-avatar', NocAvatar);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
