import { hashString, randomFromString } from '../../prng.js';
import {
  composeAvatarMatrix,
  EYE_STYLES,
  EXPRESSIONS,
  getPalette,
  HAIR_STYLES,
  HEAD_SHAPES,
  PALETTE_THEMES,
  Pixel,
  type AvatarPalette,
  type FullAvatarMatrix,
} from './layers';

export const AVATAR_SIZE = 16;
export const EXPORT_SIZE = 512;
export const IDLE_FRAME_DURATION_MS = 500;

export interface AvatarDNA {
  hashHex: string;
  headIndex: number;
  hairIndex: number;
  eyesIndex: number;
  expressionIndex: number;
  paletteIndex: number;
  paletteName: string;
}

export interface AvatarDesign {
  seed: string;
  dna: AvatarDNA;
  palette: AvatarPalette;
  matrix: FullAvatarMatrix;
}

function chooseIndex(random: () => number, length: number): number {
  return Math.floor(random() * length);
}

export function createAvatarDesign(seed: string, selectedPalette?: number): AvatarDesign {
  const random = randomFromString(seed);
  const generatedPalette = chooseIndex(random, PALETTE_THEMES.length);
  const paletteIndex = selectedPalette == null
    ? generatedPalette
    : Math.max(0, Math.min(PALETTE_THEMES.length - 1, Math.trunc(selectedPalette)));
  const palette = getPalette(paletteIndex, random);
  const headIndex = chooseIndex(random, HEAD_SHAPES.length);
  const hairIndex = chooseIndex(random, HAIR_STYLES.length);
  const eyesIndex = chooseIndex(random, EYE_STYLES.length);
  const expressionIndex = chooseIndex(random, EXPRESSIONS.length);

  return {
    seed,
    palette,
    matrix: composeAvatarMatrix(headIndex, hairIndex, eyesIndex, expressionIndex),
    dna: {
      hashHex: hashString(seed).toString(16).padStart(8, '0'),
      headIndex,
      hairIndex,
      eyesIndex,
      expressionIndex,
      paletteIndex,
      paletteName: PALETTE_THEMES[paletteIndex],
    },
  };
}

function makeFrameMatrix(design: AvatarDesign, frameIndex: 0 | 1): FullAvatarMatrix {
  const matrix = design.matrix.map((row) => row.slice());
  if (frameIndex === 1) {
    for (const x of [2, 3, 12, 13]) {
      for (const y of [7, 8]) {
        if (matrix[y][x] === Pixel.Eyes || matrix[y][x] === Pixel.EyeHighlight) {
          matrix[y][x] = y === 7 ? Pixel.Skin : Pixel.Shadow;
        }
      }
    }
  }

  if (frameIndex === 0) return matrix;

  const shifted = Array.from({ length: AVATAR_SIZE }, () => Array<number>(AVATAR_SIZE).fill(Pixel.Transparent));
  for (let y = 0; y < AVATAR_SIZE - 1; y += 1) {
    shifted[y + 1] = matrix[y];
  }
  return shifted;
}

export function renderAvatarFrame(
  canvas: HTMLCanvasElement,
  design: AvatarDesign,
  frameIndex: 0 | 1,
): HTMLCanvasElement {
  canvas.width = EXPORT_SIZE;
  canvas.height = EXPORT_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No se pudo crear el contexto 2D del canvas.');

  const cellSize = EXPORT_SIZE / AVATAR_SIZE;
  const colors = [
    design.palette.background,
    design.palette.skin,
    design.palette.hair,
    design.palette.eyeAccent,
    design.palette.skinShadow,
    design.palette.hairHighlight,
    design.palette.outline,
    design.palette.eyeHighlight,
  ];
  const frame = makeFrameMatrix(design, frameIndex);

  context.imageSmoothingEnabled = false;
  context.fillStyle = design.palette.background;
  context.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
  frame.forEach((row, y) => row.forEach((pixel, x) => {
    if (pixel === Pixel.Transparent) return;
    context.fillStyle = colors[pixel] ?? design.palette.background;
    context.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
  }));

  return canvas;
}

export function createFrameCanvas(design: AvatarDesign, frameIndex: 0 | 1): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  return renderAvatarFrame(canvas, design, frameIndex);
}

export class AvatarAnimator {
  #canvas: HTMLCanvasElement;
  #design: AvatarDesign;
  #frame: 0 | 1 = 0;
  #lastFlip = 0;
  #animationId = 0;
  #running = false;

  constructor(canvas: HTMLCanvasElement, design: AvatarDesign) {
    this.#canvas = canvas;
    this.#design = design;
    renderAvatarFrame(this.#canvas, this.#design, 0);
  }

  start(): void {
    if (this.#running) return;
    this.#running = true;
    this.#lastFlip = performance.now();
    this.#animationId = requestAnimationFrame(this.#tick);
  }

  stop(): void {
    this.#running = false;
    cancelAnimationFrame(this.#animationId);
  }

  renderFrame(frameIndex: 0 | 1): HTMLCanvasElement {
    this.#frame = frameIndex;
    return renderAvatarFrame(this.#canvas, this.#design, frameIndex);
  }

  #tick = (now: number): void => {
    if (!this.#running) return;
    if (now - this.#lastFlip >= IDLE_FRAME_DURATION_MS) {
      this.#frame = this.#frame === 0 ? 1 : 0;
      this.#lastFlip = now;
      renderAvatarFrame(this.#canvas, this.#design, this.#frame);
    }
    this.#animationId = requestAnimationFrame(this.#tick);
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error(`No se pudo crear el archivo ${type}.`));
    }, type);
  });
}

export async function createSpritesheetBlob(design: AvatarDesign): Promise<Blob> {
  const sheet = document.createElement('canvas');
  sheet.width = EXPORT_SIZE * 2;
  sheet.height = EXPORT_SIZE;
  const context = sheet.getContext('2d');
  if (!context) throw new Error('No se pudo crear el canvas del spritesheet.');
  context.imageSmoothingEnabled = false;
  context.drawImage(createFrameCanvas(design, 0), 0, 0);
  context.drawImage(createFrameCanvas(design, 1), EXPORT_SIZE, 0);
  return canvasToBlob(sheet, 'image/png');
}

export async function createAnimatedGifBlob(design: AvatarDesign): Promise<Blob> {
  const { applyPalette, GIFEncoder, quantize } = await import('gifenc');
  const frameCanvases = [createFrameCanvas(design, 0), createFrameCanvas(design, 1)];
  const frameData = frameCanvases.map((canvas) => {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No se pudo leer un frame de la animación.');
    return context.getImageData(0, 0, EXPORT_SIZE, EXPORT_SIZE).data;
  });

  const combined = new Uint8Array(frameData[0].length + frameData[1].length);
  combined.set(frameData[0], 0);
  combined.set(frameData[1], frameData[0].length);
  const palette = quantize(combined, 32);
  const gif = GIFEncoder();

  frameData.forEach((rgba, index) => {
    gif.writeFrame(applyPalette(rgba, palette), EXPORT_SIZE, EXPORT_SIZE, {
      palette: index === 0 ? palette : undefined,
      delay: IDLE_FRAME_DURATION_MS,
      repeat: index === 0 ? 0 : undefined,
    });
  });
  gif.finish();
  const bytes = gif.bytes();
  const blobBuffer = new Uint8Array(bytes.byteLength);
  blobBuffer.set(bytes);
  return new Blob([blobBuffer.buffer], { type: 'image/gif' });
}

export { canvasToBlob };
