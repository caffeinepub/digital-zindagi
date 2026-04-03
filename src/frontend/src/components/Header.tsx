import { Globe, Menu, Search, User } from "lucide-react";
import { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Link, useNavigate } from "../lib/router";
import Sidebar from "./Sidebar";

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [langDropOpen, setLangDropOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const langRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
  };

  const langOptions: {
    value: "hinglish" | "hindi" | "english";
    label: string;
  }[] = [
    { value: "hinglish", label: "Hinglish" },
    { value: "hindi", label: "हिंदी" },
    { value: "english", label: "English" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-emerald-header shadow-emerald">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
          <button
            type="button"
            data-ocid="header.open_modal_button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Menu kholein"
          >
            <Menu size={22} />
          </button>

          <Link
            to="/"
            data-ocid="header.link"
            className="font-heading font-bold text-white text-lg whitespace-nowrap flex-shrink-0 mr-2"
          >
            Digital Zindagi
          </Link>

          <form onSubmit={handleSearch} className="flex-1 max-w-lg">
            <div className="flex items-center bg-white/15 rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
              <input
                data-ocid="header.search_input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search")}
                className="flex-1 bg-transparent text-white placeholder-white/60 px-3 py-2 text-sm outline-none"
                aria-label="Search"
              />
              <button
                type="submit"
                data-ocid="header.submit_button"
                className="p-2 text-white/80 hover:text-white"
                aria-label="Search karein"
              >
                <Search size={16} />
              </button>
            </div>
          </form>

          {/* Language Switcher */}
          <div ref={langRef} className="relative flex-shrink-0">
            <button
              type="button"
              data-ocid="header.toggle"
              onClick={() => setLangDropOpen((v) => !v)}
              className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
              aria-label={t("language")}
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

          <Link
            to={
              user
                ? user.role === "provider"
                  ? "/provider/dashboard"
                  : user.role === "admin"
                    ? "/admin/pin"
                    : "/login"
                : "/login"
            }
            data-ocid="header.link"
            className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Account"
          >
            <User size={22} />
          </Link>
        </div>
      </header>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
