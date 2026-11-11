import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Upload,
  Clock,
  CreditCard,
  Key,
  Settings,
  Sparkles,
  TrendingUp,
  Timer,
  ImageIcon,
  Download,
  Plus,
  ArrowLeft,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  LogOut,
  User as UserIcon,
  Calendar,
  BarChart2,
  Filter,
  Lock,
  Eye,
  EyeOff,
  Save,
  Pencil,
  X,
  AlertTriangle,
  KeyRound,
  RefreshCw,
  Trash2,
  Menu,
  Receipt,
  Coins,
  FileText,
  Printer,
} from "lucide-react";
import logo from "@/assets/snapkut-logo.png.asset.json";
import { useUserCredits } from "@/hooks/use-user-credits";
import { useCutoutHistory } from "@/hooks/use-cutout-history";
import { CutoutHistoryItem } from "@/lib/history-storage";
import { openRazorpayCheckout, verifyAndApplyPayment } from "@/lib/razorpay";
import { UploadZone } from "@/components/site/UploadZone";
import { HistoryGallery } from "@/components/site/HistoryGallery";
import { useAuth } from "@/contexts/auth-context";
import {
  upgradeProfileToPro,
  addCreditsToProfile,
  savePaymentRecord,
  fetchUserCutouts,
  updateCutoutRecordName,
  updateUserProfileName,
  updateUserPassword,
  rotateUserApiKey,
  deleteUserAccount,
  fetchUserPaymentRecords,
  deleteCutoutRecord,
  clearUserCutoutHistory,
  type PaymentRecordItem,
} from "@/lib/supabase";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Sn_apKut AI" },
      {
        name: "description",
        content: "Manage your Sn_apKut AI cutouts, credits, API keys, and subscription usage.",
      },
    ],
  }),
  component: DashboardPage,
});

type DashboardTab = "dashboard" | "upload" | "history" | "billing" | "api" | "settings";
type HistoryFilter = "all" | "today" | "yesterday" | "week";

function formatProcessedDate(timestamp: number): string {
  if (!timestamp) return "Recently";
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (isToday) return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${timeStr}`;
}

function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");
  const [copiedKey, setCopiedKey] = useState(false);
  const [cloudCutouts, setCloudCutouts] = useState<CutoutHistoryItem[]>([]);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // User profile & security state
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [updatingName, setUpdatingName] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const { plan: localPlan, creditsRemaining: localCredits, totalProcessed: localTotal, monthProcessed: localMonth, apiKey: localKey, makePro, add, rotateKey } =
    useUserCredits();
  const { history, removeItem, renameItem, clear } = useCutoutHistory();
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();

  // API Key states
  const [showApiKey, setShowApiKey] = useState(false);
  const [rotatingKey, setRotatingKey] = useState(false);

  // Delete account states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Invoices & Payment records state
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecordItem[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentRecordItem | null>(null);
  const [copiedInvoicePaymentId, setCopiedInvoicePaymentId] = useState<string | null>(null);

  // Rename recent cutout states
  const [editingRecentId, setEditingRecentId] = useState<string | null>(null);
  const [editingRecentName, setEditingRecentName] = useState("");

  const handleRotateApiKey = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      "Are you sure you want to generate a new API key? Your current key will be revoked immediately and existing integrations will need to be updated with the new key."
    );
    if (!confirmed) return;

    setRotatingKey(true);
    const res = await rotateUserApiKey(user.id);
    setRotatingKey(false);

    if (res.success && res.newApiKey) {
      rotateKey(res.newApiKey);
      await refreshProfile();
      toast.success("New Secret API Key generated!", {
        description: "Your previous API key has been revoked. Remember to update your integrations.",
      });
    } else {
      toast.error(res.error || "Failed to generate new API key.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (deleteConfirmInput.trim() !== "DELETE") {
      toast.error("Please type DELETE in capital letters to confirm account deletion.");
      return;
    }

    setDeletingAccount(true);
    const res = await deleteUserAccount(user.id);
    setDeletingAccount(false);

    if (res.success) {
      clear(); // clear local cutout history
      toast.success("Account deleted successfully.", {
        description: "Your account and all associated data have been permanently removed.",
      });
      navigate({ to: "/" });
    } else {
      toast.error(res.error || "Failed to delete account. Please try again or contact support.");
    }
  };

  const handleRenameCutout = async (item: CutoutHistoryItem, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === item.name) {
      setEditingRecentId(null);
      return;
    }

    // 1. Update local storage history
    renameItem(item.id, trimmed);
    if (item.resultUrl) {
      renameItem(item.resultUrl, trimmed);
    }

    // 2. Update cloudCutouts state
    setCloudCutouts((prev) =>
      prev.map((c) =>
        c.id === item.id || (c.resultUrl && c.resultUrl === item.resultUrl)
          ? { ...c, name: trimmed }
          : c
      )
    );

    // 3. Update Supabase cutout record if user is logged in
    if (user) {
      await updateCutoutRecordName(user.id, item.id || item.resultUrl, trimmed);
    }

    toast.success(`Image renamed to "${trimmed}"`);
    setEditingRecentId(null);
  };

  const handleDeleteCutout = async (itemOrId: CutoutHistoryItem | string) => {
    const item =
      typeof itemOrId === "string"
        ? allCutouts.find((c) => c.id === itemOrId || c.resultUrl === itemOrId)
        : itemOrId;
    const targetId = typeof itemOrId === "string" ? itemOrId : itemOrId.id;
    const resultUrl = item?.resultUrl;

    // 1. Delete from local storage history
    removeItem(targetId);
    if (resultUrl && resultUrl !== targetId) {
      removeItem(resultUrl);
    }

    // 2. Remove immediately from in-memory state
    setCloudCutouts((prev) =>
      prev.filter((c) => c.id !== targetId && (!resultUrl || c.resultUrl !== resultUrl))
    );

    // 3. Delete from Supabase cloud database
    if (user) {
      const res = await deleteCutoutRecord(user.id, targetId, resultUrl);
      if (res.success) {
        toast.success("Cutout permanently deleted.");
      } else {
        console.warn("Could not sync deletion to Supabase:", res.error);
        toast.error("Failed to delete cutout from cloud: " + (res.error || "Unknown error"));
      }
    } else {
      toast.success("Cutout removed from history.");
    }
  };

  const handleClearAllCutouts = async () => {
    if (!window.confirm("Are you sure you want to clear your entire cutout history?")) {
      return;
    }

    clear(); // clear local storage
    setCloudCutouts([]); // clear React state

    if (user) {
      const res = await clearUserCutoutHistory(user.id);
      if (res.success) {
        toast.success("Cutout history cleared from device and cloud.");
      } else {
        toast.error("Failed to clear cloud history: " + (res.error || "Unknown error"));
      }
    } else {
      toast.success("Cutout history cleared from device.");
    }
  };

  // Route protection: redirect to /auth if not signed in
  useEffect(() => {
    if (!authLoading && !user) {
      toast.info("Please sign in to access your dashboard.");
      navigate({ to: "/auth", search: { redirect: "/dashboard" } });
    }
  }, [user, authLoading, navigate]);

  // Sync profile display name into local input
  useEffect(() => {
    if (profile?.full_name) {
      setDisplayNameInput(profile.full_name);
    } else if (user?.email && !displayNameInput) {
      setDisplayNameInput(user.email.split("@")[0] || "");
    }
  }, [profile?.full_name, user?.email]);

  // Fetch user cutouts from Supabase cloud database
  useEffect(() => {
    if (user) {
      fetchUserCutouts(user.id).then((rows) => {
        const mapped: CutoutHistoryItem[] = rows.map((r) => ({
          id: r.id,
          name: r.image_name || "cutout.png",
          size: Number(r.image_size || 0),
          resultUrl: r.result_url,
          createdAt: new Date(r.created_at).getTime(),
          rawResponse: r.raw_response,
        }));
        setCloudCutouts(mapped);
      });
    }
  }, [user, activeTab]);

  // Fetch user payment records from Supabase
  const loadPaymentRecords = async () => {
    if (!user) return;
    setLoadingPayments(true);
    try {
      const records = await fetchUserPaymentRecords(user.id);
      setPaymentRecords(records);
    } catch (err) {
      console.error("Failed to load payment records:", err);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (user && activeTab === "billing") {
      loadPaymentRecords();
    }
  }, [user, activeTab]);

  const activePlan = profile?.plan || localPlan;
  const activeCredits = profile?.credits_remaining ?? localCredits;
  const activeTotal = profile?.total_processed ?? localTotal;
  const activeMonth = profile?.month_processed ?? localMonth;
  const activeApiKey = profile?.api_key || localKey || "";

  // Combine cloud & local cutout history
  const allCutouts = useMemo(() => {
    const map = new Map<string, CutoutHistoryItem>();
    history.forEach((item) => {
      map.set(item.resultUrl || item.id, item);
    });
    cloudCutouts.forEach((item) => {
      map.set(item.resultUrl || item.id, item);
    });
    return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
  }, [history, cloudCutouts]);

  // Calculate day-wise statistics
  const dayWiseStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const sevenDaysAgoStart = todayStart - 6 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let todayCount = 0;
    let yesterdayCount = 0;
    let last7DaysCount = 0;
    let thisMonthCount = 0;

    // 7-day breakdown (past 6 days + today)
    const days: { dateStr: string; label: string; shortDate: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const start = d.getTime();
      const end = start + 24 * 60 * 60 * 1000;
      const count = allCutouts.filter(
        (item) => item.createdAt >= start && item.createdAt < end
      ).length;

      let label = d.toLocaleDateString("en-US", { weekday: "short" });
      if (i === 0) label = "Today";
      else if (i === 1) label = "Yesterday";

      days.push({
        dateStr: d.toISOString().slice(0, 10),
        label,
        shortDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count,
      });

      if (i === 0) todayCount = count;
      if (i === 1) yesterdayCount = count;
    }

    allCutouts.forEach((item) => {
      if (item.createdAt >= sevenDaysAgoStart) last7DaysCount++;
      if (item.createdAt >= monthStart) thisMonthCount++;
    });

    const totalAllTime = Math.max(activeTotal, allCutouts.length);
    const maxDayCount = Math.max(1, ...days.map((d) => d.count));

    return {
      todayCount,
      yesterdayCount,
      last7DaysCount,
      thisMonthCount: Math.max(activeMonth, thisMonthCount),
      totalAllTime,
      days,
      maxDayCount,
    };
  }, [allCutouts, activeTotal, activeMonth]);

  // Filter recent cutouts based on selected day filter
  const filteredRecent = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const sevenDaysAgoStart = todayStart - 6 * 24 * 60 * 60 * 1000;

    if (historyFilter === "today") {
      return allCutouts.filter((item) => item.createdAt >= todayStart);
    }
    if (historyFilter === "yesterday") {
      return allCutouts.filter((item) => item.createdAt >= yesterdayStart && item.createdAt < todayStart);
    }
    if (historyFilter === "week") {
      return allCutouts.filter((item) => item.createdAt >= sevenDaysAgoStart);
    }
    return allCutouts.slice(0, 15);
  }, [allCutouts, historyFilter]);

  const handleUpgradeToPro = () => {
    openRazorpayCheckout({
      planName: "Pro",
      amountInRupees: 799,
      description: "Unlimited images & priority processing",
      userEmail: user?.email ?? undefined,
      userName: profile?.full_name ?? undefined,
      onSuccess: async (res) => {
        try {
          const verifyResult = await verifyAndApplyPayment({
            response: res,
            planName: "Pro",
            amountInRupees: 799,
          });

          if (!verifyResult.success) {
            toast.error(verifyResult.error || "Payment verification failed. Please contact support.");
            return;
          }

          await refreshProfile();
          await loadPaymentRecords();
          toast.success("Account upgraded to Pro! Unlimited cutouts enabled.");
        } catch (err) {
          console.error("Upgrade error:", err);
          toast.error("Failed to apply upgrade. Please refresh or contact support.");
        }
      },
    });
  };

  const handleBuyCredits = () => {
    openRazorpayCheckout({
      planName: "Credit packs",
      amountInRupees: 299,
      description: "250 Image Credits Bundle",
      userEmail: user?.email ?? undefined,
      userName: profile?.full_name ?? undefined,
      onSuccess: async (res) => {
        try {
          const verifyResult = await verifyAndApplyPayment({
            response: res,
            planName: "Credit packs",
            amountInRupees: 299,
          });

          if (!verifyResult.success) {
            toast.error(verifyResult.error || "Payment verification failed. Please contact support.");
            return;
          }

          await refreshProfile();
          await loadPaymentRecords();
          toast.success("250 Credits added to your balance!");
        } catch (err) {
          console.error("Buy credits error:", err);
          toast.error("Failed to add credits. Please refresh or contact support.");
        }
      },
    });
  };

  const handleCopyPaymentId = (paymentId: string) => {
    navigator.clipboard.writeText(paymentId);
    setCopiedInvoicePaymentId(paymentId);
    toast.success("Payment ID copied to clipboard!");
    setTimeout(() => setCopiedInvoicePaymentId(null), 2000);
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(activeApiKey);
    setCopiedKey(true);
    toast.success("API key copied to clipboard!");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const trimmed = displayNameInput.trim();
    if (!trimmed) {
      toast.error("Display name cannot be empty.");
      return;
    }

    setUpdatingName(true);
    const res = await updateUserProfileName(user.id, trimmed);
    setUpdatingName(false);

    if (res.success) {
      await refreshProfile();
      toast.success("Display name updated successfully!");
    } else {
      toast.error(res.error || "Failed to update display name.");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match. Please re-enter.");
      return;
    }

    setUpdatingPassword(true);
    const res = await updateUserPassword(newPassword);
    setUpdatingPassword(false);

    if (res.success) {
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully!");
    } else {
      toast.error(res.error || "Failed to update password.");
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Left Sidebar Navigation (Desktop) */}
      <aside className="hidden md:flex sticky top-0 h-screen w-64 flex-col justify-between border-r border-border/60 bg-card/40 p-4 backdrop-blur-xl shrink-0">
        <div className="space-y-6">
          {/* Logo / Brand Header */}
          <Link to="/" className="flex items-center gap-2.5 px-2 py-1">
            <img
              src={logo.url}
              alt="Sn_apKut AI Logo"
              className="size-8 rounded-lg object-contain bg-white/95 p-1 shadow-sm ring-1 ring-white/10"
            />
            <span className="text-base font-bold tracking-tight">
              Sn_apKut <span className="text-gradient">AI</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <LayoutDashboard className="size-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("upload")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "upload"
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Upload className="size-4" />
              <span>Upload</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "history"
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className="size-4" />
                <span>History</span>
              </div>
              {allCutouts.length > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-bold">
                  {allCutouts.length}
                </Badge>
              )}
            </button>

            <button
              onClick={() => setActiveTab("billing")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "billing"
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <CreditCard className="size-4" />
              <span>Billing</span>
            </button>

            <button
              onClick={() => setActiveTab("api")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "api"
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Key className="size-4" />
              <span>API Keys</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "settings"
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Settings className="size-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar Plan Card */}
        <div className="space-y-3">
          <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  {activePlan === "pro" ? "Pro Plan" : "Free Plan"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {activePlan === "pro" ? "Unlimited credits" : `${activeCredits} credits left`}
                </p>
              </div>
            </div>

            {activePlan !== "pro" && (
              <Button
                size="sm"
                onClick={handleUpgradeToPro}
                className="bg-gradient-cta glow mt-3 w-full border-0 text-xs font-semibold text-primary-foreground"
              >
                Upgrade to Pro
              </Button>
            )}
          </div>

          {/* User profile & sign out footer */}
          <div className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                {(profile?.full_name || user?.email || "U")[0]?.toUpperCase()}
              </div>
              <span className="truncate text-xs text-foreground max-w-[120px]" title={user?.email}>
                {profile?.full_name || user?.email?.split("@")[0]}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
              title="Sign Out"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Menu Panel */}
          <div className="relative flex w-72 max-w-[85vw] flex-col justify-between bg-card p-5 border-r border-border shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              {/* Header with Brand Logo & Close Button */}
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <img
                    src={logo.url}
                    alt="Sn_apKut AI Logo"
                    className="size-8 rounded-lg object-contain bg-white/95 p-1 shadow-sm ring-1 ring-white/10"
                  />
                  <span className="text-base font-bold tracking-tight">
                    Sn_apKut <span className="text-gradient">AI</span>
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                {[
                  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                  { id: "upload", label: "Upload", icon: Upload },
                  { id: "history", label: "History", icon: Clock, count: allCutouts.length },
                  { id: "billing", label: "Billing", icon: CreditCard },
                  { id: "api", label: "API Keys", icon: Key },
                  { id: "settings", label: "Settings", icon: Settings },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as DashboardTab);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                      activeTab === item.id
                        ? "bg-primary/15 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </div>
                    {typeof item.count === "number" && item.count > 0 && (
                      <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-bold">
                        {item.count}
                      </Badge>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Bottom Plan & Profile Footer */}
            <div className="space-y-4 pt-4 border-t border-border/60">
              <div className="rounded-xl border border-border/80 bg-background/60 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {activePlan === "pro" ? "Pro Plan" : "Free Plan"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {activePlan === "pro" ? "Unlimited cutouts" : `${activeCredits} credits left`}
                    </p>
                  </div>
                </div>

                {activePlan !== "pro" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleUpgradeToPro();
                      setMobileMenuOpen(false);
                    }}
                    className="bg-gradient-cta glow mt-2.5 w-full border-0 text-xs font-semibold text-primary-foreground h-8"
                  >
                    Upgrade to Pro (₹799)
                  </Button>
                )}
              </div>

              {/* Profile & Sign Out */}
              <div className="flex items-center justify-between px-1 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="size-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {(profile?.full_name || user?.email || "U")[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {profile?.full_name || user?.email?.split("@")[0]}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => signOut()}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-muted/30"
                  title="Sign Out"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-4 sm:px-6 backdrop-blur-md">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden flex size-9 items-center justify-center rounded-lg border border-border/80 bg-card/60 text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="size-5" />
            </button>

            <h1 className="text-lg sm:text-xl font-bold tracking-tight capitalize truncate">
              {activeTab === "dashboard" ? "Dashboard" : activeTab === "api" ? "Developer API" : activeTab}
            </h1>
            <Badge variant="outline" className="hidden sm:inline-flex text-[11px]">
              {activePlan === "pro" ? "Pro Member" : "Free Tier"}
            </Badge>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mr-1 sm:mr-2"
            >
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>

            <Button
              size="sm"
              onClick={() => setActiveTab("upload")}
              className="bg-gradient-cta glow border-0 font-semibold text-primary-foreground gap-1.5 text-xs sm:text-sm px-2.5 sm:px-3 h-8 sm:h-9"
            >
              <Plus className="size-4" />
              <span>New Upload</span>
            </Button>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full">
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* 4 Stat Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Stat 1: Images Processed Day-Wise */}
                <div className="glass-card p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                      <ImageIcon className="size-4" />
                    </div>
                    <span className="inline-flex items-center text-xs font-semibold text-primary bg-primary/10 rounded px-1.5 py-0.5">
                      {dayWiseStats.todayCount > 0 ? `+${dayWiseStats.todayCount} Today` : "Today"}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-extrabold tracking-tight text-foreground">
                      {dayWiseStats.todayCount}
                    </p>
                    <p className="text-xs font-medium text-foreground/80 mt-1">Processed Today</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {dayWiseStats.totalAllTime} total all-time
                    </p>
                  </div>
                </div>

                {/* Stat 2: Credits Remaining */}
                <div className="glass-card p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                      <Sparkles className="size-4" />
                    </div>
                    {activePlan === "pro" ? (
                      <span className="inline-flex items-center text-xs font-semibold text-primary bg-primary/10 rounded px-1.5 py-0.5">
                        Unlimited
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-semibold text-muted-foreground bg-muted/40 rounded px-1.5 py-0.5">
                        Free Tier
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-extrabold tracking-tight">
                      {activePlan === "pro" ? "∞" : activeCredits}
                    </p>
                    <p className="text-xs font-medium text-foreground/80 mt-1">Credits Remaining</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {activePlan === "pro" ? "Unlimited Pro cutouts" : "Resets to 5 daily"}
                    </p>
                  </div>
                </div>

                {/* Stat 3: This Month */}
                <div className="glass-card p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                      <TrendingUp className="size-4" />
                    </div>
                    <span className="inline-flex items-center text-xs font-semibold text-green-500 bg-green-500/10 rounded px-1.5 py-0.5">
                      This Month
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-extrabold tracking-tight">{dayWiseStats.thisMonthCount}</p>
                    <p className="text-xs font-medium text-foreground/80 mt-1">Processed This Month</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {dayWiseStats.last7DaysCount} in the past 7 days
                    </p>
                  </div>
                </div>

                {/* Stat 4: Avg Speed */}
                <div className="glass-card p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                      <Timer className="size-4" />
                    </div>
                    <span className="inline-flex items-center text-xs font-semibold text-green-500 bg-green-500/10 rounded px-1.5 py-0.5">
                      Sub-5s
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-extrabold tracking-tight">3.2s</p>
                    <p className="text-xs font-medium text-foreground/80 mt-1">Avg. Processing Speed</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Cloud GPU accelerated</p>
                  </div>
                </div>
              </div>

              {/* Day-Wise Processing Activity Panel */}
              <div className="glass-card p-6 relative overflow-hidden border border-border/80">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-primary" />
                      <h2 className="text-base font-bold text-foreground">Day-Wise Processing Activity</h2>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Track your images processed day-by-day across the last 7 days.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Today: {dayWiseStats.todayCount}
                    </span>
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-muted/40 text-muted-foreground border border-border/60">
                      7 Days: {dayWiseStats.last7DaysCount}
                    </span>
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-muted/40 text-muted-foreground border border-border/60">
                      All-Time: {dayWiseStats.totalAllTime}
                    </span>
                  </div>
                </div>

                {/* 7-Day Activity Chart Bars */}
                <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-6 pb-2 items-end min-h-[140px] border-b border-border/50">
                  {dayWiseStats.days.map((d, idx) => {
                    const heightPercent =
                      d.count === 0 ? 8 : Math.max(20, Math.round((d.count / dayWiseStats.maxDayCount) * 100));
                    const isToday = idx === 6;

                    return (
                      <div key={d.dateStr} className="flex flex-col items-center gap-2 group">
                        <span
                          className={`text-xs font-bold transition-transform group-hover:scale-110 ${
                            d.count > 0 ? (isToday ? "text-primary" : "text-foreground") : "text-muted-foreground/60"
                          }`}
                        >
                          {d.count}
                        </span>

                        <div className="w-full max-w-[46px] h-24 flex items-end justify-center rounded-lg bg-muted/20 p-1">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-md transition-all duration-300 ${
                              d.count > 0
                                ? isToday
                                  ? "bg-gradient-to-t from-primary/80 to-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)]"
                                  : "bg-gradient-to-t from-primary/40 to-primary/70"
                                : "bg-muted/40"
                            }`}
                          />
                        </div>

                        <div className="text-center">
                          <span
                            className={`block text-[11px] font-semibold ${
                              isToday ? "text-primary" : "text-muted-foreground"
                            }`}
                          >
                            {d.label}
                          </span>
                          <span className="block text-[10px] text-muted-foreground/70">{d.shortDate}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Day-wise metrics summary bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-center">
                  <div className="rounded-lg bg-background/50 p-2.5 border border-border/50">
                    <span className="block text-lg font-bold text-foreground">{dayWiseStats.todayCount}</span>
                    <span className="text-[11px] text-muted-foreground">Today</span>
                  </div>
                  <div className="rounded-lg bg-background/50 p-2.5 border border-border/50">
                    <span className="block text-lg font-bold text-foreground">{dayWiseStats.yesterdayCount}</span>
                    <span className="text-[11px] text-muted-foreground">Yesterday</span>
                  </div>
                  <div className="rounded-lg bg-background/50 p-2.5 border border-border/50">
                    <span className="block text-lg font-bold text-foreground">{dayWiseStats.last7DaysCount}</span>
                    <span className="text-[11px] text-muted-foreground">Past 7 Days</span>
                  </div>
                  <div className="rounded-lg bg-background/50 p-2.5 border border-border/50">
                    <span className="block text-lg font-bold text-foreground">{dayWiseStats.thisMonthCount}</span>
                    <span className="text-[11px] text-muted-foreground">This Month</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-base font-bold text-foreground mb-3">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <div
                    onClick={() => setActiveTab("upload")}
                    className="glass-card group p-5 cursor-pointer transition-all hover:border-primary/50 hover:shadow-[var(--glow-primary)]"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary transition-colors group-hover:bg-primary/20">
                      <Upload className="size-4" />
                    </div>
                    <h3 className="mt-3 font-semibold text-sm">Upload Image</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Remove background from a new image in seconds.
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab("history")}
                    className="glass-card group p-5 cursor-pointer transition-all hover:border-primary/50 hover:shadow-[var(--glow-primary)]"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary transition-colors group-hover:bg-primary/20">
                      <Clock className="size-4" />
                    </div>
                    <h3 className="mt-3 font-semibold text-sm">View Full Gallery</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Access all your previous cutouts stored locally and in the cloud.
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab("api")}
                    className="glass-card group p-5 cursor-pointer transition-all hover:border-primary/50 hover:shadow-[var(--glow-primary)]"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent/25">
                      <Key className="size-4" />
                    </div>
                    <h3 className="mt-3 font-semibold text-sm">API Access</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Generate and inspect API keys for bulk batch integration.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Images Table with Day Filter */}
              <div className="glass-card overflow-hidden border border-border/80">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/80 px-6 py-4 bg-muted/20">
                  <div>
                    <h2 className="font-bold text-sm text-foreground">Recent Images</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {allCutouts.length} total processed {allCutouts.length === 1 ? "image" : "images"}
                    </p>
                  </div>

                  {/* Day-Wise Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setHistoryFilter("all")}
                      className={`text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        historyFilter === "all"
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      All ({allCutouts.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryFilter("today")}
                      className={`text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        historyFilter === "today"
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      Today ({dayWiseStats.todayCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryFilter("yesterday")}
                      className={`text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        historyFilter === "yesterday"
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      Yesterday ({dayWiseStats.yesterdayCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryFilter("week")}
                      className={`text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        historyFilter === "week"
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      7 Days ({dayWiseStats.last7DaysCount})
                    </button>
                  </div>
                </div>

                {/* Table Header Row */}
                <div className="grid grid-cols-12 px-6 py-3 text-xs font-semibold text-muted-foreground border-b border-border/60 bg-muted/10">
                  <span className="col-span-6 sm:col-span-5">Image</span>
                  <span className="col-span-3 sm:col-span-3">Processed Date</span>
                  <span className="col-span-3 sm:col-span-2">Status</span>
                  <span className="hidden sm:col-span-2 sm:block text-right">Download</span>
                </div>

                {/* Table Body */}
                {filteredRecent.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
                      <ImageIcon className="size-7" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">
                      {historyFilter === "today"
                        ? "No images processed today yet"
                        : historyFilter === "yesterday"
                        ? "No images were processed yesterday"
                        : historyFilter === "week"
                        ? "No images processed in the last 7 days"
                        : "No images processed yet"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      Upload an image to remove background in seconds. Each cutout will be stored and tracked day-by-day.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setActiveTab("upload")}
                      className="bg-gradient-cta glow border-0 font-semibold text-primary-foreground gap-1.5 mt-4"
                    >
                      <Plus className="size-4" /> Upload New Image
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {filteredRecent.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 items-center px-6 py-3.5 transition-colors hover:bg-muted/15"
                      >
                        <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0 pr-2">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border/80 bg-background/80 overflow-hidden">
                            <img
                              src={item.resultUrl}
                              alt={item.name || "Cutout"}
                              className="size-full object-contain p-0.5"
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>
                          {editingRecentId === item.id ? (
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <input
                                type="text"
                                value={editingRecentName}
                                onChange={(e) => setEditingRecentName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleRenameCutout(item, editingRecentName);
                                  if (e.key === "Escape") setEditingRecentId(null);
                                }}
                                autoFocus
                                className="w-full rounded border border-input bg-background/90 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Image name"
                              />
                              <button
                                type="button"
                                onClick={() => handleRenameCutout(item, editingRecentName)}
                                className="p-1 text-green-500 hover:text-green-400 cursor-pointer shrink-0"
                                title="Save name"
                              >
                                <Check className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingRecentId(null)}
                                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                                title="Cancel"
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 min-w-0 group/rename">
                              <span
                                className="truncate text-sm font-medium text-foreground cursor-pointer hover:underline"
                                title={`Click to rename "${item.name}"`}
                                onClick={() => {
                                  setEditingRecentId(item.id);
                                  setEditingRecentName(item.name || "cutout.png");
                                }}
                              >
                                {item.name || "cutout.png"}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRecentId(item.id);
                                  setEditingRecentName(item.name || "cutout.png");
                                }}
                                className="text-muted-foreground hover:text-foreground opacity-60 group-hover/rename:opacity-100 transition-opacity p-0.5 cursor-pointer shrink-0"
                                title="Rename image"
                              >
                                <Pencil className="size-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="col-span-3 sm:col-span-3 text-xs text-muted-foreground">
                          {formatProcessedDate(item.createdAt)}
                        </div>

                        <div className="col-span-3 sm:col-span-2 flex items-center justify-between sm:justify-start">
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                            completed
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCutout(item)}
                            className="sm:hidden p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                            title="Delete cutout"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        <div className="hidden sm:col-span-2 sm:flex items-center justify-end gap-2.5">
                          <a
                            href={item.resultUrl}
                            download={item.name ? `cutout-${item.name}` : "cutout.png"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                          >
                            <Download className="size-3" />
                            <span>Download</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteCutout(item)}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer rounded hover:bg-muted/30"
                            title="Delete cutout"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "upload" && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-bold">Background Removal Studio</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload, drag-and-drop, or paste an image. Uses 1 credit per successful cutout.
                </p>
              </div>
              <UploadZone />
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-6">
              <HistoryGallery
                items={allCutouts}
                onDeleteItem={(id) => handleDeleteCutout(id)}
                onRenameItem={(id, newName) => {
                  const item = allCutouts.find((c) => c.id === id);
                  if (item) handleRenameCutout(item, newName);
                }}
                onClearAll={handleClearAllCutouts}
                onGoToUpload={() => setActiveTab("upload")}
              />
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-6 max-w-4xl">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-bold">Billing & Credits</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage your subscription, purchase credit packs, or view payment history via Razorpay.
                </p>
              </div>

              {/* Current Plan Overview */}
              <div className="glass-card p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Badge variant="secondary" className="mb-2">Active Plan</Badge>
                  <h3 className="text-2xl font-bold">{activePlan === "pro" ? "Pro Plan" : "Free Plan"}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activePlan === "pro"
                      ? "Unlimited image cutouts and priority queue."
                      : `${activeCredits} credits remaining today. Resets daily.`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {activePlan !== "pro" && (
                    <Button
                      size="lg"
                      onClick={handleUpgradeToPro}
                      className="bg-gradient-cta glow border-0 font-semibold text-primary-foreground"
                    >
                      <Zap className="size-4" /> Go Pro (₹799/mo)
                    </Button>
                  )}
                  <Button variant="outline" size="lg" onClick={handleBuyCredits}>
                    Buy 250 Credits (₹299)
                  </Button>
                </div>
              </div>

              {/* Security info */}
              <div className="rounded-lg border border-border bg-card/40 p-4 text-xs text-muted-foreground flex items-center gap-2.5">
                <ShieldCheck className="size-4 text-primary shrink-0" />
                <span>All transactions are secured with 256-Bit SSL encryption via Razorpay. Cancel anytime.</span>
              </div>

              {/* Invoices & Payment History Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <Receipt className="size-5 text-primary" />
                    <div>
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        Invoices & Payment History
                        {paymentRecords.length > 0 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold">
                            {paymentRecords.length}
                          </Badge>
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Verified receipts and transaction records for all account payments.
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadPaymentRecords}
                    disabled={loadingPayments}
                    className="h-8 gap-1.5 text-xs border-border/80 hover:bg-muted/50 cursor-pointer"
                  >
                    <RefreshCw className={`size-3.5 ${loadingPayments ? "animate-spin text-primary" : ""}`} />
                    <span>Refresh</span>
                  </Button>
                </div>

                {loadingPayments ? (
                  <div className="glass-card p-8 text-center space-y-3">
                    <RefreshCw className="size-6 animate-spin text-primary mx-auto" />
                    <p className="text-xs text-muted-foreground">Loading your payment records from secure vault...</p>
                  </div>
                ) : paymentRecords.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/80 bg-card/20 p-8 text-center">
                    <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                      <Receipt className="size-6 text-primary" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">No payment history yet</h4>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-4">
                      When you upgrade to Pro (₹799) or purchase credit packs (₹299), your official Razorpay payment receipts, order IDs, and printable invoices will appear here.
                    </p>
                    {activePlan !== "pro" ? (
                      <Button
                        size="sm"
                        onClick={handleUpgradeToPro}
                        className="bg-gradient-cta glow border-0 text-xs font-semibold text-primary-foreground gap-1.5"
                      >
                        <Zap className="size-3.5" /> Upgrade to Pro (₹799)
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleBuyCredits}
                        className="text-xs font-semibold gap-1.5"
                      >
                        <Coins className="size-3.5 text-amber-400" /> Buy 250 Credits (₹299)
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-hidden rounded-xl border border-border/70 bg-card/30">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow className="border-border/60 hover:bg-transparent">
                            <TableHead className="text-xs font-semibold text-muted-foreground">Date & Time</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Plan / Description</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Payment ID</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Amount</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                            <TableHead className="text-right text-xs font-semibold text-muted-foreground">Invoice</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paymentRecords.map((record) => (
                            <TableRow key={record.id} className="border-border/50 hover:bg-card/50">
                              <TableCell className="text-xs font-medium text-foreground py-3">
                                {new Date(record.created_at).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                                <span className="block text-[11px] text-muted-foreground">
                                  {new Date(record.created_at).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                  {record.plan_name === "Pro" ? (
                                    <>
                                      <Zap className="size-3.5 text-primary shrink-0" />
                                      <span>Pro Plan (Monthly)</span>
                                    </>
                                  ) : (
                                    <>
                                      <Coins className="size-3.5 text-amber-400 shrink-0" />
                                      <span>250 Credits Pack</span>
                                    </>
                                  )}
                                </div>
                                <span className="text-[10px] text-muted-foreground block">
                                  {record.razorpay_order_id ? `Order: ${record.razorpay_order_id}` : "Direct Capture"}
                                </span>
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="flex items-center gap-1">
                                  <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[120px]">
                                    {record.razorpay_payment_id}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyPaymentId(record.razorpay_payment_id)}
                                    className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                    title="Copy Payment ID"
                                  >
                                    {copiedInvoicePaymentId === record.razorpay_payment_id ? (
                                      <Check className="size-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="size-3" />
                                    )}
                                  </button>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs font-bold text-foreground py-3">
                                ₹{record.amount_in_rupees || (record.plan_name === "Pro" ? 799 : 299)}.00
                              </TableCell>
                              <TableCell className="py-3">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-2 py-0.5"
                                >
                                  <CheckCircle2 className="size-2.5 mr-1" />
                                  Captured
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right py-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedInvoice(record)}
                                  className="h-7 text-xs gap-1 border-border/80 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer"
                                >
                                  <FileText className="size-3" />
                                  <span>View Receipt</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="space-y-2.5 sm:hidden">
                      {paymentRecords.map((record) => (
                        <div
                          key={record.id}
                          className="glass-card p-4 space-y-3 border border-border/70 rounded-xl"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                {record.plan_name === "Pro" ? (
                                  <>
                                    <Zap className="size-3.5 text-primary shrink-0" />
                                    <span>Pro Plan (Monthly)</span>
                                  </>
                                ) : (
                                  <>
                                    <Coins className="size-3.5 text-amber-400 shrink-0" />
                                    <span>250 Credits Pack</span>
                                  </>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {new Date(record.created_at).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <span className="text-sm font-extrabold text-foreground">
                              ₹{record.amount_in_rupees || (record.plan_name === "Pro" ? 799 : 299)}.00
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-2 py-0.5"
                            >
                              <CheckCircle2 className="size-2.5 mr-1" />
                              Captured
                            </Badge>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedInvoice(record)}
                              className="h-7 text-xs gap-1 border-border/80 hover:bg-primary hover:text-primary-foreground"
                            >
                              <FileText className="size-3" />
                              <span>Receipt</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="space-y-6 max-w-4xl">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-bold">Developer API Keys</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Integrate Sn_apKut AI directly into your applications, e-commerce backend, or automated pipelines.
                </p>
              </div>

              <div className="glass-card p-6 space-y-4 border border-border/80">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Your Secret API Key</label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Used to authenticate REST API requests for background removal.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {showApiKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    <span>{showApiKey ? "Hide key" : "Show key"}</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? "text" : "password"}
                      readOnly
                      value={activeApiKey}
                      className="w-full rounded-md border border-input bg-background/60 pl-3 pr-10 py-2 text-sm font-mono text-foreground focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={handleCopyApiKey} className="gap-1.5 h-9 text-xs">
                      {copiedKey ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                      <span>{copiedKey ? "Copied" : "Copy Key"}</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRotateApiKey}
                      disabled={rotatingKey}
                      className="gap-1.5 h-9 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                      title="Revoke current key and generate a fresh new API key"
                    >
                      <RefreshCw className={`size-3.5 ${rotatingKey ? "animate-spin" : ""}`} />
                      <span>{rotatingKey ? "Generating..." : "Roll New Key"}</span>
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-[11px] text-muted-foreground leading-relaxed">
                  💡 <strong>Security Notice:</strong> Keep your secret key confidential. If your API key is ever exposed or leaked, click <strong>Roll New Key</strong> to immediately revoke the exposed key and issue a new one.
                </div>
              </div>

              <div className="glass-card p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">API Integration Examples</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Use your secret API key to automate background removals in batch scripts or backend services.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">cURL Request</span>
                    <span className="font-mono text-[11px] text-primary">POST /api/v1/remove-bg</span>
                  </div>
                  <pre className="overflow-x-auto rounded-lg bg-black/70 p-4 text-xs font-mono text-green-400 border border-white/5">
{`curl -X POST "${typeof window !== "undefined" ? window.location.origin : "https://sn_ap_kut_ai.vercel.app"}/api/v1/remove-bg" \\
  -H "Authorization: Bearer ${activeApiKey}" \\
  -H "Content-Type: image/png" \\
  --data-binary "@photo.png"`}
                  </pre>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Python (requests)</span>
                  </div>
                  <pre className="overflow-x-auto rounded-lg bg-black/70 p-4 text-xs font-mono text-blue-300 border border-white/5">
{`import requests

url = "${typeof window !== "undefined" ? window.location.origin : "https://sn_ap_kut_ai.vercel.app"}/api/v1/remove-bg"
headers = {"Authorization": "Bearer ${activeApiKey}"}

with open("photo.png", "rb") as f:
    response = requests.post(url, headers=headers, files={"image": f})

data = response.json()
print("Cutout URL:", data.get("url"))`}
                  </pre>
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground space-y-1.5">
                  <p className="font-semibold text-foreground text-[11px]">Expected JSON Response:</p>
                  <pre className="font-mono text-[11px] text-muted-foreground bg-black/40 p-2.5 rounded border border-white/5 overflow-x-auto">
{`{
  "success": true,
  "url": "https://.../cutout.png",
  "creditsRemaining": 4,
  "plan": "free",
  "imageName": "photo.png"
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6 max-w-4xl">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-bold text-foreground">Account & Security Settings</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage your personal details, credentials, and local data storage.
                </p>
              </div>

              {/* 1. Profile & Display Name Card */}
              <div className="glass-card p-6 space-y-5 border border-border/80">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Profile Details</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your identity and contact information on Sn_apKut AI.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activePlan === "pro" ? "Pro Member" : "Free Plan"}
                  </Badge>
                </div>

                <form onSubmit={handleUpdateName} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 text-xs">
                    {/* Read-only Email Address */}
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground font-semibold block text-[11px]">
                        Email Address (Permanent)
                      </label>
                      <div className="rounded-lg border border-border/80 bg-background/50 px-3.5 py-2.5 text-sm font-medium text-foreground truncate flex items-center justify-between">
                        <span className="truncate">{user?.email}</span>
                        <span className="ml-2 inline-flex items-center text-[10px] text-green-500 bg-green-500/10 rounded px-1.5 py-0.5 shrink-0">
                          Verified
                        </span>
                      </div>
                    </div>

                    {/* Editable Display Name */}
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground font-semibold block text-[11px]">
                        Display Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={displayNameInput}
                          onChange={(e) => setDisplayNameInput(e.target.value)}
                          placeholder="Your full name"
                          className="w-full rounded-lg border border-input bg-background/60 px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                    <p className="text-[11px] text-muted-foreground">
                      This name will be displayed across your dashboard and generated cutouts.
                    </p>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={updatingName || !displayNameInput.trim() || displayNameInput.trim() === profile?.full_name}
                      className="bg-gradient-cta glow border-0 text-xs font-semibold text-primary-foreground gap-1.5 w-fit"
                    >
                      <Save className="size-3.5" />
                      {updatingName ? "Saving..." : "Save Name"}
                    </Button>
                  </div>
                </form>
              </div>

              {/* 2. Change Password Card */}
              <div className="glass-card p-6 space-y-5 border border-border/80">
                <div className="border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="size-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Change Password</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Set a new password for your account. Must be at least 6 characters long.
                  </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 text-xs">
                    {/* New Password */}
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground font-semibold block text-[11px]">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-lg border border-input bg-background/60 pl-3.5 pr-10 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground font-semibold block text-[11px]">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-lg border border-input bg-background/60 pl-3.5 pr-10 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive font-medium">
                      Passwords do not match.
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                    <span className="text-[11px] text-muted-foreground">
                      Use at least 6 characters with letters and numbers.
                    </span>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={updatingPassword || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                      className="bg-gradient-cta glow border-0 text-xs font-semibold text-primary-foreground gap-1.5 w-fit"
                    >
                      <Lock className="size-3.5" />
                      {updatingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </form>
              </div>

              {/* 3. Account Actions & Sign Out */}
              <div className="glass-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-border/80">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Sign Out</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    End your active session on this device.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                  className="gap-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive w-fit"
                >
                  <LogOut className="size-3.5" /> Sign Out of Sn_apKut AI
                </Button>
              </div>

              {/* 4. Local History Storage */}
              <div className="glass-card p-6 space-y-4 border border-border/80">
                <h3 className="text-sm font-bold text-foreground">Local History Storage</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your processed cutouts are saved on your device inside your browser&apos;s local storage and synced with your cloud account.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAllCutouts}
                >
                  Clear All Cutout History
                </Button>
              </div>

              {/* 5. 24-Hour Auto-Purge Policy */}
              <div className="glass-card p-6 space-y-2 text-xs text-muted-foreground border border-border/80">
                <p className="font-semibold text-foreground text-sm">24-Hour Auto-Purge Policy</p>
                <p>
                  Images processed through Sn_apKut AI are held in ephemeral cloud cache and permanently deleted 24 hours after processing.
                </p>
              </div>

              {/* 6. Danger Zone: Delete Account */}
              <div className="glass-card p-6 space-y-4 border border-destructive/40 bg-destructive/5 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-4 text-destructive" />
                      <h3 className="text-sm font-bold text-destructive">Danger Zone: Delete Account</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Permanently delete your account, personal credits, saved cutouts, and API credentials. This action is irreversible.
                    </p>
                  </div>
                  {!showDeleteConfirm ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="gap-1.5 text-xs font-semibold shrink-0 w-fit"
                    >
                      <Trash2 className="size-3.5" /> Delete Account
                    </Button>
                  ) : null}
                </div>

                {showDeleteConfirm && (
                  <div className="mt-4 pt-4 border-t border-destructive/20 space-y-3">
                    <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive leading-relaxed">
                      <strong>Warning:</strong> You are about to permanently delete your account (<strong>{user?.email}</strong>). All your cutout images, billing records, and API credentials will be wiped immediately.
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-foreground">
                        To confirm, type <span className="font-mono font-bold text-destructive">DELETE</span> in the box below:
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmInput}
                        onChange={(e) => setDeleteConfirmInput(e.target.value)}
                        placeholder="DELETE"
                        className="w-full sm:w-64 rounded-md border border-destructive/40 bg-background/80 px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-destructive"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletingAccount || deleteConfirmInput !== "DELETE"}
                        onClick={handleDeleteAccount}
                        className="gap-1.5 text-xs font-semibold"
                      >
                        {deletingAccount ? (
                          <>
                            <RefreshCw className="size-3.5 animate-spin" /> Deleting account...
                          </>
                        ) : (
                          <>
                            <Trash2 className="size-3.5" /> Confirm Account Deletion
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingAccount}
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmInput("");
                        }}
                        className="text-xs text-muted-foreground"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Invoice Receipt Modal */}
      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
          <DialogContent className="max-w-xl bg-card border-border/80 p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="sr-only">
              <DialogTitle>Sn_apKut AI Invoice Receipt</DialogTitle>
              <DialogDescription>
                Detailed transaction receipt for payment {selectedInvoice.razorpay_payment_id}
              </DialogDescription>
            </DialogHeader>

            {/* Printable Receipt Content */}
            <div id="snapkut-invoice-print-area" className="p-6 sm:p-8 space-y-6">
              {/* Receipt Brand Header */}
              <div className="flex items-start justify-between border-b border-border/70 pb-4">
                <div className="flex items-center gap-2.5">
                  <img
                    src={logo.url}
                    alt="Sn_apKut AI"
                    className="size-9 rounded-lg object-contain bg-white/95 p-1 shadow-sm ring-1 ring-white/10"
                  />
                  <div>
                    <h3 className="text-base font-bold tracking-tight">
                      Sn_apKut <span className="text-gradient">AI</span>
                    </h3>
                    <p className="text-[11px] text-muted-foreground">Official Payment Receipt</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-primary block">
                    INV-{new Date(selectedInvoice.created_at).getFullYear()}
                    {String(new Date(selectedInvoice.created_at).getMonth() + 1).padStart(2, "0")}-
                    {selectedInvoice.id.slice(0, 6).toUpperCase()}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(selectedInvoice.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Billed To & Gateway Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Billed To
                  </span>
                  <p className="font-semibold text-foreground truncate">
                    {profile?.full_name || user?.email?.split("@")[0] || "Customer"}
                  </p>
                  <p className="text-muted-foreground truncate">{user?.email}</p>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Payment Gateway
                  </span>
                  <p className="font-semibold text-foreground">Razorpay (256-Bit SSL)</p>
                  <p className="font-mono text-[11px] text-muted-foreground truncate">
                    ID: {selectedInvoice.razorpay_payment_id}
                  </p>
                  {selectedInvoice.razorpay_order_id && (
                    <p className="font-mono text-[10px] text-muted-foreground truncate">
                      Order: {selectedInvoice.razorpay_order_id}
                    </p>
                  )}
                </div>
              </div>

              {/* Itemized Line Items Table */}
              <div className="rounded-lg border border-border/70 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 border-b border-border/60">
                    <tr>
                      <th className="text-left font-semibold text-muted-foreground p-3">Item Description</th>
                      <th className="text-center font-semibold text-muted-foreground p-3">Qty</th>
                      <th className="text-right font-semibold text-muted-foreground p-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/40">
                      <td className="p-3">
                        <span className="font-bold text-foreground block">
                          {selectedInvoice.plan_name === "Pro"
                            ? "Sn_apKut AI Pro Plan (Monthly)"
                            : "Sn_apKut AI Credit Pack (250 Cutouts)"}
                        </span>
                        <span className="text-[11px] text-muted-foreground block">
                          {selectedInvoice.plan_name === "Pro"
                            ? "Unlimited high-resolution AI background removal, priority queue & API access"
                            : "250 high-resolution background removal credits"}
                        </span>
                      </td>
                      <td className="text-center p-3 text-muted-foreground">1</td>
                      <td className="text-right p-3 font-semibold text-foreground">
                        ₹{selectedInvoice.amount_in_rupees || (selectedInvoice.plan_name === "Pro" ? 799 : 299)}.00
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals & Status */}
              <div className="space-y-1.5 text-xs border-t border-border/60 pt-3">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{selectedInvoice.amount_in_rupees || (selectedInvoice.plan_name === "Pro" ? 799 : 299)}.00</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxes (GST 0% / Included)</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border/60">
                  <span>Total Paid (INR)</span>
                  <span className="text-primary text-base">
                    ₹{selectedInvoice.amount_in_rupees || (selectedInvoice.plan_name === "Pro" ? 799 : 299)}.00
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold pt-1">
                  <CheckCircle2 className="size-3.5" />
                  <span>Payment Status: Captured & Verified</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-muted/30 px-6 py-3.5 border-t border-border/60 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.print();
                }}
                className="text-xs gap-1.5 cursor-pointer"
              >
                <Printer className="size-3.5" />
                <span>Print Receipt</span>
              </Button>

              <Button
                size="sm"
                onClick={() => setSelectedInvoice(null)}
                className="text-xs px-4 cursor-pointer"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
