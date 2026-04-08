/**
 * Digital Zindagi — Professional Multi-Channel Web Audio Engine
 * No external files. All sounds synthesized via Web Audio API.
 * Singleton GameAudio with theme music, professional SFX, master volume, mute.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let _muted = false;
let _masterVolume = 0.75;

// Theme oscillators (kept alive while playing)
let themeOsc1: OscillatorNode | null = null;
let themeOsc2: OscillatorNode | null = null;
let themeOsc3: OscillatorNode | null = null;
let themeGain: GainNode | null = null;
let themeFilter: BiquadFilterNode | null = null;
let themeRunning = false;

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

/** Resume AudioContext (must be called from user gesture) */
export function resumeAudio() {
  try {
    const c = getCtx();
    if (c.state === "suspended") void c.resume();
  } catch {}
}

/** Legacy compat — master volume setter */
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
) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    if (freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(freqEnd, 10),
        c.currentTime + duration,
      );
    }
    g.gain.setValueAtTime(clamp(vol, 0.001, 1), c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(g);
    g.connect(getMaster());
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration + 0.02);
  } catch {}
}

function noiseBurst(
  duration: number,
  vol: number,
  centerFreq: number,
  q = 1.5,
) {
  try {
    const c = getCtx();
    const bufSize = Math.ceil(c.sampleRate * duration);
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = centerFreq;
    filter.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(clamp(vol, 0.001, 1), c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(getMaster());
    src.start();
    src.stop(c.currentTime + duration + 0.02);
  } catch {}
}

// ─── Theme Music ──────────────────────────────────────────────────────────────

function buildTheme() {
  try {
    const c = getCtx();
    // Global low-pass filter for all theme oscillators
    themeFilter = c.createBiquadFilter();
    themeFilter.type = "lowpass";
    themeFilter.frequency.value = 800;
    themeFilter.Q.value = 0.8;

    themeGain = c.createGain();
    themeGain.gain.value = 0.22;
    themeFilter.connect(themeGain);
    themeGain.connect(getMaster());

    // Bass — sine 80 Hz with slow drift
    themeOsc1 = c.createOscillator();
    themeOsc1.type = "sine";
    themeOsc1.frequency.setValueAtTime(80, c.currentTime);
    themeOsc1.frequency.setTargetAtTime(84, c.currentTime + 2, 4);
    themeOsc1.connect(themeFilter);
    themeOsc1.start();

    // Melody — triangle 440 Hz with subtle vibrato envelope
    themeOsc2 = c.createOscillator();
    themeOsc2.type = "triangle";
    themeOsc2.frequency.setValueAtTime(440, c.currentTime);
    themeOsc2.frequency.setTargetAtTime(494, c.currentTime + 1.5, 2);
    themeOsc2.frequency.setTargetAtTime(440, c.currentTime + 4, 2);
    themeOsc2.connect(themeFilter);
    themeOsc2.start();

    // Harmony — sawtooth 523 Hz (C5) filtered
    themeOsc3 = c.createOscillator();
    themeOsc3.type = "sawtooth";
    themeOsc3.frequency.setValueAtTime(523, c.currentTime);
    themeOsc3.frequency.setTargetAtTime(494, c.currentTime + 3, 3);
    themeOsc3.connect(themeFilter);
    themeOsc3.start();
  } catch {}
}

function stopThemeNodes() {
  for (const osc of [themeOsc1, themeOsc2, themeOsc3]) {
    try {
      osc?.stop();
    } catch {}
  }
  themeOsc1 = themeOsc2 = themeOsc3 = null;
  themeFilter = null;
  themeGain = null;
}

// ─── Ambient loop (legacy compat kept for GamePage.tsx) ───────────────────────

export const SFX = {
  /** @deprecated use GameAudio.playTheme() */
  startAmbient(volume = 0.2): () => void {
    GameAudio.playTheme();
    GameAudio.setMasterVolume(volume + 0.4);
    return () => GameAudio.stopTheme();
  },

  coinCollect(volume = 0.5) {
    GameAudio.play("coin", volume);
  },
  megaCoinCollect(volume = 0.6) {
    GameAudio.play("coin", volume);
    setTimeout(() => GameAudio.play("wave", volume * 0.5), 120);
  },
  heroAttack(volume = 0.5) {
    GameAudio.play("attack", volume);
  },
  heroHit(volume = 0.5) {
    GameAudio.play("damage", volume);
  },
  enemyDie(volume = 0.5) {
    GameAudio.play("hit", volume);
    setTimeout(() => noiseBurst(0.2, volume * 0.3, 150), 80);
  },
  houndBite(volume = 0.5) {
    GameAudio.play("hit", volume * 0.8);
  },
  demonShoot(volume = 0.4) {
    GameAudio.play("attack", volume * 0.7);
  },
  projectileHit(volume = 0.4) {
    noiseBurst(0.08, volume * 0.4, 400);
  },
  waveStart(volume = 0.6) {
    GameAudio.play("wave", volume);
  },
  gameOver(volume = 0.7) {
    const freqs = [440, 370, 310, 220, 165];
    freqs.forEach((f, i) => {
      setTimeout(() => tone(f, 0.45, volume * 0.48, "sine"), i * 200);
    });
    setTimeout(() => noiseBurst(0.6, volume * 0.25, 80), 900);
  },
  storePurchase(volume = 0.5) {
    GameAudio.play("heal", volume);
  },
  combatPulse(volume = 0.3) {
    tone(55, 0.15, volume * 0.5, "sawtooth");
    setTimeout(() => tone(55, 0.1, volume * 0.3, "sawtooth"), 200);
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
      buildTheme();
    } catch {}
  },

  stopTheme() {
    if (!themeRunning) return;
    themeRunning = false;
    try {
      const c = getCtx();
      if (themeGain) {
        themeGain.gain.setTargetAtTime(0.001, c.currentTime, 0.3);
      }
      setTimeout(stopThemeNodes, 500);
    } catch {
      stopThemeNodes();
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
        // Sharp laser zap — freq sweep 800→200Hz, triangle
        tone(800, 0.15, v * 0.3, "triangle", 200);
        noiseBurst(0.06, v * 0.15, 1200, 2);
        break;

      case "hit":
        // Heavy impact — 3 layered noise bursts
        noiseBurst(0.2, v * 0.5, 400, 1);
        setTimeout(() => noiseBurst(0.15, v * 0.35, 200, 1.5), 30);
        setTimeout(() => noiseBurst(0.12, v * 0.25, 600, 2), 60);
        break;

      case "coin":
        // Melodic chime — D4→F#4→A4→D5
        tone(293.66, 0.08, v * 0.25, "sine"); // D4
        setTimeout(() => tone(369.99, 0.08, v * 0.25, "sine"), 80); // F#4
        setTimeout(() => tone(440, 0.08, v * 0.25, "sine"), 160); // A4
        setTimeout(() => tone(587.33, 0.12, v * 0.3, "sine"), 240); // D5
        break;

      case "heal":
        // Ascending sweep 200→600Hz
        tone(200, 0.4, v * 0.2, "sine", 600);
        setTimeout(() => tone(300, 0.3, v * 0.15, "sine", 800), 100);
        break;

      case "spawn":
        // Whoosh — filtered noise + freq sweep
        noiseBurst(0.3, v * 0.4, 600, 0.8);
        tone(800, 0.3, v * 0.2, "sine", 100);
        break;

      case "wave":
        // Triumphant fanfare — E4→G4→C5
        tone(329.63, 0.15, v * 0.38, "sine"); // E4
        setTimeout(() => tone(392, 0.15, v * 0.38, "sine"), 150); // G4
        setTimeout(() => tone(523.25, 0.25, v * 0.45, "sine"), 300); // C5
        // Minor reverb — decaying echo
        setTimeout(() => tone(523.25, 0.2, v * 0.15, "sine"), 450);
        break;

      case "damage":
        // Harsh electronic distortion — 150Hz sawtooth
        tone(150, 0.2, v * 0.6, "sawtooth");
        setTimeout(() => tone(100, 0.15, v * 0.4, "sawtooth"), 50);
        noiseBurst(0.1, v * 0.3, 300, 3);
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
