import { ShoppingBag } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import ProviderCard from "../components/ProviderCard";
import { useProvidersByCategory } from "../hooks/useQueries";
import { useParams } from "../lib/router";
import { OrderModal } from "./OrdersPage";

const CATEGORY_EMOJIS: Record<string, string> = {
  Scrap: "♻️",
  Doctor: "🏥",
  Market: "🛒",
  Labor: "👷",
  Electronics: "📱",
  Plumber: "🔧",
  Carpenter: "🪚",
  Tutor: "📚",
  Electrician: "⚡",
  Painter: "🎨",
  Tailor: "✂️",
  Salon: "💇",
};

export default function CategoryPage() {
  const { categoryName } = useParams<{ categoryName: string }>();
  const { data: providers, isLoading } = useProvidersByCategory(
    categoryName ?? "",
  );
  const emoji = CATEGORY_EMOJIS[categoryName ?? ""] ?? "🏪";

  const [orderModal, setOrderModal] = useState<{
    open: boolean;
    providerId: string;
    providerName: string;
  }>({ open: false, providerId: "", providerName: "" });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="bg-emerald-header text-white px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-heading font-bold text-2xl">
            {emoji} {categoryName} Providers
          </h1>
          <p className="text-white/70 text-sm mt-1">
            Is category ke sare approved providers
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {isLoading ? (
          <div
            data-ocid="category.loading_state"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {Array.from({ length: 6 }, (_, i) => `skel-${i}`).map((sk) => (
              <div
                key={sk}
                className="h-40 bg-gray-100 animate-pulse rounded-2xl"
              />
            ))}
          </div>
        ) : providers && providers.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {providers.map((p, i) => (
              <div key={p.userId.toString()} className="relative">
                <ProviderCard profile={p} index={i + 1} />
                <button
                  type="button"
                  data-ocid={`category.primary_button.${i + 1}`}
                  onClick={() =>
                    setOrderModal({
                      open: true,
                      providerId: p.userId.toString(),
                      providerName: p.shopName || p.category,
                    })
                  }
                  className="absolute bottom-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md hover:opacity-90 transition-opacity"
                >
                  <ShoppingBag size={12} /> Order
                </button>
              </div>
            ))}
          </motion.div>
        ) : (
          <div
            data-ocid="category.empty_state"
            className="text-center py-20 text-muted-foreground"
          >
            <p className="text-5xl mb-4">{emoji}</p>
            <p className="font-semibold text-lg">Koi result nahi mila</p>
            <p className="text-sm mt-1">
              {categoryName} category mein abhi koi provider nahi hai
            </p>
          </div>
        )}
      </main>

      <OrderModal
        open={orderModal.open}
        onClose={() => setOrderModal((prev) => ({ ...prev, open: false }))}
        providerId={orderModal.providerId}
        providerName={orderModal.providerName}
      />

      <Footer />
    </div>
  );
}
