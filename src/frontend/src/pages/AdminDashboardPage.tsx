import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  CheckSquare,
  DollarSign,
  Facebook,
  Image,
  Instagram,
  Layout,
  Loader2,
  LogOut,
  MessageCircle,
  Palette,
  Plus,
  Search,
  Send,
  Settings,
  Shield,
  Star,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob, type SubscriptionPlan } from "../backend";
import type { Banner } from "../backend";
import { hashPassword, useAuth } from "../contexts/AuthContext";
import { useActor } from "../hooks/useActor";
import {
  useActiveBanners,
  useAdminConfig,
  useAllToggles,
  useApproveProvider,
  useProvidersPendingApproval,
  useRecentUsers,
  useRejectProvider,
  useSearchUsers,
  useSubscriptionPricing,
  useUpdateToggle,
  useUsersByRole,
} from "../hooks/useQueries";
import { useNavigate } from "../lib/router";

type AdminSection =
  | "founder"
  | "categoryManager"
  | "users"
  | "search"
  | "approvals"
  | "controls"
  | "banners"
  | "settings"
  | "pricing"
  | "staff"
  | "ads";

const DEFAULT_EMERALD = "#059669";

// ---- Save Confirmation Banner ----
function SaveConfirmation({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-green-500 text-white px-5 py-3 rounded-2xl shadow-lg font-semibold text-sm"
    >
      <CheckCircle size={18} className="text-white" />
      Settings Saved!
    </motion.div>
  );
}

// ---- User Management Section ----
function UserManagement() {
  const [activeTab, setActiveTab] = useState<
    "recent" | "customers" | "providers"
  >("recent");
  const { data: recentUsers, isLoading: r } = useRecentUsers();
  const { data: customers, isLoading: c } = useUsersByRole("customer");
  const { data: providers, isLoading: p } = useUsersByRole("provider");

  const users =
    activeTab === "recent"
      ? (recentUsers ?? [])
      : activeTab === "customers"
        ? (customers ?? [])
        : (providers ?? []);
  const loading =
    activeTab === "recent" ? r : activeTab === "customers" ? c : p;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
        {(["recent", "customers", "providers"] as const).map((t) => (
          <button
            key={t}
            type="button"
            data-ocid="admin.tab"
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === t
                ? "bg-white text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "recent"
              ? "Naye Users (48h)"
              : t === "customers"
                ? "All Customers"
                : "All Providers"}
          </button>
        ))}
      </div>
      {loading ? (
        <div
          data-ocid="admin.loading_state"
          className="flex justify-center py-8"
        >
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-card">
          <table className="w-full text-sm" data-ocid="admin.table">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-foreground">
                  Naam
                </th>
                <th className="text-left px-4 py-3 font-semibold text-foreground hidden sm:table-cell">
                  Mobile
                </th>
                <th className="text-left px-4 py-3 font-semibold text-foreground hidden md:table-cell">
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={u.id.toString()}
                  data-ocid={`admin.row.${i + 1}`}
                  className="border-t border-border hover:bg-muted/50"
                >
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {u.mobile}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="capitalize text-xs">{u.role}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div
              data-ocid="admin.empty_state"
              className="text-center py-8 text-muted-foreground"
            >
              Koi user nahi mila
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Global Search Section ----
function GlobalSearch() {
  const [text, setText] = useState("");
  const { data: users, isLoading } = useSearchUsers(text);

  return (
    <div className="space-y-4">
      <input
        data-ocid="admin.search_input"
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Naam ya mobile se search karein..."
        className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      {isLoading && (
        <div
          data-ocid="admin.loading_state"
          className="flex justify-center py-4"
        >
          <Loader2 size={20} className="animate-spin text-primary" />
        </div>
      )}
      {users && users.length > 0 && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-card">
          <table className="w-full text-sm" data-ocid="admin.table">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Naam</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">
                  Mobile
                </th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={u.id.toString()}
                  data-ocid={`admin.row.${i + 1}`}
                  className="border-t border-border hover:bg-muted/50"
                >
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {u.mobile}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="capitalize text-xs">{u.role}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {users && users.length === 0 && text.trim() && (
        <div
          data-ocid="admin.empty_state"
          className="text-center py-8 text-muted-foreground"
        >
          Koi result nahi mila
        </div>
      )}
    </div>
  );
}

// ---- Provider Approvals Section ----
function ProviderApprovals() {
  const { data: pending, isLoading } = useProvidersPendingApproval();
  const approveM = useApproveProvider();
  const rejectM = useRejectProvider();
  const [approveMap, setApproveMap] = useState<Record<string, string>>({});

  // Also show pending categories from managers
  const pendingCategories: { name: string; icon: string; status: string }[] =
    (() => {
      try {
        return JSON.parse(
          localStorage.getItem("dz_pending_categories") ?? "[]",
        );
      } catch {
        return [];
      }
    })();

  const handleApproveCategory = (name: string) => {
    const cats: { name: string; icon: string; status: string }[] = (() => {
      try {
        return JSON.parse(
          localStorage.getItem("dz_pending_categories") ?? "[]",
        );
      } catch {
        return [];
      }
    })();
    const updated = cats.map((c) =>
      c.name === name ? { ...c, status: "approved" } : c,
    );
    localStorage.setItem("dz_pending_categories", JSON.stringify(updated));
    toast.success(`Category "${name}" approve ho gayi!`);
  };

  const handleRejectCategory = (name: string) => {
    const cats: { name: string; icon: string; status: string }[] = (() => {
      try {
        return JSON.parse(
          localStorage.getItem("dz_pending_categories") ?? "[]",
        );
      } catch {
        return [];
      }
    })();
    localStorage.setItem(
      "dz_pending_categories",
      JSON.stringify(cats.filter((c) => c.name !== name)),
    );
    toast.success(`Category "${name}" reject ho gayi.`);
  };

  const handleApprove = async (userId: bigint) => {
    const planKey = approveMap[userId.toString()] ?? "oneMonth";
    await approveM.mutateAsync({ userId, plan: planKey as SubscriptionPlan });
    toast.success("Provider approve ho gaya!");
  };

  const handleReject = async (userId: bigint) => {
    await rejectM.mutateAsync(userId);
    toast.success("Provider reject ho gaya.");
  };

  if (isLoading)
    return (
      <div data-ocid="admin.loading_state" className="flex justify-center py-8">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );

  const pendingCats = pendingCategories.filter((c) => c.status === "pending");

  return (
    <div className="space-y-6">
      {/* Pending Categories from Managers */}
      {pendingCats.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-heading font-semibold text-foreground">
            Manager ki Pending Categories
          </h3>
          {pendingCats.map((cat, i) => (
            <div
              key={cat.name}
              data-ocid={`admin.item.${i + 1}`}
              className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <p className="font-semibold text-foreground">{cat.name}</p>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                    Manager ka request
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  data-ocid={`admin.confirm_button.${i + 1}`}
                  onClick={() => handleApproveCategory(cat.name)}
                  className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl"
                >
                  <CheckCircle size={13} /> Approve
                </button>
                <button
                  type="button"
                  data-ocid={`admin.delete_button.${i + 1}`}
                  onClick={() => handleRejectCategory(cat.name)}
                  className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-xl"
                >
                  <XCircle size={13} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Provider Approvals */}
      <div className="space-y-4">
        {!pending || pending.length === 0 ? (
          <div
            data-ocid="admin.empty_state"
            className="text-center py-16 text-muted-foreground"
          >
            <CheckCircle size={40} className="mx-auto mb-3 text-green-400" />
            <p className="font-medium">Sab approve ho gaye!</p>
            <p className="text-sm">Abhi koi pending approval nahi hai</p>
          </div>
        ) : (
          pending.map((p, i) => (
            <div
              key={p.userId.toString()}
              data-ocid={`admin.item.${i + 1}`}
              className="bg-white rounded-2xl border border-border shadow-card p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {p.shopName || "Shop Name Set Nahi"}
                  </h3>
                  <p className="text-sm text-muted-foreground">{p.category}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ID: {p.userId.toString()}
                  </p>
                </div>
                <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">
                  Pending
                </span>
              </div>

              {p.paymentScreenshotBlobId && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Payment Screenshot:
                  </p>
                  <img
                    src={p.paymentScreenshotBlobId}
                    alt="Payment Screenshot"
                    className="w-40 h-40 object-contain border border-border rounded-xl"
                  />
                </div>
              )}

              <div className="flex items-center gap-3">
                <select
                  data-ocid="admin.select"
                  value={approveMap[p.userId.toString()] ?? "oneMonth"}
                  onChange={(e) =>
                    setApproveMap((prev) => ({
                      ...prev,
                      [p.userId.toString()]: e.target.value,
                    }))
                  }
                  className="border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring bg-white"
                >
                  <option value="oneMonth">1 Maah</option>
                  <option value="threeMonths">3 Maah</option>
                  <option value="twelveMonths">12 Maah</option>
                </select>
                <button
                  type="button"
                  data-ocid={`admin.confirm_button.${i + 1}`}
                  onClick={() => handleApprove(p.userId)}
                  disabled={approveM.isPending}
                  className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
                >
                  <CheckCircle size={15} /> Approve Karein
                </button>
                <button
                  type="button"
                  data-ocid={`admin.delete_button.${i + 1}`}
                  onClick={() => handleReject(p.userId)}
                  disabled={rejectM.isPending}
                  className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-60 border border-red-200"
                >
                  <XCircle size={15} /> Reject Karein
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ---- Homepage Controls Section ----
function HomepageControls() {
  const { data: toggles, isLoading } = useAllToggles();
  const updateToggle = useUpdateToggle();
  const { user } = useAuth();
  const isManager = user?.role === "manager";

  // Category prices from localStorage
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("dz_category_prices") ?? "{}");
    } catch {
      return {};
    }
  });

  const handlePriceChange = (name: string, val: string) => {
    const updated = { ...prices, [name]: val };
    setPrices(updated);
    localStorage.setItem("dz_category_prices", JSON.stringify(updated));
  };

  // Manager: add pending category
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("🏪");

  const handleManagerAddCategory = () => {
    if (!newCatName.trim()) {
      toast.error("Category naam likhein");
      return;
    }
    const cats: { name: string; icon: string; status: string }[] = (() => {
      try {
        return JSON.parse(
          localStorage.getItem("dz_pending_categories") ?? "[]",
        );
      } catch {
        return [];
      }
    })();
    cats.push({ name: newCatName.trim(), icon: newCatIcon, status: "pending" });
    localStorage.setItem("dz_pending_categories", JSON.stringify(cats));
    toast.success(
      `Category "${newCatName}" pending approval mein add ho gayi!`,
    );
    setNewCatName("");
    setNewCatIcon("🏪");
  };

  if (isLoading)
    return (
      <div data-ocid="admin.loading_state" className="flex justify-center py-8">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6">
      {isManager && (
        <div className="bg-white rounded-2xl border border-border shadow-card p-5 space-y-3">
          <h3 className="font-semibold text-foreground">
            Naya Category Request Bhejein (Pending)
          </h3>
          <div className="flex gap-2">
            <input
              data-ocid="admin.input"
              type="text"
              value={newCatIcon}
              onChange={(e) => setNewCatIcon(e.target.value)}
              placeholder="Icon"
              className="w-16 border border-border rounded-xl px-3 py-2.5 text-sm text-center outline-none"
            />
            <input
              data-ocid="admin.input"
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Category naam"
              className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              data-ocid="admin.primary_button"
              onClick={handleManagerAddCategory}
              className="bg-primary text-primary-foreground text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 hover:opacity-90"
            >
              <Plus size={14} /> Add
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Manager ki categories Admin se approve hone ke baad hi live hongi.
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
        {!toggles || toggles.length === 0 ? (
          <div
            data-ocid="admin.empty_state"
            className="text-center py-12 text-muted-foreground"
          >
            Koi toggle nahi mila
          </div>
        ) : (
          toggles.map(([name, value], i) => (
            <div
              key={name}
              data-ocid={`admin.item.${i + 1}`}
              className="flex items-center justify-between px-5 py-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1">
                <span className="font-medium text-foreground text-sm">
                  {name}
                </span>
                {!isManager && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      Price: ₹
                    </span>
                    <input
                      data-ocid="admin.input"
                      type="number"
                      value={prices[name] ?? ""}
                      onChange={(e) => handlePriceChange(name, e.target.value)}
                      placeholder="Set price"
                      className="w-24 border border-border rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                )}
              </div>
              <button
                type="button"
                data-ocid={`admin.toggle.${i + 1}`}
                onClick={() =>
                  !isManager && updateToggle.mutate({ name, value: !value })
                }
                disabled={isManager}
                className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  value
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {value ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                {value ? "ON" : "OFF"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ---- Ads Banner Manager ----
function BannerManager() {
  const { data: banners, isLoading } = useActiveBanners();
  const { actor } = useActor();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!title || !actor) return;
    setAdding(true);
    try {
      await actor.addBanner(
        title,
        subtitle,
        imageUrl,
        linkUrl,
        BigInt(banners?.length ?? 0),
      );
      toast.success("Banner add ho gaya!");
      setTitle("");
      setSubtitle("");
      setImageUrl("");
      setLinkUrl("");
      qc.invalidateQueries({ queryKey: ["activeBanners"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Add nahi ho saka");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: bigint) => {
    if (!actor) return;
    try {
      await actor.deleteBanner(id);
      toast.success("Banner delete ho gaya");
      qc.invalidateQueries({ queryKey: ["activeBanners"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Delete nahi ho saca");
    }
  };

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="bg-white rounded-2xl border border-border shadow-card p-5 space-y-3">
        <h3 className="font-semibold text-foreground">
          Naya Banner Add Karein
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            data-ocid="admin.input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Banner Title"
            className="border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            data-ocid="admin.input"
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Subtitle"
            className="border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            data-ocid="admin.input"
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL"
            className="border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            data-ocid="admin.input"
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Link URL"
            className="border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="button"
          data-ocid="admin.primary_button"
          onClick={handleAdd}
          disabled={!title || adding}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-60"
        >
          {adding ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          Banner Add Karein
        </button>
      </div>

      {/* Banners list */}
      {isLoading ? (
        <div
          data-ocid="admin.loading_state"
          className="flex justify-center py-8"
        >
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : banners && banners.length > 0 ? (
        <div className="space-y-3">
          {banners.map((b, i) => (
            <div
              key={b.id.toString()}
              data-ocid={`admin.item.${i + 1}`}
              className="bg-white rounded-2xl border border-border shadow-card p-4 flex items-center gap-4"
            >
              {b.imageUrl && (
                <img
                  src={b.imageUrl}
                  alt={b.title}
                  className="w-16 h-12 object-cover rounded-lg flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {b.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {b.subtitle}
                </p>
              </div>
              <button
                type="button"
                data-ocid={`admin.delete_button.${i + 1}`}
                onClick={() => handleDelete(b.id)}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg flex-shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div
          data-ocid="admin.empty_state"
          className="text-center py-8 text-muted-foreground"
        >
          Abhi koi banner nahi hai
        </div>
      )}
    </div>
  );
}

// ---- Founder Settings Section ----
function FounderSettingsSection() {
  const [founderName, setFounderName] = useState<string>(() => {
    try {
      return JSON.parse(localStorage.getItem("dz_founder") ?? "{}").name ?? "";
    } catch {
      return "";
    }
  });
  const [founderPhoto, setFounderPhoto] = useState<string>(() => {
    try {
      return JSON.parse(localStorage.getItem("dz_founder") ?? "{}").photo ?? "";
    } catch {
      return "";
    }
  });
  const [showSaved, setShowSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem(
      "dz_founder",
      JSON.stringify({ name: founderName, photo: founderPhoto }),
    );
    setShowSaved(true);
    toast.success("Founder settings save ho gayi!");
    setTimeout(() => setShowSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <SaveConfirmation show={showSaved} />
      <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-4">
        <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
          <Star size={18} className="text-primary" /> Founder Branding
        </h3>
        <p className="text-sm text-muted-foreground">
          Footer mein dikhne wala founder ka naam aur photo yahan set karein.
        </p>
        <div>
          <label
            htmlFor="fs-name"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Founder Ka Naam
          </label>
          <input
            id="fs-name"
            data-ocid="admin.input"
            type="text"
            value={founderName}
            onChange={(e) => setFounderName(e.target.value)}
            placeholder="Aapka naam likhein"
            className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label
            htmlFor="fs-photo"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Founder Photo URL
          </label>
          <input
            id="fs-photo"
            data-ocid="admin.input"
            type="text"
            value={founderPhoto}
            onChange={(e) => setFounderPhoto(e.target.value)}
            placeholder="https://... (photo URL)"
            className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {(founderName || founderPhoto) && (
          <div className="bg-muted rounded-xl p-4 flex items-center gap-3">
            {founderPhoto && (
              <img
                src={founderPhoto}
                alt="Founder"
                className="w-12 h-12 rounded-full object-cover border-2 border-primary"
              />
            )}
            <div>
              <p className="text-xs text-muted-foreground">Preview</p>
              <p className="font-semibold text-foreground">
                {founderName || "Founder naam"}
              </p>
              <p className="text-xs text-muted-foreground">
                Founder, Digital Zindagi
              </p>
            </div>
          </div>
        )}
        <button
          type="button"
          data-ocid="admin.save_button"
          onClick={handleSave}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl transition-colors"
        >
          <CheckCircle size={16} />
          Founder Settings Save Karein
        </button>
      </div>
    </div>
  );
}

// ---- Category Manager Section ----
function CategoryManagerSection() {
  const { data: toggles, isLoading } = useAllToggles();
  const updateToggle = useUpdateToggle();
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [showSaved, setShowSaved] = useState(false);

  // Category prices: per-category saved state
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("dz_category_prices") ?? "{}");
    } catch {
      return {};
    }
  });

  const handleCategorySave = (name: string, isOn: boolean) => {
    // Save price + ON/OFF status permanently
    const updated = { ...prices };
    localStorage.setItem("dz_category_prices", JSON.stringify(updated));
    // Also save per-category on/off state
    const statusMap: Record<string, boolean> = (() => {
      try {
        return JSON.parse(localStorage.getItem("dz_category_status") ?? "{}");
      } catch {
        return {};
      }
    })();
    statusMap[name] = isOn;
    localStorage.setItem("dz_category_status", JSON.stringify(statusMap));
    setShowSaved(true);
    toast.success(`"${name}" save ho gayi!`);
    setTimeout(() => setShowSaved(false), 3000);
  };

  // New category add (admin)
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("🏪");

  const handleAdminAddCategory = () => {
    if (!newCatName.trim()) {
      toast.error("Category naam likhein");
      return;
    }
    const cats: { name: string; icon: string; status: string }[] = (() => {
      try {
        return JSON.parse(
          localStorage.getItem("dz_approved_categories") ?? "[]",
        );
      } catch {
        return [];
      }
    })();
    cats.push({
      name: newCatName.trim(),
      icon: newCatIcon,
      status: "approved",
    });
    localStorage.setItem("dz_approved_categories", JSON.stringify(cats));
    setShowSaved(true);
    toast.success(`Category "${newCatName}" add ho gayi!`);
    setTimeout(() => setShowSaved(false), 3000);
    setNewCatName("");
    setNewCatIcon("🏪");
  };

  // Manager: add pending category
  const handleManagerAddCategory = () => {
    if (!newCatName.trim()) {
      toast.error("Category naam likhein");
      return;
    }
    const cats: { name: string; icon: string; status: string }[] = (() => {
      try {
        return JSON.parse(
          localStorage.getItem("dz_pending_categories") ?? "[]",
        );
      } catch {
        return [];
      }
    })();
    cats.push({ name: newCatName.trim(), icon: newCatIcon, status: "pending" });
    localStorage.setItem("dz_pending_categories", JSON.stringify(cats));
    toast.success(
      `Category "${newCatName}" pending approval mein add ho gayi!`,
    );
    setNewCatName("");
    setNewCatIcon("🏪");
  };

  if (isLoading)
    return (
      <div data-ocid="admin.loading_state" className="flex justify-center py-8">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6">
      <SaveConfirmation show={showSaved} />

      {/* Add Category */}
      <div className="bg-white rounded-2xl border border-border shadow-card p-5 space-y-3">
        <h3 className="font-semibold text-foreground">
          {isManager
            ? "Naya Category Request Bhejein (Pending)"
            : "Naya Category Add Karein"}
        </h3>
        <div className="flex gap-2">
          <input
            data-ocid="admin.input"
            type="text"
            value={newCatIcon}
            onChange={(e) => setNewCatIcon(e.target.value)}
            placeholder="Icon"
            className="w-16 border border-border rounded-xl px-3 py-2.5 text-sm text-center outline-none"
          />
          <input
            data-ocid="admin.input"
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Category naam"
            className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            data-ocid="admin.primary_button"
            onClick={
              isManager ? handleManagerAddCategory : handleAdminAddCategory
            }
            className="bg-primary text-primary-foreground text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 hover:opacity-90"
          >
            <Plus size={14} /> Add
          </button>
        </div>
        {isManager && (
          <p className="text-xs text-muted-foreground">
            Manager ki categories Admin se approve hone ke baad hi live hongi.
          </p>
        )}
      </div>

      {/* Category List with Save Buttons */}
      <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">
            Categories — Price, Status &amp; AdMob
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Har category mein price set karein, ON/OFF karein, phir "Save"
            dabayein.
          </p>
        </div>
        {!toggles || toggles.length === 0 ? (
          <div
            data-ocid="admin.empty_state"
            className="text-center py-12 text-muted-foreground"
          >
            Koi category nahi mila
          </div>
        ) : (
          toggles.map(([name, value], i) => (
            <CategoryRow
              key={name}
              index={i}
              name={name}
              isOn={value}
              initialPrice={prices[name] ?? ""}
              isManager={isManager}
              onSave={(price, isOn) => {
                const updated = { ...prices, [name]: price };
                setPrices(updated);
                if (!isManager) updateToggle.mutate({ name, value: isOn });
                handleCategorySave(name, isOn);
              }}
              onToggle={(val) => {
                if (!isManager) updateToggle.mutate({ name, value: val });
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface CategoryRowProps {
  index: number;
  name: string;
  isOn: boolean;
  initialPrice: string;
  isManager: boolean;
  onSave: (price: string, isOn: boolean) => void;
  onToggle: (val: boolean) => void;
}

function CategoryRow({
  index,
  name,
  isOn,
  initialPrice,
  isManager,
  onSave,
  onToggle,
}: CategoryRowProps) {
  const [price, setPrice] = useState(initialPrice);
  const [localOn, setLocalOn] = useState(isOn);

  return (
    <div
      data-ocid={`admin.item.${index + 1}`}
      className="border-b border-border last:border-0 px-5 py-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-foreground text-sm">{name}</span>
        <button
          type="button"
          data-ocid={`admin.toggle.${index + 1}`}
          onClick={() => {
            const next = !localOn;
            setLocalOn(next);
            onToggle(next);
          }}
          disabled={isManager}
          className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${
            localOn
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {localOn ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          {localOn ? "ON" : "OFF"}
        </button>
      </div>
      {!isManager && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            Price: ₹
          </span>
          <input
            data-ocid="admin.input"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price set karein"
            className="w-32 border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      )}
      {!isManager && (
        <button
          type="button"
          data-ocid="admin.save_button"
          onClick={() => onSave(price, localOn)}
          className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors"
        >
          <CheckCircle size={13} />
          Save Changes
        </button>
      )}
    </div>
  );
}

// ---- Settings Section ----
function AdminSettings() {
  const { data: config, isLoading } = useAdminConfig();
  const { data: toggles } = useAllToggles();
  const updateToggle = useUpdateToggle();
  const { actor } = useActor();
  const [adminName, setAdminName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [upiId, setUpiId] = useState("");
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Theme color state
  const [themeColor, setThemeColor] = useState<string>(
    () => localStorage.getItem("dz_theme_color") ?? DEFAULT_EMERALD,
  );

  // PIN Change State
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinSaving, setPinSaving] = useState(false);

  // Social Links State
  const [socialLinks, setSocialLinks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dz_social_links") ?? "{}") as {
        instagram?: string;
        facebook?: string;
        telegram?: string;
      };
    } catch {
      return { instagram: "", facebook: "", telegram: "" };
    }
  });
  const [socialSaving, setSocialSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Admin QR toggle
  const [showRegQr, setShowRegQr] = useState<boolean>(() => {
    const val = localStorage.getItem("dz_show_registration_qr");
    return val === null ? true : val === "true";
  });

  const toggleMap = Object.fromEntries(toggles ?? []);
  const mobileVisible = toggleMap.contactMobileVisible ?? true;
  const emailVisible = toggleMap.contactEmailVisible ?? true;

  const handleSave = async () => {
    if (!actor) return;
    setSaving(true);
    try {
      let qrBlob = config?.qrCodeBlobId ?? ExternalBlob.fromURL("");
      if (qrFile) {
        const bytes = new Uint8Array(await qrFile.arrayBuffer());
        qrBlob = ExternalBlob.fromBytes(bytes);
      }
      await actor.updateAdminConfig({
        adminName: adminName || config?.adminName || "",
        mobile: mobile || config?.mobile || "",
        email: email || config?.email || "",
        upiId: upiId || config?.upiId || "",
        qrCodeBlobId: qrBlob,
      });
      toast.success("Settings save ho gayi!");
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    } catch (err: any) {
      toast.error(err?.message ?? "Save nahi ho saka");
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (color: string) => {
    setThemeColor(color);
    localStorage.setItem("dz_theme_color", color);
    document.documentElement.style.setProperty("--color-primary", color);
    document.documentElement.style.setProperty("--dz-accent", color);
  };

  const handleThemeReset = () => {
    setThemeColor(DEFAULT_EMERALD);
    localStorage.removeItem("dz_theme_color");
    document.documentElement.style.removeProperty("--color-primary");
    document.documentElement.style.removeProperty("--dz-accent");
    toast.success("Theme reset ho gaya!");
  };

  const handlePinChange = async () => {
    if (!currentPin || !newPin || !confirmPin) {
      toast.error("Sab PIN fields bharen");
      return;
    }
    if (newPin.length !== 5 || !/^\d{5}$/.test(newPin)) {
      toast.error("Naya PIN exactly 5 digits hona chahiye");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("Naya PIN aur Confirm PIN match nahi kar rahe");
      return;
    }
    setPinSaving(true);
    try {
      const currentHash = await hashPassword(currentPin);
      const storedHash = localStorage.getItem("dz_admin_pin");
      if (storedHash && currentHash !== storedHash) {
        toast.error("Current PIN galat hai");
        return;
      }
      const newHash = await hashPassword(newPin);
      localStorage.setItem("dz_admin_pin", newHash);
      toast.success("PIN successfully change ho gaya!");
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
    } catch (err: any) {
      toast.error(err?.message ?? "PIN change nahi ho saka");
    } finally {
      setPinSaving(false);
    }
  };

  const handleSocialSave = () => {
    setSocialSaving(true);
    localStorage.setItem("dz_social_links", JSON.stringify(socialLinks));
    setTimeout(() => {
      setSocialSaving(false);
      toast.success("Social links save ho gayi!");
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    }, 300);
  };

  const handleRegQrToggle = () => {
    const newVal = !showRegQr;
    setShowRegQr(newVal);
    localStorage.setItem("dz_show_registration_qr", String(newVal));
    toast.success(
      newVal ? "Registration QR ON kar diya" : "Registration QR OFF kar diya",
    );
  };

  if (isLoading)
    return (
      <div data-ocid="admin.loading_state" className="flex justify-center py-8">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6">
      <SaveConfirmation show={showSaved} />
      {/* Main Settings Card */}
      <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-4">
        <h3 className="font-heading font-semibold text-foreground">
          Admin Info &amp; UPI Settings
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="as-adminname"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Admin Naam
            </label>
            <input
              id="as-adminname"
              data-ocid="admin.input"
              type="text"
              value={adminName || config?.adminName || ""}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="Admin naam"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label
              htmlFor="as-mobile"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Mobile
            </label>
            <input
              id="as-mobile"
              data-ocid="admin.input"
              type="tel"
              value={mobile || config?.mobile || ""}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Mobile number"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label
              htmlFor="as-email"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Email
            </label>
            <input
              id="as-email"
              data-ocid="admin.input"
              type="email"
              value={email || config?.email || ""}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label
              htmlFor="as-upiid"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              UPI ID
            </label>
            <input
              id="as-upiid"
              data-ocid="admin.input"
              type="text"
              value={upiId || config?.upiId || ""}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="UPI ID (e.g. admin@upi)"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div>
          <p className="block text-sm font-medium text-foreground mb-1.5">
            QR Code Image
          </p>
          <label
            data-ocid="admin.upload_button"
            className="flex items-center gap-2 border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-all"
          >
            <span className="text-sm text-muted-foreground">
              {qrFile ? qrFile.name : "QR code image upload karein"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setQrFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <button
          type="button"
          data-ocid="admin.save_button"
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl hover:opacity-90 flex items-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : null}
          Settings Save Karein
        </button>
      </div>

      {/* Security - PIN Change */}
      <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-4">
        <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
          <Shield size={18} className="text-primary" />
          Security - PIN Change
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="cur-pin"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Current PIN
            </label>
            <input
              id="cur-pin"
              data-ocid="admin.input"
              type="password"
              inputMode="numeric"
              maxLength={5}
              value={currentPin}
              onChange={(e) =>
                setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 5))
              }
              placeholder="12345"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label
              htmlFor="new-pin"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Naya PIN
            </label>
            <input
              id="new-pin"
              data-ocid="admin.input"
              type="password"
              inputMode="numeric"
              maxLength={5}
              value={newPin}
              onChange={(e) =>
                setNewPin(e.target.value.replace(/\D/g, "").slice(0, 5))
              }
              placeholder="5 digits"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label
              htmlFor="confirm-pin"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Confirm PIN
            </label>
            <input
              id="confirm-pin"
              data-ocid="admin.input"
              type="password"
              inputMode="numeric"
              maxLength={5}
              value={confirmPin}
              onChange={(e) =>
                setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 5))
              }
              placeholder="Dobara daalein"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <button
          type="button"
          data-ocid="admin.save_button"
          onClick={handlePinChange}
          disabled={pinSaving}
          className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl hover:opacity-90 flex items-center gap-2 disabled:opacity-60"
        >
          {pinSaving ? <Loader2 size={15} className="animate-spin" /> : null}
          PIN Change Karein
        </button>
      </div>

      {/* Social Links */}
      <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-4">
        <h3 className="font-heading font-semibold text-foreground">
          Social Links
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Instagram size={18} className="text-pink-500 flex-shrink-0" />
            <input
              data-ocid="admin.input"
              type="url"
              value={socialLinks.instagram ?? ""}
              onChange={(e) =>
                setSocialLinks((prev) => ({
                  ...prev,
                  instagram: e.target.value,
                }))
              }
              placeholder="Instagram URL"
              className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-3">
            <Facebook size={18} className="text-blue-600 flex-shrink-0" />
            <input
              data-ocid="admin.input"
              type="url"
              value={socialLinks.facebook ?? ""}
              onChange={(e) =>
                setSocialLinks((prev) => ({
                  ...prev,
                  facebook: e.target.value,
                }))
              }
              placeholder="Facebook URL"
              className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-3">
            <Send size={18} className="text-sky-500 flex-shrink-0" />
            <input
              data-ocid="admin.input"
              type="url"
              value={socialLinks.telegram ?? ""}
              onChange={(e) =>
                setSocialLinks((prev) => ({
                  ...prev,
                  telegram: e.target.value,
                }))
              }
              placeholder="Telegram URL"
              className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <button
          type="button"
          data-ocid="admin.save_button"
          onClick={handleSocialSave}
          disabled={socialSaving}
          className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl hover:opacity-90 flex items-center gap-2 disabled:opacity-60"
        >
          {socialSaving ? <Loader2 size={15} className="animate-spin" /> : null}
          Social Links Save Karein
        </button>
      </div>

      {/* Admin QR Toggle on Registration */}
      <div className="bg-white rounded-2xl border border-border shadow-card p-6">
        <h3 className="font-heading font-semibold text-foreground mb-3">
          Registration QR Code
        </h3>
        <div className="flex items-center justify-between py-3 px-4 bg-muted/40 rounded-xl">
          <div>
            <p className="text-sm font-medium text-foreground">
              Registration pe QR Code Dikhao
            </p>
            <p className="text-xs text-muted-foreground">
              Provider registration form mein Admin QR code dikhana ON/OFF
              karein
            </p>
          </div>
          <button
            type="button"
            data-ocid="admin.toggle"
            onClick={handleRegQrToggle}
            className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${
              showRegQr
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {showRegQr ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            {showRegQr ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Contact Visibility Toggles */}
      <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-3">
        <h3 className="font-heading font-semibold text-foreground">
          Contact Visibility
        </h3>
        <div className="flex items-center justify-between py-3 px-4 bg-muted/40 rounded-xl">
          <div>
            <p className="text-sm font-medium text-foreground">
              Mobile Visible
            </p>
            <p className="text-xs text-muted-foreground">
              Contact mobile number dikhao
            </p>
          </div>
          <button
            type="button"
            data-ocid="admin.toggle"
            onClick={() =>
              updateToggle.mutate({
                name: "contactMobileVisible",
                value: !mobileVisible,
              })
            }
            className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${
              mobileVisible
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {mobileVisible ? (
              <ToggleRight size={18} />
            ) : (
              <ToggleLeft size={18} />
            )}
            {mobileVisible ? "ON" : "OFF"}
          </button>
        </div>
        <div className="flex items-center justify-between py-3 px-4 bg-muted/40 rounded-xl">
          <div>
            <p className="text-sm font-medium text-foreground">Email Visible</p>
            <p className="text-xs text-muted-foreground">
              Contact email section dikhao
            </p>
          </div>
          <button
            type="button"
            data-ocid="admin.toggle"
            onClick={() =>
              updateToggle.mutate({
                name: "contactEmailVisible",
                value: !emailVisible,
              })
            }
            className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${
              emailVisible
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {emailVisible ? (
              <ToggleRight size={18} />
            ) : (
              <ToggleLeft size={18} />
            )}
            {emailVisible ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Theme Color Picker */}
      <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-4">
        <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
          <Palette size={18} className="text-primary" />
          Theme Color
        </h3>
        <p className="text-xs text-muted-foreground">
          App ka primary color change karein.
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <label
              htmlFor="theme-color-picker"
              className="text-sm font-medium text-foreground"
            >
              Primary Theme Color:
            </label>
            <input
              id="theme-color-picker"
              data-ocid="admin.input"
              type="color"
              value={themeColor}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5"
            />
            <span className="text-sm text-muted-foreground font-mono">
              {themeColor}
            </span>
          </div>
          <button
            type="button"
            data-ocid="admin.secondary_button"
            onClick={handleThemeReset}
            className="text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl px-4 py-2 hover:bg-muted transition-colors"
          >
            Reset to Default
          </button>
        </div>
        <div
          className="h-8 rounded-lg"
          style={{ backgroundColor: themeColor }}
        />
      </div>
    </div>
  );
}

// ---- Subscription Pricing Section ----
function SubscriptionPricingSection() {
  const { data: pricing, isLoading } = useSubscriptionPricing();
  const { actor } = useActor();
  const [oneMonth, setOneMonth] = useState("");
  const [threeMonths, setThreeMonths] = useState("");
  const [twelveMonths, setTwelveMonths] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!actor) return;
    setSaving(true);
    try {
      await actor.updateSubscriptionPricing({
        oneMonthPrice: BigInt(
          Number.parseInt(oneMonth) ||
            Number.parseInt(pricing?.oneMonthPrice.toString() ?? "199") ||
            199,
        ),
        threeMonthPrice: BigInt(
          Number.parseInt(threeMonths) ||
            Number.parseInt(pricing?.threeMonthPrice.toString() ?? "499") ||
            499,
        ),
        twelveMonthPrice: BigInt(
          Number.parseInt(twelveMonths) ||
            Number.parseInt(pricing?.twelveMonthPrice.toString() ?? "1499") ||
            1499,
        ),
      });
      toast.success("Pricing update ho gayi!");
    } catch (err: any) {
      toast.error(err?.message ?? "Update nahi ho saca");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading)
    return (
      <div data-ocid="admin.loading_state" className="flex justify-center py-8">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );

  return (
    <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-4">
      <h3 className="font-heading font-semibold text-foreground mb-2">
        Subscription Plans Ki Prices (INR)
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "1 Maah",
            val: oneMonth,
            set: setOneMonth,
            cur: pricing?.oneMonthPrice,
          },
          {
            label: "3 Maah",
            val: threeMonths,
            set: setThreeMonths,
            cur: pricing?.threeMonthPrice,
          },
          {
            label: "12 Maah",
            val: twelveMonths,
            set: setTwelveMonths,
            cur: pricing?.twelveMonthPrice,
          },
        ].map((item) => (
          <div key={item.label}>
            <label
              htmlFor={`sp-${item.label}`}
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              {item.label}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                ₹
              </span>
              <input
                id={`sp-${item.label}`}
                data-ocid="admin.input"
                type="number"
                value={item.val || item.cur?.toString() || ""}
                onChange={(e) => item.set(e.target.value)}
                placeholder={item.cur?.toString() ?? "0"}
                className="w-full border border-border rounded-xl pl-7 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        data-ocid="admin.save_button"
        onClick={handleSave}
        disabled={saving}
        className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl hover:opacity-90 flex items-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : null}
        Pricing Save Karein
      </button>
    </div>
  );
}

// ---- Staff Management Section ----
interface Manager {
  id: string;
  name: string;
  mobile: string;
  password: string;
  createdAt: string;
}

function StaffManagement() {
  const [managers, setManagers] = useState<Manager[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("dz_managers") ?? "[]");
    } catch {
      return [];
    }
  });
  const [name, setName] = useState("");
  const [mgMobile, setMgMobile] = useState("");
  const [password, setPassword] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || !mgMobile.trim() || !password.trim()) {
      toast.error("Sab fields bharna zaroori hai");
      return;
    }
    setAdding(true);
    try {
      const hash = await hashPassword(password);
      const newManager: Manager = {
        id: `mgr-${Date.now()}`,
        name: name.trim(),
        mobile: mgMobile.trim(),
        password: hash,
        createdAt: new Date().toISOString(),
      };
      const updated = [...managers, newManager];
      localStorage.setItem("dz_managers", JSON.stringify(updated));
      setManagers(updated);
      toast.success(`Manager ${name} add ho gaya!`);
      setName("");
      setMgMobile("");
      setPassword("");
    } catch (err: any) {
      toast.error(err?.message ?? "Add nahi ho saka");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (id: string) => {
    const updated = managers.filter((m) => m.id !== id);
    localStorage.setItem("dz_managers", JSON.stringify(updated));
    setManagers(updated);
    toast.success("Manager remove ho gaya");
  };

  return (
    <div className="space-y-6">
      {/* Add Manager Form */}
      <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-4">
        <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
          <UserCog size={18} className="text-primary" />
          Naya Manager Add Karein
        </h3>
        <p className="text-xs text-muted-foreground">
          Manager sirf Approvals aur Chat dekh sakta hai. Categories add kar
          sakta hai lekin Admin approve karta hai.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            data-ocid="admin.input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Manager ka naam"
            className="border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            data-ocid="admin.input"
            type="tel"
            value={mgMobile}
            onChange={(e) => setMgMobile(e.target.value)}
            placeholder="Mobile number"
            className="border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            data-ocid="admin.input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="button"
          data-ocid="admin.primary_button"
          onClick={handleAdd}
          disabled={adding}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-60"
        >
          {adding ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          Manager Add Karein
        </button>
      </div>

      {/* Managers List */}
      <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">
            Sab Managers ({managers.length})
          </h3>
        </div>
        {managers.length === 0 ? (
          <div
            data-ocid="admin.empty_state"
            className="text-center py-12 text-muted-foreground"
          >
            <UserCog size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Koi manager nahi hai</p>
            <p className="text-sm">Upar form se manager add karein</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {managers.map((m, i) => (
              <div
                key={m.id}
                data-ocid={`admin.item.${i + 1}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-primary font-bold text-sm">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {m.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.mobile}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                    Manager
                  </span>
                  <button
                    type="button"
                    data-ocid={`admin.delete_button.${i + 1}`}
                    onClick={() => handleDelete(m.id)}
                    className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Chat Section (Manager Only placeholder) ----
function ChatSection() {
  return (
    <div
      data-ocid="admin.card"
      className="bg-white rounded-2xl border border-border shadow-card p-10 text-center"
    >
      <MessageCircle
        size={48}
        className="mx-auto mb-4 text-primary opacity-60"
      />
      <h3 className="font-heading font-bold text-xl text-foreground mb-2">
        Chat Support
      </h3>
      <p className="text-muted-foreground">
        Real-time chat feature jald aa raha hai!
      </p>
    </div>
  );
}

// ---- Ads Manager Section ----
function AdsManager() {
  const [config, setConfig] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dz_admob_config") ?? "{}");
    } catch {
      return {};
    }
  });

  const save = (key: string, val: string | boolean) => {
    const updated = { ...config, [key]: val };
    setConfig(updated);
    localStorage.setItem("dz_admob_config", JSON.stringify(updated));
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-4">
        <h3 className="font-heading font-semibold text-foreground">
          AdMob Configuration
        </h3>
        <p className="text-sm text-muted-foreground">
          Apni AdMob IDs yahan daalo. Ads app mein automatically show honge.
        </p>
        {[
          {
            key: "appId",
            label: "AdMob App ID",
            placeholder: "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX",
          },
          {
            key: "bannerId",
            label: "Banner Ad Unit ID",
            placeholder: "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX",
          },
          {
            key: "interstitialId",
            label: "Interstitial Ad Unit ID",
            placeholder: "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX",
          },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label
              htmlFor={`admob-${key}`}
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              {label}
            </label>
            <input
              id={`admob-${key}`}
              data-ocid="admin.input"
              type="text"
              value={config[key] ?? ""}
              onChange={(e) => save(key, e.target.value)}
              placeholder={placeholder}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
            />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-4">
        <h3 className="font-heading font-semibold text-foreground">
          Ads Control
        </h3>
        {[
          {
            key: "bannerEnabled",
            label: "Banner Ads",
            desc: "Homepage aur pages par banner ads dikhaao",
          },
          {
            key: "interstitialEnabled",
            label: "Interstitial Ads",
            desc: "Page transition par full-screen ad",
          },
        ].map(({ key, label, desc }) => (
          <div
            key={key}
            className="flex items-center justify-between py-3 border-b border-border last:border-0"
          >
            <div>
              <p className="font-medium text-foreground text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <button
              type="button"
              data-ocid="admin.toggle_button"
              onClick={() => save(key, !config[key])}
              className={`relative w-12 h-6 rounded-full transition-colors ${config[key] ? "bg-primary" : "bg-gray-300"}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${config[key] ? "translate-x-7" : "translate-x-1"}`}
              />
            </button>
          </div>
        ))}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-sm font-medium text-amber-800">
          AdMob Integration Note
        </p>
        <p className="text-xs text-amber-700 mt-1">
          AdMob IDs save ho gayi hain. Real ads ke liye Google AdMob account se
          actual ad units create karein aur IDs yahan daalo. Ads status app mein
          reflect hoga.
        </p>
      </div>
    </div>
  );
}

// ---- Main Admin Dashboard ----
export default function AdminDashboardPage() {
  const { user } = useAuth();
  const isManager = user?.role === "manager";

  // Manager sees only approvals & chat
  const ALL_NAV_ITEMS: {
    key: AdminSection;
    label: string;
    icon: React.ReactNode;
    managerVisible?: boolean;
  }[] = [
    {
      key: "founder",
      label: "Founder Settings",
      icon: <Star size={18} />,
    },
    {
      key: "categoryManager",
      label: "Category Manager",
      icon: <Layout size={18} />,
      managerVisible: true,
    },
    {
      key: "users",
      label: "User Management",
      icon: <Users size={18} />,
    },
    {
      key: "search",
      label: "Global Search",
      icon: <Search size={18} />,
    },
    {
      key: "approvals",
      label: "Provider Approvals",
      icon: <CheckSquare size={18} />,
      managerVisible: true,
    },
    {
      key: "controls",
      label: "Homepage Controls",
      icon: <Layout size={18} />,
      managerVisible: true,
    },
    {
      key: "banners",
      label: "Ads Banner Manager",
      icon: <Image size={18} />,
    },
    {
      key: "settings",
      label: "Settings",
      icon: <Settings size={18} />,
    },
    {
      key: "pricing",
      label: "Subscription Pricing",
      icon: <DollarSign size={18} />,
    },
    {
      key: "staff",
      label: "Staff Management",
      icon: <UserCog size={18} />,
    },
    {
      key: "ads",
      label: "Ads Manager",
      icon: <DollarSign size={18} />,
    },
    {
      key: "chat" as AdminSection,
      label: "Chat",
      icon: <MessageCircle size={18} />,
      managerVisible: true,
    },
  ];

  const NAV_ITEMS = isManager
    ? ALL_NAV_ITEMS.filter((n) => n.managerVisible)
    : ALL_NAV_ITEMS;

  const [section, setSection] = useState<AdminSection>(
    isManager ? "approvals" : "founder",
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("adminVerified");
    navigate("/admin/pin");
  };

  const currentNav = ALL_NAV_ITEMS.find((n) => n.key === section);

  const renderSection = () => {
    switch (section) {
      case "founder":
        return <FounderSettingsSection />;
      case "categoryManager":
        return <CategoryManagerSection />;
      case "users":
        return <UserManagement />;
      case "search":
        return <GlobalSearch />;
      case "approvals":
        return <ProviderApprovals />;
      case "controls":
        return <HomepageControls />;
      case "banners":
        return <BannerManager />;
      case "settings":
        return <AdminSettings />;
      case "pricing":
        return <SubscriptionPricingSection />;
      case "staff":
        return <StaffManagement />;
      case "ads":
        return <AdsManager />;
      case "chat" as AdminSection:
        return <ChatSection />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-emerald-header shadow-emerald">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-ocid="admin.open_modal_button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
            >
              <Layout size={20} />
            </button>
            <span className="font-heading font-bold text-white text-lg">
              Digital Zindagi Admin
            </span>
            {isManager && (
              <span className="text-xs bg-blue-500/80 text-white px-2 py-0.5 rounded-full font-semibold">
                Manager
              </span>
            )}
          </div>
          <button
            type="button"
            data-ocid="admin.button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar Nav */}
        <aside
          className={`${
            mobileNavOpen ? "fixed inset-0 z-50 bg-black/50" : "hidden"
          } md:static md:block md:z-auto md:bg-transparent`}
        >
          {mobileNavOpen && (
            <button
              type="button"
              className="absolute inset-0 w-full h-full cursor-default"
              onClick={() => setMobileNavOpen(false)}
              onKeyDown={(e) => e.key === "Escape" && setMobileNavOpen(false)}
              aria-label="Close menu"
            />
          )}
          <nav
            className={`${
              mobileNavOpen ? "absolute left-0 top-0 h-full" : ""
            } w-60 bg-white border-r border-border flex flex-col py-4 shadow-lg md:shadow-none`}
            data-ocid="admin.panel"
          >
            {NAV_ITEMS.map((item) => (
              <button
                type="button"
                key={item.key}
                data-ocid="admin.link"
                onClick={() => {
                  setSection(item.key);
                  setMobileNavOpen(false);
                }}
                className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors text-left ${
                  section === item.key
                    ? "bg-accent text-accent-foreground border-r-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 min-w-0">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-6">
              <h2 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
                {currentNav?.icon} {currentNav?.label}
              </h2>
            </div>
            {renderSection()}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
