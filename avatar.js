import { randomFromString } from './prng.js';

// Cada paleta incluye un fondo y tres tonos para dibujar los píxeles.
const PALETTES = [
  ['#191d2b', '#8be9fd', '#bd93f9', '#ff79c6'],
  ['#20251f', '#c4f06a', '#f5b971', '#f27878'],
  ['#211b2b', '#ff9e64', '#ffd866', '#7bdff2'],
  ['#19252c', '#80ed99', '#57c4e5', '#f7aef8'],
  ['#29201b', '#f2cc8f', '#e07a5f', '#81b29a'],
  ['#1d2230', '#a0c4ff', '#ffc6ff', '#fdffb6'],
];

export function generateAvatar(seedText, size = 8) {
  const sizeIsValid = size === 5 || size === 8;
  if (!sizeIsValid) throw new RangeError('El tamaño debe ser 5 u 8.');

  const random = randomFromString(seedText);
  const palette = [...PALETTES[Math.floor(random() * PALETTES.length)]];
  const pixels = Array.from({ length: size }, () => Array(size).fill(0));
  const halfWidth = Math.ceil(size / 2);

  // Basta generar la mitad izquierda; la otra mitad se refleja en cada fila.
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < halfWidth; x += 1) {
      const roll = random();
      let colorIndex = 0;
      if (roll > 0.27) {
        const shade = random();
        colorIndex = shade > 0.82 ? 3 : shade > 0.48 ? 2 : 1;
      }
      pixels[y][x] = colorIndex;
      pixels[y][size - 1 - x] = colorIndex;
    }
  }

  return { size, pixels, palette };
}

// Las celdas se dibujan como rectángulos para conservar los bordes nítidos.
export function drawAvatar(canvas, avatar) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No se pudo crear el contexto 2D del canvas.');
  const cellSize = canvas.width / avatar.size;
  context.imageSmoothingEnabled = false;
  context.fillStyle = avatar.palette[0];
  context.fillRect(0, 0, canvas.width, canvas.height);

  avatar.pixels.forEach((row, y) => row.forEach((colorIndex, x) => {
    if (colorIndex === 0) return;
    context.fillStyle = avatar.palette[colorIndex];
    context.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
  }));
}

// En el SVG cada píxel coloreado ocupa un rectángulo de una unidad.
export function avatarToSvg(avatar) {
  const { size, pixels, palette } = avatar;
  const rects = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const colorIndex = pixels[y][x];
      if (colorIndex !== 0) {
        rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[colorIndex]}"/>`);
      }
    }
  }
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">`,
    `<rect width="${size}" height="${size}" fill="${palette[0]}"/>`,
    ...rects,
    '</svg>',
  ].join('');
}
