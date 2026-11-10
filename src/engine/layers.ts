// Cada número representa un color o transparencia dentro del sprite.
export const Pixel = {
  Transparent: 0,
  Skin: 1,
  Hair: 2,
  Eyes: 3,
  Shadow: 4,
  SkinShadow: 4,
  HairShadow: 4,
  HairHighlight: 5,
  Outline: 6,
  EyeHighlight: 7,
} as const;

export type PixelValue = (typeof Pixel)[keyof typeof Pixel];
export type HalfMatrix = number[][];
export type FullAvatarMatrix = number[][];
export type PRNG = () => number;
export type PaletteThemeName = 'HUMAN' | 'CYBERPUNK' | 'ORC' | 'UNDEAD';

export interface AvatarPalette {
  background: string;
  outline: string;
  skin: string;
  skinShadow: string;
  hair: string;
  hairShadow: string;
  hairHighlight: string;
  eyeAccent: string;
  eyeHighlight: string;
}

const HALF_WIDTH = 8;
const GRID_SIZE = 16;

// Así es más fácil dibujar las formas a mano sin perder la matriz 16 × 8.
function matrix(...rows: string[]): HalfMatrix {
  if (rows.length !== GRID_SIZE) {
    throw new RangeError(`Una capa debe contener ${GRID_SIZE} filas.`);
  }

  return rows.map((row, rowIndex) => {
    if (row.length !== HALF_WIDTH || /[^0-7]/.test(row)) {
      throw new RangeError(`La fila ${rowIndex} debe tener 8 píxeles entre 0 y 7.`);
    }
    return Array.from(row, (pixel) => Number(pixel));
  });
}

// Guardamos solo la mitad izquierda: x=0 es el borde y x=7 toca el centro.
export const HEAD_SHAPES: HalfMatrix[] = [
  // La forma redonda de base.
  matrix(
    '00000000', '00000000', '00011111', '00111111',
    '01111111', '11111111', '11111111', '11111111',
    '11111111', '11111111', '11111111', '01111111',
    '00111111', '00000000', '00000000', '00000000',
  ),
  // Un poco más ancha en la mandíbula.
  matrix(
    '00000000', '00000000', '00011111', '00111111',
    '01111111', '11111111', '11111111', '11111111',
    '11111111', '11111111', '11111111', '11111111',
    '11111111', '00000000', '00000000', '00000000',
  ),
  // Más larga, con una barbilla estrecha.
  matrix(
    '00000000', '00011111', '00111111', '00111111',
    '01111111', '01111111', '01111111', '01111111',
    '01111111', '01111111', '01111111', '00111111',
    '00011111', '00000000', '00000000', '00000000',
  ),
  // Las orejas sobresalen un par de píxeles, sin quedar sueltas.
  matrix(
    '00000000', '00000000', '00011111', '00111111',
    '01111111', '01111111', '11111111', '11111111',
    '01111111', '01111111', '01111111', '00111111',
    '00011111', '00000000', '00000000', '00000000',
  ),
];

// El brillo del estilo calvo usa el mismo tono claro que los ojos.
export const HAIR_STYLES: HalfMatrix[] = [
  // Sin pelo, con un reflejo compacto arriba.
  matrix(
    '00000000', '00000000', '00000000', '00000055',
    '00000055', '00000000', '00000000', '00000000',
    '00000000', '00000000', '00000000', '00000000',
    '00000000', '00000000', '00000000', '00000000',
  ),
  // Cresta centrada, como un mohicano.
  matrix(
    '00002222', '00022222', '00002222', '00000000',
    '00000000', '00000000', '00000000', '00000000',
    '00000000', '00000000', '00000000', '00000000',
    '00000000', '00000000', '00000000', '00000000',
  ),
  // Flequillo arriba y mechones largos por los lados.
  matrix(
    '00002222', '00022222', '00222222', '02222222',
    '22222222', '22222222', '22000000', '22000000',
    '22000000', '22000000', '22000000', '22000000',
    '02000000', '00000000', '00000000', '00000000',
  ),
  // Gorra retro: la visera queda por encima de los ojos.
  matrix(
    '00002222', '00022222', '00222222', '02222222',
    '22222222', '22222222', '22000000', '22000000',
    '00000000', '00000000', '00000000', '00000000',
    '00000000', '00000000', '00000000', '00000000',
  ),
  // Afro ancho, con el contorno despejado a la altura de los ojos.
  matrix(
    '00000000', '00022222', '00222222', '02222222',
    '22222222', '22222222', '22000000', '22000000',
    '02000000', '00000000', '00000000', '00000000',
    '00000000', '00000000', '00000000', '00000000',
  ),
];

// Los ojos siempre ocupan las filas 7 y 8; el catchlight va en la esquina alta.
export const EYE_STYLES: HalfMatrix[] = [
  // Ojo clásico de 2 × 2 píxeles.
  matrix(
    '00000000', '00000000', '00000000', '00000000',
    '00000000', '00000000', '00000000', '00730000',
    '00330000', '00000000', '00000000', '00000000',
    '00000000', '00000000', '00000000', '00000000',
  ),
  // Gafas oscuras con puente y un reflejo claro en cada lente.
  matrix(
    '00000000', '00000000', '00000000', '00000000',
    '00000000', '00000000', '00000000', '06736000',
    '06336000', '00000000', '00000000', '00000000',
    '00000000', '00000000', '00000000', '00000000',
  ),
  // El visor cruza la cara, pero deja brillar los ojos.
  matrix(
    '00000000', '00000000', '00000000', '00000000',
    '00000000', '00000000', '00000000', '63333336',
    '63333336', '00000000', '00000000', '00000000',
    '00000000', '00000000', '00000000', '00000000',
  ),
  // Un ojo abierto y otro cerrado.
  matrix(
    '00000000', '00000000', '00000000', '00000000',
    '00000000', '00000000', '00000000', '00730000',
    '00440000', '00000000', '00000000', '00000000',
    '00000000', '00000000', '00000000', '00000000',
  ),
];

// La boca queda anclada en la fila 10.
export const EXPRESSIONS: HalfMatrix[] = [
  // Una boca recta y sencilla.
  matrix(
    '00000000', '00000000', '00000000', '00000000',
    '00000000', '00000000', '00000000', '00000000',
    '00000000', '00000000', '00044000', '00000000',
    '00000000', '00000000', '00000000', '00000000',
  ),
  // Una sonrisa corta, también centrada en la fila 10.
  matrix(
    '00000000', '00000000', '00000000', '00000000',
    '00000000', '00000000', '00000000', '00000000',
    '00000000', '00000000', '00444000', '00000000',
    '00000000', '00000000', '00000000', '00000000',
  ),
  // Barba completa, sin alargar la barbilla más allá de la fila 12.
  matrix(
    '00000000', '00000000', '00000000', '00000000',
    '00000000', '00000000', '00000000', '00000000',
    '00000000', '00000000', '00044000', '02222220',
    '00244200', '00000000', '00000000', '00000000',
  ),
];

export const PALETTE_THEMES: readonly PaletteThemeName[] = [
  'HUMAN',
  'CYBERPUNK',
  'ORC',
  'UNDEAD',
];

interface ThemeSettings {
  hueRange: readonly [minimum: number, maximum: number];
  skinHueOffset: number;
  skinSaturation: readonly [minimum: number, maximum: number];
  skinLightness: readonly [minimum: number, maximum: number];
  hairSaturation: number;
  hairLightness: number;
}

const THEME_SETTINGS: readonly ThemeSettings[] = [
  { hueRange: [18, 42], skinHueOffset: 8, skinSaturation: [35, 53], skinLightness: [51, 70], hairSaturation: 54, hairLightness: 34 },
  { hueRange: [185, 285], skinHueOffset: -35, skinSaturation: [36, 57], skinLightness: [48, 68], hairSaturation: 72, hairLightness: 32 },
  { hueRange: [78, 112], skinHueOffset: 0, skinSaturation: [42, 66], skinLightness: [35, 53], hairSaturation: 59, hairLightness: 25 },
  { hueRange: [145, 205], skinHueOffset: 12, skinSaturation: [20, 39], skinLightness: [48, 65], hairSaturation: 38, hairLightness: 22 },
];

function unitRandom(prng: PRNG): number {
  const value = prng();
  if (!Number.isFinite(value)) return 0;
  return Math.min(0.999999999, Math.max(0, value));
}

function interpolate(range: readonly [number, number], amount: number): number {
  return range[0] + (range[1] - range[0]) * amount;
}

function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}

// Convertimos aquí mismo para no depender del navegador ni del DOM.
function hslToHex(hue: number, saturation: number, lightness: number): string {
  const h = normalizeHue(hue) / 60;
  const s = Math.min(100, Math.max(0, saturation)) / 100;
  const l = Math.min(100, Math.max(0, lightness)) / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const secondary = chroma * (1 - Math.abs((h % 2) - 1));

  let channels: readonly [number, number, number];
  if (h < 1) channels = [chroma, secondary, 0];
  else if (h < 2) channels = [secondary, chroma, 0];
  else if (h < 3) channels = [0, chroma, secondary];
  else if (h < 4) channels = [0, secondary, chroma];
  else if (h < 5) channels = [secondary, 0, chroma];
  else channels = [chroma, 0, secondary];

  const offset = l - chroma / 2;
  const hex = channels
    .map((channel) => Math.round((channel + offset) * 255).toString(16).padStart(2, '0'))
    .join('');
  return `#${hex}`;
}

// El tema fija la familia de color; estas variaciones siguen dependiendo de la semilla.
export function getPalette(themeIndex: number, prng: PRNG): AvatarPalette {
  if (typeof prng !== 'function') {
    throw new TypeError('getPalette necesita una función PRNG.');
  }

  const validIndex = Number.isFinite(themeIndex) ? Math.trunc(themeIndex) : 0;
  const normalizedIndex = ((validIndex % THEME_SETTINGS.length) + THEME_SETTINGS.length)
    % THEME_SETTINGS.length;
  const settings = THEME_SETTINGS[normalizedIndex];
  const baseHue = interpolate(settings.hueRange, unitRandom(prng));
  const hueJitter = (unitRandom(prng) - 0.5) * 12;
  const skinSaturation = interpolate(settings.skinSaturation, unitRandom(prng));
  const skinLightness = interpolate(settings.skinLightness, unitRandom(prng));
  const skinHue = baseHue + settings.skinHueOffset + hueJitter;
  const hairHue = baseHue + 26 + hueJitter;
  const hairLightness = settings.hairLightness;
  const shadowHue = 220 + unitRandom(prng) * 45;
  const shadowSaturation = 58 + unitRandom(prng) * 14;
  const shadowLightness = Math.min(skinLightness, hairLightness) * 0.72;
  const highlightHue = 35 + unitRandom(prng) * 22;
  const highlightLightness = Math.min(96, Math.max(skinLightness, hairLightness) + 24);

  const coolShadow = hslToHex(shadowHue, shadowSaturation, shadowLightness);
  const warmHighlight = hslToHex(highlightHue, 36, highlightLightness);

  return {
    background: hslToHex(baseHue + 205, 20 + unitRandom(prng) * 10, 86 + unitRandom(prng) * 6),
    outline: hslToHex(baseHue + 220, 42, 10),
    skin: hslToHex(skinHue, skinSaturation, skinLightness),
    skinShadow: coolShadow,
    hair: hslToHex(hairHue, settings.hairSaturation, hairLightness),
    hairShadow: coolShadow,
    hairHighlight: warmHighlight,
    eyeAccent: hslToHex(baseHue + 178 - hueJitter, 76, 64 + unitRandom(prng) * 10),
    eyeHighlight: warmHighlight,
  };
}

function assertCatalogIndex(index: number, catalog: readonly HalfMatrix[], label: string): HalfMatrix {
  if (!Number.isInteger(index) || index < 0 || index >= catalog.length) {
    throw new RangeError(`${label} debe estar entre 0 y ${catalog.length - 1}.`);
  }
  return catalog[index];
}

function compositeLayer(target: HalfMatrix, layer: HalfMatrix): void {
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < HALF_WIDTH; x += 1) {
      const pixel = layer[y][x];
      if (pixel > Pixel.Transparent) target[y][x] = pixel;
    }
  }
}

function addEyeCatchlights(avatar: FullAvatarMatrix, eyeIdx: number): void {
  const eyeRow = 7;
  avatar[eyeRow][2] = Pixel.EyeHighlight;

  if (eyeIdx === 3) {
    // En el guiño dejamos un ojo abierto y el otro como una línea cerrada.
    avatar[eyeRow][12] = Pixel.Shadow;
    avatar[eyeRow][13] = Pixel.Shadow;
    avatar[eyeRow + 1][12] = Pixel.Shadow;
    avatar[eyeRow + 1][13] = Pixel.Shadow;
    return;
  }

  // El espejo deja el brillo a la derecha; lo movemos a la esquina interior correcta.
  avatar[eyeRow][12] = Pixel.EyeHighlight;
  avatar[eyeRow][13] = Pixel.Eyes;
}

// Oscurecemos la piel bajo el pelo, la base del pelo y el borde inferior de la cara.
function applyAutoShading(matrixToShade: FullAvatarMatrix): void {
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const pixel = matrixToShade[y][x];
      const directlyBelowHair = y > 0 && matrixToShade[y - 1][x] === Pixel.Hair;
      const atChin = y >= 11 && y <= 12;
      const hairEdge = pixel === Pixel.Hair
        && y + 1 < GRID_SIZE
        && matrixToShade[y + 1][x] === Pixel.Skin;

      if ((pixel === Pixel.Skin && (directlyBelowHair || atChin)) || hairEdge) {
        matrixToShade[y][x] = Pixel.Shadow;
      }
    }
  }
}

// El contorno mira arriba, abajo y a los lados; no se extiende en diagonal.
function applyAutoOutline(avatar: FullAvatarMatrix): FullAvatarMatrix {
  const result = avatar.map((row) => row.slice());
  const neighbors: readonly (readonly [dy: number, dx: number])[] = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
  ];

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (avatar[y][x] !== Pixel.Transparent) continue;

      const touchesCharacter = neighbors.some(([dy, dx]) => {
        const neighborY = y + dy;
        const neighborX = x + dx;
        if (neighborY < 0 || neighborY >= GRID_SIZE || neighborX < 0 || neighborX >= GRID_SIZE) {
          return false;
        }
        const neighbor = avatar[neighborY][neighborX];
        return neighbor >= Pixel.Skin && neighbor <= Pixel.HairHighlight;
      });

      if (touchesCharacter) result[y][x] = Pixel.Outline;
    }
  }
  return result;
}

// Los índices empiezan en 0. Primero juntamos las capas y al final las reflejamos.
export function composeAvatarMatrix(
  headIdx: number,
  hairIdx: number,
  eyeIdx: number,
  exprIdx: number,
): FullAvatarMatrix {
  const head = assertCatalogIndex(headIdx, HEAD_SHAPES, 'headIdx');
  const hair = assertCatalogIndex(hairIdx, HAIR_STYLES, 'hairIdx');
  const eyes = assertCatalogIndex(eyeIdx, EYE_STYLES, 'eyeIdx');
  const expression = assertCatalogIndex(exprIdx, EXPRESSIONS, 'exprIdx');

  // Las capas de arriba reemplazan los píxeles de las que ya dibujamos.
  const leftHalf = Array.from(
    { length: GRID_SIZE },
    () => Array<number>(HALF_WIDTH).fill(Pixel.Transparent),
  );

  compositeLayer(leftHalf, head);
  compositeLayer(leftHalf, eyes);
  compositeLayer(leftHalf, hair);
  compositeLayer(leftHalf, expression);

  const mirrored = leftHalf.map((row) => [
    ...row,
    ...row.slice().reverse(),
  ]);

  addEyeCatchlights(mirrored, eyeIdx);
  applyAutoShading(mirrored);
  return applyAutoOutline(mirrored);
}
