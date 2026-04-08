import { ArrowLeft, Play, RotateCcw, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameCanvas } from "../game/GameCanvas";
import { getHighScore, useGameStore } from "../game/stores/gameStore";
import AttackButton from "../game/ui/AttackButton";
import GameHUD from "../game/ui/GameHUD";
import Leaderboard from "../game/ui/Leaderboard";
import PhotoUpload from "../game/ui/PhotoUpload";
import VirtualJoystick from "../game/ui/VirtualJoystick";
import { GameAudio, SFX, resumeAudio } from "../game/utils/audioEngine";
import {
  type LeaderboardEntry,
  addScore as addLeaderboardScore,
  isHighScore,
} from "../game/utils/leaderboard";
import { Link } from "../lib/router";

// ─── Rotate Warning Overlay ───────────────────────────────────────────────────

function RotateWarning() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-[9999] select-none"
      style={{
        background:
          "linear-gradient(135deg, #064420 0%, #000 60%, #0a0a0a 100%)",
      }}
      data-ocid="rotate-warning"
    >
      {/* Animated rotate icon */}
      <div
        style={{
          fontSize: 72,
          animation: "spin 2s linear infinite",
          display: "inline-block",
        }}
      >
        📱
      </div>

      <div
        className="text-2xl font-black text-center mt-6 px-8"
        style={{ color: "#00ff88", textShadow: "0 0 20px #00ff88" }}
      >
        Please rotate your device
        <br />
        to play Digital Zindagi
      </div>
      <div
        className="text-base font-semibold text-center mt-3 px-8"
        style={{ color: "#f0c040", textShadow: "0 0 10px #f0c040" }}
      >
        डिजिटल ज़िंदगी खेलने के लिए फोन घुमाएँ 🔄
      </div>

      <div className="mt-8 opacity-60" style={{ color: "#aaa", fontSize: 14 }}>
        🎮 Digital Zindagi — Real Human
      </div>

      <style>{`
        @keyframes spin {
          0%   { transform: rotate(0deg); }
          25%  { transform: rotate(90deg); }
          50%  { transform: rotate(90deg); }
          75%  { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Main GamePage ─────────────────────────────────────────────────────────────

export default function GamePage() {
  const {
    score,
    waveCount,
    coins,
    heroHP,
    gamePhase,
    resetGame,
    volume,
    leaderboardVisible,
    setLeaderboardVisible,
  } = useGameStore();

  const keys = useRef<Set<string>>(new Set());
  const joystick = useRef({ x: 0, y: 0 });
  const [showRotateWarning, setShowRotateWarning] = useState(false);
  const [latestEntry, setLatestEntry] = useState<LeaderboardEntry | null>(null);
  const gameOverHandled = useRef(false);

  // ── Keyboard handlers
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      if (e.code === "Space") e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // ── Landscape lock + fullscreen + rotate warning
  useEffect(() => {
    function checkOrientation() {
      const isPortrait = window.innerWidth < window.innerHeight;
      setShowRotateWarning(isPortrait);
    }

    checkOrientation();

    // Orientation change listeners
    window.addEventListener("orientationchange", checkOrientation);
    if (screen.orientation) {
      screen.orientation.addEventListener("change", checkOrientation);
    }
    window.addEventListener("resize", checkOrientation);

    return () => {
      window.removeEventListener("orientationchange", checkOrientation);
      if (screen.orientation) {
        screen.orientation.removeEventListener("change", checkOrientation);
      }
      window.removeEventListener("resize", checkOrientation);

      // Exit fullscreen on unmount
      try {
        if (document.fullscreenElement) {
          void document.exitFullscreen();
        }
      } catch {}

      // Release orientation lock
      try {
        (
          screen.orientation as ScreenOrientation & { unlock?: () => void }
        ).unlock?.();
      } catch {}
    };
  }, []);

  // ── Request fullscreen + landscape lock when game starts
  useEffect(() => {
    if (gamePhase !== "playing") return;

    const el = document.documentElement;
    try {
      if (el.requestFullscreen) {
        void el.requestFullscreen();
      } else if (
        (el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> })
          .webkitRequestFullscreen
      ) {
        void (
          el as HTMLElement & { webkitRequestFullscreen: () => Promise<void> }
        ).webkitRequestFullscreen();
      } else if (
        (el as HTMLElement & { mozRequestFullScreen?: () => Promise<void> })
          .mozRequestFullScreen
      ) {
        void (
          el as HTMLElement & { mozRequestFullScreen: () => Promise<void> }
        ).mozRequestFullScreen();
      }
    } catch {}

    try {
      void (
        screen.orientation as ScreenOrientation & {
          lock?: (o: string) => Promise<void>;
        }
      ).lock?.("landscape");
    } catch {}
  }, [gamePhase]);

  // ── Theme music when playing
  useEffect(() => {
    if (gamePhase === "playing") {
      resumeAudio();
      GameAudio.playTheme();
      GameAudio.setMasterVolume(volume);
    } else {
      GameAudio.stopTheme();
    }
    return () => {
      GameAudio.stopTheme();
    };
  }, [gamePhase, volume]);

  // ── Add to leaderboard on game over
  useEffect(() => {
    if (gamePhase === "gameover" && !gameOverHandled.current && score > 0) {
      gameOverHandled.current = true;
      const entry = addLeaderboardScore(score, waveCount);
      setLatestEntry(entry);
      if (isHighScore(score)) {
        setTimeout(() => setLeaderboardVisible(true), 1200);
      }
    }
    if (gamePhase === "playing") {
      gameOverHandled.current = false;
      setLatestEntry(null);
    }
  }, [gamePhase, score, waveCount, setLeaderboardVisible]);

  const handleStartGame = useCallback(() => {
    resumeAudio();
    SFX.waveStart(volume);
    resetGame();
  }, [resetGame, volume]);

  const handleRestart = useCallback(() => {
    SFX.waveStart(volume);
    resetGame();
  }, [resetGame, volume]);

  const handleJoystickMove = useCallback((x: number, y: number) => {
    joystick.current = { x, y };
  }, []);

  const handleJoystickEnd = useCallback(() => {
    joystick.current = { x: 0, y: 0 };
  }, []);

  const handleAttack = useCallback(() => {
    keys.current.add("Space");
    setTimeout(() => keys.current.delete("Space"), 200);
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: "#020503", touchAction: "none" }}
      data-ocid="game-page"
    >
      {/* Rotate warning — highest z-index */}
      {showRotateWarning && <RotateWarning />}

      {/* 3D Canvas layer */}
      <div className="absolute inset-0">
        <GameCanvas keys={keys} joystick={joystick} />
      </div>

      {/* ── START SCREEN ── */}
      <AnimatePresence>
        {gamePhase === "start" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
            style={{
              backgroundImage:
                "url(/assets/generated/game-scene-bg.dim_1920x1080.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Dark cinematic overlay */}
            <div
              className="absolute inset-0"
              style={{ background: "rgba(0,0,0,0.78)" }}
            />

            <div className="relative z-10 flex flex-col items-center gap-5 px-5 max-w-sm w-full">
              {/* Back */}
              <Link
                to="/"
                className="absolute -top-10 left-0 flex items-center gap-1 text-sm opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: "#f0c040" }}
              >
                <ArrowLeft size={16} />
                Home
              </Link>

              {/* Flaming title */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-center"
              >
                <div
                  className="text-4xl font-black tracking-widest mb-1"
                  style={{
                    color: "#00ff88",
                    textShadow:
                      "0 0 24px #00ff88, 0 0 48px #00aa55, 0 0 6px #ff6600",
                  }}
                >
                  🔥 REAL HUMAN 🔥
                </div>
                <div
                  className="text-base font-semibold"
                  style={{ color: "#f0c040", textShadow: "0 0 10px #f0c040" }}
                >
                  Digital Zindagi
                </div>
                <div
                  className="text-sm mt-1 opacity-60"
                  style={{ color: "#ccc" }}
                >
                  लड़ो • जीतो • आगे बढ़ो
                </div>
              </motion.div>

              {/* High Score + Leaderboard trigger */}
              <div className="flex gap-3 w-full">
                <div
                  className="game-hud-bg rounded-xl px-5 py-2.5 text-center flex-1"
                  style={{ color: "#f0c040" }}
                >
                  <div className="text-xs opacity-60">🏆 Best Score</div>
                  <div className="text-2xl font-bold">
                    {getHighScore().toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLeaderboardVisible(true)}
                  className="game-hud-bg rounded-xl px-4 py-2.5 flex flex-col items-center justify-center gap-1 transition-opacity hover:opacity-80"
                  style={{
                    color: "#f0c040",
                    border: "1px solid rgba(240,192,64,0.25)",
                  }}
                  data-ocid="leaderboard-btn"
                >
                  <Trophy size={18} />
                  <span className="text-xs opacity-70">Board</span>
                </button>
              </div>

              {/* Photo upload */}
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <PhotoUpload />
              </motion.div>

              {/* Play CTA */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={handleStartGame}
                className="game-cta-gold w-full py-4 rounded-2xl text-xl font-black flex items-center justify-center gap-2"
                data-ocid="start-game-btn"
              >
                <Play size={22} fill="currentColor" />
                PLAY KARO! ⚔
              </motion.button>

              <div
                className="text-xs text-center opacity-40"
                style={{ color: "#bbb" }}
              >
                <span className="hidden md:inline">
                  WASD = Move • Space = Attack
                </span>
                <span className="md:hidden">
                  Joystick = Chalo • Red Button = Attack
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GAME OVER SCREEN ── */}
      <AnimatePresence>
        {gamePhase === "gameover" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
            style={{ background: "rgba(0,0,0,0.9)" }}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="game-hud-bg rounded-2xl p-8 flex flex-col items-center gap-4 max-w-xs w-full mx-4"
              style={{ border: "2px solid rgba(255,50,0,0.4)" }}
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
                    background: "rgba(240,192,64,0.2)",
                    border: "1px solid rgba(240,192,64,0.4)",
                    color: "#f0c040",
                  }}
                >
                  🏆 Leaderboard mein entry ho gayi!
                </motion.div>
              )}

              <div className="text-center">
                <div className="text-xs opacity-60" style={{ color: "#aaa" }}>
                  Aapka Score
                </div>
                <div
                  className="text-4xl font-bold"
                  style={{ color: "#f0c040" }}
                >
                  {score.toLocaleString()}
                </div>
              </div>

              <div className="text-center">
                <div className="text-xs opacity-60" style={{ color: "#aaa" }}>
                  🏆 Best Score
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: "#00ff88" }}
                >
                  {getHighScore().toLocaleString()}
                </div>
              </div>

              <div
                className="flex items-center gap-3 text-sm"
                style={{ color: "#f0c040" }}
              >
                <span>🪙 {coins} Coins</span>
                <span>•</span>
                <span>Wave {waveCount}</span>
                <span>•</span>
                <span>❤️ {heroHP} HP bachi</span>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="game-cta-gold flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
                  data-ocid="restart-game-btn"
                >
                  <RotateCcw size={18} />
                  Fir Se!
                </button>
                <button
                  type="button"
                  onClick={() => setLeaderboardVisible(true)}
                  className="game-hud-bg py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-opacity hover:opacity-80"
                  style={{
                    color: "#f0c040",
                    border: "1px solid rgba(240,192,64,0.3)",
                  }}
                  data-ocid="gameover-leaderboard-btn"
                >
                  <Trophy size={16} />
                </button>
              </div>

              <Link
                to="/"
                className="text-sm opacity-50 hover:opacity-80 transition-opacity"
                style={{ color: "#aaa" }}
              >
                ← Homepage par Jao
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PLAYING HUD OVERLAY ── */}
      <GameHUD />

      {/* ── TOUCH CONTROLS (only when playing) ── */}
      {gamePhase === "playing" && (
        <>
          <VirtualJoystick
            onMove={handleJoystickMove}
            onEnd={handleJoystickEnd}
          />
          <AttackButton onAttack={handleAttack} />
        </>
      )}

      {/* ── LEADERBOARD MODAL ── */}
      <AnimatePresence>
        {leaderboardVisible && (
          <Leaderboard
            onClose={() => setLeaderboardVisible(false)}
            latestEntry={latestEntry}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
