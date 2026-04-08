/**
 * Web Audio API synthesizer — no external libraries.
 * Synthesizes all game sounds procedurally with master gain control.
 */

let ctx: AudioContext | null = null;
let masterGainNode: GainNode | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function getMaster(): GainNode {
  const c = getCtx();
  if (!masterGainNode) {
    masterGainNode = c.createGain();
    masterGainNode.gain.value = 0.7;
    masterGainNode.connect(c.destination);
  }
  return masterGainNode;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function resumeAudio() {
  try {
    const c = getCtx();
    if (c.state === "suspended") c.resume();
  } catch {}
}

/** Set master volume 0..1 */
export function setMasterVolume(v: number) {
  try {
    const m = getMaster();
    m.gain.setTargetAtTime(clamp(v, 0, 1), getCtx().currentTime, 0.05);
  } catch {}
}

/** Generic noise burst through master gain */
function noiseBurst(
  duration: number,
  volume: number,
  lowFreq: number,
  highFreq: number,
) {
  try {
    const c = getCtx();
    const bufSize = c.sampleRate * duration;
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = (lowFreq + highFreq) / 2;
    filter.Q.value = 1;
    const gain = c.createGain();
    gain.gain.value = clamp(volume, 0, 1);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(getMaster());
    src.start();
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    src.stop(c.currentTime + duration);
  } catch {}
}

/** Tone beep through master gain */
function beep(
  freq: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    gain.gain.setValueAtTime(clamp(volume, 0, 1), c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(getMaster());
    osc.start();
    osc.stop(c.currentTime + duration);
  } catch {}
}

export const SFX = {
  coinCollect(volume = 0.5) {
    beep(880, 0.05, volume * 0.6, "sine");
    setTimeout(() => beep(1320, 0.1, volume * 0.4, "sine"), 50);
  },

  megaCoinCollect(volume = 0.6) {
    // Triumphant ascending chord
    const freqs = [523, 659, 784, 1047];
    freqs.forEach((f, i) => {
      setTimeout(() => beep(f, 0.3, volume * 0.45, "sine"), i * 60);
    });
    setTimeout(() => noiseBurst(0.2, volume * 0.2, 800, 3000), 240);
  },

  heroAttack(volume = 0.5) {
    // Metallic strike
    noiseBurst(0.08, volume * 0.5, 600, 3000);
    beep(180, 0.08, volume * 0.35, "sawtooth");
    setTimeout(() => beep(90, 0.12, volume * 0.2, "square"), 40);
  },

  heroHit(volume = 0.5) {
    // Damage warning buzz
    noiseBurst(0.15, volume * 0.6, 80, 300);
    beep(130, 0.12, volume * 0.45, "square");
    setTimeout(() => beep(90, 0.1, volume * 0.3, "square"), 60);
  },

  enemyDie(volume = 0.5) {
    noiseBurst(0.25, volume * 0.5, 100, 600);
    beep(150, 0.18, volume * 0.3, "sawtooth");
    setTimeout(() => beep(80, 0.22, volume * 0.3, "square"), 100);
  },

  houndBite(volume = 0.5) {
    // Snap + growl
    noiseBurst(0.1, volume * 0.55, 300, 1500);
    beep(160, 0.08, volume * 0.3, "square");
  },

  demonShoot(volume = 0.4) {
    beep(440, 0.04, volume * 0.4, "sawtooth");
    setTimeout(() => beep(220, 0.08, volume * 0.3, "sawtooth"), 35);
  },

  projectileHit(volume = 0.4) {
    noiseBurst(0.08, volume * 0.4, 400, 2000);
  },

  waveStart(volume = 0.6) {
    // Ascending fanfare
    const freqs = [220, 277, 330, 440, 554, 660];
    freqs.forEach((f, i) => {
      setTimeout(() => beep(f, 0.35, volume * 0.38, "sine"), i * 70);
    });
  },

  gameOver(volume = 0.7) {
    // Descending grim chord
    const freqs = [440, 370, 310, 220, 165];
    freqs.forEach((f, i) => {
      setTimeout(() => beep(f, 0.45, volume * 0.48, "sine"), i * 200);
    });
    setTimeout(() => noiseBurst(0.6, volume * 0.25, 40, 200), 900);
  },

  storePurchase(volume = 0.5) {
    beep(523, 0.06, volume * 0.4, "sine");
    setTimeout(() => beep(659, 0.06, volume * 0.4, "sine"), 60);
    setTimeout(() => beep(784, 0.12, volume * 0.5, "sine"), 120);
  },

  /** Combat bass pulse for intense moments */
  combatPulse(volume = 0.3) {
    beep(55, 0.15, volume * 0.5, "sawtooth");
    setTimeout(() => beep(55, 0.1, volume * 0.3, "sawtooth"), 200);
  },

  /** Continuous ambient horror loop — returns stop function */
  startAmbient(volume = 0.2): () => void {
    let running = true;

    // Wind drone — low continuous oscillation
    let droneStop: (() => void) | null = null;
    try {
      const c = getCtx();
      const osc1 = c.createOscillator();
      const osc2 = c.createOscillator();
      const droneGain = c.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(55, c.currentTime);
      osc1.frequency.setTargetAtTime(58, c.currentTime + 2, 3);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(82, c.currentTime);
      osc2.frequency.setTargetAtTime(79, c.currentTime + 3, 4);
      droneGain.gain.value = volume * 0.18;
      osc1.connect(droneGain);
      osc2.connect(droneGain);
      droneGain.connect(getMaster());
      osc1.start();
      osc2.start();
      droneStop = () => {
        try {
          osc1.stop();
        } catch {}
        try {
          osc2.stop();
        } catch {}
      };
    } catch {}

    // Fire crackle loop
    const playLoop = () => {
      if (!running) return;
      noiseBurst(0.35, volume * 0.25, 60, 280);
      setTimeout(playLoop, 250 + Math.random() * 450);
    };
    playLoop();

    // Distant thunder / bass rumble
    const rumbleLoop = () => {
      if (!running) return;
      noiseBurst(0.5, volume * 0.15, 20, 80);
      setTimeout(rumbleLoop, 3000 + Math.random() * 5000);
    };
    setTimeout(rumbleLoop, 1000);

    return () => {
      running = false;
      droneStop?.();
    };
  },
};
