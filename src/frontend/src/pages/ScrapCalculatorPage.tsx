import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator, Plus, RotateCcw, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AdMobBanner, { useAdMobBannerVisible } from "../components/AdMobBanner";
import Footer from "../components/Footer";
import Header from "../components/Header";

interface ScrapRow {
  id: number;
  item: string;
  weight: string;
  rate: string;
}

let nextId = 4;

function getAdminRates(): { lohaa: string; kaagaz: string; taamba: string } {
  try {
    const stored = JSON.parse(localStorage.getItem("dz_scrap_rates") ?? "{}");
    if (stored.lohaa || stored.kaagaz || stored.taamba) return stored;
  } catch {}
  return { lohaa: "25", kaagaz: "8", taamba: "450" };
}

function rowTotal(row: ScrapRow): number {
  const w = Number.parseFloat(row.weight) || 0;
  const r = Number.parseFloat(row.rate) || 0;
  return w * r;
}

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ScrapCalculatorPage() {
  const bannerVisible = useAdMobBannerVisible();
  const [rows, setRows] = useState<ScrapRow[]>(() => {
    const rates = getAdminRates();
    return [
      { id: 1, item: "Lohaa (Iron)", weight: "", rate: rates.lohaa },
      { id: 2, item: "Kaagaz (Paper)", weight: "", rate: rates.kaagaz },
      { id: 3, item: "Taamba (Copper)", weight: "", rate: rates.taamba },
    ];
  });
  const [adminRatesLoaded, setAdminRatesLoaded] = useState(false);

  // Sync rates from admin panel on mount
  useEffect(() => {
    const rates = getAdminRates();
    const hasCustomRates =
      rates.lohaa !== "25" || rates.kaagaz !== "8" || rates.taamba !== "450";
    if (hasCustomRates) {
      setAdminRatesLoaded(true);
      setRows((prev) =>
        prev.map((r) => {
          if (r.item === "Lohaa (Iron)") return { ...r, rate: rates.lohaa };
          if (r.item === "Kaagaz (Paper)") return { ...r, rate: rates.kaagaz };
          if (r.item === "Taamba (Copper)") return { ...r, rate: rates.taamba };
          return r;
        }),
      );
    }
  }, []);

  const grandTotal = rows.reduce((sum, row) => sum + rowTotal(row), 0);

  const updateRow = (id: number, field: keyof ScrapRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: nextId++, item: "", weight: "", rate: "" },
    ]);
  };

  const removeRow = (id: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleCalculate = () => {
    toast.success("Calculation Complete! ✅", {
      description: `Grand Total: ${formatINR(grandTotal)}`,
    });
  };

  const handleReset = () => {
    setRows((prev) => prev.map((r) => ({ ...r, weight: "" })));
    toast("Reset ho gaya! Weights clear kar diye.");
  };

  const handleReloadRates = () => {
    const rates = getAdminRates();
    setRows((prev) =>
      prev.map((r) => {
        if (r.item === "Lohaa (Iron)") return { ...r, rate: rates.lohaa };
        if (r.item === "Kaagaz (Paper)") return { ...r, rate: rates.kaagaz };
        if (r.item === "Taamba (Copper)") return { ...r, rate: rates.taamba };
        return r;
      }),
    );
    toast.success("Admin rates reload ho gayi!");
  };

  return (
    <div
      className={`min-h-screen flex flex-col${bannerVisible ? " pt-[50px]" : ""}`}
    >
      <AdMobBanner />
      <Header />

      {/* Page Header Band */}
      <div className="bg-emerald-header text-white px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading font-bold text-2xl md:text-3xl">
            ♻️ Scrap Calculator
          </h1>
          <p className="text-white/75 text-sm mt-1">
            Apne scrap ka sahi rate calculate karein
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-2xl mx-auto px-4 py-6 w-full">
        {/* Table Header (desktop) */}
        <div className="hidden sm:grid grid-cols-[1fr_100px_110px_110px_44px] gap-2 mb-2 px-1">
          {["Item ka Naam", "Weight (KG)", "Rate (₹/KG)", "Total", ""].map(
            (h) => (
              <span
                key={h}
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                {h}
              </span>
            ),
          )}
        </div>

        {/* Rows */}
        <div className="space-y-3" data-ocid="calculator.list">
          <AnimatePresence initial={false}>
            {rows.map((row, i) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
                data-ocid={`calculator.item.${i + 1}`}
                className="bg-card border border-border rounded-2xl p-3 shadow-sm"
              >
                {/* Mobile label row */}
                <div className="sm:hidden flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Item {i + 1}
                  </span>
                  <button
                    type="button"
                    data-ocid={`calculator.delete_button.${i + 1}`}
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length <= 1}
                    className="p-1.5 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Row hatao"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Mobile stacked inputs */}
                <div className="sm:hidden grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground mb-1 block">
                      Item ka Naam
                    </span>
                    <Input
                      id={`item-${row.id}`}
                      data-ocid={`calculator.input.${i + 1}`}
                      value={row.item}
                      onChange={(e) =>
                        updateRow(row.id, "item", e.target.value)
                      }
                      placeholder="e.g. Lohaa, Taamba..."
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground mb-1 block">
                      Weight (KG)
                    </span>
                    <Input
                      id={`weight-${row.id}`}
                      data-ocid={`calculator.input.${i + 1}`}
                      type="number"
                      value={row.weight}
                      onChange={(e) =>
                        updateRow(row.id, "weight", e.target.value)
                      }
                      placeholder="0"
                      min="0"
                      step="0.1"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground mb-1 block">
                      Rate (₹/KG)
                    </span>
                    <Input
                      id={`rate-${row.id}`}
                      data-ocid={`calculator.input.${i + 1}`}
                      type="number"
                      value={row.rate}
                      onChange={(e) =>
                        updateRow(row.id, "rate", e.target.value)
                      }
                      placeholder="0"
                      min="0"
                      step="0.5"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground mb-1 block">
                      Total
                    </span>
                    <div className="h-9 flex items-center px-3 rounded-md bg-accent/50 border border-border text-sm font-semibold text-primary">
                      {formatINR(rowTotal(row))}
                    </div>
                  </div>
                </div>

                {/* Desktop grid row */}
                <div className="hidden sm:grid grid-cols-[1fr_100px_110px_110px_44px] gap-2 items-center">
                  <Input
                    data-ocid={`calculator.input.${i + 1}`}
                    value={row.item}
                    onChange={(e) => updateRow(row.id, "item", e.target.value)}
                    placeholder="Item ka naam..."
                    aria-label={`Item ${i + 1} naam`}
                    className="h-9 text-sm"
                  />
                  <Input
                    data-ocid={`calculator.input.${i + 1}`}
                    type="number"
                    value={row.weight}
                    onChange={(e) =>
                      updateRow(row.id, "weight", e.target.value)
                    }
                    placeholder="KG"
                    min="0"
                    step="0.1"
                    aria-label={`Item ${i + 1} weight`}
                    className="h-9 text-sm"
                  />
                  <Input
                    data-ocid={`calculator.input.${i + 1}`}
                    type="number"
                    value={row.rate}
                    onChange={(e) => updateRow(row.id, "rate", e.target.value)}
                    placeholder="₹/KG"
                    min="0"
                    step="0.5"
                    aria-label={`Item ${i + 1} rate`}
                    className="h-9 text-sm"
                  />
                  <div
                    className="h-9 flex items-center px-3 rounded-md bg-accent/50 border border-border text-sm font-semibold text-primary"
                    aria-label={`Item ${i + 1} total`}
                  >
                    {formatINR(rowTotal(row))}
                  </div>
                  <button
                    type="button"
                    data-ocid={`calculator.delete_button.${i + 1}`}
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length <= 1}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Row hatao"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add Row Button */}
        <button
          type="button"
          data-ocid="calculator.secondary_button"
          onClick={addRow}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-dashed border-primary/40 text-primary text-sm font-medium hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <Plus size={15} />+ Aur Item Jodein
        </button>

        {/* Grand Total Card */}
        <motion.div
          key={grandTotal}
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.15 }}
          data-ocid="calculator.card"
          className="mt-6 rounded-2xl bg-emerald-header text-white p-5 shadow-lg"
        >
          <p className="text-white/70 text-sm mb-1 font-medium">
            Grand Total (Sabhi Items)
          </p>
          <p className="font-heading font-bold text-4xl tracking-tight">
            {formatINR(grandTotal)}
          </p>
          {grandTotal > 0 && (
            <p className="text-white/60 text-xs mt-1">
              {rows.filter((r) => Number.parseFloat(r.weight) > 0).length}{" "}
              item(s) ka weight diya gaya hai
            </p>
          )}
        </motion.div>

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button
            data-ocid="calculator.submit_button"
            onClick={handleCalculate}
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex items-center justify-center gap-2 shadow-md"
          >
            <Calculator size={16} />
            Calculate Karein
          </Button>
          <Button
            data-ocid="calculator.secondary_button"
            variant="outline"
            onClick={handleReset}
            className="w-full h-12 text-base font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            Reset Karein
          </Button>
        </div>

        {/* Admin rates sync info */}
        <div className="mt-4 flex flex-col items-center gap-2">
          {adminRatesLoaded && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
              ✅ Admin Rates — Admin Panel se synced hain
            </span>
          )}
          <p className="text-center text-xs text-muted-foreground">
            💡 Rate automatically calculate hoti hai jab aap weight ya rate
            dalte hain
          </p>
          <button
            type="button"
            onClick={handleReloadRates}
            className="text-xs text-primary hover:underline underline-offset-2 font-medium"
          >
            🔄 Admin rates reload karein
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
