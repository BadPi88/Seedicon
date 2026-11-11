import '../pixel-avatar.js';
import './components/DnaInspector';
import { playBleep } from '../sound.js';
import { PALETTE_THEMES, type PaletteThemeName } from './engine/layers';
import type { AvatarDNA } from './engine/renderer';

interface PixelAvatarElement extends HTMLElement {
  readonly design: { dna: AvatarDNA };
  setAvatarState(seed: string, palette?: string): void;
  getStaticPngBlob(): Promise<Blob>;
  getSvg(): string;
  getAnimatedGifBlob(): Promise<Blob>;
  getSpritesheetBlob(): Promise<Blob>;
}

interface DnaInspectorElement extends HTMLElement {
  update(dna: AvatarDNA): void;
}

const preview = document.querySelector<PixelAvatarElement>('#avatar-preview')!;
const seedInput = document.querySelector<HTMLInputElement>('#seed-input')!;
const paletteSelect = document.querySelector<HTMLSelectElement>('#palette-select')!;
const swatches = document.querySelector<HTMLDivElement>('#palette-swatches')!;
const inspector = document.querySelector<DnaInspectorElement>('#dna-inspector')!;
const copyStatus = document.querySelector<HTMLElement>('#copy-status')!;
const randomButton = document.querySelector<HTMLButtonElement>('#random-button')!;

function currentUrlState(): { seed: string | null; palette: string | null } {
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.replace(/^#\??/, ''));
  return {
    seed: url.searchParams.get('seed') ?? hashParams.get('seed'),
    palette: url.searchParams.get('palette') ?? hashParams.get('palette'),
  };
}

function updateUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.set('seed', seedInput.value || 'avatar');
  url.searchParams.set('palette', paletteSelect.value || 'auto');
  window.history.replaceState(null, '', url);
}

function validPalette(value: string | null): string {
  return value && (value === 'auto' || PALETTE_THEMES.includes(value as PaletteThemeName))
    ? value
    : 'auto';
}

function applyInputs(syncUrl = true, sound = false): void {
  const seed = seedInput.value || 'avatar';
  const palette = validPalette(paletteSelect.value);
  paletteSelect.value = palette;
  preview.setAvatarState(seed, palette);
  if (syncUrl) updateUrl();
  if (sound) playBleep();
}

function applyUrlState(): void {
  const state = currentUrlState();
  if (state.seed !== null) seedInput.value = state.seed.slice(0, 64);
  if (state.palette !== null) paletteSelect.value = validPalette(state.palette);
  applyInputs(false);
}

function safeFilename(value: string): string {
  const normalized = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  return normalized.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'avatar';
}

function download(blob: Blob, extension: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeFilename(seedInput.value)}.${extension}`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyText(value: string, message: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const temporaryInput = document.createElement('textarea');
      temporaryInput.value = value;
      temporaryInput.style.position = 'fixed';
      temporaryInput.style.opacity = '0';
      document.body.append(temporaryInput);
      temporaryInput.select();
      const copied = document.execCommand('copy');
      temporaryInput.remove();
      if (!copied) throw new Error('El navegador rechazó el acceso al portapapeles.');
    }
    copyStatus.textContent = message;
  } catch {
    copyStatus.textContent = 'No se pudo copiar. Revisa los permisos del portapapeles.';
  }
}

preview.addEventListener('avatar-rendered', (event) => {
  const { palette, dna } = (event as CustomEvent<{ palette: string[]; dna: AvatarDNA }>).detail;
  const labels = ['Fondo', 'Piel', 'Pelo', 'Ojos', 'Brillo', 'Sombra', 'Contorno'];
  swatches.replaceChildren(...palette.map((color, index) => {
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.backgroundColor = color;
    swatch.title = labels[index];
    swatch.setAttribute('aria-label', `${labels[index]}: ${color}`);
    return swatch;
  }));
  inspector.update(dna);
});

seedInput.addEventListener('input', () => applyInputs(true, true));
paletteSelect.addEventListener('change', () => applyInputs(true, true));
randomButton.addEventListener('click', () => {
  const fragment = globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10);
  seedInput.value = `pixel-${fragment}`;
  applyInputs(true, true);
  seedInput.focus();
  seedInput.select();
});
window.addEventListener('popstate', applyUrlState);
window.addEventListener('hashchange', applyUrlState);

document.querySelector<HTMLButtonElement>('#copy-link')!.addEventListener('click', () => {
  updateUrl();
  void copyText(window.location.href, 'Enlace copiado.');
});

document.querySelector<HTMLButtonElement>('#copy-component')!.addEventListener('click', () => {
  const seed = seedInput.value || 'avatar';
  const escapedSeed = seed.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  const palette = validPalette(paletteSelect.value);
  void copyText(`<pixel-avatar seed="${escapedSeed}" palette="${palette}" size="128"></pixel-avatar>`, 'HTML del componente copiado.');
});

document.querySelector<HTMLButtonElement>('#download-png')!.addEventListener('click', async () => {
  try {
    download(await preview.getStaticPngBlob(), 'png');
  } catch (error) {
    console.error('No se pudo crear el PNG estático.', error);
    copyStatus.textContent = 'No se pudo generar el PNG. Inténtalo de nuevo.';
  }
});

document.querySelector<HTMLButtonElement>('#download-svg')!.addEventListener('click', () => {
  download(new Blob([preview.getSvg()], { type: 'image/svg+xml;charset=utf-8' }), 'svg');
});

document.querySelector<HTMLButtonElement>('#download-gif')!.addEventListener('click', async () => {
  try {
    download(await preview.getAnimatedGifBlob(), 'gif');
  } catch (error) {
    console.error('No se pudo crear el GIF animado.', error);
    copyStatus.textContent = 'No se pudo generar el GIF. Inténtalo de nuevo.';
  }
});

document.querySelector<HTMLButtonElement>('#download-sheet')!.addEventListener('click', async () => {
  try {
    download(await preview.getSpritesheetBlob(), 'png');
  } catch (error) {
    console.error('No se pudo crear el spritesheet.', error);
    copyStatus.textContent = 'No se pudo generar el spritesheet. Inténtalo de nuevo.';
  }
});

const initialState = currentUrlState();
if (initialState.seed !== null) seedInput.value = initialState.seed.slice(0, 64);
if (initialState.palette !== null) paletteSelect.value = validPalette(initialState.palette);
applyInputs();
