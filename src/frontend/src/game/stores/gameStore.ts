import { create } from "zustand";

export type GamePhase = "start" | "playing" | "paused" | "gameover";

export interface Enemy {
  id: string;
  type: "hound" | "demon";
  position: [number, number, number];
  hp: number;
  maxHp: number;
  state: "idle" | "chase" | "attack" | "retreat" | "dead";
}

export interface Coin {
  id: string;
  position: [number, number, number];
  type: "normal" | "mega";
  collected: boolean;
}

export interface GameState {
  heroHP: number;
  heroMaxHP: number;
  partnerHP: [number, number];
  partnerMaxHP: number;
  score: number;
  waveCount: number;
  coins: number;
  gamePhase: GamePhase;
  heroFace: string | null;
  volume: number;

  // Actions
  setHeroHP: (hp: number) => void;
  damageHero: (dmg: number) => void;
  healHero: (amt: number) => void;
  setPartnerHP: (index: 0 | 1, hp: number) => void;
  damagePartner: (index: 0 | 1, dmg: number) => void;
  addScore: (pts: number) => void;
  addCoins: (n: number) => void;
  setGamePhase: (phase: GamePhase) => void;
  setHeroFace: (face: string | null) => void;
  setVolume: (v: number) => void;
  nextWave: () => void;
  resetGame: () => void;
}

const STORAGE_HIGH_SCORE = "dz_game_high_score";
const STORAGE_HERO_FACE = "dz_game_hero_face";
const STORAGE_COINS = "dz_game_coins_session";
const STORAGE_VOLUME = "dz_game_volume";

function loadInitial() {
  return {
    heroHP: 100,
    heroMaxHP: 100,
    partnerHP: [80, 80] as [number, number],
    partnerMaxHP: 80,
    score: 0,
    waveCount: 1,
    coins: Number(localStorage.getItem(STORAGE_COINS) || "0"),
    gamePhase: "start" as GamePhase,
    heroFace: localStorage.getItem(STORAGE_HERO_FACE),
    volume: Number(localStorage.getItem(STORAGE_VOLUME) || "0.7"),
  };
}

export const useGameStore = create<GameState>((set) => ({
  ...loadInitial(),

  setHeroHP: (hp) => set({ heroHP: Math.max(0, Math.min(100, hp)) }),

  damageHero: (dmg) =>
    set((s) => {
      const heroHP = Math.max(0, s.heroHP - dmg);
      if (heroHP === 0 && s.gamePhase === "playing") {
        const best = Number(localStorage.getItem(STORAGE_HIGH_SCORE) || "0");
        if (s.score > best)
          localStorage.setItem(STORAGE_HIGH_SCORE, String(s.score));
        return { heroHP, gamePhase: "gameover" };
      }
      return { heroHP };
    }),

  healHero: (amt) =>
    set((s) => ({ heroHP: Math.min(s.heroMaxHP, s.heroHP + amt) })),

  setPartnerHP: (index, hp) =>
    set((s) => {
      const ph: [number, number] = [...s.partnerHP] as [number, number];
      ph[index] = Math.max(0, Math.min(s.partnerMaxHP, hp));
      return { partnerHP: ph };
    }),

  damagePartner: (index, dmg) =>
    set((s) => {
      const ph: [number, number] = [...s.partnerHP] as [number, number];
      ph[index] = Math.max(0, ph[index] - dmg);
      return { partnerHP: ph };
    }),

  addScore: (pts) =>
    set((s) => {
      const score = s.score + pts;
      const best = Number(localStorage.getItem(STORAGE_HIGH_SCORE) || "0");
      if (score > best) localStorage.setItem(STORAGE_HIGH_SCORE, String(score));
      return { score };
    }),

  addCoins: (n) =>
    set((s) => {
      const coins = s.coins + n;
      localStorage.setItem(STORAGE_COINS, String(coins));
      return { coins };
    }),

  setGamePhase: (gamePhase) => set({ gamePhase }),

  setHeroFace: (heroFace) => {
    if (heroFace) localStorage.setItem(STORAGE_HERO_FACE, heroFace);
    else localStorage.removeItem(STORAGE_HERO_FACE);
    set({ heroFace });
  },

  setVolume: (volume) => {
    localStorage.setItem(STORAGE_VOLUME, String(volume));
    set({ volume });
  },

  nextWave: () =>
    set((s) => ({
      waveCount: s.waveCount + 1,
      heroHP: Math.min(s.heroMaxHP, s.heroHP + 30),
    })),

  resetGame: () =>
    set({
      heroHP: 100,
      partnerHP: [80, 80],
      score: 0,
      waveCount: 1,
      gamePhase: "playing",
    }),
}));

export function getHighScore(): number {
  return Number(localStorage.getItem(STORAGE_HIGH_SCORE) || "0");
}
