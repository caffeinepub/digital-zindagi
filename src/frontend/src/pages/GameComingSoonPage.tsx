/**
 * LudoGamePage — Digital Zindagi
 * Full 2-4 player Pass & Play Ludo game.
 * Features: 18+ disclaimer, player setup, grid-based board,
 * dice roll, token movement, capture, win condition,
 * InterstitialAd after match, AdMob banner at bottom.
 *
 * Visual upgrade: premium glossy board, 3D dice, smooth pawn animations,
 * gold branding, gaming roll button.
 */
import { ArrowLeft, Camera, Wallet } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import InterstitialAd from "../components/InterstitialAd";
import { useNavigate } from "../lib/router";

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_NAMES = ["Red", "Blue", "Green", "Yellow"] as const;
type ColorName = (typeof COLOR_NAMES)[number];

const PLAYER_COLORS: Record<
  ColorName,
  { bg: string; border: string; text: string }
> = {
  Red: { bg: "bg-red-500", border: "border-red-400", text: "text-red-400" },
  Blue: { bg: "bg-blue-500", border: "border-blue-400", text: "text-blue-400" },
  Green: {
    bg: "bg-green-500",
    border: "border-green-400",
    text: "text-green-400",
  },
  Yellow: {
    bg: "bg-yellow-400",
    border: "border-yellow-300",
    text: "text-yellow-300",
  },
};

// Token radial gradient colors for 3D spherical look
const TOKEN_GRADIENTS: Record<ColorName, string> = {
  Red: "radial-gradient(circle at 35% 35%, #ff8888, #cc0000 60%, #8b0000)",
  Blue: "radial-gradient(circle at 35% 35%, #88aaff, #2255cc 60%, #0a1e6e)",
  Green: "radial-gradient(circle at 35% 35%, #88ee88, #22aa22 60%, #0a5c0a)",
  Yellow: "radial-gradient(circle at 35% 35%, #ffe566, #ccaa00 60%, #7a6500)",
};

// Home zone rich gradient backgrounds
const HOME_ZONE_GRADIENTS: Record<string, string> = {
  "home-red": "linear-gradient(135deg, #ff6b6b 0%, #cc0000 50%, #8b0000 100%)",
  "home-blue": "linear-gradient(135deg, #6b9bff 0%, #1a56cc 50%, #0a1e6e 100%)",
  "home-green":
    "linear-gradient(135deg, #6bdd6b 0%, #1a9a1a 50%, #0a5c0a 100%)",
  "home-yellow":
    "linear-gradient(135deg, #ffe566 0%, #ccaa00 50%, #7a6500 100%)",
};

// Colored lane gradients
const LANE_GRADIENTS: Record<string, string> = {
  "col-blue": "linear-gradient(180deg, #c8d8ff 0%, #a0b8ff 100%)",
  "row-red": "linear-gradient(90deg, #ffc8c8 0%, #ffa0a0 100%)",
  "col-yellow": "linear-gradient(180deg, #fff3c8 0%, #ffe080 100%)",
  "row-green": "linear-gradient(90deg, #c8ffcc 0%, #a0ffaa 100%)",
};

// 52-step shared path as [row, col] on 15x15 grid (0-indexed), clockwise
const SHARED_PATH: [number, number][] = [
  [6, 1],
  [6, 2],
  [6, 3],
  [6, 4],
  [6, 5],
  [5, 5],
  [4, 5],
  [3, 5],
  [2, 5],
  [1, 5],
  [0, 5],
  [0, 6],
  [0, 8],
  [1, 8],
  [2, 8],
  [3, 8],
  [4, 8],
  [5, 8],
  [6, 9],
  [6, 10],
  [6, 11],
  [6, 12],
  [6, 13],
  [6, 14],
  [7, 14],
  [8, 14],
  [8, 13],
  [8, 12],
  [8, 11],
  [8, 10],
  [8, 9],
  [9, 8],
  [10, 8],
  [11, 8],
  [12, 8],
  [13, 8],
  [14, 8],
  [14, 6],
  [14, 5],
  [13, 5],
  [12, 5],
  [11, 5],
  [10, 5],
  [9, 5],
  [8, 4],
  [8, 3],
  [8, 2],
  [8, 1],
  [8, 0],
  [7, 0],
];

const ENTRY_INDEX: Record<ColorName, number> = {
  Red: 0,
  Blue: 13,
  Green: 26,
  Yellow: 39,
};

const HOME_PATH: Record<ColorName, [number, number][]> = {
  Red: [
    [7, 1],
    [7, 2],
    [7, 3],
    [7, 4],
    [7, 5],
    [7, 6],
  ],
  Blue: [
    [1, 7],
    [2, 7],
    [3, 7],
    [4, 7],
    [5, 7],
    [6, 7],
  ],
  Green: [
    [7, 13],
    [7, 12],
    [7, 11],
    [7, 10],
    [7, 9],
    [7, 8],
  ],
  Yellow: [
    [13, 7],
    [12, 7],
    [11, 7],
    [10, 7],
    [9, 7],
    [8, 7],
  ],
};

const BASE_POSITIONS: Record<ColorName, [number, number][]> = {
  Red: [
    [1, 1],
    [1, 3],
    [3, 1],
    [3, 3],
  ],
  Blue: [
    [1, 11],
    [1, 13],
    [3, 11],
    [3, 13],
  ],
  Green: [
    [11, 11],
    [11, 13],
    [13, 11],
    [13, 13],
  ],
  Yellow: [
    [11, 1],
    [11, 3],
    [13, 1],
    [13, 3],
  ],
};

const SAFE_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Token {
  pos: number;
}

interface Player {
  color: ColorName;
  name: string;
  tokens: Token[];
  active: boolean;
}

type GamePhase = "disclaimer" | "setup" | "playing" | "winner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTokenCell(color: ColorName, token: Token): [number, number] | null {
  if (token.pos === 0 || token.pos >= 59) return null;
  if (token.pos <= 52) {
    const entryIdx = ENTRY_INDEX[color];
    const sharedIdx = (entryIdx + token.pos - 1) % 52;
    return SHARED_PATH[sharedIdx] ?? null;
  }
  const homeIdx = token.pos - 53;
  return HOME_PATH[color][homeIdx] ?? null;
}

function canCapture(color: ColorName, pathPos: number): boolean {
  const entryIdx = ENTRY_INDEX[color];
  const sharedIdx = (entryIdx + pathPos - 1) % 52;
  return pathPos >= 1 && pathPos <= 52 && !SAFE_INDICES.has(sharedIdx);
}

// ─── Premium 3D Dice Component ────────────────────────────────────────────────

const DOT_POSITIONS: [number, number][][] = [
  [],
  [[50, 50]],
  [
    [28, 28],
    [72, 72],
  ],
  [
    [28, 28],
    [50, 50],
    [72, 72],
  ],
  [
    [28, 28],
    [72, 28],
    [28, 72],
    [72, 72],
  ],
  [
    [28, 28],
    [72, 28],
    [50, 50],
    [28, 72],
    [72, 72],
  ],
  [
    [28, 22],
    [72, 22],
    [28, 50],
    [72, 50],
    [28, 78],
    [72, 78],
  ],
];

// CSS keyframe for tumbling dice injected once
const DICE_KEYFRAMES = `
@keyframes diceRoll {
  0%   { transform: rotateX(0deg)   rotateY(0deg)   rotateZ(0deg); }
  20%  { transform: rotateX(180deg) rotateY(90deg)  rotateZ(45deg); }
  40%  { transform: rotateX(360deg) rotateY(180deg) rotateZ(90deg); }
  60%  { transform: rotateX(540deg) rotateY(270deg) rotateZ(135deg); }
  80%  { transform: rotateX(660deg) rotateY(330deg) rotateZ(160deg); }
  100% { transform: rotateX(720deg) rotateY(360deg) rotateZ(180deg); }
}
@keyframes tokenLand {
  0%   { transform: scale(1.0); }
  40%  { transform: scale(1.3); }
  70%  { transform: scale(0.92); }
  100% { transform: scale(1.0); }
}
@keyframes rollPulse {
  0%, 100% { box-shadow: 0 8px 20px rgba(255,165,0,0.55), 0 0 0 0 rgba(255,215,0,0.4), inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.2); }
  50%       { box-shadow: 0 8px 30px rgba(255,165,0,0.75), 0 0 0 8px rgba(255,215,0,0), inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.2); }
}
`;

function StyleInjector() {
  useEffect(() => {
    const id = "ludo-keyframes";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = DICE_KEYFRAMES;
      document.head.appendChild(style);
    }
    return () => {
      // leave it — harmless to keep
    };
  }, []);
  return null;
}

function DiceFace({ value, rolling }: { value: number; rolling: boolean }) {
  const dots = DOT_POSITIONS[value] ?? [];

  return (
    <div
      style={{
        perspective: "200px",
        width: 60,
        height: 60,
        flexShrink: 0,
      }}
      aria-label={`Dice shows ${value}`}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "12px",
          background:
            "linear-gradient(145deg, #ffffff 0%, #f0f0f0 60%, #d8d8d8 100%)",
          boxShadow:
            "0 6px 20px rgba(0,0,0,0.55), inset 0 2px 3px rgba(255,255,255,0.9), inset 0 -2px 3px rgba(0,0,0,0.15), 0 0 0 2px rgba(200,200,200,0.6)",
          border: "1px solid rgba(180,180,180,0.8)",
          position: "relative",
          animation: rolling ? "diceRoll 0.65s ease-out" : "none",
          transformStyle: "preserve-3d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Glossy top-left sheen */}
        <div
          style={{
            position: "absolute",
            top: 4,
            left: 4,
            width: "40%",
            height: "30%",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.85) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        {/* Dots */}
        {dots.map(([x, y]) => (
          <div
            key={`dot-${x}-${y}`}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: "18%",
              height: "18%",
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #555, #111)",
              transform: "translate(-50%, -50%)",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Cell background helper ────────────────────────────────────────────────────

function getCellType(row: number, col: number): string {
  if (row >= 6 && row <= 8 && col >= 6 && col <= 8) {
    return row === 7 && col === 7 ? "center-star" : "center";
  }
  if (row <= 5 && col <= 5) return "home-red";
  if (row <= 5 && col >= 9) return "home-blue";
  if (row >= 9 && col >= 9) return "home-green";
  if (row >= 9 && col <= 5) return "home-yellow";
  if (col === 7 && row >= 1 && row <= 5) return "col-blue";
  if (row === 7 && col >= 1 && col <= 5) return "row-red";
  if (col === 7 && row >= 9 && row <= 13) return "col-yellow";
  if (row === 7 && col >= 9 && col <= 13) return "row-green";
  const sharedIdx = SHARED_PATH.findIndex(([r, c]) => r === row && c === col);
  if (sharedIdx >= 0 && SAFE_INDICES.has(sharedIdx)) return "safe";
  return "path";
}

function getCellStyle(type: string): React.CSSProperties {
  const base: React.CSSProperties = {
    boxShadow:
      "inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.3)",
    borderRadius: "2px",
  };

  if (HOME_ZONE_GRADIENTS[type]) {
    return {
      ...base,
      background: HOME_ZONE_GRADIENTS[type],
      boxShadow:
        "inset 0 3px 6px rgba(255,255,255,0.25), inset 0 -3px 6px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.4)",
    };
  }

  if (LANE_GRADIENTS[type]) {
    return {
      ...base,
      background: LANE_GRADIENTS[type],
    };
  }

  switch (type) {
    case "safe":
      return {
        ...base,
        background:
          "linear-gradient(135deg, #fffde0 0%, #fff6a0 50%, #ffe566 100%)",
        boxShadow:
          "inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -2px 4px rgba(180,140,0,0.3), 0 1px 4px rgba(0,0,0,0.25)",
      };
    case "center":
      return {
        background:
          "linear-gradient(135deg, #064e35 0%, #065f46 50%, #047857 100%)",
        boxShadow:
          "inset 0 2px 4px rgba(16,185,129,0.3), inset 0 -2px 4px rgba(0,0,0,0.4)",
        borderRadius: "0px",
      };
    case "center-star":
      return {
        background:
          "linear-gradient(135deg, #064e35 0%, #065f46 50%, #047857 100%)",
        boxShadow:
          "inset 0 2px 6px rgba(255,215,0,0.2), inset 0 -2px 4px rgba(0,0,0,0.5)",
        borderRadius: "0px",
      };
    default:
      return {
        background:
          "linear-gradient(135deg, #fafafa 0%, #f2f2f2 60%, #e8e8e8 100%)",
        boxShadow:
          "inset 0 1px 3px rgba(255,255,255,0.8), inset 0 -1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.15)",
        borderRadius: "2px",
      };
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GameComingSoonPage() {
  const navigate = useNavigate();

  const ludoEnabled = localStorage.getItem("dz_ludo_enabled") !== "false";
  const gameVisible = localStorage.getItem("dz_game_visible") !== "false";
  const isEnabled = ludoEnabled && gameVisible;

  const admobConfig = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("dz_admob_config") ?? "{}",
      ) as Record<string, string>;
    } catch {
      return {} as Record<string, string>;
    }
  })();
  const bannerUnitId = admobConfig.ludoBannerId ?? admobConfig.bannerId ?? "";

  const [phase, setPhase] = useState<GamePhase>(() =>
    localStorage.getItem("dz_ludo_disclaimer_accepted") === "true"
      ? "setup"
      : "disclaimer",
  );

  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState([
    "Aap",
    "Player 2",
    "Player 3",
    "Player 4",
  ]);

  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [diceValue, setDiceValue] = useState(1);
  const [diceRolled, setDiceRolled] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [movableTokens, setMovableTokens] = useState<number[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showWinnerScreen, setShowWinnerScreen] = useState(false);
  const [message, setMessage] = useState("");
  // Track recently-landed tokens for bounce animation
  const [landedToken, setLandedToken] = useState<string | null>(null);
  const rollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextTurnRef = useRef<((lastDice: number) => void) | null>(null);

  useEffect(() => {
    return () => {
      if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current);
    };
  }, []);

  // nextTurn stored in ref to avoid stale closures in effect
  const nextTurn = useCallback(
    (lastDice: number) => {
      setDiceRolled(false);
      setMovableTokens([]);
      if (lastDice === 6) {
        // Same player gets another turn
        setPlayers((prev) => {
          const p = prev[currentPlayerIdx];
          if (p) setMessage(`${p.name} ko 6 aaya! Ek aur chance!`);
          return prev;
        });
      } else {
        setPlayers((prev) => {
          const nextIdx = (currentPlayerIdx + 1) % prev.length;
          const next = prev[nextIdx];
          if (next) {
            setCurrentPlayerIdx(nextIdx);
            setMessage(`${next.name} ki baari! Dice roll karein.`);
          }
          return prev;
        });
      }
    },
    [currentPlayerIdx],
  );

  useEffect(() => {
    nextTurnRef.current = nextTurn;
  }, [nextTurn]);

  // Compute movable tokens after dice roll
  useEffect(() => {
    if (!diceRolled || players.length === 0) return;
    const p = players[currentPlayerIdx];
    if (!p) return;
    const movable: number[] = [];
    for (let i = 0; i < p.tokens.length; i++) {
      const t = p.tokens[i];
      if (!t || t.pos === 59) continue;
      if (t.pos === 0 && diceValue === 6) {
        movable.push(i);
        continue;
      }
      if (t.pos === 0) continue;
      const newPos = t.pos + diceValue;
      if (newPos <= 59) movable.push(i);
    }
    setMovableTokens(movable);
    if (movable.length === 0) {
      setMessage(`${p.name} ka koi token move nahi ho sakta. Turn pass.`);
      rollTimeoutRef.current = setTimeout(() => {
        nextTurnRef.current?.(diceValue);
      }, 1500);
    }
  }, [diceRolled, diceValue, players, currentPlayerIdx]);

  const acceptDisclaimer = () => {
    localStorage.setItem("dz_ludo_disclaimer_accepted", "true");
    setPhase("setup");
  };

  const startGame = () => {
    const newPlayers: Player[] = COLOR_NAMES.slice(0, numPlayers).map(
      (color, i) => ({
        color,
        name: playerNames[i] || `Player ${i + 1}`,
        tokens: [{ pos: 0 }, { pos: 0 }, { pos: 0 }, { pos: 0 }],
        active: i === 0,
      }),
    );
    setPlayers(newPlayers);
    setCurrentPlayerIdx(0);
    setDiceValue(1);
    setDiceRolled(false);
    setMovableTokens([]);
    setWinner(null);
    setShowWinnerScreen(false);
    setShowInterstitial(false);
    setMessage(
      `${newPlayers[0]?.name ?? "Player 1"} ki baari! Dice roll karein.`,
    );
    setPhase("playing");
  };

  const rollDice = useCallback(() => {
    if (diceRolled || rolling) return;
    setRolling(true);
    setMessage("");
    const anim = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
    }, 80);
    rollTimeoutRef.current = setTimeout(() => {
      clearInterval(anim);
      const val = Math.floor(Math.random() * 6) + 1;
      setDiceValue(val);
      setRolling(false);
      setDiceRolled(true);
    }, 650);
  }, [diceRolled, rolling]);

  const moveToken = useCallback(
    (tokenIdx: number) => {
      if (!diceRolled) return;
      const p = players[currentPlayerIdx];
      if (p) {
        const key = `${p.color}-${tokenIdx}`;
        setLandedToken(key);
        setTimeout(() => setLandedToken(null), 400);
      }

      setPlayers((prev) => {
        const updated: Player[] = prev.map((p) => ({
          ...p,
          tokens: p.tokens.map((t) => ({ ...t })),
        }));
        const player = updated[currentPlayerIdx];
        if (!player) return prev;

        const token = player.tokens[tokenIdx];
        if (!token) return prev;

        let newPos = token.pos;
        if (token.pos === 0 && diceValue === 6) {
          newPos = 1;
        } else if (token.pos > 0) {
          const candidate = token.pos + diceValue;
          if (candidate <= 59) newPos = candidate;
        }
        player.tokens[tokenIdx] = { pos: newPos };

        // Capture logic
        if (newPos >= 1 && newPos <= 52 && canCapture(player.color, newPos)) {
          const myCell = getTokenCell(player.color, { pos: newPos });
          if (myCell) {
            for (let oi = 0; oi < updated.length; oi++) {
              if (oi === currentPlayerIdx) continue;
              const other = updated[oi];
              if (!other) continue;
              for (let oti = 0; oti < other.tokens.length; oti++) {
                const ot = other.tokens[oti];
                if (!ot || ot.pos <= 0 || ot.pos > 52) continue;
                const otherCell = getTokenCell(other.color, ot);
                if (
                  otherCell &&
                  myCell[0] === otherCell[0] &&
                  myCell[1] === otherCell[1]
                ) {
                  other.tokens[oti] = { pos: 0 };
                  setMessage(
                    `${player.name} ne ${other.name} ka token capture kiya! 🎯`,
                  );
                }
              }
            }
          }
        }

        // Win check
        if (updated[currentPlayerIdx]?.tokens.every((t) => t.pos === 59)) {
          const w = updated[currentPlayerIdx];
          if (w) {
            setWinner(w);
            setShowInterstitial(true);
          }
        }

        return updated;
      });

      setDiceRolled(false);
      setMovableTokens([]);

      if (diceValue !== 6) {
        setPlayers((prev) => {
          const nextIdx = (currentPlayerIdx + 1) % prev.length;
          const next = prev[nextIdx];
          if (next) {
            setCurrentPlayerIdx(nextIdx);
            setMessage(`${next.name} ki baari! Dice roll karein.`);
          }
          return prev;
        });
      } else {
        setPlayers((prev) => {
          const p = prev[currentPlayerIdx];
          if (p) setMessage(`${p.name} ko 6 aaya! Ek aur chance!`);
          return prev;
        });
      }
    },
    [diceRolled, diceValue, currentPlayerIdx, players],
  );

  const cellTokens = useCallback(
    (row: number, col: number): { color: ColorName; tokenIdx: number }[] => {
      const result: { color: ColorName; tokenIdx: number }[] = [];
      for (const p of players) {
        for (let ti = 0; ti < p.tokens.length; ti++) {
          const t = p.tokens[ti];
          if (!t) continue;
          if (t.pos === 0) {
            const base = BASE_POSITIONS[p.color];
            if (base.some(([r, c]) => r === row && c === col)) {
              result.push({ color: p.color, tokenIdx: ti });
            }
            continue;
          }
          if (t.pos >= 59) continue;
          const cell = getTokenCell(p.color, t);
          if (cell && cell[0] === row && cell[1] === col) {
            result.push({ color: p.color, tokenIdx: ti });
          }
        }
      }
      return result;
    },
    [players],
  );

  const isMovableToken = useCallback(
    (color: ColorName, tokenIdx: number): boolean => {
      const p = players[currentPlayerIdx];
      return !!p && p.color === color && movableTokens.includes(tokenIdx);
    },
    [players, currentPlayerIdx, movableTokens],
  );

  // ─── Disabled ──────────────────────────────────────────────────────────────
  if (!isEnabled) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{
          background: "linear-gradient(160deg, #0a2e1a 0%, #051208 100%)",
        }}
        data-ocid="game.disabled_screen"
      >
        <div className="text-5xl mb-4">🎮</div>
        <h2 className="text-white text-xl font-bold mb-2">Game Section</h2>
        <p className="text-emerald-400/70 text-sm mb-6">
          Game section admin ne band kar rakha hai. Jald wapas aayega!
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-emerald-400 hover:text-white py-2 px-4 rounded-xl border border-emerald-700 transition-colors"
          data-ocid="game.exit_btn"
        >
          <ArrowLeft size={16} /> Home Jaao
        </button>
      </div>
    );
  }

  // ─── 18+ Disclaimer ────────────────────────────────────────────────────────
  if (phase === "disclaimer") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: "linear-gradient(160deg, #0a2e1a 0%, #051208 100%)",
        }}
        data-ocid="game.disclaimer_screen"
      >
        <div className="w-full max-w-sm bg-gray-900 rounded-3xl border border-emerald-800/50 p-6 space-y-5">
          <div className="text-center">
            <div className="text-5xl mb-3">⚠️</div>
            <h2 className="text-white font-bold text-xl">
              18+ Legal Disclaimer
            </h2>
            <p className="text-emerald-300 text-sm mt-1">कानूनी अस्वीकरण</p>
          </div>
          <div className="bg-black/30 rounded-2xl p-4 space-y-2 text-sm text-white/80 leading-relaxed">
            <p>यह game सिर्फ मनोरंजन के लिए है।</p>
            <p>इसमें real money gambling नहीं है।</p>
            <p>इस game को खेलने के लिए आपकी उम्र 18 वर्ष या उससे अधिक होनी चाहिए।</p>
            <p className="text-white/50 text-xs mt-2">
              This game is for entertainment only. Real money gambling is not
              involved. You must be 18 years or older to play.
            </p>
          </div>
          <label
            htmlFor="disclaimer-check"
            className="flex items-start gap-3 cursor-pointer"
          >
            <input
              id="disclaimer-check"
              type="checkbox"
              checked={disclaimerChecked}
              onChange={(e) => setDisclaimerChecked(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded accent-emerald-500 cursor-pointer flex-shrink-0"
              data-ocid="game.disclaimer_checkbox"
            />
            <span className="text-white/80 text-sm">
              मैं 18+ हूँ और उपरोक्त शर्तों से सहमत हूँ
            </span>
          </label>
          <button
            type="button"
            disabled={!disclaimerChecked}
            onClick={acceptDisclaimer}
            data-ocid="game.disclaimer_accept_btn"
            className="w-full py-3.5 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            style={{ background: "linear-gradient(135deg, #065f46, #10b981)" }}
          >
            ✅ Accept &amp; Continue
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full py-2 text-emerald-400/70 text-sm hover:text-emerald-400 transition-colors"
          >
            Wapas Jaao
          </button>
        </div>
      </div>
    );
  }

  // ─── Player Setup ──────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: "linear-gradient(160deg, #0a2e1a 0%, #051208 100%)",
        }}
        data-ocid="game.setup_screen"
      >
        <div className="w-full max-w-sm bg-gray-900 rounded-3xl border border-emerald-800/50 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-emerald-400 hover:text-white transition-colors p-1"
              aria-label="Go back to home"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-white font-bold text-xl">🎲 Ludo</h1>
              {/* Premium gold branding */}
              <p
                className="text-xs font-black tracking-widest"
                style={{
                  background: "linear-gradient(135deg, #FFD700, #FFA500)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "2px",
                  textShadow: "none",
                  filter: "drop-shadow(0 0 4px rgba(255,215,0,0.5))",
                }}
              >
                Digital Zindagi
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/rewards-wallet")}
              className="flex items-center gap-1.5 text-yellow-400 hover:text-yellow-300 transition-colors text-xs font-semibold"
              data-ocid="game.wallet_btn"
            >
              <Wallet size={16} /> Wallet
            </button>
          </div>

          <div>
            <p className="text-emerald-300 text-sm font-semibold mb-3">
              Kitne Khiladi? (2-4)
            </p>
            <div className="flex gap-2">
              {([2, 3, 4] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumPlayers(n)}
                  data-ocid={`game.player_count_${n}`}
                  className={`flex-1 py-3 rounded-xl font-bold text-base transition-all ${
                    numPlayers === n
                      ? "bg-emerald-600 text-white shadow-lg"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-emerald-300 text-sm font-semibold">
              Khiladi ke Naam
            </p>
            {COLOR_NAMES.slice(0, numPlayers).map((color, i) => (
              <div key={color} className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full flex-shrink-0 ${PLAYER_COLORS[color].bg}`}
                />
                <input
                  type="text"
                  value={playerNames[i] ?? ""}
                  onChange={(e) => {
                    const names = [...playerNames];
                    names[i] = e.target.value;
                    setPlayerNames(names);
                  }}
                  placeholder={`${color} Player`}
                  maxLength={12}
                  className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-500 transition-colors"
                  data-ocid={`game.player_name_${i}`}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={startGame}
            data-ocid="game.start_btn"
            className="w-full py-4 rounded-full font-black text-white text-lg transition-all active:scale-95 active:translate-y-0.5"
            style={{
              background:
                "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6B00 100%)",
              boxShadow:
                "0 8px 20px rgba(255,165,0,0.5), inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.2)",
              color: "#1a0a00",
              textShadow: "0 1px 2px rgba(255,255,255,0.3)",
              letterSpacing: "0.5px",
            }}
          >
            🎮 Game Shuru Karein!
          </button>
        </div>
      </div>
    );
  }

  // ─── Interstitial Ad after match ends ──────────────────────────────────────
  if (showInterstitial && winner) {
    return (
      <InterstitialAd
        phase="post"
        adBlocked={false}
        customAds={[]}
        onClose={() => {
          setShowInterstitial(false);
          setShowWinnerScreen(true);
        }}
      />
    );
  }

  // ─── Winner Screen ─────────────────────────────────────────────────────────
  if (showWinnerScreen && winner) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{
          background: "linear-gradient(160deg, #0a2e1a 0%, #051208 100%)",
        }}
        data-ocid="game.winner_screen"
      >
        <div className="text-7xl mb-4">🏆</div>
        <h1 className="text-yellow-300 font-black text-3xl mb-2">
          Mubarak ho!
        </h1>
        <div
          className={`w-6 h-6 rounded-full mx-auto mb-3 ${PLAYER_COLORS[winner.color].bg}`}
        />
        <p className="text-white font-bold text-2xl">{winner.name}</p>
        <p className="text-emerald-400 text-sm mt-1">
          {winner.color} Team — Winner!
        </p>
        <p className="text-yellow-400 font-semibold mt-3">+50 Points Earn!</p>
        <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
          <button
            type="button"
            onClick={startGame}
            data-ocid="game.play_again_btn"
            className="w-full py-3.5 rounded-full font-black text-lg active:translate-y-0.5 transition-all"
            style={{
              background:
                "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6B00 100%)",
              boxShadow:
                "0 8px 20px rgba(255,165,0,0.5), inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.2)",
              color: "#1a0a00",
            }}
          >
            🔄 Dobara Khelo
          </button>
          <button
            type="button"
            onClick={() => navigate("/rewards-wallet")}
            data-ocid="game.wallet_link_btn"
            className="w-full py-3 rounded-2xl font-bold text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/10 transition-colors"
          >
            <Wallet size={16} className="inline mr-1" />
            Wallet Dekhein
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full py-3 text-emerald-400/70 text-sm hover:text-emerald-400 transition-colors"
          >
            Home Jaao
          </button>
        </div>
      </div>
    );
  }

  // ─── Playing ────────────────────────────────────────────────────────────────
  const currentPlayer = players[currentPlayerIdx];
  const canRoll = !diceRolled && !rolling;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(160deg, #0a2e1a 0%, #051208 100%)",
      }}
      data-ocid="game.playing_screen"
    >
      <StyleInjector />

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-emerald-900/50 flex-shrink-0"
        style={{ background: "rgba(6,95,70,0.25)" }}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-emerald-400 hover:text-white transition-colors p-2 rounded-xl"
          aria-label="Exit game"
          data-ocid="game.exit_btn"
        >
          <ArrowLeft size={20} />
        </button>
        {/* Premium gold brand text */}
        <p
          className="font-black text-sm tracking-wider"
          style={{
            background: "linear-gradient(135deg, #FFD700, #FFA500)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 6px rgba(255,215,0,0.55))",
            letterSpacing: "2px",
          }}
        >
          🎲 Digital Zindagi Ludo
        </p>
        <button
          type="button"
          onClick={() => navigate("/rewards-wallet")}
          className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 transition-colors text-xs font-semibold"
          data-ocid="game.wallet_header_btn"
        >
          <Wallet size={14} /> Wallet
        </button>
      </div>

      {/* Player turn indicators */}
      <div className="px-4 py-2 flex items-center gap-2 flex-shrink-0">
        {players.map((p, i) => (
          <div
            key={p.color}
            className={`flex-1 py-1.5 rounded-xl text-center text-xs font-bold transition-all ${
              i === currentPlayerIdx
                ? `${PLAYER_COLORS[p.color].bg} text-white shadow-md scale-105`
                : "bg-gray-800 text-gray-500"
            }`}
            data-ocid={`game.player_indicator_${i}`}
          >
            {p.name}
          </div>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className="px-4 py-1 flex-shrink-0">
          <p className="text-center text-emerald-300 text-xs">{message}</p>
        </div>
      )}

      {/* Board */}
      <div className="flex-1 flex items-center justify-center px-2 py-2 overflow-hidden">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(15, 1fr)",
            gridTemplateRows: "repeat(15, 1fr)",
            width: "min(90vw, 420px)",
            height: "min(90vw, 420px)",
            borderRadius: "10px",
            overflow: "hidden",
            border: "3px solid rgba(255,215,0,0.35)",
            boxShadow:
              "0 0 30px rgba(255,215,0,0.18), 0 10px 40px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.2)",
          }}
          data-ocid="game.board"
        >
          {Array.from({ length: 225 }, (_, idx) => {
            const row = Math.floor(idx / 15);
            const col = idx % 15;
            const type = getCellType(row, col);
            const tokensHere = cellTokens(row, col);
            const isSafe = type === "safe";
            const isCenterStar = type === "center-star";
            const isCenter = type === "center" || isCenterStar;
            const cellStyle = getCellStyle(type);

            return (
              <div
                key={`cell-${row}-${col}`}
                className="relative flex items-center justify-center select-none"
                style={{
                  ...cellStyle,
                  minWidth: 0,
                  minHeight: 0,
                  border: "0.5px solid rgba(0,0,0,0.12)",
                }}
                data-ocid={`game.cell.${row}.${col}`}
              >
                {/* Center cell — big prominent profile placeholder + branding */}
                {isCenterStar && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                    {/* Profile photo placeholder */}
                    <div
                      style={{
                        width: "clamp(48px, 9vw, 88px)",
                        height: "clamp(48px, 9vw, 88px)",
                        borderRadius: "50%",
                        background:
                          "radial-gradient(circle at 35% 30%, #2d6a4f, #064e35 70%, #022c1a)",
                        border: "3px solid gold",
                        boxShadow:
                          "0 0 18px rgba(255,215,0,0.8), 0 0 6px rgba(255,215,0,0.5), inset 0 2px 4px rgba(255,255,255,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Camera
                        style={{
                          color: "rgba(255,215,0,0.85)",
                          width: "clamp(16px, 3.5vw, 32px)",
                          height: "clamp(16px, 3.5vw, 32px)",
                        }}
                      />
                    </div>
                    {/* Brand label below photo */}
                    <p
                      style={{
                        fontSize: "clamp(4px, 1vw, 8px)",
                        fontWeight: 900,
                        letterSpacing: "1px",
                        marginTop: "2px",
                        background: "linear-gradient(135deg, #FFD700, #FFA500)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        filter: "drop-shadow(0 0 3px rgba(255,215,0,0.6))",
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      DZ
                    </p>
                  </div>
                )}

                {/* Safe star marker */}
                {isSafe && tokensHere.length === 0 && (
                  <span
                    className="text-yellow-500"
                    style={{ fontSize: "clamp(6px, 1.5vw, 10px)" }}
                    aria-hidden="true"
                  >
                    ★
                  </span>
                )}

                {/* Non-center cells content */}
                {!isCenter && tokensHere.length > 0 && (
                  <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-px p-px">
                    {tokensHere.slice(0, 4).map(({ color, tokenIdx }) => {
                      const movable = isMovableToken(color, tokenIdx);
                      const tokenKey = `${color}-${tokenIdx}`;
                      const isLanding = landedToken === tokenKey;

                      return (
                        <button
                          key={tokenKey}
                          type="button"
                          aria-label={`${color} token ${tokenIdx + 1}`}
                          onClick={() => movable && moveToken(tokenIdx)}
                          style={{
                            width: "42%",
                            height: "42%",
                            minWidth: 4,
                            minHeight: 4,
                            background: TOKEN_GRADIENTS[color],
                            borderRadius: "50%",
                            border: movable
                              ? "1.5px solid rgba(255,255,255,0.9)"
                              : "1px solid rgba(0,0,0,0.3)",
                            boxShadow: movable
                              ? "0 4px 12px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.6)"
                              : "0 3px 8px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)",
                            cursor: movable ? "pointer" : "default",
                            position: "relative",
                            overflow: "hidden",
                            transition:
                              "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s ease",
                            animation: isLanding
                              ? "tokenLand 0.35s ease-out"
                              : movable
                                ? "pulse 1.2s ease-in-out infinite"
                                : "none",
                            zIndex: movable ? 10 : 1,
                          }}
                          data-ocid={`game.token.${color}.${tokenIdx}`}
                        >
                          {/* Top-left highlight for 3D sphere look */}
                          <span
                            style={{
                              position: "absolute",
                              top: "10%",
                              left: "10%",
                              width: "35%",
                              height: "30%",
                              borderRadius: "50%",
                              background:
                                "radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.75) 0%, transparent 70%)",
                              pointerEvents: "none",
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dice + Controls */}
      <div
        className="px-4 py-3 flex items-center justify-center gap-6 flex-shrink-0 border-t border-emerald-900/40"
        style={{ background: "rgba(0,0,0,0.4)" }}
        data-ocid="game.controls"
      >
        <DiceFace value={diceValue} rolling={rolling} />

        <div className="flex flex-col items-center gap-2">
          {currentPlayer && (
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: TOKEN_GRADIENTS[currentPlayer.color],
                  boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                  flexShrink: 0,
                }}
              />
              <span className="text-white text-xs font-semibold">
                {currentPlayer.name} ki baari
              </span>
            </div>
          )}

          {/* Premium gaming Roll button */}
          <button
            type="button"
            onClick={rollDice}
            disabled={!canRoll}
            data-ocid="game.roll_btn"
            style={{
              padding: "12px 32px",
              borderRadius: "50px",
              fontWeight: 900,
              fontSize: "16px",
              color: canRoll ? "#1a0a00" : "#ffffff",
              letterSpacing: "0.5px",
              border: "none",
              cursor: canRoll ? "pointer" : "not-allowed",
              background: canRoll
                ? "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6B00 100%)"
                : "rgba(75,85,99,0.8)",
              boxShadow: canRoll ? undefined : "none",
              animation: canRoll
                ? "rollPulse 1.8s ease-in-out infinite"
                : "none",
              transition: "transform 0.1s ease, filter 0.2s ease",
              textShadow: canRoll ? "0 1px 2px rgba(255,255,255,0.3)" : "none",
              opacity: canRoll ? 1 : 0.55,
            }}
            onMouseDown={(e) => {
              if (canRoll) {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 3px 8px rgba(255,165,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)";
              }
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
            }}
            onTouchStart={(e) => {
              if (canRoll) {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(2px)";
              }
            }}
            onTouchEnd={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "";
            }}
          >
            {rolling
              ? "⏳ Rolling…"
              : diceRolled
                ? `${diceValue} आया! ✅`
                : "🎲 Roll करें"}
          </button>
        </div>
      </div>

      {/* AdMob Banner */}
      <div
        className="flex items-center justify-center py-2 border-t border-emerald-900/30 flex-shrink-0"
        style={{ background: "rgba(0,0,0,0.4)", minHeight: "50px" }}
        data-ocid="game.banner_ad"
      >
        <div
          className="rounded-lg flex items-center justify-center"
          style={{
            width: "320px",
            height: "50px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span className="text-white/20 text-xs font-mono">
            {bannerUnitId
              ? `Ad: ${bannerUnitId.slice(0, 20)}…`
              : "Advertisement — Digital Zindagi"}
          </span>
        </div>
      </div>
    </div>
  );
}
