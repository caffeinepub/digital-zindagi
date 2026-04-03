import { Calculator, Facebook, Instagram, Youtube } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import CategoryGrid, { ALL_CATEGORIES } from "../components/CategoryGrid";
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

interface SocialSettings {
  facebook: boolean;
  instagram: boolean;
  whatsapp: boolean;
  youtube: boolean;
  facebookUrl: string;
  instagramUrl: string;
  whatsappUrl: string;
  youtubeUrl: string;
}

interface AffiliateSettings {
  enabled: boolean;
  title: string;
  description: string;
  link: string;
}

function readSocialSettings(): SocialSettings {
  try {
    const raw = localStorage.getItem("dz_social_settings");
    if (!raw)
      return {
        facebook: false,
        instagram: false,
        whatsapp: false,
        youtube: false,
        facebookUrl: "",
        instagramUrl: "",
        whatsappUrl: "",
        youtubeUrl: "",
      };
    const parsed = JSON.parse(raw);
    return {
      facebook: parsed.facebook ?? false,
      instagram: parsed.instagram ?? false,
      whatsapp: parsed.whatsapp ?? false,
      youtube: parsed.youtube ?? false,
      facebookUrl: parsed.facebookUrl ?? "",
      instagramUrl: parsed.instagramUrl ?? "",
      whatsappUrl: parsed.whatsappUrl ?? "",
      youtubeUrl: parsed.youtubeUrl ?? "",
    };
  } catch {
    return {
      facebook: false,
      instagram: false,
      whatsapp: false,
      youtube: false,
      facebookUrl: "",
      instagramUrl: "",
      whatsappUrl: "",
      youtubeUrl: "",
    };
  }
}

function readAffiliateSettings(): AffiliateSettings {
  try {
    const raw = localStorage.getItem("dz_affiliate_settings");
    if (!raw)
      return {
        enabled: false,
        title: "Affiliate Marketing",
        description: "Paisa kamao Digital Zindagi se!",
        link: "",
      };
    const parsed = JSON.parse(raw);
    return {
      enabled: parsed.enabled ?? false,
      title: parsed.title ?? "Affiliate Marketing",
      description: parsed.description ?? "Paisa kamao Digital Zindagi se!",
      link: parsed.link ?? "",
    };
  } catch {
    return {
      enabled: false,
      title: "Affiliate Marketing",
      description: "Paisa kamao Digital Zindagi se!",
      link: "",
    };
  }
}

// WhatsApp icon as SVG since lucide doesn't have it
function WhatsAppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.14.564 4.148 1.55 5.88L0 24l6.335-1.524A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.092-1.424l-.364-.217-3.768.906.952-3.673-.237-.377A9.779 9.779 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
    </svg>
  );
}

export default function HomePage() {
  const { data: banners, isLoading: bannersLoading } = useActiveBanners();
  const { data: providers, isLoading: providersLoading } = useActiveProviders();
  const { data: toggles, isLoading: togglesLoading } = useAllToggles();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // 5-tap logo gesture
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [socialSettings, setSocialSettings] =
    useState<SocialSettings>(readSocialSettings);
  const [affiliateSettings, setAffiliateSettings] = useState<AffiliateSettings>(
    readAffiliateSettings,
  );

  // Re-read settings on focus (in case admin changed them)
  useEffect(() => {
    const onFocus = () => {
      setSocialSettings(readSocialSettings());
      setAffiliateSettings(readAffiliateSettings());
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleLogoTap = () => {
    tapCountRef.current += 1;

    if (tapCountRef.current === 3) {
      toast("Admin gateway...", { duration: 1000 });
    }

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      navigate("/admin");
      return;
    }

    // Reset after 2 seconds of no taps
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 2000);
  };

  const featuredProviders = providers?.slice(0, 6) ?? [];

  // Read lowest 1-month price from category localStorage settings
  const lowestPrice = useMemo(() => {
    const prices = ALL_CATEGORIES.flatMap((cat) => {
      try {
        const d = JSON.parse(
          localStorage.getItem(`dz_cat_row_${cat.name}`) ?? "{}",
        );
        return d.m1 ? [Number(d.m1)] : [];
      } catch {
        return [];
      }
    });
    return prices.length > 0 ? Math.min(...prices) : null;
  }, []);

  const enabledSocialPlatforms = [
    {
      key: "facebook",
      enabled: socialSettings.facebook,
      url: socialSettings.facebookUrl,
      icon: <Facebook size={22} />,
      color: "bg-blue-600",
      label: "Facebook",
    },
    {
      key: "instagram",
      enabled: socialSettings.instagram,
      url: socialSettings.instagramUrl,
      icon: <Instagram size={22} />,
      color: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
      label: "Instagram",
    },
    {
      key: "whatsapp",
      enabled: socialSettings.whatsapp,
      url: socialSettings.whatsappUrl,
      icon: <WhatsAppIcon size={22} />,
      color: "bg-green-500",
      label: "WhatsApp",
    },
    {
      key: "youtube",
      enabled: socialSettings.youtube,
      url: socialSettings.youtubeUrl,
      icon: <Youtube size={22} />,
      color: "bg-red-600",
      label: "YouTube",
    },
  ].filter((p) => p.enabled);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-emerald-hero px-4 py-4">
          <div className="max-w-7xl mx-auto">
            {/* Logo row */}
            <div className="flex flex-col items-center mb-3 gap-2">
              <button
                type="button"
                data-ocid="home.button"
                onClick={handleLogoTap}
                className="flex items-center gap-2 select-none cursor-pointer bg-transparent border-0 p-2 rounded-xl hover:bg-white/5 transition-colors"
                aria-label="Digital Zindagi"
              >
                <img
                  src="/assets/generated/dz-logo-transparent.dim_512x512.png"
                  alt="Digital Zindagi Logo"
                  className="w-10 h-10 rounded-xl object-contain"
                />
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

        {/* Rate Calculator — Primary Feature Button */}
        <section className="max-w-7xl mx-auto px-4 pt-6 pb-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <button
              type="button"
              onClick={() => navigate("/scrap-calculator")}
              data-ocid="home.rate_calculator_button"
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-5 flex items-center gap-4 shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-emerald-600 transition-all active:scale-[0.99]"
            >
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Calculator size={32} className="text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="font-heading font-bold text-xl">
                  🧮 Rate Calculator
                </p>
                <p className="text-white/80 text-sm mt-0.5">
                  Scrap ka sahi daam pata karein — Lohaa, Kaagaz, Taamba
                </p>
              </div>
              <div className="ml-auto text-white/60 text-2xl flex-shrink-0">
                →
              </div>
            </button>
          </motion.div>
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
                  {lowestPrice != null
                    ? `Sirf ₹${lowestPrice}/maah mein apna digital shop shuru karein!`
                    : "Register karo aur hazaro customers tak pahuncho. Bilkul free!"}
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

        {/* Affiliate Marketing Banner */}
        {affiliateSettings.enabled && (
          <section className="px-4 mb-6 max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 rounded-2xl p-6 shadow-lg"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">💰</span>
                    <h3 className="font-heading font-bold text-white text-xl">
                      {affiliateSettings.title}
                    </h3>
                  </div>
                  <p className="text-white/85 text-sm">
                    {affiliateSettings.description}
                  </p>
                </div>
                {affiliateSettings.link && (
                  <a
                    href={affiliateSettings.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ocid="home.primary_button"
                    className="flex-shrink-0 bg-white text-emerald-700 font-bold px-7 py-2.5 rounded-full hover:bg-emerald-50 transition-colors text-sm shadow-md"
                  >
                    Join Now →
                  </a>
                )}
              </div>
            </motion.div>
          </section>
        )}

        {/* Social Media Icons */}
        {enabledSocialPlatforms.length > 0 && (
          <section className="px-4 pb-8 max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="bg-white border border-border rounded-2xl p-5 shadow-card"
            >
              <p className="text-center text-sm font-semibold text-muted-foreground mb-4">
                Hamare Social Media par Follow Karein
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                {enabledSocialPlatforms.map((platform) => (
                  <a
                    key={platform.key}
                    href={platform.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ocid="home.link"
                    aria-label={platform.label}
                    className={`w-12 h-12 rounded-full text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform ${platform.color}`}
                  >
                    {platform.icon}
                  </a>
                ))}
              </div>
            </motion.div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
