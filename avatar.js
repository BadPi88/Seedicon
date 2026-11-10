import { randomFromString } from './prng.js';

const SIZE = 16;

// Cada fila describe una máscara de 16 píxeles: 1 pinta y 0 deja ver la capa inferior.
const SHAPES = {
  silhouette: [
    '0000011111100000', '0001111111111000', '0011111111111100', '0011111111111100',
    '0111111111111110', '0111111111111110', '0111111111111110', '0111111111111110',
    '0111111111111110', '0111111111111110', '0011111111111100', '0011111111111100',
    '0011111111111100', '0001111111111000', '0000111111110000', '0000001111000000',
  ],
  helmet: [
    '0000111111110000', '0001111111111000', '0011111111111100', '0111111111111110',
    '0111111111111110', '0111111111111110', '0111111111111110', '0111111111111110',
    '0111111111111110', '0111111111111110', '0011111111111100', '0011111111111100',
    '0011111111111100', '0001111111111000', '0000111111110000', '0000001111000000',
  ],
  hairShort: [
    '0000011111100000', '0001111111111000', '0011111111111100', '0111111111111110',
    '0111111111111110', '0011111111111100', '0000000000000000', '0000000000000000',
    '0000000000000000', '0000000000000000', '0000000000000000', '0000000000000000',
    '0000000000000000', '0000000000000000', '0000000000000000', '0000000000000000',
  ],
  hairFringe: [
    '0000011111100000', '0001111111111000', '0011111111111100', '0111111111111110',
    '0111111111111110', '0011111001111100', '0000110000110000', '0000000000000000',
    '0000000000000000', '0000000000000000', '0000000000000000', '0000000000000000',
    '0000000000000000', '0000000000000000', '0000000000000000', '0000000000000000',
  ],
  hairSide: [
    '0000011111100000', '0001111111111000', '0011111111111100', '0111111111111110',
    '0111111111111110', '0011111111111100', '0000000000000000', '0000000000000000',
    '0000000000000000', '0000000000000000', '0000000000000000', '0000000000000000',
    '0000000000000000', '0000000000000000', '0000000000000000', '0000000000000000',
  ],
  eyes: [
    '0000000000000000', '0000000000000000', '0000000000000000', '0000000000000000',
    '0000000000000000', '0000000000000000', '0000100000010000', '0000110000110000',
    '0000000000000000', '0000000000000000', '0000000000000000', '0000000000000000',
    '0000000000000000', '0000000000000000', '0000000000000000', '0000000000000000',
  ],
  visor: [
    '0000000000000000', '0000000000000000', '0000000000000000', '0000000000000000',
    '0000000000000000', '0011111111111100', '0011111111111100', '0000000000000000',
    '0000000000000000', '0000000000000000', '0000000000000000', '0000000000000000',
    '0000000000000000', '0000000000000000', '0000000000000000', '0000000000000000',
  ],
  headband: [
    '0000000000000000', '0000000000000000', '0000000000000000', '0000000000000000',
    '0011111111111100', '0011111111111100', '0000000000000000', '0000000000000000',
    '0000000000000000', '0000000000000000', '0000000000000000', '0000000000000000',
    '0000000000000000', '0000000000000000', '0000000000000000', '0000000000000000',
  ],
  badge: [
    '0000000000000000', '0000000000000000', '0000000000000000', '0000000000000000',
    '0000000000000000', '0000000000000000', '0000000000000000', '0000000000000000',
    '0000000110000000', '0000001111000000', '0000001111000000', '0000000110000000',
    '0000000000000000', '0000000000000000', '0000000000000000', '0000000000000000',
  ],
};

function maskToMatrix(mask) {
  return mask.map((row) => [...row].map((pixel) => pixel === '1'));
}

function hslToHex(hue, saturation, lightness) {
  const h = ((hue % 360) + 360) % 360;
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const segment = h / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
  const [red, green, blue] = segment < 1 ? [chroma, secondary, 0]
    : segment < 2 ? [secondary, chroma, 0]
      : segment < 3 ? [0, chroma, secondary]
        : segment < 4 ? [0, secondary, chroma]
          : segment < 5 ? [secondary, 0, chroma]
            : [chroma, 0, secondary];
  const offset = l - chroma / 2;
  return `#${[red, green, blue].map((channel) => Math.round((channel + offset) * 255).toString(16).padStart(2, '0')).join('')}`;
}

function createPalette(random) {
  const hue = Math.floor(random() * 360);
  const bodyHue = hue + 145;
  return {
    background: hslToHex(hue, 28 + random() * 14, 13 + random() * 5),
    shadow: hslToHex(bodyHue, 48, 39),
    body: hslToHex(bodyHue, 55, 65),
    hair: hslToHex(hue + 28, 62, 43),
    eyes: hslToHex(hue + 195, 75, 72),
    accessory: hslToHex(hue + 180, 82, 59),
  };
}

function makeLayer(name, mask, color) {
  return { name, matrix: maskToMatrix(mask), color };
}

export function generateAvatar(seedText = 'avatar') {
  const random = randomFromString(seedText);
  const palette = createPalette(random);
  const isHelmet = random() > 0.55;
  const hairStyle = Math.floor(random() * 3);
  const accessoryStyle = Math.floor(random() * 3);

  // Las capas se componen en orden: cada máscara puede cubrir las anteriores.
  const layers = [
    makeLayer('silhouette', isHelmet ? SHAPES.helmet : SHAPES.silhouette, palette.body),
    makeLayer('eyes', SHAPES.eyes, palette.eyes),
  ];

  if (isHelmet) {
    layers.push(makeLayer('helmet-trim', SHAPES.headband, palette.hair));
  } else if (hairStyle > 0) {
    const hairMask = hairStyle === 1 ? SHAPES.hairShort : SHAPES.hairFringe;
    layers.push(makeLayer('hair', hairMask, palette.hair));
  }

  if (accessoryStyle === 1) {
    layers.push(makeLayer('visor', SHAPES.visor, palette.shadow));
  } else if (accessoryStyle === 2) {
    layers.push(makeLayer('headband', SHAPES.headband, palette.accessory));
  } else if (random() > 0.5) {
    layers.push(makeLayer('badge', SHAPES.badge, palette.accessory));
  }

  const pixels = Array.from({ length: SIZE }, () => Array(SIZE).fill(palette.background));
  for (const layer of layers) {
    layer.matrix.forEach((row, y) => row.forEach((isSet, x) => {
      if (isSet) pixels[y][x] = layer.color;
    }));
  }

  return { size: SIZE, pixels, layers, palette };
}

export function drawAvatar(canvas, avatar) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No se pudo crear el contexto 2D del canvas.');
  const cellSize = canvas.width / avatar.size;
  context.imageSmoothingEnabled = false;
  avatar.pixels.forEach((row, y) => row.forEach((color, x) => {
    context.fillStyle = color;
    context.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
  }));
}

export function avatarToSvg(avatar) {
  const rects = avatar.pixels.flatMap((row, y) => row.map((color, x) =>
    `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`));
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${avatar.size} ${avatar.size}" shape-rendering="crispEdges">`,
    ...rects,
    '</svg>',
  ].join('');
}

export function getPaletteSwatches(palette) {
  return [palette.background, palette.body, palette.hair, palette.eyes, palette.accessory];
}
