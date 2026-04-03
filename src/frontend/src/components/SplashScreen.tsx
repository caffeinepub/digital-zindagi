import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const SPLASH_KEY = "dz_splash_shown";

export default function SplashScreen({
  children,
}: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem(SPLASH_KEY);
  });

  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem(SPLASH_KEY, "true");
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [showSplash]);

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-emerald-hero"
            data-ocid="splash.card"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.1,
                duration: 0.5,
                type: "spring",
                bounce: 0.3,
              }}
              className="flex flex-col items-center gap-5"
            >
              <img
                src="/assets/generated/dz-logo-transparent.dim_512x512.png"
                alt="Digital Zindagi Logo"
                className="w-28 h-28 rounded-3xl shadow-2xl"
              />
              <div className="text-center">
                <h1 className="text-white text-3xl font-heading font-bold tracking-wide">
                  Digital Zindagi
                </h1>
                <p className="text-white/75 text-sm mt-2">डिजिटल जिंदगी से जुड़ो</p>
              </div>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 1.6, ease: "easeInOut" }}
                className="h-1 w-40 bg-white/40 rounded-full origin-left"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {!showSplash && children}
    </>
  );
}
