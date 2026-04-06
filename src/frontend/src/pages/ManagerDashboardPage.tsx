import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Loader2,
  LogOut,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Users,
  Video,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { ApprovalStatus, type SubscriptionPlan } from "../backend";
import VideoPlayer from "../components/VideoPlayer";
import { useAuth } from "../contexts/AuthContext";
import {
  useActiveProviders,
  useApproveProvider,
  useProvidersPendingApproval,
  useRejectProvider,
} from "../hooks/useQueries";
import { useNavigate } from "../lib/router";
import {
  type SheetRow,
  getSheetData,
  syncFromSheet,
} from "../utils/googleSheetsSync";
import { broadcastSettingsChange } from "../utils/settingsSync";

// Read/write video toggle state per row id
function readVideoToggles(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem("dz_manager_video_toggles") ?? "{}");
  } catch {
    return {};
  }
}

function saveVideoToggles(t: Record<string, boolean>): void {
  localStorage.setItem("dz_manager_video_toggles", JSON.stringify(t));
}

function readAdsToggles(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem("dz_manager_ads_toggles") ?? "{}");
  } catch {
    return {};
  }
}

function saveAdsToggles(t: Record<string, boolean>): void {
  localStorage.setItem("dz_manager_ads_toggles", JSON.stringify(t));
  broadcastSettingsChange();
}

export default function ManagerDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const {
    data: activeProviders,
    isLoading: loadingActive,
    refetch: refetchActive,
  } = useActiveProviders();
  const {
    data: pendingProviders,
    isLoading: loadingPending,
    refetch: refetchPending,
  } = useProvidersPendingApproval();
  const approveM = useApproveProvider();
  const rejectM = useRejectProvider();

  const [videoToggles, setVideoToggles] =
    useState<Record<string, boolean>>(readVideoToggles);
  const [adsToggles, setAdsToggles] =
    useState<Record<string, boolean>>(readAdsToggles);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [sheetRows, setSheetRows] = useState<SheetRow[]>(getSheetData);
  const [syncing, setSyncing] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleApprove = async (userId: bigint, name: string) => {
    setApproving(userId.toString());
    try {
      await approveM.mutateAsync({
        userId,
        plan: "oneMonth" as SubscriptionPlan,
      });
      toast.success(`${name} ko approve kar diya!`);
      refetchPending();
      refetchActive();
    } catch {
      toast.error("Approve karne mein error aaya");
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (userId: bigint, name: string) => {
    setApproving(userId.toString());
    try {
      await rejectM.mutateAsync(userId);
      toast.success(`${name} ko reject kar diya.`);
      refetchPending();
    } catch {
      toast.error("Reject karne mein error aaya");
    } finally {
      setApproving(null);
    }
  };

  const toggleVideo = (id: string) => {
    const newToggles = { ...videoToggles, [id]: !videoToggles[id] };
    setVideoToggles(newToggles);
    saveVideoToggles(newToggles);
    broadcastSettingsChange();
    toast.success(`Video ${newToggles[id] ? "ON" : "OFF"} kar diya`);
  };

  const toggleAds = (id: string) => {
    const newToggles = { ...adsToggles, [id]: !adsToggles[id] };
    setAdsToggles(newToggles);
    saveAdsToggles(newToggles);
    toast.success(`Ads ${newToggles[id] ? "ON" : "OFF"} kar diye`);
  };

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncFromSheet();
    setSyncing(false);
    if (result.error) {
      toast.error(`Sync failed: ${result.error}`);
    } else {
      toast.success(`${result.added} rows sync ho gaye!`);
      setSheetRows(getSheetData());
    }
  };

  const isLoading = loadingActive || loadingPending;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header
        className="bg-emerald-header text-white px-4 py-4 sticky top-0 z-20"
        data-ocid="manager.section"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-2">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-base leading-tight">
                Manager Dashboard
              </h1>
              <p className="text-white/70 text-xs">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              title="Google Sheet Sync"
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors disabled:opacity-60"
            >
              <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              data-ocid="manager.secondary_button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 w-full flex-1 space-y-8">
        {isLoading ? (
          <div
            data-ocid="manager.loading_state"
            className="flex items-center justify-center py-24"
          >
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Daily Approvals — Pending */}
            <section data-ocid="manager.section">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading font-bold text-lg text-foreground">
                  📋 Daily Approvals
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {pendingProviders?.length ?? 0} Pending
                </Badge>
              </div>
              {pendingProviders && pendingProviders.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {pendingProviders.map((p, i) => (
                    <div
                      key={p.userId.toString()}
                      data-ocid={`manager.item.${i + 1}`}
                      className="bg-white rounded-2xl border border-amber-200 shadow-xs p-4"
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {p.shopName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {p.category} &bull; {p.address}
                          </p>
                        </div>
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs flex-shrink-0">
                          Pending
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={approving === p.userId.toString()}
                          onClick={() => handleApprove(p.userId, p.shopName)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-60"
                        >
                          {approving === p.userId.toString() ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <CheckCircle size={13} />
                          )}
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={approving === p.userId.toString()}
                          onClick={() => handleReject(p.userId, p.shopName)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-60"
                        >
                          <XCircle size={13} />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <div
                  data-ocid="manager.empty_state"
                  className="text-center py-10 text-muted-foreground bg-white rounded-2xl border border-border"
                >
                  <p className="text-sm">Aaj koi pending approval nahi hai ✔️</p>
                </div>
              )}
            </section>

            {/* Videos & Ads Toggle per Sheet Row */}
            <section data-ocid="manager.section">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading font-bold text-lg text-foreground">
                  🎬 Videos & Ads Control
                </h2>
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline disabled:opacity-60"
                >
                  <RefreshCw
                    size={12}
                    className={syncing ? "animate-spin" : ""}
                  />
                  Sheet Sync
                </button>
              </div>
              {sheetRows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-white rounded-2xl border border-border">
                  <p className="text-sm">
                    Google Sheet mein koi data nahi hai.
                  </p>
                  <p className="text-xs mt-1">
                    Admin Panel mein Google Sheets section mein jaayein.
                  </p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {sheetRows
                    .filter((r) => r.videoLink || r.adLink)
                    .map((row, i) => (
                      <div
                        key={row.id}
                        data-ocid={`manager.item.${i + 1}`}
                        className="bg-white rounded-2xl border border-border p-4"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground">
                              {row.platform || row.category || `Row ${i + 1}`}
                            </p>
                            {row.category && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {row.category}
                              </p>
                            )}
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              row.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {row.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {/* Video Toggle */}
                          {row.videoLink && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setVideoUrl(row.videoLink)}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                              >
                                <Video size={12} /> Preview
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleVideo(row.id)}
                                className="flex items-center gap-1.5 text-xs font-semibold"
                              >
                                {videoToggles[row.id] !== false ? (
                                  <>
                                    <ToggleRight
                                      size={20}
                                      className="text-primary"
                                    />{" "}
                                    <span className="text-primary">
                                      Video ON
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <ToggleLeft
                                      size={20}
                                      className="text-muted-foreground"
                                    />{" "}
                                    <span className="text-muted-foreground">
                                      Video OFF
                                    </span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {/* Ads Toggle */}
                          {row.adLink && (
                            <button
                              type="button"
                              onClick={() => toggleAds(row.id)}
                              className="flex items-center gap-1.5 text-xs font-semibold"
                            >
                              {adsToggles[row.id] !== false ? (
                                <>
                                  <ToggleRight
                                    size={20}
                                    className="text-amber-500"
                                  />{" "}
                                  <span className="text-amber-600">Ads ON</span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft
                                    size={20}
                                    className="text-muted-foreground"
                                  />{" "}
                                  <span className="text-muted-foreground">
                                    Ads OFF
                                  </span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </motion.div>
              )}
            </section>

            {/* Active Providers */}
            <section data-ocid="manager.section">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading font-bold text-lg text-foreground">
                  Active Providers
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {activeProviders?.length ?? 0}
                </Badge>
              </div>
              {activeProviders && activeProviders.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {activeProviders.map((p, i) => (
                    <div
                      key={p.userId.toString()}
                      data-ocid={`manager.item.${i + 1}`}
                      className="bg-white rounded-2xl border border-border shadow-xs p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {p.shopName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {p.category} &bull; {p.address}
                          </p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs flex-shrink-0">
                          Active
                        </Badge>
                      </div>
                      {p.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {p.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3">
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg"
                          style={{
                            background:
                              p.approvalStatus === ApprovalStatus.approved
                                ? "oklch(0.92 0.1 155)"
                                : "oklch(0.96 0.03 80)",
                            color:
                              p.approvalStatus === ApprovalStatus.approved
                                ? "oklch(0.3 0.12 155)"
                                : "oklch(0.5 0.1 80)",
                          }}
                        >
                          {p.approvalStatus === ApprovalStatus.approved
                            ? "✓ Approved"
                            : p.approvalStatus}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Sub: {p.subscriptionStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <div
                  data-ocid="manager.empty_state"
                  className="text-center py-10 text-muted-foreground bg-white rounded-2xl border border-border"
                >
                  <p className="text-sm">Koi active provider nahi hai</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Video Player */}
      {videoUrl && (
        <VideoPlayer
          url={videoUrl}
          title="Sheet Video"
          onClose={() => setVideoUrl(null)}
        />
      )}

      <footer className="bg-emerald-footer text-white/60 text-xs text-center py-4">
        © {new Date().getFullYear()} Digital Zindagi
      </footer>
    </div>
  );
}
