import { generateAvatar, drawAvatar, avatarToSvg } from './avatar.js';

const canvas = document.querySelector('#avatar-canvas');
const seedInput = document.querySelector('#seed-input');
const gridSelect = document.querySelector('#grid-select');
const gridLabel = document.querySelector('#grid-label');
const swatches = document.querySelector('#palette-swatches');
const randomButton = document.querySelector('#random-button');
const downloadPngButton = document.querySelector('#download-png');
const downloadSvgButton = document.querySelector('#download-svg');

let currentAvatar;

function safeFilename(seed) {
  const normalized = seed.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  return normalized.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'avatar';
}

function render() {
  const seed = seedInput.value || 'avatar';
  currentAvatar = generateAvatar(seed, Number(gridSelect.value));
  drawAvatar(canvas, currentAvatar);
  gridLabel.textContent = `${currentAvatar.size} × ${currentAvatar.size}`;
  canvas.setAttribute('aria-label', `Avatar pixel art para ${seed}, cuadrícula ${currentAvatar.size} por ${currentAvatar.size}`);
  swatches.replaceChildren(...currentAvatar.palette.map((color, index) => {
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.backgroundColor = color;
    swatch.title = ['Fondo', 'Primario', 'Secundario', 'Acento'][index];
    swatch.setAttribute('aria-label', `${swatch.title}: ${color}`);
    return swatch;
  }));
}

// Al cambiar la semilla o la cuadrícula, generamos y dibujamos el avatar otra vez.
seedInput.addEventListener('input', render);
gridSelect.addEventListener('change', render);
randomButton.addEventListener('click', () => {
  const fragment = globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10);
  seedInput.value = `pixel-${fragment}`;
  render();
  seedInput.focus();
});

// Creamos un archivo PNG desde el canvas y lo descargamos como blob.
downloadPngButton.addEventListener('click', () => {
  canvas.toBlob((blob) => {
    if (!blob) {
      console.error('No se pudo exportar el canvas como PNG.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFilename(seedInput.value)}.png`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
});

downloadSvgButton.addEventListener('click', () => {
  const svgData = avatarToSvg(currentAvatar);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeFilename(seedInput.value)}.svg`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});

render();
