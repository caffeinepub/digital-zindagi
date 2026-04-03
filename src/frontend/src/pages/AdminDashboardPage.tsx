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
  Pencil,
  Plus,
  Search,
  Send,
  Settings,
  Share2,
  Shield,
  Star,
  ToggleLeft,
  ToggleRight,
  Trash2,
  TrendingUp,
  UserCog,
  Users,
  XCircle,
  Youtube,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob, type SubscriptionPlan } from "../backend";
import type { Banner, ProviderProfile, User } from "../backend";
import { hashPassword, useAuth } from "../contexts/AuthContext";
import { useActor } from "../hooks/useActor";
import {
  useActiveBanners,
  useAdminConfig,
  useAllProviders,
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

// ---- Provider Quick Action Modal ----
interface ProviderQuickActionModalProps {
  user: User;
  profile?: ProviderProfile;
  onClose: () => void;
}

function ProviderQuickActionModal({
  user,
  profile,
  onClose,
}: ProviderQuickActionModalProps) {
  const approveM = useApproveProvider();
  const rejectM = useRejectProvider();

  const handleApprove = async () => {
    await approveM.mutateAsync({
      userId: user.id,
      plan: "oneMonth" as SubscriptionPlan,
    });
    toast.success(`${user.name} ko approve kar diya!`);
    onClose();
  };

  const handleReject = async () => {
    await rejectM.mutateAsync(user.id);
    toast.success(`${user.name} ko reject kar diya.`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      data-ocid="admin.modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 12 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
      >
        {/* Header */}
        <div className="bg-emerald-header text-white px-5 py-4 flex items-center justify-between">
          <div>
            <p className="font-heading font-bold text-lg">{user.name}</p>
            <p className="text-white/70 text-sm">{user.mobile}</p>
          </div>
          <button
            type="button"
            data-ocid="admin.close_button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <XCircle size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Profile Info */}
          {profile && (
            <div className="bg-muted rounded-xl px-4 py-3 space-y-1">
              {profile.shopName && (
                <p className="text-sm font-semibold text-foreground">
                  🏪 {profile.shopName}
                </p>
              )}
              {profile.category && (
                <p className="text-xs text-muted-foreground">
                  Category: {profile.category}
                </p>
              )}
              <span
                className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                  getPlanLabel(profile.planType) === "premium"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {getPlanLabel(profile.planType) === "premium"
                  ? "⭐ Premium"
                  : "🆓 Free"}
              </span>
            </div>
          )}

          {/* Payment Screenshot */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Payment Screenshot
            </p>
            {profile?.paymentScreenshotBlobId ? (
              <img
                src={profile.paymentScreenshotBlobId}
                alt="Payment Screenshot"
                className="w-40 h-40 object-contain border border-border rounded-xl mx-auto block"
              />
            ) : (
              <div className="w-full h-24 bg-muted rounded-xl flex items-center justify-center">
                <p className="text-xs text-muted-foreground text-center px-4">
                  📷 Payment screenshot nahi hai
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              data-ocid="admin.confirm_button"
              onClick={handleApprove}
              disabled={approveM.isPending || rejectM.isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
            >
              {approveM.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle size={14} />
              )}
              Approve
            </button>
            <button
              type="button"
              data-ocid="admin.delete_button"
              onClick={handleReject}
              disabled={approveM.isPending || rejectM.isPending}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-60 font-bold py-2.5 rounded-xl transition-colors text-sm"
            >
              {rejectM.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <XCircle size={14} />
              )}
              Reject
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Helper: convert Motoko variant to readable string
function getRoleLabel(role: unknown): string {
  if (!role || typeof role !== "object") return String(role ?? "");
  const keys = Object.keys(role as object);
  return keys[0] ?? String(role);
}

function getPlanLabel(plan: unknown): string {
  if (!plan || typeof plan !== "object") return String(plan ?? "pending");
  const keys = Object.keys(plan as object);
  return keys[0] ?? "pending";
}

// ---- User Management Section ----
type UserMgmtTab =
  | "recent"
  | "customers"
  | "providers"
  | "nayeProviders"
  | "puraneProviders";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function UserManagement() {
  const [activeTab, setActiveTab] = useState<UserMgmtTab>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<bigint | null>(null);

  const { data: recentUsers, isLoading: r } = useRecentUsers();
  const { data: customers, isLoading: c } = useUsersByRole("customer");
  const { data: providers, isLoading: p } = useUsersByRole("provider");
  const { data: allProviders } = useAllProviders();

  const isProviderTab =
    activeTab === "providers" ||
    activeTab === "nayeProviders" ||
    activeTab === "puraneProviders";

  const baseUsers = (() => {
    switch (activeTab) {
      case "recent":
        return recentUsers ?? [];
      case "customers":
        return customers ?? [];
      case "providers":
        return providers ?? [];
      case "nayeProviders": {
        const now = Date.now();
        return (providers ?? []).filter(
          (u) => now - Number(u.createdAt) <= SEVEN_DAYS_MS,
        );
      }
      case "puraneProviders": {
        const now = Date.now();
        return (providers ?? []).filter(
          (u) => now - Number(u.createdAt) > THIRTY_DAYS_MS,
        );
      }
      default:
        return [];
    }
  })();

  const loading =
    activeTab === "recent" ? r : activeTab === "customers" ? c : p;

  // Client-side search filter
  const users = searchQuery.trim()
    ? baseUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.mobile.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : baseUsers;

  const selectedUser =
    selectedUserId != null
      ? (users.find((u) => u.id === selectedUserId) ?? null)
      : null;
  const selectedProfile =
    selectedUserId != null
      ? (allProviders ?? []).find((p) => p.userId === selectedUserId)
      : undefined;

  const TAB_CONFIG: { key: UserMgmtTab; label: string }[] = [
    { key: "recent", label: "Naye Users (48h)" },
    { key: "customers", label: "All Customers" },
    { key: "providers", label: "All Providers" },
    { key: "nayeProviders", label: "Naye Providers (7d)" },
    { key: "puraneProviders", label: "Purane Providers (30d+)" },
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          data-ocid="admin.search_input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Naam ya Mobile Number se search karein..."
          className="w-full border border-border rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring bg-white"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
        {TAB_CONFIG.map((t) => (
          <button
            key={t.key}
            type="button"
            data-ocid="admin.tab"
            onClick={() => setActiveTab(t.key)}
            className={`flex-shrink-0 py-2 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === t.key
                ? "bg-white text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
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
                <th className="text-left px-4 py-3 font-semibold text-foreground">
                  Mobile
                </th>
                <th className="text-left px-4 py-3 font-semibold text-foreground hidden sm:table-cell">
                  Reg. Date
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
                  <td className="px-4 py-3 font-medium">
                    {isProviderTab ? (
                      <button
                        type="button"
                        data-ocid={`admin.button.${i + 1}`}
                        onClick={() =>
                          setSelectedUserId(
                            selectedUserId === u.id ? null : u.id,
                          )
                        }
                        className="text-primary underline-offset-2 hover:underline font-semibold text-left"
                      >
                        {u.name}
                      </button>
                    ) : (
                      u.name
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.mobile}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">
                    {new Date(Number(u.createdAt)).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="capitalize text-xs">
                      {getRoleLabel(u.role)}
                    </span>
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
              {searchQuery.trim()
                ? "Koi user search results mein nahi mila"
                : "Koi user nahi mila"}
            </div>
          )}
        </div>
      )}

      {/* Provider Quick Action Modal */}
      {selectedUser && isProviderTab && (
        <ProviderQuickActionModal
          user={selectedUser}
          profile={selectedProfile}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}

// ---- Global Search Section ----
function GlobalSearch() {
  const [text, setText] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<bigint | null>(null);
  const { data: users, isLoading } = useSearchUsers(text);
  const { data: allProviders } = useAllProviders();

  const selectedUser =
    selectedUserId != null
      ? ((users ?? []).find((u) => u.id === selectedUserId) ?? null)
      : null;
  const selectedProfile =
    selectedUserId != null
      ? (allProviders ?? []).find((p) => p.userId === selectedUserId)
      : undefined;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          data-ocid="admin.search_input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Naam ya mobile se search karein..."
          className="w-full border border-border rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
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
                <th className="text-left px-4 py-3 font-semibold">Mobile</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">
                  Reg. Date
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
                  <td className="px-4 py-3 font-medium">
                    {getRoleLabel(u.role).toLowerCase() === "provider" ? (
                      <button
                        type="button"
                        data-ocid={`admin.button.${i + 1}`}
                        onClick={() =>
                          setSelectedUserId(
                            selectedUserId === u.id ? null : u.id,
                          )
                        }
                        className="text-primary underline-offset-2 hover:underline font-semibold text-left"
                      >
                        {u.name}
                      </button>
                    ) : (
                      u.name
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.mobile}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">
                    {new Date(Number(u.createdAt)).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="capitalize text-xs">
                      {getRoleLabel(u.role)}
                    </span>
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

      {/* Provider Quick Action Modal for search results */}
      {selectedUser &&
        getRoleLabel(selectedUser.role).toLowerCase() === "provider" && (
          <ProviderQuickActionModal
            user={selectedUser}
            profile={selectedProfile}
            onClose={() => setSelectedUserId(null)}
          />
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

  // Local providers from localStorage (dz_providers)
  const [localProviders, setLocalProviders] = useState<
    {
      id: string;
      name: string;
      mobile: string;
      category: string;
      planType: string;
      status: string;
      createdAt: string;
    }[]
  >(() => {
    try {
      const all = JSON.parse(localStorage.getItem("dz_providers") ?? "[]");
      return all.filter((p: { status: string }) => p.status === "pending");
    } catch {
      return [];
    }
  });

  const handleApproveLocal = (id: string) => {
    try {
      const all = JSON.parse(localStorage.getItem("dz_providers") ?? "[]");
      const updated = all.map((p: { id: string; status: string }) =>
        p.id === id ? { ...p, status: "approved" } : p,
      );
      localStorage.setItem("dz_providers", JSON.stringify(updated));
      setLocalProviders(
        updated.filter((p: { status: string }) => p.status === "pending"),
      );
      toast.success("Provider approve ho gaya!");
    } catch {
      toast.error("Error ho gaya");
    }
  };

  const handleRejectLocal = (id: string) => {
    try {
      const all = JSON.parse(localStorage.getItem("dz_providers") ?? "[]");
      const updated = all.filter((p: { id: string }) => p.id !== id);
      localStorage.setItem("dz_providers", JSON.stringify(updated));
      setLocalProviders(
        updated.filter((p: { status: string }) => p.status === "pending"),
      );
      toast.success("Provider reject ho gaya.");
    } catch {
      toast.error("Error ho gaya");
    }
  };

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

      {/* Local Providers from Registration Form */}
      {localProviders.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-heading font-semibold text-foreground">
            Naye Registrations (Pending Approval)
          </h3>
          {localProviders.map((lp, i) => (
            <div
              key={lp.id}
              data-ocid={`admin.item.local.${i + 1}`}
              className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {lp.name || "Name nahi diya"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    📱 {lp.mobile}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    📂 {lp.category}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Plan:{" "}
                    {lp.planType === "pending_premium"
                      ? "⭐ Premium (Payment Pending)"
                      : "🆓 Free (Ads)"}
                  </p>
                  {lp.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      Registered:{" "}
                      {new Date(lp.createdAt).toLocaleDateString("hi-IN")}
                    </p>
                  )}
                </div>
                <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                  Pending
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  data-ocid={`admin.confirm_button.local.${i + 1}`}
                  onClick={() => handleApproveLocal(lp.id)}
                  className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl"
                >
                  <CheckCircle size={15} /> Approve
                </button>
                <button
                  type="button"
                  data-ocid={`admin.delete_button.local.${i + 1}`}
                  onClick={() => handleRejectLocal(lp.id)}
                  className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 text-sm font-semibold px-4 py-2 rounded-xl"
                >
                  <XCircle size={15} /> Reject
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">
                      {p.shopName || "Shop Name Set Nahi"}
                    </h3>
                    {getPlanLabel(p.planType) === "premium" && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-semibold">
                        Premium ⭐
                      </span>
                    )}
                    {getPlanLabel(p.planType) === "free" && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                        Free
                      </span>
                    )}
                  </div>
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

// Default categories matching CategoryGrid
const DEFAULT_CATEGORIES = [
  { name: "Scrap", hinglish: "Kabadiwala", emoji: "♻️" },
  { name: "Doctor", hinglish: "Online Doctor", emoji: "🏥" },
  { name: "Market", hinglish: "Local Market", emoji: "🛒" },
  { name: "Labor", hinglish: "Expert Labor", emoji: "👷" },
  { name: "Electronics", hinglish: "Electronics", emoji: "📱" },
  { name: "Plumber", hinglish: "Plumber", emoji: "🔧" },
  { name: "Carpenter", hinglish: "Carpenter", emoji: "🪚" },
  { name: "Tutor", hinglish: "Online Tutor", emoji: "📚" },
  { name: "Electrician", hinglish: "Electrician", emoji: "⚡" },
  { name: "Painter", hinglish: "Painter", emoji: "🎨" },
  { name: "Tailor", hinglish: "Darzi", emoji: "✂️" },
  { name: "Salon", hinglish: "Salon", emoji: "💇" },
];

// Emoji picker options for category icon selection
const EMOJI_OPTIONS = [
  "🗑️",
  "🩺",
  "🛒",
  "👷",
  "📱",
  "🔧",
  "🪚",
  "📚",
  "⚡",
  "🎨",
  "✂️",
  "💇",
  "🏪",
  "🚿",
  "🍕",
  "🚗",
  "🏠",
  "🌿",
  "💊",
  "🔌",
  "🪣",
  "🛠️",
  "🌾",
  "🎭",
  "👗",
  "🐄",
  "🌻",
  "🏋️",
  "🧹",
  "🍽️",
  "♻️",
  "🏥",
  "💼",
  "🎓",
  "🏗️",
  "🚜",
  "🧴",
  "🪴",
  "🎯",
  "🛵",
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        data-ocid="admin.toggle"
        onClick={() => setOpen((p) => !p)}
        className="w-12 h-10 border border-border rounded-xl text-xl flex items-center justify-center hover:bg-accent transition-colors"
        title="Icon chunein"
      >
        {value}
      </button>
      {open && (
        <div className="absolute top-12 left-0 z-50 bg-white border border-border rounded-2xl shadow-xl p-3 w-64">
          <p className="text-xs text-muted-foreground mb-2 font-medium">
            Icon select karein:
          </p>
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onChange(emoji);
                  setOpen(false);
                }}
                className={`w-7 h-7 text-base rounded-lg hover:bg-accent flex items-center justify-center transition-colors ${emoji === value ? "bg-primary/20 ring-1 ring-primary" : ""}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryManagerSection() {
  const { data: toggles, isLoading } = useAllToggles();
  const updateToggle = useUpdateToggle();
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [showSaved, setShowSaved] = useState(false);
  const [triggerSaveAll, setTriggerSaveAll] = useState(0);

  // Build merged category list: defaults + user-added (state-driven for edit/remove)
  const buildInitialCategories = () => {
    // Try loading from dz_categories_list first (persisted list with edits/removes)
    try {
      const stored = localStorage.getItem("dz_categories_list");
      if (stored) {
        return JSON.parse(stored) as {
          name: string;
          hinglish: string;
          emoji: string;
        }[];
      }
    } catch {}
    // Fallback: defaults + approved extras
    const extra: { name: string; hinglish: string; emoji: string }[] = (() => {
      try {
        const stored = JSON.parse(
          localStorage.getItem("dz_approved_categories") ?? "[]",
        ) as { name: string; icon: string; status: string }[];
        const defaultNames = new Set(
          DEFAULT_CATEGORIES.map((c) => c.name.toLowerCase()),
        );
        return stored
          .filter((c) => !defaultNames.has(c.name.toLowerCase()))
          .map((c) => ({
            name: c.name,
            hinglish: c.name,
            emoji: c.icon ?? "🏪",
          }));
      } catch {
        return [];
      }
    })();
    return [...DEFAULT_CATEGORIES, ...extra];
  };

  const [categories, setCategories] = useState<
    { name: string; hinglish: string; emoji: string }[]
  >(buildInitialCategories);

  const persistCategories = (
    cats: { name: string; hinglish: string; emoji: string }[],
  ) => {
    localStorage.setItem("dz_categories_list", JSON.stringify(cats));
  };

  const handleRemoveCategory = (catName: string) => {
    setCategories((prev) => {
      const updated = prev.filter((c) => c.name !== catName);
      persistCategories(updated);
      return updated;
    });
    toast.success(`"${catName}" category remove ho gayi!`);
  };

  const handleEditCategory = (
    oldName: string,
    newName: string,
    newEmoji: string,
  ) => {
    setCategories((prev) => {
      const updated = prev.map((c) =>
        c.name === oldName
          ? { ...c, name: newName, hinglish: newName, emoji: newEmoji }
          : c,
      );
      persistCategories(updated);
      return updated;
    });
    toast.success("Category update ho gayi!");
  };

  // Get toggle value for a category (from backend or localStorage)
  const getToggleValue = (name: string): boolean => {
    if (toggles) {
      const found = toggles.find(([k]) => k === name);
      if (found !== undefined) return found[1];
    }
    try {
      const statusMap = JSON.parse(
        localStorage.getItem("dz_category_status") ?? "{}",
      );
      return statusMap[name] ?? true;
    } catch {
      return true;
    }
  };

  const handleSaveAll = () => {
    setTriggerSaveAll((n) => n + 1);
    setShowSaved(true);
    toast.success("Saari categories save ho gayi!");
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
    // Also update the categories state
    setCategories((prev) => {
      const newCat = {
        name: newCatName.trim(),
        hinglish: newCatName.trim(),
        emoji: newCatIcon,
      };
      const updated = [...prev, newCat];
      persistCategories(updated);
      return updated;
    });
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
        <div className="flex gap-2 items-center">
          <EmojiPicker value={newCatIcon} onChange={setNewCatIcon} />
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

      {/* Category List with Full Subscription Row */}
      <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">
            Categories — Price (4 Plans), Status &amp; AdMob
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Har category mein 4 plan prices set karein, ON/OFF karein, phir
            "Save" dabayein.
          </p>
        </div>
        {categories.length === 0 ? (
          <div
            data-ocid="admin.empty_state"
            className="text-center py-12 text-muted-foreground"
          >
            Koi category nahi mila
          </div>
        ) : (
          categories.map((cat, i) => (
            <CategoryRow
              key={cat.name}
              index={i}
              name={cat.name}
              emoji={cat.emoji}
              isOn={getToggleValue(cat.name)}
              isManager={isManager}
              triggerSaveAll={triggerSaveAll}
              onSave={(data) => {
                if (!isManager) {
                  updateToggle.mutate({ name: cat.name, value: data.isOn });
                }
                // Persist status map
                const statusMap: Record<string, boolean> = (() => {
                  try {
                    return JSON.parse(
                      localStorage.getItem("dz_category_status") ?? "{}",
                    );
                  } catch {
                    return {};
                  }
                })();
                statusMap[cat.name] = data.isOn;
                localStorage.setItem(
                  "dz_category_status",
                  JSON.stringify(statusMap),
                );
                setShowSaved(true);
                toast.success(`"${cat.name}" save ho gayi!`);
                setTimeout(() => setShowSaved(false), 3000);
              }}
              onToggle={(val) => {
                if (!isManager)
                  updateToggle.mutate({ name: cat.name, value: val });
              }}
              onRemove={() => handleRemoveCategory(cat.name)}
              onEditNameEmoji={(newName, newEmoji) =>
                handleEditCategory(cat.name, newName, newEmoji)
              }
            />
          ))
        )}
      </div>

      {/* Global Save All Button */}
      {!isManager && (
        <div className="pt-2">
          <button
            type="button"
            data-ocid="admin.save_button"
            onClick={handleSaveAll}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl text-base flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            <CheckCircle size={20} />
            Save All Changes — Saari Categories Save Karein
          </button>
        </div>
      )}
    </div>
  );
}

interface CategoryRowData {
  m1: string;
  m2: string;
  m6: string;
  m12: string;
  adMob: boolean;
  isOn: boolean;
  adInterval: string; // Ad interval in minutes, default "5"
}

interface CategoryRowProps {
  index: number;
  name: string;
  emoji: string;
  isOn: boolean;
  isManager: boolean;
  triggerSaveAll: number;
  onSave: (data: CategoryRowData) => void;
  onToggle: (val: boolean) => void;
  onRemove?: () => void;
  onEditNameEmoji?: (newName: string, newEmoji: string) => void;
}

function CategoryRow({
  index,
  name,
  emoji,
  isOn,
  isManager,
  triggerSaveAll,
  onSave,
  onToggle,
  onRemove,
  onEditNameEmoji,
}: CategoryRowProps) {
  const storageKey = `dz_cat_row_${name}`;

  const loadStored = (): CategoryRowData => {
    try {
      const d = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
      return {
        m1: d.m1 ?? "",
        m2: d.m2 ?? "",
        m6: d.m6 ?? "",
        m12: d.m12 ?? "",
        adMob: d.adMob ?? false,
        isOn: d.isOn ?? isOn,
        adInterval: d.adInterval ?? "5",
      };
    } catch {
      return {
        m1: "",
        m2: "",
        m6: "",
        m12: "",
        adMob: false,
        isOn,
        adInterval: "5",
      };
    }
  };

  const initial = loadStored();
  const [m1, setM1] = useState(initial.m1);
  const [m2, setM2] = useState(initial.m2);
  const [m6, setM6] = useState(initial.m6);
  const [m12, setM12] = useState(initial.m12);
  const [adMob, setAdMob] = useState(initial.adMob);
  const [localOn, setLocalOn] = useState(initial.isOn);
  const [adInterval, setAdInterval] = useState(initial.adInterval);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editEmoji, setEditEmoji] = useState(emoji);

  const handleSave = () => {
    const data: CategoryRowData = {
      m1,
      m2,
      m6,
      m12,
      adMob,
      isOn: localOn,
      adInterval: adInterval || "5",
    };
    localStorage.setItem(storageKey, JSON.stringify(data));
    onSave(data);
  };

  const handleConfirmEdit = () => {
    if (!editName.trim()) return;
    onEditNameEmoji?.(editName.trim(), editEmoji);
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditName(name);
    setEditEmoji(emoji);
    setEditMode(false);
  };

  const handleRemoveClick = () => {
    if (
      window.confirm(
        `"${name}" category delete karein? Yeh action undo nahi hoga.`,
      )
    ) {
      onRemove?.();
    }
  };

  // Listen to global Save All trigger
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — only re-runs on triggerSaveAll change
  useEffect(() => {
    if (triggerSaveAll > 0) {
      const data: CategoryRowData = {
        m1,
        m2,
        m6,
        m12,
        adMob,
        isOn: localOn,
        adInterval: adInterval || "5",
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
      onSave(data);
    }
  }, [triggerSaveAll]);

  return (
    <div
      data-ocid={`admin.item.${index + 1}`}
      className="border-b border-border last:border-0 px-5 py-4 space-y-3"
    >
      {/* Row Header: Name + Edit/Remove + ON/OFF */}
      <div className="flex items-center justify-between gap-2">
        {editMode ? (
          /* Inline Edit Form */
          <div className="flex items-center gap-2 flex-1">
            <EmojiPicker value={editEmoji} onChange={setEditEmoji} />
            <input
              data-ocid="admin.input"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Category naam"
              className="flex-1 border border-emerald-400 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400 min-w-0"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmEdit();
                if (e.key === "Escape") handleCancelEdit();
              }}
            />
            <button
              type="button"
              data-ocid="admin.save_button"
              onClick={handleConfirmEdit}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors text-xs font-bold flex-shrink-0"
              title="Confirm"
            >
              ✓
            </button>
            <button
              type="button"
              data-ocid="admin.cancel_button"
              onClick={handleCancelEdit}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors text-xs font-bold flex-shrink-0"
              title="Cancel"
            >
              ✗
            </button>
          </div>
        ) : (
          /* Normal Name Display */
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xl flex-shrink-0">{emoji}</span>
            <span className="font-semibold text-foreground text-sm truncate">
              {name}
            </span>
            {!isManager && (
              <div className="flex items-center gap-1 ml-1 flex-shrink-0">
                <button
                  type="button"
                  data-ocid="admin.edit_button"
                  onClick={() => {
                    setEditName(name);
                    setEditEmoji(emoji);
                    setEditMode(true);
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded-md text-blue-500 hover:bg-blue-50 transition-colors"
                  title="Edit karo"
                >
                  <Pencil size={12} />
                </button>
                <button
                  type="button"
                  data-ocid="admin.delete_button"
                  onClick={handleRemoveClick}
                  className="w-6 h-6 flex items-center justify-center rounded-md text-red-400 hover:bg-red-50 transition-colors"
                  title="Remove karo"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          data-ocid={`admin.toggle.${index + 1}`}
          onClick={() => {
            const next = !localOn;
            setLocalOn(next);
            onToggle(next);
          }}
          disabled={isManager}
          className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ${
            localOn
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {localOn ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          {localOn ? "ON" : "OFF"}
        </button>
      </div>

      {/* 4 Price Inputs */}
      {!isManager && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "1 Month", value: m1, set: setM1 },
            { label: "2 Month", value: m2, set: setM2 },
            { label: "6 Month", value: m6, set: setM6 },
            { label: "12 Month", value: m12, set: setM12 },
          ].map(({ label, value, set }) => (
            <div key={label} className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">
                {label} ₹
              </span>
              <input
                data-ocid="admin.input"
                type="number"
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder="Price"
                className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          ))}
        </div>
      )}

      {/* AdMob Toggle + Ad Interval + Save Button */}
      {!isManager && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">
                AdMob Ads:
              </span>
              <button
                type="button"
                data-ocid={`admin.toggle.${index + 1}`}
                onClick={() => setAdMob((v) => !v)}
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                  adMob
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {adMob ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                {adMob ? "ON" : "OFF"}
              </button>
            </div>
            {/* Ad Interval input — only visible when AdMob is ON */}
            {adMob && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                  Ad Interval (Min):
                </span>
                <input
                  data-ocid="admin.input"
                  type="number"
                  min={1}
                  value={adInterval}
                  onChange={(e) => setAdInterval(e.target.value)}
                  placeholder="5"
                  className="w-16 border border-border rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring text-center"
                />
              </div>
            )}
          </div>
          <button
            type="button"
            data-ocid="admin.save_button"
            onClick={handleSave}
            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors flex-shrink-0"
          >
            <CheckCircle size={13} />
            Save Changes
          </button>
        </div>
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

  // Security Settings — Email, Password, Mobile
  const [adminEmail, setAdminEmail] = useState(
    () => localStorage.getItem("dz_admin_email") ?? "sushhilkumar651@gmail.com",
  );
  const [emailSaving, setEmailSaving] = useState(false);
  const [currentAdminPassword, setCurrentAdminPassword] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [confirmAdminPassword, setConfirmAdminPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [adminMobileProfile, setAdminMobileProfile] = useState(
    () => localStorage.getItem("dz_admin_mobile") ?? "",
  );
  const [mobileSaving, setMobileSaving] = useState(false);

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

      {/* Security Settings */}
      <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-6">
        <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
          <Shield size={18} className="text-primary" />
          Security Settings
        </h3>

        {/* a) Edit Email */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            ✉️ Email Badlein
          </h4>
          <div>
            <label
              htmlFor="sec-admin-email"
              className="block text-xs font-medium text-muted-foreground mb-1"
            >
              Admin Email Address
            </label>
            <input
              id="sec-admin-email"
              data-ocid="admin.input"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="Admin email"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Naya email login mein use hoga
            </p>
          </div>
          <button
            type="button"
            data-ocid="admin.save_button"
            disabled={emailSaving}
            onClick={() => {
              setEmailSaving(true);
              setTimeout(() => {
                localStorage.setItem("dz_admin_email", adminEmail);
                toast.success("Email save ho gaya!");
                setEmailSaving(false);
              }, 300);
            }}
            className="bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-xl hover:opacity-90 flex items-center gap-2 text-sm disabled:opacity-60"
          >
            {emailSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : null}
            Email Save Karein
          </button>
        </div>

        <div className="border-t border-border pt-6 space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            🔒 Password Badlein
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="sec-cur-pwd"
                className="block text-xs font-medium text-muted-foreground mb-1"
              >
                Current Password
              </label>
              <input
                id="sec-cur-pwd"
                data-ocid="admin.input"
                type="password"
                value={currentAdminPassword}
                onChange={(e) => setCurrentAdminPassword(e.target.value)}
                placeholder="Current password"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label
                htmlFor="sec-new-pwd"
                className="block text-xs font-medium text-muted-foreground mb-1"
              >
                Naya Password
              </label>
              <input
                id="sec-new-pwd"
                data-ocid="admin.input"
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="Naya password"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label
                htmlFor="sec-conf-pwd"
                className="block text-xs font-medium text-muted-foreground mb-1"
              >
                Confirm Password
              </label>
              <input
                id="sec-conf-pwd"
                data-ocid="admin.input"
                type="password"
                value={confirmAdminPassword}
                onChange={(e) => setConfirmAdminPassword(e.target.value)}
                placeholder="Dobara daalein"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <button
            type="button"
            data-ocid="admin.save_button"
            disabled={passwordSaving}
            onClick={async () => {
              if (
                !currentAdminPassword ||
                !newAdminPassword ||
                !confirmAdminPassword
              ) {
                toast.error("Sab password fields bharen");
                return;
              }
              const storedPwd =
                localStorage.getItem("dz_admin_password") ?? "Admin@2024";
              if (currentAdminPassword !== storedPwd) {
                toast.error("Current password galat hai");
                return;
              }
              if (newAdminPassword !== confirmAdminPassword) {
                toast.error("Naya password aur confirm match nahi kar rahe");
                return;
              }
              if (newAdminPassword.length < 6) {
                toast.error("Password kam se kam 6 characters ka hona chahiye");
                return;
              }
              setPasswordSaving(true);
              setTimeout(() => {
                localStorage.setItem("dz_admin_password", newAdminPassword);
                toast.success("Password change ho gaya!");
                setCurrentAdminPassword("");
                setNewAdminPassword("");
                setConfirmAdminPassword("");
                setPasswordSaving(false);
              }, 300);
            }}
            className="bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-xl hover:opacity-90 flex items-center gap-2 text-sm disabled:opacity-60"
          >
            {passwordSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : null}
            Password Save Karein
          </button>
        </div>

        {/* c) Edit Secret PIN (5-digit) */}
        <div className="border-t border-border pt-6 space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            🔑 Secret PIN Badlein (5 Digits)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="cur-pin"
                className="block text-xs font-medium text-muted-foreground mb-1"
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
                className="block text-xs font-medium text-muted-foreground mb-1"
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
                className="block text-xs font-medium text-muted-foreground mb-1"
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
            className="bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-xl hover:opacity-90 flex items-center gap-2 text-sm disabled:opacity-60"
          >
            {pinSaving ? <Loader2 size={14} className="animate-spin" /> : null}
            PIN Change Karein
          </button>
        </div>

        {/* d) Add/Edit Mobile */}
        <div className="border-t border-border pt-6 space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            📱 Mobile Number Jodein / Badlein
          </h4>
          <div>
            <label
              htmlFor="sec-admin-mobile"
              className="block text-xs font-medium text-muted-foreground mb-1"
            >
              Admin Mobile Number
            </label>
            <input
              id="sec-admin-mobile"
              data-ocid="admin.input"
              type="tel"
              value={adminMobileProfile}
              onChange={(e) => setAdminMobileProfile(e.target.value)}
              placeholder="Apna mobile number daalein"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Yeh aapka personal contact number hai
            </p>
          </div>
          <button
            type="button"
            data-ocid="admin.save_button"
            disabled={mobileSaving}
            onClick={() => {
              setMobileSaving(true);
              setTimeout(() => {
                localStorage.setItem("dz_admin_mobile", adminMobileProfile);
                toast.success("Mobile number save ho gaya!");
                setMobileSaving(false);
              }, 300);
            }}
            className="bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-xl hover:opacity-90 flex items-center gap-2 text-sm disabled:opacity-60"
          >
            {mobileSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : null}
            Mobile Save Karein
          </button>
        </div>
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

// ---- Social Media Section ----
function SocialMediaSection() {
  const [settings, setSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dz_social_settings") ?? "{}");
    } catch {
      return {};
    }
  });
  const [saved, setSaved] = useState(false);

  const platforms = [
    { key: "facebook", label: "Facebook", icon: <Facebook size={18} /> },
    { key: "instagram", label: "Instagram", icon: <Instagram size={18} /> },
    { key: "whatsapp", label: "WhatsApp", icon: <Share2 size={18} /> },
    { key: "youtube", label: "YouTube", icon: <Youtube size={18} /> },
  ];

  const handleToggle = (key: string) => {
    setSettings((prev: Record<string, unknown>) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleUrl = (key: string, val: string) => {
    setSettings((prev: Record<string, unknown>) => ({
      ...prev,
      [`${key}Url`]: val,
    }));
  };

  const handleSave = () => {
    localStorage.setItem("dz_social_settings", JSON.stringify(settings));
    setSaved(true);
    toast.success("Social Media settings save ho gayi!");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-4">
        <h3 className="font-heading font-semibold text-foreground">
          Social Media Links ON/OFF
        </h3>
        <p className="text-sm text-muted-foreground">
          Jab aap kisi platform ko ON karenge, woh icon homepage par dikhega.
        </p>
        {platforms.map((p) => (
          <div
            key={p.key}
            className="border border-border rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-sm">
                {p.icon} {p.label}
              </div>
              <button
                type="button"
                data-ocid="admin.toggle"
                onClick={() => handleToggle(p.key)}
                className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  settings[p.key]
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {settings[p.key] ? (
                  <ToggleRight size={18} />
                ) : (
                  <ToggleLeft size={18} />
                )}
                {settings[p.key] ? "ON" : "OFF"}
              </button>
            </div>
            {settings[p.key] && (
              <input
                data-ocid="admin.input"
                type="url"
                placeholder={`${p.label} profile URL (optional)`}
                value={(settings[`${p.key}Url`] as string) ?? ""}
                onChange={(e) => handleUrl(p.key, e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>
        ))}
        <button
          type="button"
          data-ocid="admin.primary_button"
          onClick={handleSave}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
            saved
              ? "bg-green-500 text-white"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {saved ? "✓ Saved!" : "Save Social Media Settings"}
        </button>
      </div>
    </div>
  );
}

// ---- Affiliate Marketing Section ----
function AffiliateMarketingSection() {
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem("dz_affiliate_settings");
      if (!raw)
        return {
          enabled: false,
          title: "Affiliate Marketing",
          description: "Paisa kamao Digital Zindagi se!",
          link: "",
        };
      return JSON.parse(raw);
    } catch {
      return {
        enabled: false,
        title: "Affiliate Marketing",
        description: "Paisa kamao Digital Zindagi se!",
        link: "",
      };
    }
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("dz_affiliate_settings", JSON.stringify(settings));
    setSaved(true);
    toast.success("Affiliate Marketing settings save ho gayi!");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-foreground">
            Affiliate Marketing
          </h3>
          <button
            type="button"
            data-ocid="admin.toggle"
            onClick={() =>
              setSettings((prev: typeof settings) => ({
                ...prev,
                enabled: !prev.enabled,
              }))
            }
            className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${
              settings.enabled
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {settings.enabled ? (
              <ToggleRight size={18} />
            ) : (
              <ToggleLeft size={18} />
            )}
            {settings.enabled ? "ON (Homepage par dikhega)" : "OFF"}
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          ON karne par homepage par ek promotional banner dikhega jahan users
          affiliate link join kar sakte hain.
        </p>
        <div className="space-y-3">
          <div>
            <label
              htmlFor="aff-title"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block"
            >
              Banner Title
            </label>
            <input
              id="aff-title"
              data-ocid="admin.input"
              type="text"
              placeholder="Affiliate Marketing"
              value={settings.title}
              onChange={(e) =>
                setSettings((prev: typeof settings) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label
              htmlFor="aff-desc"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block"
            >
              Description
            </label>
            <textarea
              id="aff-desc"
              data-ocid="admin.input"
              placeholder="Paisa kamao Digital Zindagi se!"
              value={settings.description}
              onChange={(e) =>
                setSettings((prev: typeof settings) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={2}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div>
            <label
              htmlFor="aff-link"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block"
            >
              Join Link (URL)
            </label>
            <input
              id="aff-link"
              data-ocid="admin.input"
              type="url"
              placeholder="https://..."
              value={settings.link}
              onChange={(e) =>
                setSettings((prev: typeof settings) => ({
                  ...prev,
                  link: e.target.value,
                }))
              }
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        {settings.enabled && (
          <div className="bg-gradient-to-r from-emerald-600 to-green-500 rounded-2xl p-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80 mb-1">
              Preview (Homepage par aise dikhega)
            </p>
            <p className="font-bold text-lg">
              {settings.title || "Affiliate Marketing"}
            </p>
            <p className="text-sm opacity-90 mt-1">
              {settings.description || "Paisa kamao Digital Zindagi se!"}
            </p>
            <button
              type="button"
              className="mt-3 bg-white text-emerald-700 text-xs font-bold px-4 py-1.5 rounded-xl"
            >
              Join Now →
            </button>
          </div>
        )}
        <button
          type="button"
          data-ocid="admin.primary_button"
          onClick={handleSave}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
            saved
              ? "bg-green-500 text-white"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {saved ? "✓ Saved!" : "Save Affiliate Settings"}
        </button>
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
    {
      key: "socialMedia" as AdminSection,
      label: "Social Media",
      icon: <Share2 size={18} />,
    },
    {
      key: "affiliateMarketing" as AdminSection,
      label: "Affiliate Marketing",
      icon: <TrendingUp size={18} />,
    },
  ];

  const NAV_ITEMS = isManager
    ? ALL_NAV_ITEMS.filter((n) => n.managerVisible)
    : ALL_NAV_ITEMS;

  const searchParams = new URLSearchParams(window.location.search);
  const initialSection =
    (searchParams.get("section") as AdminSection) || "categoryManager";
  const [section, setSection] = useState<AdminSection>(
    isManager ? "approvals" : initialSection,
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("adminVerified");
    navigate("/login");
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
      case "socialMedia" as AdminSection:
        return <SocialMediaSection />;
      case "affiliateMarketing" as AdminSection:
        return <AffiliateMarketingSection />;
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
