// nocturnal-components/components/animation/animation.js

/**
 * @customElement
 * @slot - Animation content
 * 
 * Attributes:
 * @attr src-webm - WebM video source
 * @attr src-mp4 - MP4 video source
 * @attr src-gif - GIF image source
 * @attr width - Width of the animation
 * @attr height - Height of the animation
 * 
 * CSS Custom Properties:
 * @cssprop --noc-radius - Border radius for the animation
 */
class NocturnalAnimation extends HTMLElement {

  static get observedAttributes() {
    return ['src-webm', 'src-mp4', 'src-gif', 'width', 'height'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const srcWebm = this.getAttribute('src-webm');
    const srcMp4  = this.getAttribute('src-mp4');
    const srcGif  = this.getAttribute('src-gif');
    const width   = this.getAttribute('width') || '100%';
    const height  = this.getAttribute('height') || 'auto';

    let mediaHTML = '';
    if (srcWebm || srcMp4) {
      mediaHTML = `
        <video autoplay muted loop playsinline width="${width}" height="${height}">
          ${srcWebm ? `<source src="${srcWebm}" type="video/webm">` : ''}
          ${srcMp4  ? `<source src="${srcMp4}" type="video/mp4">`  : ''}
          Your browser does not support the video element.
        </video>
      `;
    } else if (srcGif) {
      mediaHTML = `<img src="${srcGif}" width="${width}" height="${height}" />`;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }

        video, img {
          display: block;
          max-width: 100%;
          height: auto;
          border-radius: var(--noc-radius, 0.5rem);
          object-fit: cover;
        }
      </style>
      ${mediaHTML}
    `;
  }
}

customElements.define('noc-animation', NocturnalAnimation);