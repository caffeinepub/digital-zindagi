import { ArrowLeft, Pause, Play, Store } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { Link } from "../../lib/router";
import { getHighScore, useGameStore } from "../stores/gameStore";
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
    setGamePhase,
  } = useGameStore();

  const [storeOpen, setStoreOpen] = useState(false);

  const handlePause = useCallback(() => {
    setGamePhase(gamePhase === "playing" ? "paused" : "playing");
  }, [gamePhase, setGamePhase]);

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

      {/* ── Top-right: Wave + Coins ── */}
      <div
        className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end"
        data-ocid="hud-wave-coins"
      >
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
        {gamePhase === "paused" && !storeOpen && <PauseMenu />}
      </AnimatePresence>
    </>
  );
}
