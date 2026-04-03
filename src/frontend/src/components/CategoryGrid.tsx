import { motion } from "motion/react";
import { Link } from "../lib/router";

export const ALL_CATEGORIES = [
  {
    name: "Scrap",
    hinglish: "Kabadiwala",
    emoji: "\u267b\ufe0f",
    color: "from-green-400 to-green-600",
  },
  {
    name: "Doctor",
    hinglish: "Online Doctor",
    emoji: "\ud83c\udfe5",
    color: "from-red-400 to-red-600",
  },
  {
    name: "Market",
    hinglish: "Local Market",
    emoji: "\ud83d\uded2",
    color: "from-orange-400 to-orange-600",
  },
  {
    name: "Labor",
    hinglish: "Expert Labor",
    emoji: "\ud83d\udc77",
    color: "from-yellow-400 to-yellow-600",
  },
  {
    name: "Electronics",
    hinglish: "Electronics",
    emoji: "\ud83d\udcf1",
    color: "from-blue-400 to-blue-600",
  },
  {
    name: "Plumber",
    hinglish: "Plumber",
    emoji: "\ud83d\udd27",
    color: "from-cyan-400 to-cyan-600",
  },
  {
    name: "Carpenter",
    hinglish: "Carpenter",
    emoji: "\ud83e\ude9a",
    color: "from-amber-400 to-amber-600",
  },
  {
    name: "Tutor",
    hinglish: "Online Tutor",
    emoji: "\ud83d\udcda",
    color: "from-purple-400 to-purple-600",
  },
  {
    name: "Electrician",
    hinglish: "Electrician",
    emoji: "\u26a1",
    color: "from-yellow-300 to-yellow-500",
  },
  {
    name: "Painter",
    hinglish: "Painter",
    emoji: "\ud83c\udfa8",
    color: "from-pink-400 to-pink-600",
  },
  {
    name: "Tailor",
    hinglish: "Darzi",
    emoji: "\u2702\ufe0f",
    color: "from-violet-400 to-violet-600",
  },
  {
    name: "Salon",
    hinglish: "Salon",
    emoji: "\ud83d\udc87",
    color: "from-rose-400 to-rose-600",
  },
];

interface Props {
  toggles?: [string, boolean][];
  loading?: boolean;
}

export default function CategoryGrid({ toggles, loading }: Props) {
  const enabledNames = toggles
    ? new Set(toggles.filter(([, v]) => v).map(([k]) => k))
    : null;

  const visible = enabledNames
    ? ALL_CATEGORIES.filter(
        (c) => enabledNames.has(c.name) || enabledNames.size === 0,
      )
    : ALL_CATEGORIES;

  const displayCats = visible.length > 0 ? visible : ALL_CATEGORIES;

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {displayCats.map((cat, i) => (
        <motion.div
          key={cat.name}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <Link
            to={`/category/${encodeURIComponent(cat.name)}`}
            data-ocid={`categories.item.${i + 1}`}
            className="flex items-center gap-3 bg-white rounded-2xl border border-border shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 p-3"
          >
            <div
              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}
            >
              {cat.emoji}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm leading-tight truncate">
                {cat.hinglish}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {cat.name}
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
