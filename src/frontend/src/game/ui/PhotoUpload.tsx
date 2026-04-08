import { RefreshCw, Upload } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useGameStore } from "../stores/gameStore";

const STORAGE_KEY = "dz_game_hero_face";

export default function PhotoUpload() {
  const { heroFace, setHeroFace } = useGameStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore face from localStorage on mount
  useEffect(() => {
    if (!heroFace) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setHeroFace(saved);
    }
  }, [heroFace, setHeroFace]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Use canvas to crop center-square at 128x128 (face mapping)
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 128, 128);
        const base64 = canvas.toDataURL("image/jpeg", 0.85);
        localStorage.setItem(STORAGE_KEY, base64);
        setHeroFace(base64);
        URL.revokeObjectURL(url);
      };
      img.src = url;

      // Reset input for re-selection
      e.target.value = "";
    },
    [setHeroFace],
  );

  const handleClear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHeroFace(null);
  }, [setHeroFace]);

  return (
    <div
      className="w-full flex flex-col items-center gap-3"
      data-ocid="photo-upload"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        data-ocid="face-file-input"
      />

      {heroFace ? (
        <div className="flex flex-col items-center gap-2">
          <img
            src={heroFace}
            alt="Hero face preview"
            className="w-16 h-16 rounded-full object-cover"
            style={{
              border: "3px solid #f0c040",
              boxShadow: "0 0 12px rgba(240,192,64,0.4)",
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                border: "1px solid #f0c040",
                color: "#f0c040",
                background: "rgba(240,192,64,0.08)",
              }}
              data-ocid="change-face-btn"
            >
              <RefreshCw size={14} />
              चेहरा बदलें
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 rounded-xl text-xs opacity-50 hover:opacity-80 transition-opacity"
              style={{
                color: "#aaa",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              हटाएं
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all"
          style={{
            border: "1px dashed rgba(240,192,64,0.5)",
            color: "#f0c040",
            background: "rgba(240,192,64,0.06)",
          }}
          data-ocid="upload-face-btn"
        >
          <Upload size={18} />
          अपनी फोटो लगाओ (Hero Face)
        </button>
      )}
    </div>
  );
}
