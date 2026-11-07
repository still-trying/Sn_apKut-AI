import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "lucide-react";
import logo from "@/assets/snapkut-logo.png.asset.json";
import { useUserCredits } from "@/hooks/use-user-credits";
import { useCutoutHistory } from "@/hooks/use-cutout-history";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { UploadZone } from "@/components/site/UploadZone";
import { HistoryGallery } from "@/components/site/HistoryGallery";
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

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return "Recently";
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

const DEMO_RECENT_IMAGES = [
  {
    id: "sample-1",
    name: "product-photo.jpg",
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    resultUrl: "http://res.cloudinary.com/usur2rt5/image/upload/v1793992293/irzntds9ryc4u1rsxr1e.png",
  },
  {
    id: "sample-2",
    name: "headshot.png",
    createdAt: Date.now() - 5 * 60 * 60 * 1000,
    resultUrl: "http://res.cloudinary.com/usur2rt5/image/upload/v1793992293/irzntds9ryc4u1rsxr1e.png",
  },
  {
    id: "sample-3",
    name: "team-photo.jpg",
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
    resultUrl: "http://res.cloudinary.com/usur2rt5/image/upload/v1793992293/irzntds9ryc4u1rsxr1e.png",
  },
];

function DashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");
  const [copiedKey, setCopiedKey] = useState(false);

  const { plan, creditsRemaining, totalProcessed, monthProcessed, apiKey, makePro, add } =
    useUserCredits();
  const { history, removeItem, clear } = useCutoutHistory();

  const handleUpgradeToPro = () => {
    openRazorpayCheckout({
      planName: "Pro",
      amountInRupees: 799,
      description: "Unlimited images & priority processing",
      onSuccess: () => {
        makePro();
        toast.success("Account upgraded to Pro! Unlimited cutouts enabled.");
      },
    });
  };

  const handleBuyCredits = () => {
    openRazorpayCheckout({
      planName: "Credit packs",
      amountInRupees: 299,
      description: "250 Image Credits Bundle",
      onSuccess: () => {
        add(250);
        toast.success("250 Credits added to your balance!");
      },
    });
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    toast.success("API key copied to clipboard!");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const displayedTotal = totalProcessed > 0 ? totalProcessed : (history.length > 0 ? history.length : 124);
  const displayedMonth = monthProcessed > 0 ? monthProcessed : (history.length > 0 ? history.length : 45);
  const displayedRecent = history.length > 0 ? history.slice(0, 6) : DEMO_RECENT_IMAGES;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Left Sidebar Navigation */}
      <aside className="sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-border/60 bg-card/40 p-4 backdrop-blur-xl">
        <div className="space-y-6">
          {/* Logo / Brand Header */}
          <Link to="/" className="flex items-center gap-2.5 px-2 py-1">
            <img src={logo.url} alt="Sn_apKut AI Logo" className="size-8 rounded-lg object-contain" />
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
              {history.length > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-bold">
                  {history.length}
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
        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                {plan === "pro" ? "Pro Plan" : "Free Plan"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {plan === "pro" ? "Unlimited credits" : `${creditsRemaining} credits left`}
              </p>
            </div>
          </div>

          {plan !== "pro" && (
            <Button
              size="sm"
              onClick={handleUpgradeToPro}
              className="bg-gradient-cta glow mt-3 w-full border-0 text-xs font-semibold text-primary-foreground"
            >
              Upgrade to Pro
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight capitalize">
              {activeTab === "dashboard" ? "Dashboard" : activeTab}
            </h1>
            <Badge variant="outline" className="hidden sm:inline-flex text-[11px]">
              {plan === "pro" ? "Pro Member" : "Free Tier"}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mr-2"
            >
              <ArrowLeft className="size-3.5" /> Back to Home
            </Link>

            <Button
              size="sm"
              onClick={() => setActiveTab("upload")}
              className="bg-gradient-cta glow border-0 font-semibold text-primary-foreground gap-1.5"
            >
              <Plus className="size-4" />
              <span>New Upload</span>
            </Button>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full">
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* 4 Stat Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Stat 1: Images Processed */}
                <div className="glass-card p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                      <ImageIcon className="size-4" />
                    </div>
                    <span className="inline-flex items-center text-xs font-semibold text-green-500 bg-green-500/10 rounded px-1.5 py-0.5">
                      +12%
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-extrabold tracking-tight">{displayedTotal}</p>
                    <p className="text-xs text-muted-foreground mt-1">Images Processed</p>
                  </div>
                </div>

                {/* Stat 2: Credits Remaining */}
                <div className="glass-card p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                      <Sparkles className="size-4" />
                    </div>
                    {plan === "pro" && (
                      <span className="inline-flex items-center text-xs font-semibold text-primary bg-primary/10 rounded px-1.5 py-0.5">
                        Unlimited
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-extrabold tracking-tight">
                      {plan === "pro" ? "∞" : creditsRemaining}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Credits Remaining</p>
                  </div>
                </div>

                {/* Stat 3: This Month */}
                <div className="glass-card p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                      <TrendingUp className="size-4" />
                    </div>
                    <span className="inline-flex items-center text-xs font-semibold text-green-500 bg-green-500/10 rounded px-1.5 py-0.5">
                      +8%
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-extrabold tracking-tight">{displayedMonth}</p>
                    <p className="text-xs text-muted-foreground mt-1">This Month</p>
                  </div>
                </div>

                {/* Stat 4: Avg Time */}
                <div className="glass-card p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                      <Timer className="size-4" />
                    </div>
                    <span className="inline-flex items-center text-xs font-semibold text-green-500 bg-green-500/10 rounded px-1.5 py-0.5">
                      -0.5s
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-extrabold tracking-tight">3.2s</p>
                    <p className="text-xs text-muted-foreground mt-1">Avg. Time</p>
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
                    <h3 className="mt-3 font-semibold text-sm">View History</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Access your recent processed cutouts stored in local storage.
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

              {/* Recent Images Table */}
              <div className="glass-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-muted/20">
                  <h2 className="font-bold text-sm">Recent Images</h2>
                  {history.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("history")}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      View all ({history.length})
                    </Button>
                  )}
                </div>

                {/* Table Header Row */}
                <div className="grid grid-cols-12 px-6 py-3 text-xs font-semibold text-muted-foreground border-b border-border/60 bg-muted/10">
                  <span className="col-span-6 sm:col-span-5">Image</span>
                  <span className="col-span-3 sm:col-span-3">Date</span>
                  <span className="col-span-3 sm:col-span-2">Status</span>
                  <span className="hidden sm:col-span-2 sm:block text-right">Download</span>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-border/60">
                  {displayedRecent.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 items-center px-6 py-3.5 transition-colors hover:bg-muted/15"
                    >
                      <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0 pr-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/80 bg-muted/40 text-muted-foreground">
                          <ImageIcon className="size-4" />
                        </div>
                        <span className="truncate text-sm font-medium text-foreground">
                          {item.name || "cutout.png"}
                        </span>
                      </div>

                      <div className="col-span-3 sm:col-span-3 text-xs text-muted-foreground">
                        {formatRelativeTime(item.createdAt)}
                      </div>

                      <div className="col-span-3 sm:col-span-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                          completed
                        </span>
                      </div>

                      <div className="hidden sm:col-span-2 sm:flex justify-end">
                        <a
                          href={item.resultUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors hover:underline"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
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
                items={history}
                onDeleteItem={removeItem}
                onClearAll={clear}
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
                  <h3 className="text-2xl font-bold">{plan === "pro" ? "Pro Plan" : "Free Plan"}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan === "pro"
                      ? "Unlimited image cutouts and priority queue."
                      : `${creditsRemaining} credits remaining today. Resets daily.`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {plan !== "pro" && (
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

              <div className="glass-card p-6 space-y-4">
                <label className="text-xs font-semibold text-foreground">Your Secret API Key</label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    readOnly
                    value={apiKey}
                    className="w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm font-mono text-foreground"
                  />
                  <Button variant="outline" size="sm" onClick={handleCopyApiKey} className="gap-1.5 shrink-0">
                    {copiedKey ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                    <span>{copiedKey ? "Copied" : "Copy Key"}</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Keep this key confidential. Do not expose it in public client-side repositories.
                </p>
              </div>

              <div className="glass-card p-6 space-y-3">
                <h3 className="text-sm font-bold">Quick cURL Example</h3>
                <pre className="overflow-x-auto rounded-lg bg-black/60 p-4 text-xs font-mono text-green-400">
{`curl -X POST "http://localhost:5678/webhook/remove%20bkgrnd" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: image/png" \\
  --data-binary "@photo.png"`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6 max-w-4xl">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-bold">Account & Data Settings</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage privacy, local data storage, and compliance preferences.
                </p>
              </div>

              <div className="glass-card p-6 space-y-4">
                <h3 className="text-sm font-bold">Local History Storage</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your processed cutouts are saved strictly on your device inside your browser&apos;s local storage. No server tracks your download history.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to clear your local cutout history?")) {
                      clear();
                      toast.info("Local history cleared.");
                    }
                  }}
                >
                  Clear All Local History
                </Button>
              </div>

              <div className="glass-card p-6 space-y-2 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground text-sm">24-Hour Auto-Purge Policy</p>
                <p>
                  Images processed through Sn_apKut AI are held in ephemeral cloud cache and permanently deleted 24 hours after processing.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
