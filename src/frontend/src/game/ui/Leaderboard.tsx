import { Share2, X } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useGameStore } from "../stores/gameStore";
import {
  type LeaderboardEntry,
  getLeaderboard,
  rankMedal,
} from "../utils/leaderboard";

const ROW_BG: Record<number, string> = {
  0: "rgba(240,192,64,0.15)", // gold
  1: "rgba(192,192,192,0.12)", // silver
  2: "rgba(180,100,40,0.15)", // bronze
};
const ROW_BORDER: Record<number, string> = {
  0: "rgba(240,192,64,0.4)",
  1: "rgba(192,192,192,0.3)",
  2: "rgba(200,120,40,0.3)",
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

interface Props {
  onClose: () => void;
  /** Pass a score+entry if we just added one — used to highlight */
  latestEntry?: LeaderboardEntry | null;
}

export default function Leaderboard({ onClose, latestEntry }: Props) {
  const { score } = useGameStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setEntries(getLeaderboard());
  }, []);

  const handleShare = useCallback(() => {
    const shareScore = latestEntry?.score ?? score;
    const text = `I scored ${shareScore.toLocaleString()} points in Digital Zindagi: Real Human! Can you beat me? 🔥`;
    const url = window.location.href;

    if (navigator.share) {
      navigator
        .share({ title: "Digital Zindagi: Real Human", text, url })
        .catch(() => {});
    } else {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }
  }, [score, latestEntry]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.88)" }}
      data-ocid="leaderboard-modal"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="game-hud-bg rounded-2xl p-5 max-w-sm w-full mx-4 relative flex flex-col gap-4"
        style={{
          border: "2px solid rgba(240,192,64,0.45)",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 transition-colors"
          style={{ color: "#f0c040" }}
          aria-label="Close leaderboard"
          data-ocid="leaderboard-close-btn"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center pr-8">
          <div
            className="text-2xl font-black tracking-wide"
            style={{
              color: "#f0c040",
              textShadow: "0 0 16px rgba(240,192,64,0.5)",
            }}
          >
            🏆 LEADERBOARD
          </div>
          <div
            className="text-sm font-semibold mt-0.5"
            style={{ color: "#00ff88" }}
          >
            Digital Zindagi: Real Human
          </div>
          <div className="text-xs mt-0.5 opacity-50" style={{ color: "#aaa" }}>
            Top 10 Players
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="text-4xl">🎮</div>
              <div className="text-base font-bold" style={{ color: "#aaa" }}>
                No scores yet!
              </div>
              <div className="text-sm text-center" style={{ color: "#666" }}>
                Be the first to play and claim the top spot!
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Column headers */}
              <div
                className="grid gap-1 px-2 pb-1"
                style={{
                  gridTemplateColumns: "40px 1fr 72px 48px 36px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {["Rank", "Player", "Score", "Wave", "Date"].map((h) => (
                  <div
                    key={h}
                    className="text-xs font-bold opacity-50 text-center"
                    style={{ color: "#aaa" }}
                  >
                    {h}
                  </div>
                ))}
              </div>

              {entries.map((entry, idx) => {
                const isLatest = latestEntry?.id === entry.id;
                const bg =
                  ROW_BG[idx] ??
                  (isLatest
                    ? "rgba(0,255,136,0.08)"
                    : "rgba(255,255,255,0.03)");
                const border =
                  ROW_BORDER[idx] ??
                  (isLatest ? "rgba(0,255,136,0.4)" : "rgba(255,255,255,0.06)");

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="grid gap-1 px-2 py-2 rounded-xl items-center"
                    style={{
                      gridTemplateColumns: "40px 1fr 72px 48px 36px",
                      background: bg,
                      border: `1px solid ${border}`,
                    }}
                    data-ocid={`leaderboard-row-${idx}`}
                  >
                    {/* Rank */}
                    <div
                      className="text-center text-base font-bold"
                      style={{ color: idx < 3 ? "#f0c040" : "#888" }}
                    >
                      {rankMedal(idx + 1)}
                    </div>
                    {/* Player */}
                    <div
                      className="text-xs font-semibold truncate"
                      style={{ color: isLatest ? "#00ff88" : "#ddd" }}
                      title={entry.playerName}
                    >
                      {isLatest ? "YOU" : entry.playerName}
                    </div>
                    {/* Score */}
                    <div
                      className="text-sm font-bold text-center"
                      style={{ color: "#f0c040" }}
                    >
                      {entry.score.toLocaleString()}
                    </div>
                    {/* Wave */}
                    <div
                      className="text-xs text-center font-semibold"
                      style={{ color: "#00ff88" }}
                    >
                      W{entry.wave}
                    </div>
                    {/* Date */}
                    <div
                      className="text-xs text-center opacity-60"
                      style={{ color: "#aaa" }}
                    >
                      {formatDate(entry.timestamp)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Share + Close */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              background: "rgba(0,255,136,0.12)",
              color: "#00ff88",
              border: "1px solid rgba(0,255,136,0.35)",
            }}
            data-ocid="leaderboard-share-btn"
          >
            <Share2 size={15} />📤 Share Score
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{
              background: "rgba(240,192,64,0.12)",
              color: "#f0c040",
              border: "1px solid rgba(240,192,64,0.35)",
            }}
            data-ocid="leaderboard-close-bottom-btn"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
