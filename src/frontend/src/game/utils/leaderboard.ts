/**
 * Global Leaderboard — localStorage-backed, top 10 scores.
 * All data is stored client-side under LEADERBOARD_KEY.
 */

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  wave: number;
  timestamp: number;
}

const LEADERBOARD_KEY = "dz_game_leaderboard";
const MAX_ENTRIES = 10;

function genId(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function genPlayerName(): string {
  const suffix = String(Math.floor(Math.random() * 9000) + 1000);
  return `DZ_Player_${suffix}`;
}

/** Read leaderboard from localStorage, sorted by score descending */
export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed: LeaderboardEntry[] = JSON.parse(raw);
    return parsed.sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

/** Add a score to the leaderboard. Returns the new entry (even if not in top 10). */
export function addScore(score: number, wave: number): LeaderboardEntry {
  const entry: LeaderboardEntry = {
    id: genId(),
    playerName: genPlayerName(),
    score,
    wave,
    timestamp: Date.now(),
  };

  const current = getLeaderboard();
  const updated = [...current, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);

  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
  } catch {}

  return entry;
}

/** Clear all leaderboard entries */
export function clearLeaderboard(): void {
  try {
    localStorage.removeItem(LEADERBOARD_KEY);
  } catch {}
}

/** Returns true if the score qualifies for the top 10 */
export function isHighScore(score: number): boolean {
  const board = getLeaderboard();
  if (board.length < MAX_ENTRIES) return true;
  return score > board[board.length - 1].score;
}

/** Rank medal emoji for position (1-based) */
export function rankMedal(position: number): string {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return `#${position}`;
}
