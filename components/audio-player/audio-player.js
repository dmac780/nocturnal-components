// nocturnal-components/components/audio-player/audio-player.js

/**
 * @customElement noc-audio-player
 *
 * Attributes:
 * @attr {string}  src        - Audio source URL.
 * @attr {string}  track      - Track / song title displayed in the player.
 * @attr {string}  artist     - Artist name displayed below the title.
 * @attr {string}  group      - Grouping key. When a player in a group starts
 *                              playing, all other players in the same group
 *                              are automatically paused. Players without a
 *                              group attribute are isolated from each other.
 * @attr {boolean} autoplay   - If present, begins playback as soon as the
 *                              audio is ready. Browsers may block this without
 *                              prior user interaction.
 *
 * Properties / Public API:
 * @prop {string}  src        - Get or set the audio source URL.
 * @prop {string}  track      - Get or set the track title.
 * @prop {string}  artist     - Get or set the artist name.
 * @prop {number}  volume     - Get or set volume (0–1).
 * @prop {boolean} muted      - Get or set muted state.
 * @prop {boolean} paused     - Whether audio is currently paused (read-only).
 * @method play()             - Begin playback. Returns the Audio play() Promise.
 * @method pause()            - Pause playback.
 *
 * CSS Custom Properties:
 * @cssprop --noc-audio-bg              - Player background (default: #111)
 * @cssprop --noc-audio-fg              - Primary text colour (default: #f0f0f0)
 * @cssprop --noc-audio-accent          - Accent / playhead colour (default: #ff5500)
 * @cssprop --noc-audio-muted           - Secondary / muted text colour (default: #555)
 * @cssprop --noc-audio-waveform        - Inactive waveform bar colour (default: #2a2a2a)
 * @cssprop --noc-audio-waveform-played - Played waveform bar colour (default: var(--noc-audio-accent))
 * @cssprop --noc-audio-radius          - Border radius of the player shell (default: 12px)
 * @cssprop --noc-audio-width           - Max width of the player (default: 480px)
 * @cssprop --noc-audio-padding         - Inner padding (default: 20px 22px 18px)
 *
 * Events:
 * @event noc-play       - Emitted when playback starts. detail: { src, group }
 * @event noc-pause      - Emitted when playback pauses. detail: { src, group }
 * @event noc-ended      - Emitted when playback ends. detail: { src, group }
 * @event noc-timeupdate - Emitted on timeupdate. detail: { currentTime, duration, progress }
 */

const BAR_HEIGHTS = Array.from({ length: 60 }, (_, i) =>
  Math.min(90, 20 + Math.abs(Math.sin(i * 0.4 + Math.cos(i * 0.15) * 2)) * 60 + ((i * 7 + 13) % 23))
);

function buildTemplate(attrs = {}) {
  const track  = attrs.track  || 'Untitled';
  const artist = attrs.artist || '';

  const bars = BAR_HEIGHTS.map(h =>
    `<div class="bar" style="height:${h}%"></div>`
  ).join('');

  return `
    <style>
      :host {
        display: block;
        width: 100%;
        max-width: var(--noc-audio-width, 480px);
        font-family: inherit;

        --noc-audio-bg:              #111;
        --noc-audio-fg:              #f0f0f0;
        --noc-audio-accent:          #ff5500;
        --noc-audio-muted:           #555;
        --noc-audio-waveform:        #2a2a2a;
        --noc-audio-waveform-played: var(--noc-audio-accent);
        --noc-audio-radius:          12px;
        --noc-audio-width:           480px;
        --noc-audio-padding:         20px 22px 18px;
        --noc-audio-progress:        0%;
      }

      *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      .player {
        background: var(--noc-audio-bg);
        border-radius: var(--noc-audio-radius);
        padding: var(--noc-audio-padding);
        width: 100%;
        user-select: none;
      }

      .meta {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 16px;
        gap: 1rem;
      }

      .track-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--noc-audio-fg);
        letter-spacing: -0.01em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 280px;
      }

      .track-artist {
        font-size: 10px;
        color: var(--noc-audio-muted);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-top: 3px;
      }

      .time-display {
        font-size: 10px;
        color: var(--noc-audio-muted);
        letter-spacing: 0.05em;
        text-align: right;
        flex-shrink: 0;
        white-space: nowrap;
      }

      .waveform-wrap {
        position: relative;
        height: 52px;
        cursor: pointer;
        margin-bottom: 14px;
        overflow: hidden;
        border-radius: 4px;
      }

      .waveform {
        display: flex;
        align-items: center;
        gap: 2px;
        height: 100%;
        width: 100%;
      }

      .bar {
        flex: 1;
        background: var(--noc-audio-waveform);
        border-radius: 2px;
        min-width: 3px;
        transition: background 0.08s;
      }

      .bar.played {
        background: var(--noc-audio-waveform-played);
      }

      .waveform-wrap::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
          90deg,
          transparent var(--noc-audio-progress),
          color-mix(in srgb, var(--noc-audio-accent) 6%, transparent) var(--noc-audio-progress)
        );
        pointer-events: none;
      }

      .controls {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .play-btn {
        all: unset;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--noc-audio-accent);
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: transform 0.15s ease, opacity 0.15s ease;
      }

      .play-btn:hover  { transform: scale(1.08); }
      .play-btn:active { transform: scale(0.95); opacity: 0.85; }

      .progress-wrap {
        flex: 1;
        height: 3px;
        background: var(--noc-audio-waveform);
        border-radius: 999px;
        cursor: pointer;
        position: relative;
      }

      .progress-fill {
        height: 100%;
        background: var(--noc-audio-accent);
        border-radius: 999px;
        width: 0%;
        pointer-events: none;
      }

      .progress-thumb {
        position: absolute;
        top: 50%;
        left: 0%;
        transform: translate(-50%, -50%) scale(0);
        width: 11px;
        height: 11px;
        border-radius: 50%;
        background: var(--noc-audio-accent);
        pointer-events: none;
        transition: transform 0.15s ease;
      }

      .progress-wrap:hover .progress-thumb {
        transform: translate(-50%, -50%) scale(1);
      }

      .vol-wrap {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }

      .vol-icon {
        color: var(--noc-audio-muted);
        cursor: pointer;
        line-height: 0;
        transition: color 0.15s ease;
      }

      .vol-icon:hover {
        color: var(--noc-audio-fg);
      }

      .vol-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 60px;
        height: 3px;
        border-radius: 999px;
        background: var(--noc-audio-waveform);
        outline: none;
        cursor: pointer;
      }

      .vol-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--noc-audio-fg);
        cursor: pointer;
      }

      .vol-slider::-moz-range-thumb {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--noc-audio-fg);
        border: none;
        cursor: pointer;
      }
    </style>

    <div class="player" part="base">
      <div class="meta">
        <div>
          <div class="track-title" part="title">${track}</div>
          <div class="track-artist" part="artist">${artist}</div>
        </div>
        <div class="time-display" part="time">
          <span class="cur-time">0:00</span> / <span class="dur-time">0:00</span>
        </div>
      </div>

      <div class="waveform-wrap" part="waveform">
        <div class="waveform">${bars}</div>
      </div>

      <div class="controls" part="controls">
        <button class="play-btn" aria-label="Play" part="play-button">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>

        <div class="progress-wrap" part="progress">
          <div class="progress-fill"></div>
          <div class="progress-thumb"></div>
        </div>

        <div class="vol-wrap" part="volume">
          <span class="vol-icon" aria-label="Toggle mute" role="button" tabindex="0">
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
          </span>
          <input class="vol-slider" type="range" min="0" max="1" step="0.01" value="1" aria-label="Volume">
        </div>
      </div>
    </div>
  `;
}

class NocAudioPlayer extends HTMLElement {

  static get observedAttributes() {
    return ['src', 'track', 'artist', 'autoplay'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this._audio      = new Audio();
    this._bars       = [];
    this._dragging   = false;
    this._dragTarget = null;

    this._onGroupPlay        = this._onGroupPlay.bind(this);
    this._onWindowMouseMove  = this._onWindowMouseMove.bind(this);
    this._onWindowMouseUp    = this._onWindowMouseUp.bind(this);
  }

  connectedCallback() {
    this._render();
    this._bindAudioEvents();
    this._bindUIEvents();

    const src = this.getAttribute('src');
    if (src) {
      this._audio.src = src;
    }

    document.addEventListener('noc:audio:play', this._onGroupPlay);
    window.addEventListener('mousemove', this._onWindowMouseMove);
    window.addEventListener('mouseup',   this._onWindowMouseUp);

    if (this.hasAttribute('autoplay')) {
      this._audio.play().catch(() => {});
    }
  }

  disconnectedCallback() {
    this._audio.pause();
    document.removeEventListener('noc:audio:play', this._onGroupPlay);
    window.removeEventListener('mousemove', this._onWindowMouseMove);
    window.removeEventListener('mouseup',   this._onWindowMouseUp);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this.shadowRoot.innerHTML) {
      return;
    }

    if (name === 'src') {
      const wasPlaying = !this._audio.paused;
      this._audio.src  = newVal || '';
      this._audio.load();
      this._resetProgress();

      if (wasPlaying) {
        this._audio.play().catch(() => {});
      }
    }

    if (name === 'track') {
      const el = this.shadowRoot.querySelector('.track-title');
      if (el) el.textContent = newVal || '';
    }

    if (name === 'artist') {
      const el = this.shadowRoot.querySelector('.track-artist');
      if (el) el.textContent = newVal || '';
    }
  }

  play()         { return this._audio.play(); }
  pause()        { this._audio.pause(); }
  get paused()   { return this._audio.paused; }
  get src()      { return this.getAttribute('src') || ''; }
  set src(v)     { this.setAttribute('src', v); }
  get track()    { return this.getAttribute('track') || ''; }
  set track(v)   { this.setAttribute('track', v); }
  get artist()   { return this.getAttribute('artist') || ''; }
  set artist(v)  { this.setAttribute('artist', v); }
  get volume()   { return this._audio.volume; }
  set volume(v)  {
    this._audio.volume = v;
    const slider = this.shadowRoot.querySelector('.vol-slider');
    if (slider) slider.value = v;
  }
  get muted()    { return this._audio.muted; }
  set muted(v)   { this._audio.muted = v; this._updateVolumeIcon(); }

  _group() { return this.getAttribute('group') || null; }

  _onGroupPlay(e) {
    if (e.detail.player === this) return;
    const myGroup = this._group();
    if (myGroup !== null && e.detail.group === myGroup) {
      this._audio.pause();
    }
  }

  _fmt(s) {
    if (!isFinite(s)) return '0:00';
    const m  = Math.floor(s / 60);
    const ss = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${ss}`;
  }

  _q(sel) { return this.shadowRoot.querySelector(sel); }

  _bindAudioEvents() {
    const audio = this._audio;

    audio.addEventListener('play', () => {
      this._updatePlayButton(false);
      const group = this._group();
      document.dispatchEvent(new CustomEvent('noc:audio:play', {
        detail: { player: this, group }
      }));
      this.dispatchEvent(new CustomEvent('noc-play', {
        bubbles: true, composed: true,
        detail:  { src: this.src, group }
      }));
    });

    audio.addEventListener('pause', () => {
      this._updatePlayButton(true);
      this.dispatchEvent(new CustomEvent('noc-pause', {
        bubbles: true, composed: true,
        detail:  { src: this.src, group: this._group() }
      }));
    });

    audio.addEventListener('ended', () => {
      audio.currentTime = 0;
      this._updateProgress();
      this._updatePlayButton(true);
      this.dispatchEvent(new CustomEvent('noc-ended', {
        bubbles: true, composed: true,
        detail:  { src: this.src, group: this._group() }
      }));
    });

    audio.addEventListener('timeupdate', () => {
      this._updateProgress();
      const progress = audio.duration ? audio.currentTime / audio.duration : 0;
      this.dispatchEvent(new CustomEvent('noc-timeupdate', {
        bubbles: true, composed: true,
        detail:  { currentTime: audio.currentTime, duration: audio.duration, progress }
      }));
    });

    audio.addEventListener('durationchange', () => {
      const el = this._q('.dur-time');
      if (el) el.textContent = this._fmt(audio.duration);
    });

    audio.addEventListener('loadedmetadata', () => {
      const el = this._q('.dur-time');
      if (el) el.textContent = this._fmt(audio.duration);
    });
  }

  _bindUIEvents() {
    const playBtn      = this._q('.play-btn');
    const progressWrap = this._q('.progress-wrap');
    const waveWrap     = this._q('.waveform-wrap');
    const volSlider    = this._q('.vol-slider');
    const volIcon      = this._q('.vol-icon');

    playBtn.addEventListener('click', () => {
      if (this._audio.paused) {
        this._audio.play().catch(() => {});
      } else {
        this._audio.pause();
      }
    });

    progressWrap.addEventListener('mousedown', (e) => {
      this._dragging   = true;
      this._dragTarget = 'progress';
      this._scrubProgress(e);
    });

    waveWrap.addEventListener('mousedown', (e) => {
      this._dragging   = true;
      this._dragTarget = 'wave';
      this._scrubWave(e);
    });

    volSlider.addEventListener('input', () => {
      this._audio.volume = parseFloat(volSlider.value);
      if (this._audio.muted && this._audio.volume > 0) {
        this._audio.muted = false;
      }
      this._updateVolumeIcon();
    });

    volIcon.addEventListener('click', () => {
      this._audio.muted = !this._audio.muted;
      this._updateVolumeIcon();
    });
  }

  _onWindowMouseMove(e) {
    if (!this._dragging) return;
    if (this._dragTarget === 'progress') {
      this._scrubProgress(e);
    } else if (this._dragTarget === 'wave') {
      this._scrubWave(e);
    }
  }

  _onWindowMouseUp() {
    this._dragging   = false;
    this._dragTarget = null;
  }

  _scrubProgress(e) {
    const wrap = this._q('.progress-wrap');
    if (!wrap || !this._audio.duration) return;
    const rect = wrap.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    this._audio.currentTime = pct * this._audio.duration;
  }

  _scrubWave(e) {
    const wrap = this._q('.waveform-wrap');
    if (!wrap || !this._audio.duration) return;
    const rect = wrap.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    this._audio.currentTime = pct * this._audio.duration;
  }

  _updateProgress() {
    const audio         = this._audio;
    const pct           = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    const progressFill  = this._q('.progress-fill');
    const progressThumb = this._q('.progress-thumb');
    const waveWrap      = this._q('.waveform-wrap');
    const curTime       = this._q('.cur-time');

    if (progressFill)  progressFill.style.width = `${pct}%`;
    if (progressThumb) progressThumb.style.left = `${pct}%`;
    if (waveWrap)      waveWrap.style.setProperty('--noc-audio-progress', `${pct}%`);
    if (curTime)       curTime.textContent = this._fmt(audio.currentTime);

    const playedIdx = Math.floor((pct / 100) * this._bars.length);
    this._bars.forEach((b, i) => b.classList.toggle('played', i < playedIdx));
  }

  _resetProgress() {
    const progressFill  = this._q('.progress-fill');
    const progressThumb = this._q('.progress-thumb');
    const waveWrap      = this._q('.waveform-wrap');
    const curTime       = this._q('.cur-time');
    const durTime       = this._q('.dur-time');

    if (progressFill)  progressFill.style.width = '0%';
    if (progressThumb) progressThumb.style.left = '0%';
    if (waveWrap)      waveWrap.style.setProperty('--noc-audio-progress', '0%');
    if (curTime)       curTime.textContent = '0:00';
    if (durTime)       durTime.textContent = '0:00';

    this._bars.forEach(b => b.classList.remove('played'));
  }

  _updatePlayButton(showPlay) {
    const btn = this._q('.play-btn');
    if (!btn) return;
    btn.setAttribute('aria-label', showPlay ? 'Play' : 'Pause');
    btn.innerHTML = showPlay
      ? `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M8 5v14l11-7z"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
  }

  _updateVolumeIcon() {
    const icon   = this._q('.vol-icon');
    const slider = this._q('.vol-slider');
    if (!icon) return;
    const isMuted = this._audio.muted || this._audio.volume === 0;
    icon.innerHTML = isMuted
      ? `<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 18L19 19.27 20.27 18 5.27 3 4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>`;
    if (slider) slider.value = this._audio.muted ? 0 : this._audio.volume;
  }

  _render() {
    this.shadowRoot.innerHTML = buildTemplate({
      track:  this.getAttribute('track'),
      artist: this.getAttribute('artist'),
    });
    this._bars = Array.from(this.shadowRoot.querySelectorAll('.bar'));
  }
}

customElements.define('noc-audio-player', NocAudioPlayer);

export function ssrTemplate(attrs) {
  return `<template shadowrootmode="open">${buildTemplate(attrs)}</template>`;
}
