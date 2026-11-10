import { avatarToSvg, drawAvatar, generateAvatar, getPaletteSwatches } from './avatar.js';

class PixelAvatar extends HTMLElement {
  static observedAttributes = ['seed', 'size'];

  #canvas;
  #avatar;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { display: block; width: min(var(--avatar-size, 128px), 100%); aspect-ratio: 1; }
        canvas { display: block; width: 100%; height: 100%; image-rendering: pixelated; }
      </style>
      <canvas width="512" height="512" role="img"></canvas>
    `;
    this.#canvas = shadow.querySelector('canvas');
  }

  connectedCallback() {
    this.#syncSize();
    this.#render();
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this.#syncSize();
      this.#render();
    }
  }

  get seed() {
    return this.getAttribute('seed') || 'avatar';
  }

  set seed(value) {
    this.setAttribute('seed', String(value));
  }

  refresh() {
    this.#syncSize();
    this.#render();
  }

  #syncSize() {
    const requestedSize = Number.parseInt(this.getAttribute('size') || '128', 10);
    const displaySize = Number.isFinite(requestedSize) ? Math.max(1, requestedSize) : 128;
    this.style.setProperty('--avatar-size', `${displaySize}px`);
  }

  #render() {
    this.#avatar = generateAvatar(this.seed);
    drawAvatar(this.#canvas, this.#avatar);
    this.#canvas.setAttribute('aria-label', `Avatar pixel art para ${this.seed}`);
    this.dispatchEvent(new CustomEvent('avatar-rendered', {
      bubbles: true,
      composed: true,
      detail: { palette: getPaletteSwatches(this.#avatar.palette), size: this.#avatar.size },
    }));
  }

  getSvg() {
    return avatarToSvg(this.#avatar || generateAvatar(this.seed));
  }

  getPngBlob() {
    return new Promise((resolve, reject) => {
      this.#canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('No se pudo exportar el avatar como PNG.'));
      }, 'image/png');
    });
  }
}

if (!customElements.get('pixel-avatar')) {
  customElements.define('pixel-avatar', PixelAvatar);
}
