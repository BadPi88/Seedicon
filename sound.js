let audioContext;

// El oscilador crea el sonido en el momento; no hace falta cargar un archivo.
export function playBleep() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    audioContext ||= new AudioContextClass();
    if (audioContext.state === 'suspended') audioContext.resume();

    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(660, now);
    oscillator.frequency.exponentialRampToValueAtTime(990, now + 0.045);
    volume.gain.setValueAtTime(0.0001, now);
    volume.gain.exponentialRampToValueAtTime(0.055, now + 0.008);
    volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    oscillator.connect(volume);
    volume.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.095);
  } catch (error) {
    console.warn('El sonido no está disponible en este navegador.', error);
  }
}
