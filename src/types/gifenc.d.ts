declare module 'gifenc' {
  export type GifColor = [red: number, green: number, blue: number];
  export type GifPalette = GifColor[];

  export interface GifEncoder {
    writeFrame(
      pixels: Uint8Array,
      width: number,
      height: number,
      options?: {
        palette?: GifPalette;
        delay?: number;
        repeat?: number;
      },
    ): void;
    finish(): void;
    bytes(): Uint8Array;
  }

  export function GIFEncoder(options?: { initialCapacity?: number }): GifEncoder;
  export function quantize(pixels: Uint8Array | Uint8ClampedArray, maxColors: number): GifPalette;
  export function applyPalette(pixels: Uint8Array | Uint8ClampedArray, palette: GifPalette): Uint8Array;
}
