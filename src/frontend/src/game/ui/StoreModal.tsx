import { Heart, Users, X, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useCallback } from "react";
import { useGameStore } from "../stores/gameStore";
import { SFX } from "../utils/audioEngine";

interface StoreItem {
  id: string;
  icon: React.ReactNode;
  titleHindi: string;
  titleEnglish: string;
  description: string;
  cost: number;
  action: (store: ReturnType<typeof useGameStore.getState>) => void;
}

const STORE_ITEMS: StoreItem[] = [
  {
    id: "heal",
    icon: <Heart size={24} className="text-red-400" />,
    titleHindi: "Hero ठीक करो",
    titleEnglish: "Heal +25 HP",
    description: "Hero ko 25 HP wapas milega",
    cost: 50,
    action: (s) => s.healHero(25),
  },
  {
    id: "revive",
    icon: <Users size={24} className="text-blue-400" />,
    titleHindi: "Partner Wapas Lao",
    titleEnglish: "Revive Partner",
    description: "Ek partner ko 50 HP ke saath wapas lao",
    cost: 75,
    action: (s) => {
      if (s.partnerHP[0] === 0) s.setPartnerHP(0, 50);
      else if (s.partnerHP[1] === 0) s.setPartnerHP(1, 50);
    },
  },
  {
    id: "power",
    icon: <Zap size={24} className="text-yellow-400" />,
    titleHindi: "Weapon Power Up",
    titleEnglish: "3x Damage (30s)",
    description: "30 second ke liye 3x attack power",
    cost: 100,
    action: (_s) => {
      // Power boost stored in localStorage for GameScene to detect
      localStorage.setItem("dz_game_power_boost", String(Date.now() + 30000));
    },
  },
];

interface Props {
  onClose: () => void;
}

export default function StoreModal({ onClose }: Props) {
  const { coins, addCoins } = useGameStore();

  const handleBuy = useCallback(
    (item: StoreItem) => {
      if (coins < item.cost) return;
      addCoins(-item.cost);
      item.action(useGameStore.getState());
      SFX.storePurchase(0.6);
    },
    [coins, addCoins],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)" }}
      data-ocid="store-modal"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="game-hud-bg rounded-2xl p-5 max-w-sm w-full mx-4 relative"
        style={{ border: "2px solid rgba(240,192,64,0.5)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold" style={{ color: "#f0c040" }}>
              🏪 डिजिटल ज़िंदगी स्टोर
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#aaa" }}>
              Coins se upgrades kharido
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            style={{ color: "#f0c040" }}
            aria-label="Close store"
            data-ocid="store-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Coin balance */}
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4"
          style={{
            background: "rgba(240,192,64,0.12)",
            border: "1px solid rgba(240,192,64,0.3)",
          }}
        >
          <span className="text-2xl">🪙</span>
          <div>
            <div className="text-xs opacity-60" style={{ color: "#aaa" }}>
              Aapke paas hain
            </div>
            <div className="text-2xl font-bold" style={{ color: "#f0c040" }}>
              {coins} Coins
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {STORE_ITEMS.map((item) => {
            const canAfford = coins >= item.cost;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${canAfford ? "rgba(240,192,64,0.2)" : "rgba(255,255,255,0.06)"}`,
                  opacity: canAfford ? 1 : 0.5,
                }}
                data-ocid={`store-item-${item.id}`}
              >
                <div className="flex-shrink-0">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-bold text-sm"
                    style={{ color: canAfford ? "#f0c040" : "#888" }}
                  >
                    {item.titleHindi}
                  </div>
                  <div className="text-xs" style={{ color: "#aaa" }}>
                    {item.description}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={() => handleBuy(item)}
                  className="flex-shrink-0 px-3 py-2 rounded-xl font-bold text-sm transition-all"
                  style={{
                    background: canAfford
                      ? "linear-gradient(135deg, #f0c040, #c89820)"
                      : "rgba(255,255,255,0.05)",
                    color: canAfford ? "#020503" : "#555",
                    border: `1px solid ${canAfford ? "#f0c040" : "transparent"}`,
                    cursor: canAfford ? "pointer" : "not-allowed",
                  }}
                  data-ocid={`buy-btn-${item.id}`}
                >
                  🪙{item.cost}
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
