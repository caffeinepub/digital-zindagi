/**
 * Digital Zindagi — Professional Multi-Channel Web Audio Engine v2
 * No external audio files. All sounds synthesized via Web Audio API.
 *
 * Theme music: layered dramatic 4-second loop at 120BPM.
 * SFX: high-quality synthesized combat sounds — NO simple oscillator beeps.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let _muted = false;
let _masterVolume = 0.75;

// Theme state
let themeRunning = false;
let themeTimeout: ReturnType<typeof setTimeout> | null = null;
const themeNodes: AudioNode[] = [];

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function getMaster(): GainNode {
  const c = getCtx();
  if (!masterGain) {
    masterGain = c.createGain();
    masterGain.gain.value = _masterVolume;
    masterGain.connect(c.destination);
  }
  return masterGain;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/** Resume AudioContext — must be called from user gesture */
export function resumeAudio() {
  try {
    const c = getCtx();
    if (c.state === "suspended") void c.resume();
  } catch {}
}

/** Legacy compat */
export function setMasterVolume(v: number) {
  GameAudio.setMasterVolume(v);
}

// ─── Low-level helpers ────────────────────────────────────────────────────────

function tone(
  freq: number,
  duration: number,
  vol: number,
  type: OscillatorType = "sine",
  freqEnd?: number,
  delayMs = 0,
) {
  try {
    const c = getCtx();
    const startAt = c.currentTime + delayMs / 1000;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startAt);
    if (freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(freqEnd, 10),
        startAt + duration,
      );
    }
    g.gain.setValueAtTime(clamp(vol, 0.001, 1), startAt);
    g.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
    osc.connect(g);
    g.connect(getMaster());
    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
  } catch {}
}

function noiseBurst(
  duration: number,
  vol: number,
  centerFreq: number,
  q = 1.5,
  filterType: BiquadFilterType = "bandpass",
  delayMs = 0,
) {
  try {
    const c = getCtx();
    const startAt = c.currentTime + delayMs / 1000;
    const bufSize = Math.ceil(c.sampleRate * duration);
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = centerFreq;
    filter.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(clamp(vol, 0.001, 1), startAt);
    g.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(getMaster());
    src.start(startAt);
    src.stop(startAt + duration + 0.02);
  } catch {}
}

// ─── Theme Music ──────────────────────────────────────────────────────────────
// 120BPM = 0.5s per beat, 4/4 = 2s per bar, 2 bars = 4s loop
// Bass sequence: [55, 55, 44, 49] Hz (each 0.5s)
// Melody arpeggio: [220, 262, 196, 220] Hz (each 0.5s)
// Rhythm: noise burst every beat (0.5s interval)

const BASS_SEQ = [55, 55, 44, 49]; // A1, A1, C1, G1
const MELODY_SEQ = [220, 262, 196, 220]; // A3, C4, G3, A3
const BEAT_DURATION = 0.5; // 120BPM
const LOOP_DURATION = 4000; // ms

function scheduleThemeLoop(loopStartTime: number) {
  if (!themeRunning) return;
  try {
    const c = getCtx();

    // Bass voice: sawtooth, gain 0.15
    BASS_SEQ.forEach((freq, beat) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, loopStartTime + beat * BEAT_DURATION);
      g.gain.setValueAtTime(0.15, loopStartTime + beat * BEAT_DURATION);
      g.gain.exponentialRampToValueAtTime(
        0.001,
        loopStartTime + (beat + 1) * BEAT_DURATION - 0.02,
      );
      osc.connect(g);
      g.connect(getMaster());
      osc.start(loopStartTime + beat * BEAT_DURATION);
      osc.stop(loopStartTime + (beat + 1) * BEAT_DURATION);
      themeNodes.push(osc, g);
    });

    // Melody voice: sine, gain 0.08
    MELODY_SEQ.forEach((freq, beat) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, loopStartTime + beat * BEAT_DURATION);
      g.gain.setValueAtTime(0.08, loopStartTime + beat * BEAT_DURATION);
      g.gain.exponentialRampToValueAtTime(
        0.001,
        loopStartTime + (beat + 0.85) * BEAT_DURATION,
      );
      osc.connect(g);
      g.connect(getMaster());
      osc.start(loopStartTime + beat * BEAT_DURATION);
      osc.stop(loopStartTime + (beat + 0.9) * BEAT_DURATION);
      themeNodes.push(osc, g);
    });

    // Rhythm: noise burst each beat (BrownNoise approximation via LP filtered white noise)
    BASS_SEQ.forEach((_, beat) => {
      const bufSize = Math.ceil(c.sampleRate * 0.08);
      const buf = c.createBuffer(1, bufSize, c.sampleRate);
      const data = buf.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5; // "brown noise"
      }
      const src = c.createBufferSource();
      src.buffer = buf;
      const filter = c.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 200;
      const g = c.createGain();
      const beatStart = loopStartTime + beat * BEAT_DURATION;
      g.gain.setValueAtTime(0.35, beatStart);
      g.gain.exponentialRampToValueAtTime(0.001, beatStart + 0.08);
      src.connect(filter);
      filter.connect(g);
      g.connect(getMaster());
      src.start(beatStart);
      src.stop(beatStart + 0.1);
      themeNodes.push(src, g);
    });

    // Schedule next loop iteration
    themeTimeout = setTimeout(() => {
      if (themeRunning) {
        const nextStart = getCtx().currentTime;
        scheduleThemeLoop(nextStart);
      }
    }, LOOP_DURATION - 100); // 100ms early for seamless loop
  } catch {}
}

function stopAllThemeNodes() {
  for (const node of themeNodes) {
    try {
      if (
        node instanceof OscillatorNode ||
        node instanceof AudioBufferSourceNode
      ) {
        node.stop();
      }
      node.disconnect();
    } catch {}
  }
  themeNodes.length = 0;
  if (themeTimeout !== null) {
    clearTimeout(themeTimeout);
    themeTimeout = null;
  }
}

// ─── SFX — High-quality synthesized sounds ───────────────────────────────────

export const SFX = {
  /** Attack: crisp impact — white noise shaped by exponential decay + highpass */
  heroAttack(volume = 0.5) {
    try {
      const c = getCtx();
      const bufSize = Math.ceil(c.sampleRate * 0.08);
      const buf = c.createBuffer(1, bufSize, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      src.buffer = buf;
      const filter = c.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 1000;
      const g = c.createGain();
      g.gain.setValueAtTime(clamp(volume * 0.6, 0.001, 1), c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
      src.connect(filter);
      filter.connect(g);
      g.connect(getMaster());
      src.start();
      src.stop(c.currentTime + 0.1);
    } catch {}
  },

  /** Enemy hit: heavy thud — 80Hz sine with tanh distortion */
  enemyHit(volume = 0.5) {
    try {
      const c = getCtx();
      const osc = c.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(80, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, c.currentTime + 0.12);
      const wave = c.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i * 2) / 255 - 1;
        curve[i] = Math.tanh(x * 4);
      }
      wave.curve = curve;
      const g = c.createGain();
      g.gain.setValueAtTime(clamp(volume * 0.8, 0.001, 1), c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
      osc.connect(wave);
      wave.connect(g);
      g.connect(getMaster());
      osc.start();
      osc.stop(c.currentTime + 0.14);
    } catch {}
  },

  /** Wave start: epic sweep — sawtooth 110→880Hz over 1.5s */
  waveStart(volume = 0.6) {
    try {
      const c = getCtx();
      const osc = c.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(110, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, c.currentTime + 1.5);
      const g = c.createGain();
      g.gain.setValueAtTime(clamp(volume * 0.4, 0.001, 1), c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.5);
      osc.connect(g);
      g.connect(getMaster());
      osc.start();
      osc.stop(c.currentTime + 1.55);
    } catch {}
  },

  /** Power-up: ascending arpeggio [523, 659, 784, 1047] Hz */
  powerUp(volume = 0.3) {
    [523, 659, 784, 1047].forEach((freq, i) => {
      tone(freq, 0.12, volume, "sine", undefined, i * 120);
    });
  },

  /** Coin collect: bright chime — 1047Hz sine, 0.25s exponential decay */
  coinCollect(volume = 0.5) {
    try {
      const c = getCtx();
      const osc = c.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1047, c.currentTime);
      const g = c.createGain();
      g.gain.setValueAtTime(clamp(volume * 0.3, 0.001, 1), c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
      osc.connect(g);
      g.connect(getMaster());
      osc.start();
      osc.stop(c.currentTime + 0.27);
    } catch {}
  },

  /** Mega coin: coin + power-up together */
  megaCoinCollect(volume = 0.6) {
    SFX.coinCollect(volume);
    setTimeout(() => SFX.powerUp(volume * 0.5), 120);
  },

  /** Game over: dramatic descending [784, 659, 523, 392] Hz, triangle */
  gameOver(volume = 0.7) {
    [784, 659, 523, 392].forEach((freq, i) => {
      tone(freq, 0.4, volume * 0.35, "triangle", undefined, i * 400);
    });
    noiseBurst(0.6, volume * 0.2, 80, 1, "lowpass", 1600);
  },

  /** Hero hit: harsh electronic distortion */
  heroHit(volume = 0.5) {
    tone(150, 0.2, volume * 0.6, "sawtooth");
    setTimeout(() => tone(100, 0.15, volume * 0.4, "sawtooth"), 50);
    noiseBurst(0.1, volume * 0.3, 300, 3, "bandpass", 0);
  },

  /** Enemy die: layered noise impact */
  enemyDie(volume = 0.5) {
    noiseBurst(0.2, volume * 0.5, 400, 1);
    noiseBurst(0.15, volume * 0.35, 200, 1.5, "bandpass", 30);
    noiseBurst(0.12, volume * 0.25, 600, 2, "bandpass", 60);
  },

  /** Hound bite: medium thud */
  houndBite(volume = 0.5) {
    SFX.enemyHit(volume * 0.8);
  },

  /** Demon shoot: laser-like zap */
  demonShoot(volume = 0.4) {
    tone(800, 0.15, volume * 0.3, "triangle", 200);
    noiseBurst(0.06, volume * 0.15, 1200, 2);
  },

  /** Projectile hit: brief filtered noise */
  projectileHit(volume = 0.4) {
    noiseBurst(0.08, volume * 0.4, 400, 2);
  },

  /** Store purchase: ascending heal sweep */
  storePurchase(volume = 0.5) {
    tone(200, 0.4, volume * 0.2, "sine", 600);
    setTimeout(() => tone(300, 0.3, volume * 0.15, "sine", 800), 100);
  },

  /** Combat pulse: rhythmic bass hit */
  combatPulse(volume = 0.3) {
    tone(55, 0.15, volume * 0.5, "sawtooth");
    setTimeout(() => tone(55, 0.1, volume * 0.3, "sawtooth"), 200);
  },

  /** @deprecated kept for legacy callers */
  startAmbient(volume = 0.2): () => void {
    GameAudio.playTheme();
    GameAudio.setMasterVolume(volume + 0.4);
    return () => GameAudio.stopTheme();
  },
};

// ─── Main GameAudio singleton ─────────────────────────────────────────────────

export const GameAudio = {
  get isMuted() {
    return _muted;
  },

  init() {
    resumeAudio();
  },

  playTheme() {
    if (themeRunning) return;
    themeRunning = true;
    try {
      resumeAudio();
      scheduleThemeLoop(getCtx().currentTime + 0.05);
    } catch {}
  },

  stopTheme() {
    if (!themeRunning) return;
    themeRunning = false;
    try {
      // Fade out master before stopping nodes
      if (masterGain) {
        const c = getCtx();
        masterGain.gain.setTargetAtTime(
          _muted ? 0 : _masterVolume,
          c.currentTime,
          0.1,
        );
      }
      setTimeout(stopAllThemeNodes, 300);
    } catch {
      stopAllThemeNodes();
    }
  },

  /**
   * Play a named SFX.
   * sfxName: 'attack' | 'hit' | 'coin' | 'heal' | 'spawn' | 'wave' | 'damage'
   */
  play(sfxName: string, vol = 0.5) {
    if (_muted) return;
    const v = clamp(vol, 0, 1);
    switch (sfxName) {
      case "attack":
        SFX.heroAttack(v);
        break;
      case "hit":
        SFX.enemyDie(v);
        break;
      case "coin":
        SFX.coinCollect(v);
        break;
      case "heal":
        SFX.storePurchase(v);
        break;
      case "spawn":
        noiseBurst(0.3, v * 0.4, 600, 0.8);
        tone(800, 0.3, v * 0.2, "sine", 100);
        break;
      case "wave":
        SFX.waveStart(v);
        break;
      case "damage":
        SFX.heroHit(v);
        break;
      default:
        break;
    }
  },

  setMasterVolume(v: number) {
    _masterVolume = clamp(v, 0, 1);
    try {
      const m = getMaster();
      m.gain.setTargetAtTime(_masterVolume, getCtx().currentTime, 0.05);
    } catch {}
  },

  toggleMute() {
    _muted = !_muted;
    try {
      const m = getMaster();
      const c = getCtx();
      m.gain.setTargetAtTime(_muted ? 0 : _masterVolume, c.currentTime, 0.05);
    } catch {}
    return _muted;
  },
};
