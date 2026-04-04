import { Globe, Menu } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigate } from "../lib/router";
import Sidebar from "./Sidebar";

// Updated admin credentials (V162)
const ADMIN_EMAIL = "sushilkumar12022@gmail.com";
const ADMIN_PASSWORD = "123456";
const ADMIN_PIN = "12345";

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langDropOpen, setLangDropOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const langRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // 5-tap secret admin entry
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showAdminPopup, setShowAdminPopup] = useState(false);
  const [popupEmail, setPopupEmail] = useState("");
  const [popupPin, setPopupPin] = useState("");
  const [popupError, setPopupError] = useState("");

  function handleLogoTap() {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setShowAdminPopup(true);
      setPopupEmail("");
      setPopupPin("");
      setPopupError("");
    } else {
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 2000);
    }
  }

  function handleAdminLogin() {
    const storedEmail = localStorage.getItem("dz_admin_email") ?? ADMIN_EMAIL;
    const storedPassword =
      localStorage.getItem("dz_admin_password") ?? ADMIN_PASSWORD;
    const storedPin = localStorage.getItem("dz_admin_pin") ?? ADMIN_PIN;

    // Accept email+PIN OR email+password
    const emailOk =
      popupEmail.trim().toLowerCase() === storedEmail.toLowerCase();
    const pinOk = popupPin.trim() === storedPin;
    // also allow password in PIN field for flexibility
    const passwordOk = popupPin.trim() === storedPassword;

    if (emailOk && (pinOk || passwordOk)) {
      sessionStorage.setItem("adminVerified", "true");
      setShowAdminPopup(false);
      toast.success("एडमिन पैनल में आपका स्वागत है!");
      navigate("/admin");
    } else {
      setPopupError("ईमेल या PIN गलत है। दोबारा कोशिश करें।");
    }
  }

  const langOptions: {
    value: "hinglish" | "hindi" | "english";
    label: string;
  }[] = [
    { value: "hinglish", label: "Hinglish" },
    { value: "hindi", label: "हिंदी" },
    { value: "english", label: "English" },
  ];

  void t;

  return (
    <>
      <header className="sticky top-0 z-40 bg-emerald-header shadow-emerald">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
          {/* Left: Hamburger Menu */}
          <button
            type="button"
            data-ocid="header.open_modal_button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Menu kholein"
          >
            <Menu size={22} />
          </button>

          {/* Center: Logo + Name — 5-tap secret admin entry */}
          <button
            type="button"
            data-ocid="header.logo_tap"
            onClick={handleLogoTap}
            className="font-heading font-bold text-white text-lg whitespace-nowrap flex-1 flex items-center gap-2 min-w-0 bg-transparent border-0 cursor-pointer p-0 text-left"
            aria-label="Digital Zindagi"
          >
            <img
              src="/logo.png"
              alt="Digital Zindagi Logo"
              className="header-logo w-8 h-8 rounded-md flex-shrink-0"
              style={{ padding: "5px", objectFit: "contain" }}
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.src = "/assets/generated/dz-logo-192.dim_192x192.png";
                img.onerror = () => {
                  img.src =
                    "/assets/generated/dz-logo-transparent.dim_512x512.png";
                  img.onerror = () => {
                    img.style.display = "none";
                  };
                };
              }}
            />
            <span className="truncate">Digital Zindagi</span>
          </button>

          {/* Language Switcher */}
          <div ref={langRef} className="relative flex-shrink-0">
            <button
              type="button"
              data-ocid="header.toggle"
              onClick={() => setLangDropOpen((v) => !v)}
              className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
              aria-label="Language"
              aria-expanded={langDropOpen}
            >
              <Globe size={18} />
              <span className="text-xs font-medium hidden sm:inline">
                {lang === "hinglish" ? "HG" : lang === "hindi" ? "HI" : "EN"}
              </span>
            </button>
            {langDropOpen && (
              <div
                className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-border py-1 min-w-[120px] z-50"
                role="menu"
              >
                {langOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="menuitem"
                    data-ocid="header.button"
                    onClick={() => {
                      setLang(opt.value);
                      setLangDropOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-accent ${
                      lang === opt.value
                        ? "text-primary font-semibold"
                        : "text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Settings icon removed — use 5-tap on logo for admin access */}
        </div>
      </header>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Secret Admin Login Popup */}
      {showAdminPopup && (
        <div
          role="presentation"
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAdminPopup(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowAdminPopup(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 max-w-[90vw]">
            <div className="flex flex-col items-center mb-4">
              <img
                src="/logo.png"
                alt="Digital Zindagi"
                className="w-12 h-12 rounded-xl mb-2"
                style={{ padding: "4px", objectFit: "contain" }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <h2 className="text-lg font-bold text-gray-800">एडमिन लॉगिन</h2>
              <p className="text-xs text-gray-500 mt-1">
                Digital Zindagi Admin
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="admin-popup-email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  ईमेल
                </label>
                <input
                  id="admin-popup-email"
                  type="email"
                  value={popupEmail}
                  onChange={(e) => setPopupEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                />
              </div>
              <div>
                <label
                  htmlFor="admin-popup-pin"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  PIN (5 अंक)
                </label>
                <input
                  id="admin-popup-pin"
                  type="password"
                  value={popupPin}
                  onChange={(e) => setPopupPin(e.target.value)}
                  placeholder="12345"
                  maxLength={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                />
              </div>

              {popupError && (
                <p className="text-red-500 text-xs text-center">{popupError}</p>
              )}

              <button
                type="button"
                onClick={handleAdminLogin}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
              >
                एडमिन पैनल खोलें
              </button>
              <button
                type="button"
                onClick={() => setShowAdminPopup(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-colors text-sm"
              >
                रद्द करें
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
