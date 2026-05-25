import { getSettings } from './storage';

// ─── Web Audio Sound Effects ────────────────────────────────
const audioCtx = { ctx: null };

function getAudioCtx() {
  if (!audioCtx.ctx) audioCtx.ctx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx.ctx;
}

export { getAudioCtx };

function vibrate(pattern) {
  const settings = getSettings();
  if (!settings.vibration) return;
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function playTone(frequency, type, duration, gain = 0.3, delay = 0) {
  const settings = getSettings();
  if (!settings.sfx) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
    g.gain.setValueAtTime(gain, ctx.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch {}
}

export function playCorrect() {
  playTone(523, 'sine', 0.12, 0.25);
  playTone(659, 'sine', 0.12, 0.25, 0.12);
  playTone(784, 'sine', 0.18, 0.25, 0.24);
  vibrate(50);
}

export function playWrong() {
  playTone(220, 'sawtooth', 0.2, 0.2);
  playTone(180, 'sawtooth', 0.2, 0.2, 0.15);
  vibrate([30, 50, 30]);
}

export function playClick() {
  playTone(880, 'sine', 0.05, 0.1);
}

export function playCombo() {
  [523,659,784,1046].forEach((f,i) => playTone(f,'sine',0.1,0.3,i*0.07));
  vibrate([20, 30, 20, 30, 20]);
}

export function playShatter() {
  try {
    const ctx = getAudioCtx();
    const duration = 0.8;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 6) * 0.7;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch {}
}
