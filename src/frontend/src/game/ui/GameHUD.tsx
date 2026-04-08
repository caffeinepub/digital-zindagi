import {
  ArrowLeft,
  Pause,
  Play,
  Store,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "../../lib/router";
import { useGameStore } from "../stores/gameStore";
import { GameAudio } from "../utils/audioEngine";
import Leaderboard from "./Leaderboard";
import PauseMenu from "./PauseMenu";
import StoreModal from "./StoreModal";

function HpBar({
  pct,
  width = 96,
  height = 8,
  color,
}: {
  pct: number;
  width?: number;
  height?: number;
  color: string;
}) {
  return (
    <div
      className="rounded-full overflow-hidden"
      style={{
        width,
        height,
        background: "rgba(0,0,0,0.6)",
        border: "1px solid rgba(240,192,64,0.3)",
      }}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${Math.max(0, Math.min(100, pct))}%`,
          background: color,
        }}
      />
    </div>
  );
}

const WEAPON_ICONS: Record<string, string> = {
  rifle: "🔫",
  shotgun: "💥",
  plasma: "⚡",
};
const WEAPON_NAMES: Record<string, string> = {
  rifle: "Assault Rifle",
  shotgun: "Shotgun",
  plasma: "Plasma Gun",
};
const WEAPON_COOLDOWN_MS: Record<string, number> = {
  rifle: 1200,
  shotgun: 2000,
  plasma: 1500,
};

export default function GameHUD() {
  const {
    heroHP,
    heroMaxHP,
    partnerHP,
    partnerMaxHP,
    score,
    waveCount,
    coins,
    gamePhase,
    heroFace,
    currentWeapon,
    setGamePhase,
    setLeaderboardVisible,
    leaderboardVisible,
  } = useGameStore();

  const [storeOpen, setStoreOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cooldownPct, setCooldownPct] = useState(1);
  const cooldownRef = useRef<number>(0);
  const lastAttackRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  // Track attack cooldown progress
  useEffect(() => {
    const cooldownMs = WEAPON_COOLDOWN_MS[currentWeapon] ?? 1200;

    // Listen for attack events via localStorage polling (simple bridge)
    const tick = () => {
      const now = Date.now();
      const elapsed = now - lastAttackRef.current;
      const pct = Math.min(1, elapsed / cooldownMs);
      cooldownRef.current = pct;
      setCooldownPct(pct);
      rafRef.current = requestAnimationFrame(tick);
    };

    // Detect attack via custom event from Hero
    const onAttack = () => {
      lastAttackRef.current = Date.now();
    };
    window.addEventListener("dz_hero_attack", onAttack);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("dz_hero_attack", onAttack);
      cancelAnimationFrame(rafRef.current);
    };
  }, [currentWeapon]);

  const handlePause = useCallback(() => {
    setGamePhase(gamePhase === "playing" ? "paused" : "playing");
  }, [gamePhase, setGamePhase]);

  const handleToggleMute = useCallback(() => {
    const nowMuted = GameAudio.toggleMute();
    setMuted(nowMuted);
  }, []);

  const handleOpenLeaderboard = useCallback(() => {
    setLeaderboardVisible(true);
    if (gamePhase === "playing") setGamePhase("paused");
  }, [setLeaderboardVisible, gamePhase, setGamePhase]);

  const hpPct = (heroHP / heroMaxHP) * 100;
  const p0Pct = (partnerHP[0] / partnerMaxHP) * 100;
  const p1Pct = (partnerHP[1] / partnerMaxHP) * 100;
  const hpColor = hpPct > 50 ? "#00ff44" : hpPct > 25 ? "#ffaa00" : "#ff2200";

  if (gamePhase !== "playing" && gamePhase !== "paused") return null;

  return (
    <>
      {/* ── Top-left: Hero HP + Score ── */}
      <div
        className="absolute top-2 left-2 z-10 flex flex-col gap-1"
        data-ocid="hud-hero-hp"
      >
        <div className="game-hud-bg rounded-xl px-3 py-2 flex items-center gap-2">
          {heroFace ? (
            <img
              src={heroFace}
              alt="Hero"
              className="w-9 h-9 rounded-full object-cover"
              style={{ border: "2px solid #f0c040" }}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: "#064420",
                border: "2px solid #f0c040",
                color: "#f0c040",
              }}
            >
              DZ
            </div>
          )}
          <div>
            <div className="text-xs mb-0.5" style={{ color: "#aaa" }}>
              HP
            </div>
            <HpBar pct={hpPct} width={96} height={8} color={hpColor} />
            <div
              className="text-xs mt-0.5 font-bold"
              style={{ color: hpColor }}
            >
              {heroHP}/{heroMaxHP}
            </div>
          </div>
        </div>

        <div className="game-hud-bg rounded-xl px-3 py-1.5 text-center">
          <div className="text-xs opacity-50" style={{ color: "#aaa" }}>
            Score
          </div>
          <div
            className="text-lg font-bold leading-tight"
            style={{ color: "#f0c040" }}
          >
            {score.toLocaleString()}
          </div>
        </div>
      </div>

      {/* ── Top-center: Pause button ── */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
        <button
          type="button"
          onClick={handlePause}
          className="game-hud-bg rounded-xl px-3 py-2.5 flex items-center justify-center"
          style={{ color: "#f0c040", minWidth: 44, minHeight: 44 }}
          aria-label="Pause game"
          data-ocid="hud-pause-btn"
        >
          {gamePhase === "playing" ? <Pause size={18} /> : <Play size={18} />}
        </button>
      </div>

      {/* ── Top-right: Wave + Coins + Mute + Leaderboard ── */}
      <div
        className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end"
        data-ocid="hud-wave-coins"
      >
        {/* Mute + Leaderboard row */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleOpenLeaderboard}
            className="game-hud-bg rounded-xl p-2 flex items-center justify-center transition-all hover:bg-white/10"
            style={{ color: "#f0c040", minWidth: 36, minHeight: 36 }}
            aria-label="View leaderboard"
            data-ocid="hud-leaderboard-btn"
          >
            <Trophy size={16} />
          </button>
          <button
            type="button"
            onClick={handleToggleMute}
            className="game-hud-bg rounded-xl p-2 flex items-center justify-center transition-all hover:bg-white/10"
            style={{
              color: muted ? "#555" : "#f0c040",
              minWidth: 36,
              minHeight: 36,
            }}
            aria-label={muted ? "Unmute" : "Mute"}
            data-ocid="hud-mute-btn"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>

        <div className="game-hud-bg rounded-xl px-3 py-1.5 flex items-center gap-1.5">
          <span>🌊</span>
          <div>
            <div className="text-xs opacity-50" style={{ color: "#aaa" }}>
              Wave
            </div>
            <div
              className="text-base font-bold leading-tight"
              style={{ color: "#00ff88" }}
            >
              #{waveCount}
            </div>
          </div>
        </div>
        <div className="game-hud-bg rounded-xl px-3 py-1.5 flex items-center gap-1.5">
          <span>🪙</span>
          <span className="font-bold" style={{ color: "#f0c040" }}>
            {coins}
          </span>
        </div>
      </div>

      {/* ── Bottom-left: Partner HP bars ── */}
      <div
        className="absolute bottom-36 left-2 z-10 flex flex-col gap-1 md:bottom-4"
        data-ocid="hud-partner-hp"
      >
        <div className="game-hud-bg rounded-lg px-2 py-1.5">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs" style={{ color: "#4488ff" }}>
              ⚔ Warrior
            </span>
          </div>
          <HpBar pct={p0Pct} width={60} height={5} color="#4488ff" />
        </div>
        <div className="game-hud-bg rounded-lg px-2 py-1.5">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs" style={{ color: "#aa44ff" }}>
              🔮 Mage
            </span>
          </div>
          <HpBar pct={p1Pct} width={60} height={5} color="#aa44ff" />
        </div>

        {/* Weapon display */}
        <div
          className="game-hud-bg rounded-lg px-2 py-1.5"
          data-ocid="hud-weapon-display"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-base">{WEAPON_ICONS[currentWeapon]}</span>
            <span
              className="text-xs font-semibold truncate"
              style={{ color: "#f0c040", maxWidth: 64 }}
            >
              {WEAPON_NAMES[currentWeapon]}
            </span>
          </div>
          {/* Cooldown bar */}
          <div
            className="mt-1 rounded-full overflow-hidden"
            style={{
              width: 72,
              height: 4,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,200,0,0.2)",
            }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${cooldownPct * 100}%`,
                background:
                  cooldownPct < 0.5
                    ? "#ff6600"
                    : cooldownPct < 0.8
                      ? "#ffaa00"
                      : "#f0c040",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Bottom-right: Store button + Back ── */}
      <div
        className="absolute bottom-36 right-2 z-10 flex flex-col gap-2 items-end md:bottom-4"
        data-ocid="hud-store"
      >
        <button
          type="button"
          onClick={() => {
            setStoreOpen(true);
            setGamePhase("paused");
          }}
          className="game-cta-gold flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-sm"
          style={{ minHeight: 44 }}
          data-ocid="hud-store-btn"
        >
          <Store size={16} />
          दुकान
        </button>
        <Link
          to="/"
          className="game-hud-bg rounded-xl px-3 py-2 flex items-center justify-center"
          style={{ color: "#f0c040", minHeight: 44 }}
          aria-label="Go home"
        >
          <ArrowLeft size={16} />
        </Link>
      </div>

      {/* ── Store Modal ── */}
      <AnimatePresence>
        {storeOpen && (
          <StoreModal
            onClose={() => {
              setStoreOpen(false);
              setGamePhase("playing");
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Pause Menu ── */}
      <AnimatePresence>
        {gamePhase === "paused" && !storeOpen && !leaderboardVisible && (
          <PauseMenu />
        )}
      </AnimatePresence>

      {/* ── Leaderboard ── */}
      <AnimatePresence>
        {leaderboardVisible && (
          <Leaderboard
            onClose={() => {
              setLeaderboardVisible(false);
              if (gamePhase === "paused") setGamePhase("playing");
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
