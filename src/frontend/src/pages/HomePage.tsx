import { Leaf } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import CategoryGrid from "../components/CategoryGrid";
import Footer from "../components/Footer";
import Header from "../components/Header";
import HeroCarousel from "../components/HeroCarousel";
import ProviderCard from "../components/ProviderCard";
import { useLanguage } from "../contexts/LanguageContext";
import {
  useActiveBanners,
  useActiveProviders,
  useAllToggles,
} from "../hooks/useQueries";
import { Link, useNavigate } from "../lib/router";

export default function HomePage() {
  const { data: banners, isLoading: bannersLoading } = useActiveBanners();
  const { data: providers, isLoading: providersLoading } = useActiveProviders();
  const { data: toggles, isLoading: togglesLoading } = useAllToggles();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // 5-tap logo gesture
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // PWA Install
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then(() => {
      setInstallPrompt(null);
      setShowInstall(false);
    });
  };

  const handleLogoTap = () => {
    tapCountRef.current += 1;

    if (tapCountRef.current === 3) {
      toast("Admin gateway...", { duration: 1000 });
    }

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      navigate("/admin/pin");
      return;
    }

    // Reset after 2 seconds of no taps
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 2000);
  };

  const featuredProviders = providers?.slice(0, 6) ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-emerald-hero px-4 py-4">
          <div className="max-w-7xl mx-auto">
            {/* 5-tap Logo Trigger */}
            <div className="flex justify-center mb-3">
              <button
                type="button"
                data-ocid="home.button"
                onClick={handleLogoTap}
                className="flex items-center gap-2 select-none cursor-pointer bg-transparent border-0 p-2 rounded-xl hover:bg-white/5 transition-colors"
                aria-label="Digital Zindagi"
              >
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Leaf size={20} className="text-white" />
                </div>
                <span className="font-heading font-bold text-white text-2xl tracking-tight">
                  Digital Zindagi
                </span>
              </button>
            </div>
            <HeroCarousel banners={banners} loading={bannersLoading} />
          </div>
        </section>

        {/* Tagline Banner */}
        <section className="bg-emerald-header px-4 py-3">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-white font-semibold text-base sm:text-lg tracking-wide">
              डिजिटल जिंदगी से जुड़ो और लोकल सर्विस का फायदा उठाओ
            </p>
          </div>
        </section>

        {/* PWA Install Banner */}
        {showInstall && (
          <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📲</span>
                <span className="text-sm font-medium text-foreground">
                  Digital Zindagi app install karein
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  data-ocid="home.install_button"
                  onClick={handleInstall}
                  className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90"
                >
                  Install App
                </button>
                <button
                  type="button"
                  onClick={() => setShowInstall(false)}
                  className="text-muted-foreground text-xs px-2"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="bg-white border-b border-border px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = (
                  e.currentTarget.elements.namedItem("q") as HTMLInputElement
                ).value;
                if (q.trim())
                  window.location.href = `/search?q=${encodeURIComponent(q.trim())}`;
              }}
              className="flex gap-2"
            >
              <input
                name="q"
                data-ocid="home.search_input"
                type="text"
                placeholder={t("search")}
                className="flex-1 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring bg-white"
                aria-label="Search"
              />
              <button
                type="submit"
                data-ocid="home.submit_button"
                className="bg-primary text-primary-foreground px-5 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                {t("searchBtn")}
              </button>
            </form>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading font-bold text-2xl text-foreground">
                {t("popularServices")}
              </h2>
            </div>
            <CategoryGrid toggles={toggles} loading={togglesLoading} />
          </motion.div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-8 border-t border-border">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading font-bold text-2xl text-foreground">
                {t("featuredProviders")} ⭐
              </h2>
              <Link
                to="/search"
                data-ocid="home.link"
                className="text-sm text-primary font-medium hover:underline"
              >
                {t("viewAll")} &rarr;
              </Link>
            </div>

            {providersLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }, (_, i) => `skel-${i}`).map((sk) => (
                  <div
                    key={sk}
                    className="h-40 bg-gray-100 animate-pulse rounded-2xl"
                  />
                ))}
              </div>
            ) : featuredProviders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredProviders.map((p, i) => (
                  <ProviderCard
                    key={p.userId.toString()}
                    profile={p}
                    index={i + 1}
                  />
                ))}
              </div>
            ) : (
              <div
                data-ocid="providers.empty_state"
                className="text-center py-12 text-muted-foreground"
              >
                <p className="text-4xl mb-3">🏪</p>
                <p className="font-medium">Abhi koi provider nahi hai</p>
                <p className="text-sm mt-1">
                  Provider ban-o aur pehle list mein aao!
                </p>
                <Link
                  to="/signup"
                  data-ocid="providers.primary_button"
                  className="inline-block mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  {t("providerSignup")}
                </Link>
              </div>
            )}
          </motion.div>
        </section>

        <section className="px-4 mb-8">
          <div className="bg-emerald-header max-w-7xl mx-auto rounded-2xl">
            <div className="px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-heading font-bold text-white text-xl mb-1">
                  {t("registerBusiness")}
                </h3>
                <p className="text-white/75 text-sm">
                  Register karo aur hazaro customers tak pahuncho. Bilkul free!
                </p>
              </div>
              <Link
                to="/signup"
                data-ocid="home.primary_button"
                className="bg-white text-emerald-800 font-bold px-8 py-3 rounded-full hover:bg-emerald-50 transition-colors whitespace-nowrap"
              >
                {t("registerNow")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
