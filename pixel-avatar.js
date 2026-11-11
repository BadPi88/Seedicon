import { avatarToSvg } from './avatar.js';
import { AvatarAnimator, createAnimatedGifBlob, createAvatarDesign, createFrameCanvas, createSpritesheetBlob } from './src/engine/renderer.ts';
import { PALETTE_THEMES } from './src/engine/layers.ts';

class PixelAvatar extends HTMLElement {
  static observedAttributes = ['seed', 'size', 'palette'];

  #canvas;
  #design;
  #animator;
  #updating = false;
  #motionQuery;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    this.#motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
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
    this.#motionQuery.addEventListener('change', this.#syncMotion);
    this.#syncSize();
    this.#render();
  }

  disconnectedCallback() {
    this.#animator?.stop();
    this.#motionQuery.removeEventListener('change', this.#syncMotion);
  }

  attributeChangedCallback() {
    if (this.isConnected && !this.#updating) {
      this.#syncSize();
      this.#render();
    }
  }

  get seed() {
    return this.getAttribute('seed') || 'avatar';
  }

  get palette() {
    return this.getAttribute('palette') || 'auto';
  }

  get design() {
    return this.#design;
  }

  setAvatarState(seed, palette = 'auto') {
    this.#updating = true;
    try {
      this.setAttribute('seed', String(seed));
      this.setAttribute('palette', String(palette));
    } finally {
      this.#updating = false;
    }
    if (this.isConnected) this.#render();
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
    this.#animator?.stop();
    const paletteIndex = PALETTE_THEMES.indexOf(this.palette);
    this.#design = createAvatarDesign(this.seed, paletteIndex >= 0 ? paletteIndex : undefined);
    this.#animator = new AvatarAnimator(this.#canvas, this.#design);
    this.#syncMotion();
    this.#canvas.setAttribute('aria-label', `Avatar pixel art para ${this.seed}`);
    this.dispatchEvent(new CustomEvent('avatar-rendered', {
      bubbles: true,
      composed: true,
      detail: {
        palette: [
          this.#design.palette.background,
          this.#design.palette.skin,
          this.#design.palette.hair,
          this.#design.palette.eyeAccent,
          this.#design.palette.hairHighlight,
          this.#design.palette.skinShadow,
          this.#design.palette.outline,
        ],
        dna: this.#design.dna,
        size: 16,
      },
    }));
  }

  #syncMotion = () => {
    if (!this.isConnected || !this.#animator) return;
    if (this.#motionQuery.matches) {
      this.#animator.stop();
      this.#animator.renderFrame(0);
    } else {
      this.#animator.start();
    }
  };

  getStaticPngBlob() {
    const canvas = createFrameCanvas(this.#design, 0);
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('No se pudo exportar el PNG estático.'));
      }, 'image/png');
    });
  }

  getSvg() {
    const colorByPixel = [
      this.#design.palette.background,
      this.#design.palette.skin,
      this.#design.palette.hair,
      this.#design.palette.eyeAccent,
      this.#design.palette.skinShadow,
      this.#design.palette.hairHighlight,
      this.#design.palette.outline,
      this.#design.palette.eyeHighlight,
    ];
    const pixels = this.#design.matrix.map((row) => row.map((pixel) => colorByPixel[pixel]));
    return avatarToSvg({ size: 16, pixels });
  }

  getSpritesheetBlob() {
    return createSpritesheetBlob(this.#design);
  }

  getAnimatedGifBlob() {
    return createAnimatedGifBlob(this.#design);
  }
}

if (!customElements.get('pixel-avatar')) {
  customElements.define('pixel-avatar', PixelAvatar);
}
