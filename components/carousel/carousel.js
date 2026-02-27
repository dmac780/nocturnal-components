// nocturnal-components/components/carousel/carousel.js

/**
 * @customElement noc-carousel
 * @slot - Carousel content
 * @slot prefix - Prefix content
 * @slot suffix - Suffix content
 * 
 * Attributes:
 * @attr loop - Loop the carousel
 * @attr vertical - Vertical carousel
 * @attr current - Current slide index
 * @attr autoplay - Autoplay the carousel
 * 
 * CSS Custom Properties:
 * @cssprop --noc-carousel-bg - Background color
 * @cssprop --noc-carousel-color - Text color
 * @cssprop --noc-carousel-border - Border color
 * @cssprop --noc-carousel-radius - Border radius override
 * @cssprop --noc-carousel-height - Carousel height
 * @cssprop --noc-carousel-accent - Accent color
 */

function buildTemplate(attrs = {}, slidesHtml = '', dots = '') {
  const vertical = 'vertical' in attrs;

  return `
    <style>
      :host {
        --noc-carousel-aspect-ratio: 16 / 9;
        --noc-carousel-bg: #0a0a0a;
        --noc-carousel-radius: 16px;
        --noc-carousel-accent: var(--noc-accent, #2563eb);

        display: block;
        position: relative;
        width: 100%;
        max-width: 100%;
        aspect-ratio: var(--noc-carousel-aspect-ratio);
        background: var(--noc-carousel-bg);
        border-radius: var(--noc-carousel-radius);
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        font-family: inherit;
        box-sizing: border-box;
        container-type: inline-size;
      }

      @supports not (aspect-ratio: 16 / 9) {
        :host { min-height: 300px; height: clamp(250px, 40vw, 450px); }
      }

      .track {
        display: flex;
        flex-direction: ${vertical ? 'column' : 'row'};
        width: 100%;
        height: 100%;
        transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .slide {
        flex: 0 0 100%;
        width: 100%;
        height: 100%;
        background: var(--noc-carousel-bg);
        box-sizing: border-box;
      }

      .controls {
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        transform: translateY(-50%);
        display: flex;
        justify-content: space-between;
        padding: 0 1rem;
        pointer-events: none;
        z-index: 10;
      }

      @media (max-width: 480px) { .controls { padding: 0 0.5rem; } }

      .nav-btn {
        all: unset;
        cursor: pointer;
        width: 44px;
        height: 44px;
        background: rgba(255,255,255,0.1);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,0.1);
        color: #fff;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        transition: all 0.3s;
        font-size: 1.25rem;
      }

      @media (max-width: 480px) { .nav-btn { width: 36px; height: 36px; font-size: 1rem; } }

      .nav-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.05); border-color: var(--noc-carousel-accent); }
      .nav-btn:active { transform: scale(0.95); }

      .pagination {
        position: absolute;
        bottom: 1.5rem;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 0.75rem;
        padding: 0.5rem 0.75rem;
        background: rgba(0,0,0,0.3);
        backdrop-filter: blur(8px);
        border-radius: 99px;
        border: 1px solid rgba(255,255,255,0.05);
        z-index: 10;
      }

      @media (max-width: 480px) { .pagination { bottom: 1rem; gap: 0.5rem; padding: 0.375rem 0.5rem; } }

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255,255,255,0.3);
        cursor: pointer;
        transition: all 0.3s;
      }

      @media (max-width: 480px) { .dot { width: 6px; height: 6px; } }

      .dot:hover { background: rgba(255,255,255,0.5); }

      .dot.active {
        background: var(--noc-carousel-accent);
        width: 24px;
        border-radius: 4px;
        box-shadow: 0 0 10px var(--noc-carousel-accent);
      }

      @media (max-width: 480px) { .dot.active { width: 18px; } }

      ::slotted(noc-carousel-item) { width: 100%; height: 100%; box-sizing: border-box; }
    </style>

    <div class="track" id="track">
      ${slidesHtml}
    </div>

    <div class="controls">
      <button class="nav-btn prev" aria-label="Previous">❮</button>
      <button class="nav-btn next" aria-label="Next">❯</button>
    </div>

    <div class="pagination">${dots}</div>
  `;
}

class NocCarousel extends HTMLElement {

  static get observedAttributes() {
    return ['loop', 'vertical', 'current', 'autoplay'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.next = this.next.bind(this);
    this.prev = this.prev.bind(this);
    this._autoplayTimer = null;
  }

  connectedCallback() {
    this.current = parseInt(this.getAttribute('current')) || 0;
    this.render();
    this.startAutoplay();
  }

  disconnectedCallback() {
    this.stopAutoplay();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'current' && oldVal !== newVal) {
      this.current = parseInt(newVal);
      this.updateTrack();
    } else {
      this.render();
    }
  }

  get items() {
    return Array.from(this.querySelectorAll('noc-carousel-item'));
  }

  startAutoplay() {
    if (this.hasAttribute('autoplay')) {
      this.stopAutoplay();
      this._autoplayTimer = setInterval(() => this.next(), 5000);
    }
  }

  stopAutoplay() {
    if (this._autoplayTimer) {
      clearInterval(this._autoplayTimer);
      this._autoplayTimer = null;
    }
  }

  next() {
    const len = this.items.length;
    if (len === 0) return;
    this.current = (this.current + 1) % len;
    this.setAttribute('current', this.current);
  }

  prev() {
    const len = this.items.length;
    if (len === 0) return;
    this.current = (this.current - 1 + len) % len;
    this.setAttribute('current', this.current);
  }

  updateTrack() {
    if (!this.track) return;
    const vertical = this.hasAttribute('vertical');
    this.track.style.transform = vertical
      ? `translateY(-${this.current * 100}%)`
      : `translateX(-${this.current * 100}%)`;
    this.shadowRoot.querySelectorAll('.dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === this.current);
    });
  }

  render() {
    const vertical   = this.hasAttribute('vertical');
    this.items.forEach((item, index) => item.setAttribute('slot', `slide-${index}`));

    const slidesHtml = this.items.map((_, index) =>
      `<div class="slide"><slot name="slide-${index}"></slot></div>`
    ).join('');

    const dots = this.items.map((_, i) =>
      `<div class="dot ${i === this.current ? 'active' : ''}" data-index="${i}"></div>`
    ).join('');

    this.shadowRoot.innerHTML = buildTemplate(
      { ...(vertical ? { vertical: true } : {}) },
      slidesHtml,
      dots
    );

    this.track = this.shadowRoot.getElementById('track');

    this.shadowRoot.querySelector('.prev').onclick = () => { this.stopAutoplay(); this.prev(); };
    this.shadowRoot.querySelector('.next').onclick = () => { this.stopAutoplay(); this.next(); };
    this.shadowRoot.querySelectorAll('.dot').forEach(dot => {
      dot.onclick = () => {
        this.stopAutoplay();
        this.current = parseInt(dot.dataset.index);
        this.setAttribute('current', this.current);
      };
    });

    this.updateTrack();
  }
}

customElements.define('noc-carousel', NocCarousel);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
