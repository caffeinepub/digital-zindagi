import { Heart, Users, X, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useState } from "react";
import { type WeaponType, useGameStore } from "../stores/gameStore";
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

interface WeaponCard {
  id: WeaponType;
  icon: string;
  name: string;
  stat: string;
  description: string;
  borderColor: string;
  glowColor: string;
  animated?: boolean;
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
      localStorage.setItem("dz_game_power_boost", String(Date.now() + 30000));
    },
  },
];

const WEAPONS: WeaponCard[] = [
  {
    id: "rifle",
    icon: "🔫",
    name: "Assault Rifle",
    stat: "DMG: 20 | Rate: Fast | Range: Long",
    description: "Rapid-fire precision rifle. Perfect for crowd control.",
    borderColor: "rgba(0,255,136,0.5)",
    glowColor: "#00ff88",
  },
  {
    id: "shotgun",
    icon: "💥",
    name: "Shotgun",
    stat: "DMG: 30 | Rate: Slow | Range: Short",
    description: "Devastates enemies at close range. One shot, massive impact.",
    borderColor: "rgba(255,80,80,0.5)",
    glowColor: "#ff5050",
  },
  {
    id: "plasma",
    icon: "⚡",
    name: "Digital Plasma Gun",
    stat: "DMG: 25 | Rate: Medium | Range: Long",
    description: "Advanced energy weapon. Fires plasma bolts.",
    borderColor: "rgba(0,200,255,0.6)",
    glowColor: "#00c8ff",
    animated: true,
  },
];

interface Props {
  onClose: () => void;
}

export default function StoreModal({ onClose }: Props) {
  const { coins, addCoins, currentWeapon, setWeapon } = useGameStore();
  const [activeTab, setActiveTab] = useState<"items" | "weapons">("items");

  const handleBuy = useCallback(
    (item: StoreItem) => {
      if (coins < item.cost) return;
      addCoins(-item.cost);
      item.action(useGameStore.getState());
      SFX.storePurchase(0.6);
    },
    [coins, addCoins],
  );

  const handleSelectWeapon = useCallback(
    (weaponId: WeaponType) => {
      setWeapon(weaponId);
      SFX.storePurchase(0.5);
      setTimeout(onClose, 300);
    },
    [setWeapon, onClose],
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
        <div className="flex items-center justify-between mb-3">
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
          className="flex items-center gap-2 px-4 py-2 rounded-xl mb-3"
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
            <div className="text-xl font-bold" style={{ color: "#f0c040" }}>
              {coins} Coins
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex rounded-xl mb-4 p-1 gap-1"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("items")}
            className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
            style={{
              background:
                activeTab === "items" ? "rgba(240,192,64,0.2)" : "transparent",
              color: activeTab === "items" ? "#f0c040" : "#888",
              border:
                activeTab === "items"
                  ? "1px solid rgba(240,192,64,0.4)"
                  : "1px solid transparent",
            }}
            data-ocid="store-tab-items"
          >
            🗡️ Items
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("weapons")}
            className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
            style={{
              background:
                activeTab === "weapons"
                  ? "rgba(0,255,136,0.15)"
                  : "transparent",
              color: activeTab === "weapons" ? "#00ff88" : "#888",
              border:
                activeTab === "weapons"
                  ? "1px solid rgba(0,255,136,0.4)"
                  : "1px solid transparent",
            }}
            data-ocid="store-tab-weapons"
          >
            ⚔️ Weapons
          </button>
        </div>

        {/* Items Tab */}
        {activeTab === "items" && (
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
        )}

        {/* Weapons Tab */}
        {activeTab === "weapons" && (
          <div className="space-y-3">
            {WEAPONS.map((w) => {
              const isEquipped = currentWeapon === w.id;
              return (
                <motion.div
                  key={w.id}
                  whileHover={{ scale: 1.01 }}
                  className="p-3 rounded-xl relative"
                  style={{
                    background: isEquipped
                      ? "rgba(0,255,136,0.07)"
                      : "rgba(255,255,255,0.03)",
                    border: `1.5px solid ${isEquipped ? w.borderColor : "rgba(255,255,255,0.08)"}`,
                    boxShadow:
                      isEquipped && w.animated
                        ? `0 0 16px ${w.glowColor}55`
                        : isEquipped
                          ? `0 0 10px ${w.glowColor}33`
                          : "none",
                  }}
                  data-ocid={`weapon-card-${w.id}`}
                >
                  {/* Equipped badge */}
                  {isEquipped && (
                    <div
                      className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(0,255,136,0.2)",
                        color: "#00ff88",
                        border: "1px solid rgba(0,255,136,0.4)",
                      }}
                    >
                      ✓ EQUIPPED
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    {/* Weapon icon */}
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-3xl"
                      style={{
                        background: `${w.glowColor}15`,
                        border: `1px solid ${w.glowColor}40`,
                      }}
                    >
                      {w.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-white">
                        {w.name}
                      </div>
                      <div
                        className="text-xs font-semibold mt-0.5"
                        style={{ color: "#f0c040" }}
                      >
                        {w.stat}
                      </div>
                      <div
                        className="text-xs mt-1 leading-relaxed"
                        style={{ color: "#aaa" }}
                      >
                        {w.description}
                      </div>
                    </div>
                  </div>

                  {/* Select button */}
                  <button
                    type="button"
                    onClick={() => handleSelectWeapon(w.id)}
                    className="mt-3 w-full py-2 rounded-lg font-bold text-sm transition-all"
                    style={
                      isEquipped
                        ? {
                            background: "rgba(0,255,136,0.15)",
                            color: "#00ff88",
                            border: "1px solid rgba(0,255,136,0.4)",
                          }
                        : {
                            background: `linear-gradient(135deg, ${w.glowColor}22, ${w.glowColor}11)`,
                            color: "#fff",
                            border: `1px solid ${w.glowColor}50`,
                          }
                    }
                    data-ocid={`weapon-select-${w.id}`}
                  >
                    {isEquipped ? "EQUIPPED ✓" : "SELECT"}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
