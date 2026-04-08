import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameEngine } from "../game/GameEngine";
import { GameAudio, SFX, resumeAudio } from "../game/audio/AudioEngine";
import { WEAPONS, getHighScore, useGameStore } from "../game/stores/gameStore";
import type { WeaponType } from "../game/stores/gameStore";
import Leaderboard from "../game/ui/Leaderboard";
import StoreModal from "../game/ui/StoreModal";
import {
  addScore as addLeaderboardScore,
  isHighScore,
} from "../game/utils/leaderboard";
import type { LeaderboardEntry } from "../game/utils/leaderboard";
import { useNavigate } from "../lib/router";

// ─── HUD Overlay ───────────────────────────────────────────────────────────────
function GameHUD({ onExit }: { onExit: () => void }) {
  const {
    heroHP,
    heroMaxHP,
    currentLevel,
    currentWave,
    enemiesRemaining,
    score,
    coins,
    currentWeapon,
    ammo,
  } = useGameStore();
  const hpFrac = Math.max(0, heroHP / heroMaxHP);
  const hpColor =
    hpFrac > 0.6 ? "#22dd55" : hpFrac > 0.3 ? "#ffaa00" : "#ff3300";
  const weapon = WEAPONS[currentWeapon];
  const ammoCount = ammo[currentWeapon];
  return (
    <div
      className="absolute top-0 left-0 right-0 z-10 flex items-start justify-between px-3 pt-2 pointer-events-none"
      data-ocid="game-hud"
    >
      {/* HP */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">❤️</span>
          <div
            className="relative rounded-full overflow-hidden"
            style={{
              width: 100,
              height: 8,
              background: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <div
              className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-200"
              style={{ width: `${hpFrac * 100}%`, background: hpColor }}
            />
          </div>
          <span
            className="text-xs font-bold tabular-nums"
            style={{ color: hpColor }}
          >
            {heroHP}
          </span>
        </div>
        {/* Weapon + ammo */}
        <div
          className="text-xs px-2 py-0.5 rounded-lg"
          style={{ background: "rgba(0,0,0,0.5)", color: weapon.color }}
        >
          {currentWeapon === "pistol"
            ? "🔫"
            : currentWeapon === "rifle"
              ? "🪖"
              : currentWeapon === "shotgun"
                ? "💥"
                : currentWeapon === "plasma"
                  ? "⚡"
                  : "🔥"}{" "}
          {weapon.name} · {ammoCount === -1 ? "∞" : ammoCount}
        </div>
      </div>
      {/* Level/Wave */}
      <div
        className="flex flex-col items-center px-3 py-1 rounded-xl"
        style={{
          background: "rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,80,0,0.3)",
        }}
      >
        <span className="text-xs font-black" style={{ color: "#ff6600" }}>
          LVL {currentLevel}
        </span>
        <span className="text-xs" style={{ color: "#ff8844" }}>
          Wave {currentWave}/3
        </span>
        <span className="text-xs opacity-70" style={{ color: "#aaa" }}>
          {enemiesRemaining} left
        </span>
      </div>
      {/* Score + Coins + Exit */}
      <div className="flex flex-col items-end gap-0.5 pointer-events-auto">
        <div
          className="px-3 py-1 rounded-xl"
          style={{
            background: "rgba(0,0,0,0.55)",
            border: "1px solid rgba(255,200,0,0.2)",
          }}
        >
          <div
            className="text-sm font-black tabular-nums"
            style={{ color: "#f0c040" }}
          >
            {score.toLocaleString()}
          </div>
          <div className="text-xs" style={{ color: "#ffa800" }}>
            🪙 {coins}
          </div>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="text-xs px-2 py-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#fff",
          }}
          data-ocid="game-exit-btn"
        >
          ✕ Exit
        </button>
      </div>
    </div>
  );
}

// ─── Virtual Joystick ──────────────────────────────────────────────────────────
function VirtualJoystick({
  onMove,
  onEnd,
}: { onMove: (x: number, y: number) => void; onEnd: () => void }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const touchId = useRef<number | null>(null);
  const baseCenter = useRef({ x: 0, y: 0 });
  const R = 44;

  const onStart = useCallback((e: React.TouchEvent) => {
    if (touchId.current !== null) return;
    const t = e.changedTouches[0];
    touchId.current = t.identifier;
    const rect = baseRef.current?.getBoundingClientRect();
    if (rect)
      baseCenter.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
  }, []);

  const onMv = useCallback(
    (e: React.TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier !== touchId.current) continue;
        const dx = t.clientX - baseCenter.current.x;
        const dy = t.clientY - baseCenter.current.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const cx = d > R ? (dx / d) * R : dx;
        const cy = d > R ? (dy / d) * R : dy;
        if (stickRef.current)
          stickRef.current.style.transform = `translate(${cx}px,${cy}px)`;
        onMove(cx / R, cy / R);
      }
    },
    [onMove],
  );

  const onEnd2 = useCallback(
    (e: React.TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier !== touchId.current) continue;
        touchId.current = null;
        if (stickRef.current)
          stickRef.current.style.transform = "translate(0,0)";
        onEnd();
      }
    },
    [onEnd],
  );

  return (
    <div
      className="absolute bottom-8 left-8 z-10"
      style={{ touchAction: "none" }}
      data-ocid="game-joystick"
    >
      <div
        ref={baseRef}
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: 96,
          height: 96,
          background: "rgba(255,80,0,0.08)",
          border: "2px solid rgba(255,80,0,0.35)",
        }}
        onTouchStart={onStart}
        onTouchMove={onMv}
        onTouchEnd={onEnd2}
        onTouchCancel={onEnd2}
      >
        <div
          ref={stickRef}
          className="rounded-full"
          style={{
            width: 42,
            height: 42,
            background: "rgba(255,80,0,0.55)",
            border: "2px solid rgba(255,80,0,0.85)",
            boxShadow: "0 0 12px rgba(255,80,0,0.4)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Fire Button ───────────────────────────────────────────────────────────────
function FireButton({
  onFire,
  onRelease,
}: { onFire: () => void; onRelease: () => void }) {
  return (
    <button
      type="button"
      className="absolute bottom-8 right-8 z-10 rounded-full font-black text-3xl flex items-center justify-center active:scale-90 transition-transform select-none"
      style={{
        width: 84,
        height: 84,
        background: "rgba(255,40,40,0.9)",
        border: "3px solid rgba(255,100,100,0.85)",
        boxShadow: "0 0 24px rgba(255,50,50,0.6)",
        color: "#fff",
        touchAction: "none",
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        onFire();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onRelease();
      }}
      onMouseDown={onFire}
      onMouseUp={onRelease}
      data-ocid="game-fire-btn"
      aria-label="Fire"
    >
      🔥
    </button>
  );
}

// ─── Wave Announcement ─────────────────────────────────────────────────────────
function WaveAnnouncement() {
  const { currentLevel, currentWave, gamePhase } = useGameStore();
  const [visible, setVisible] = useState(false);
  const prevWave = useRef(currentWave);

  useEffect(() => {
    if (gamePhase !== "playing") return;
    if (currentWave !== prevWave.current) {
      prevWave.current = currentWave;
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 2200);
      return () => clearTimeout(t);
    }
  }, [currentWave, gamePhase]);

  useEffect(() => {
    if (gamePhase === "playing") {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 2200);
      return () => clearTimeout(t);
    }
  }, [gamePhase]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
        >
          <div
            className="px-8 py-4 rounded-2xl text-center"
            style={{
              background: "rgba(0,5,0,0.88)",
              border: "2px solid rgba(255,80,0,0.5)",
              boxShadow: "0 0 32px rgba(255,80,0,0.25)",
            }}
          >
            <div
              className="text-3xl font-black"
              style={{ color: "#ff6600", textShadow: "0 0 16px #ff4400" }}
            >
              ⚔️ Level {currentLevel} — Wave {currentWave}
            </div>
            <div className="text-sm mt-1" style={{ color: "#aaa" }}>
              {currentLevel >= 12 && currentWave === 3
                ? "FINAL BOSS! 🔥"
                : currentWave === 1
                  ? "Aage bado — creatures aane wale hain!"
                  : `Wave ${currentWave} — Aur bhi khatarnak!`}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Start Screen ──────────────────────────────────────────────────────────────
function StartScreen({
  onStart,
  onLeaderboard,
}: { onStart: (weapon: WeaponType) => void; onLeaderboard: () => void }) {
  const [selected, setSelected] = useState<WeaponType>("pistol");
  const weaponList = Object.values(WEAPONS);
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto"
      style={{ background: "rgba(5,2,0,0.95)" }}
      data-ocid="game-start-screen"
    >
      <div className="flex flex-col items-center gap-4 px-5 py-6 max-w-sm w-full mx-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-5xl mb-2">🐺</div>
          <div
            className="text-3xl font-black tracking-wide mb-1"
            style={{ color: "#ff6600", textShadow: "0 0 20px #ff4400" }}
          >
            WILD SIEGE
          </div>
          <div className="text-base font-semibold" style={{ color: "#cc4400" }}>
            Digital Zindagi
          </div>
          <div className="text-sm mt-1 opacity-60" style={{ color: "#aaa" }}>
            लड़ो • जीतो • बचो
          </div>
        </motion.div>

        <div className="flex gap-3 w-full">
          <div
            className="rounded-xl px-4 py-2.5 text-center flex-1"
            style={{
              background: "rgba(255,80,0,0.08)",
              border: "1px solid rgba(255,80,0,0.25)",
              color: "#ff6600",
            }}
          >
            <div className="text-xs opacity-60">🏆 Best Score</div>
            <div className="text-xl font-bold">
              {getHighScore().toLocaleString()}
            </div>
          </div>
          <button
            type="button"
            onClick={onLeaderboard}
            className="rounded-xl px-4 py-2.5 flex flex-col items-center justify-center gap-1 transition-opacity hover:opacity-80"
            style={{
              background: "rgba(255,80,0,0.08)",
              border: "1px solid rgba(255,80,0,0.25)",
              color: "#ff6600",
            }}
            data-ocid="leaderboard-btn"
          >
            <span className="text-xl">🏆</span>
            <span className="text-xs opacity-70">Top 10</span>
          </button>
        </div>

        {/* Weapon selection */}
        <div className="w-full">
          <div className="text-xs mb-2 text-center" style={{ color: "#888" }}>
            Starting Weapon:
          </div>
          <div className="flex gap-2">
            {weaponList
              .filter((w) => w.cost === 0 || w.id === "pistol")
              .map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelected(w.id)}
                  className="flex-1 py-2 rounded-xl font-bold text-sm transition-all"
                  style={{
                    background:
                      selected === w.id
                        ? `${w.color}25`
                        : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${selected === w.id ? w.color : "rgba(255,255,255,0.08)"}`,
                    color: selected === w.id ? w.color : "#666",
                  }}
                  data-ocid={`start-weapon-${w.id}`}
                >
                  {w.id === "pistol" ? "🔫" : "🪖"} {w.name}
                </button>
              ))}
          </div>
        </div>

        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", bounce: 0.35 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onStart(selected)}
          className="w-full rounded-2xl font-black flex items-center justify-center gap-3"
          style={{
            background:
              "linear-gradient(135deg, #1a0800 0%, #3a1000 50%, #1a0800 100%)",
            border: "2px solid #ff6600",
            color: "#ff6600",
            fontSize: "20px",
            minHeight: "60px",
            boxShadow: "0 0 24px rgba(255,80,0,0.35)",
            textShadow: "0 0 8px #ff4400",
          }}
          data-ocid="start-game-btn"
        >
          <span>▶</span>
          <span>
            Start Game
            <br />
            <span style={{ fontSize: "14px", opacity: 0.85 }}>गेम शुरू करें</span>
          </span>
        </motion.button>

        <div
          className="text-xs text-center opacity-40"
          style={{ color: "#bbb" }}
        >
          <span className="hidden md:inline">
            WASD = Move · Auto-fire at nearest creature
          </span>
          <span className="md:hidden">
            Joystick = Move · 🔥 = Fire (auto-aims)
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main GamePage ─────────────────────────────────────────────────────────────
export default function GamePage() {
  const {
    gamePhase,
    score,
    currentLevel,
    currentWave,
    coins,
    heroHP,
    resetGame,
    setSpawnInvincible,
    leaderboardVisible,
    setLeaderboardVisible,
    setWeapon,
    nextLevel,
  } = useGameStore();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const joystickRef = useRef({ x: 0, y: 0 });
  const audioStarted = useRef(false);
  const latestEntryRef = useRef<LeaderboardEntry | null>(null);
  const gameOverHandled = useRef(false);
  const [showStore, setShowStore] = useState(false);

  // Init engine ONCE on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || engineRef.current) return;
    try {
      engineRef.current = new GameEngine(canvas, () => {});
    } catch (e) {
      console.warn("[GamePage] Engine init failed:", e);
    }
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const onResize = () => engineRef.current?.resize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Prevent scroll during game
  useEffect(() => {
    const prev = document.body.style.overscrollBehavior;
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overscrollBehavior = prev;
    };
  }, []);

  // Game over handler
  useEffect(() => {
    if (gamePhase === "gameover" && !gameOverHandled.current && score > 0) {
      gameOverHandled.current = true;
      const entry = addLeaderboardScore(score, currentWave, currentLevel);
      latestEntryRef.current = entry;
      SFX.gameOver(0.6);
      GameAudio.stopTheme();
      audioStarted.current = false;
      if (isHighScore(score))
        setTimeout(() => setLeaderboardVisible(true), 1200);
    }
    if (gamePhase === "playing") {
      gameOverHandled.current = false;
      latestEntryRef.current = null;
    }
    if (gamePhase === "level_complete") {
      setShowStore(true);
    }
    if (gamePhase === "wave_complete") {
      // Auto-start next wave after 3s
      const timer = setTimeout(() => {
        const engine = engineRef.current;
        const s = useGameStore.getState();
        if (engine && s.gamePhase === "wave_complete") {
          s.setGamePhase("playing");
          engine.startWave(s.currentLevel, s.currentWave);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gamePhase, score, currentWave, currentLevel, setLeaderboardVisible]);

  useEffect(() => {
    return () => {
      GameAudio.stopTheme();
      audioStarted.current = false;
    };
  }, []);

  const startGame = useCallback(
    (weapon: WeaponType) => {
      resumeAudio();
      setWeapon(weapon);
      resetGame();
      if (!audioStarted.current) {
        audioStarted.current = true;
        setTimeout(() => {
          GameAudio.playTheme();
          GameAudio.setMasterVolume(0.7);
        }, 300);
      }
      setTimeout(() => {
        setSpawnInvincible(false);
        const engine = engineRef.current;
        if (engine) {
          engine.startWave(1, 1);
          engine.startGameLoop();
        }
      }, 2000);
    },
    [resetGame, setSpawnInvincible, setWeapon],
  );

  const handleRestart = useCallback(() => {
    resumeAudio();
    resetGame();
    setShowStore(false);
    if (!audioStarted.current) {
      audioStarted.current = true;
      setTimeout(() => {
        GameAudio.playTheme();
        GameAudio.setMasterVolume(0.7);
      }, 300);
    }
    setTimeout(() => {
      setSpawnInvincible(false);
      const engine = engineRef.current;
      if (engine) {
        engine.startWave(1, 1);
        engine.startGameLoop();
      }
    }, 2000);
  }, [resetGame, setSpawnInvincible]);

  const handleGoHome = useCallback(() => {
    GameAudio.stopTheme();
    audioStarted.current = false;
    navigate("/");
  }, [navigate]);

  const handleJoystickMove = useCallback((x: number, y: number) => {
    joystickRef.current = { x, y };
    engineRef.current?.setJoystick(x, y);
  }, []);

  const handleJoystickEnd = useCallback(() => {
    joystickRef.current = { x: 0, y: 0 };
    engineRef.current?.setJoystick(0, 0);
  }, []);

  const handleFireStart = useCallback(() => {
    resumeAudio();
    engineRef.current?.setFireHeld(true);
  }, []);

  const handleFireEnd = useCallback(() => {
    engineRef.current?.setFireHeld(false);
  }, []);

  const handleStoreClose = useCallback(() => {
    setShowStore(false);
    nextLevel();
    const engine = engineRef.current;
    const s = useGameStore.getState();
    if (engine) engine.startWave(s.currentLevel, 1);
  }, [nextLevel]);

  const shareOnWhatsApp = useCallback(() => {
    const text = encodeURIComponent(
      `🐺 Maine Digital Zindagi: Wild Siege mein ${score.toLocaleString()} score kiya! Level ${currentLevel} Wave ${currentWave} tak pahuncha!\n\nTum bhi khelo! 💪`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }, [score, currentLevel, currentWave]);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: "#080400", touchAction: "none" }}
      data-ocid="game-page"
    >
      {/* Canvas — always mounted, never conditionally unmounted */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block"
        style={{ width: "100%", height: "100%" }}
      />

      {/* START SCREEN */}
      <AnimatePresence>
        {gamePhase === "start" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="absolute inset-0 z-20"
          >
            <StartScreen
              onStart={startGame}
              onLeaderboard={() => setLeaderboardVisible(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* GAME HUD (playing) */}
      {(gamePhase === "playing" || gamePhase === "wave_complete") && (
        <>
          <GameHUD onExit={handleGoHome} />
          <WaveAnnouncement />
          <VirtualJoystick
            onMove={handleJoystickMove}
            onEnd={handleJoystickEnd}
          />
          <FireButton onFire={handleFireStart} onRelease={handleFireEnd} />
        </>
      )}

      {/* WAVE COMPLETE OVERLAY */}
      <AnimatePresence>
        {gamePhase === "wave_complete" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 top-20 z-20 flex justify-center pointer-events-none"
          >
            <div
              className="px-6 py-3 rounded-2xl text-center"
              style={{
                background: "rgba(0,5,0,0.9)",
                border: "2px solid rgba(255,80,0,0.5)",
              }}
            >
              <div className="text-xl font-black" style={{ color: "#ff6600" }}>
                ✅ Wave Complete!
              </div>
              <div className="text-sm" style={{ color: "#aaa" }}>
                Agla wave 3 seconds mein…
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEVEL COMPLETE / STORE */}
      <AnimatePresence>
        {showStore && <StoreModal onClose={handleStoreClose} />}
      </AnimatePresence>

      {/* GAME OVER */}
      <AnimatePresence>
        {gamePhase === "gameover" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
            style={{ background: "rgba(0,0,0,0.92)" }}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="rounded-2xl p-8 flex flex-col items-center gap-4 max-w-xs w-full mx-4"
              style={{
                background: "rgba(8,4,0,0.97)",
                border: "2px solid rgba(255,80,0,0.4)",
              }}
            >
              <div className="text-6xl">💀</div>
              <div className="text-2xl font-black" style={{ color: "#ff3300" }}>
                GAME OVER
              </div>
              {isHighScore(score) && score > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="rounded-xl px-4 py-2 text-sm font-bold text-center"
                  style={{
                    background: "rgba(255,80,0,0.15)",
                    border: "1px solid rgba(255,80,0,0.4)",
                    color: "#ff6600",
                  }}
                >
                  🏆 New High Score!
                </motion.div>
              )}
              <div className="text-center">
                <div className="text-xs opacity-60" style={{ color: "#aaa" }}>
                  Score
                </div>
                <div
                  className="text-4xl font-bold"
                  style={{ color: "#ff6600" }}
                >
                  {score.toLocaleString()}
                </div>
              </div>
              <div
                className="flex items-center gap-3 text-sm"
                style={{ color: "#aaa" }}
              >
                <span>🪙 {coins}</span>
                <span>·</span>
                <span>
                  Lv {currentLevel} W{currentWave}
                </span>
                <span>·</span>
                <span>❤️ {heroHP}</span>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{
                    background: "rgba(255,80,0,0.15)",
                    border: "2px solid #ff6600",
                    color: "#ff6600",
                  }}
                  data-ocid="restart-game-btn"
                >
                  ↺ Dobara Khelo
                </button>
                <button
                  type="button"
                  onClick={() => setLeaderboardVisible(true)}
                  className="py-3.5 px-4 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80"
                  style={{
                    background: "rgba(255,80,0,0.08)",
                    border: "1px solid rgba(255,80,0,0.3)",
                    color: "#ff6600",
                  }}
                  data-ocid="gameover-leaderboard-btn"
                >
                  🏆
                </button>
              </div>
              <button
                type="button"
                onClick={shareOnWhatsApp}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: "#25d366", color: "#fff" }}
                data-ocid="gameover-whatsapp-btn"
              >
                📲 WhatsApp Share
              </button>
              <button
                type="button"
                onClick={handleGoHome}
                className="text-sm opacity-50 hover:opacity-80 transition-opacity"
                style={{ color: "#aaa" }}
                data-ocid="gameover-home-btn"
              >
                🏠 Home
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VICTORY */}
      <AnimatePresence>
        {gamePhase === "victory" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
            style={{ background: "rgba(0,10,0,0.97)" }}
          >
            <div className="text-7xl mb-4">🏆</div>
            <div
              className="text-3xl font-black mb-2"
              style={{ color: "#ff6600", textShadow: "0 0 20px #ff4400" }}
            >
              YOU WIN!
            </div>
            <div className="text-lg mb-4" style={{ color: "#aaa" }}>
              Sabhi 12 levels complete!
            </div>
            <div
              className="text-3xl font-bold mb-6"
              style={{ color: "#f0c040" }}
            >
              {score.toLocaleString()} pts
            </div>
            <button
              type="button"
              onClick={shareOnWhatsApp}
              className="px-8 py-3 rounded-xl font-bold text-lg mb-3"
              style={{ background: "#25d366", color: "#fff" }}
            >
              📲 Share
            </button>
            <button
              type="button"
              onClick={handleGoHome}
              className="text-sm opacity-60 hover:opacity-90 transition-opacity"
              style={{ color: "#ff6600" }}
            >
              🏠 Home
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEADERBOARD */}
      <AnimatePresence>
        {leaderboardVisible && (
          <Leaderboard
            onClose={() => setLeaderboardVisible(false)}
            latestEntry={latestEntryRef.current}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
