import './pixel-avatar.js';
import { playBleep } from './sound.js';

const preview = document.querySelector('#avatar-preview');
const seedInput = document.querySelector('#seed-input');
const swatches = document.querySelector('#palette-swatches');
const randomButton = document.querySelector('#random-button');
const downloadPngButton = document.querySelector('#download-png');
const downloadSvgButton = document.querySelector('#download-svg');

function safeFilename(seed) {
  const normalized = seed.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  return normalized.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'avatar';
}

function updateSeed({ sound = false } = {}) {
  const seed = seedInput.value || 'avatar';
  if (preview.seed === seed) preview.refresh();
  else preview.seed = seed;
  if (sound) playBleep();
}

preview.addEventListener('avatar-rendered', ({ detail }) => {
  const labels = ['Fondo', 'Piel', 'Pelo', 'Ojos', 'Brillo', 'Sombra', 'Contorno'];
  swatches.replaceChildren(...detail.palette.map((color, index) => {
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.backgroundColor = color;
    swatch.title = labels[index];
    swatch.setAttribute('aria-label', `${labels[index]}: ${color}`);
    return swatch;
  }));
});

seedInput.addEventListener('input', () => updateSeed({ sound: true }));

randomButton.addEventListener('click', () => {
  const fragment = globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10);
  seedInput.value = `pixel-${fragment}`;
  updateSeed({ sound: true });
  seedInput.focus();
});

downloadPngButton.addEventListener('click', async () => {
  try {
    const blob = await preview.getPngBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFilename(seedInput.value)}.png`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error('No se pudo descargar el PNG.', error);
  }
});

downloadSvgButton.addEventListener('click', () => {
  const blob = new Blob([preview.getSvg()], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeFilename(seedInput.value)}.svg`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});

updateSeed();
