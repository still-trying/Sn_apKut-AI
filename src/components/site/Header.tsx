import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, LayoutDashboard, Sparkles, LogOut, User as UserIcon } from "lucide-react";
import logo from "@/assets/snapkut-logo.png.asset.json";
import { useCutoutHistory } from "@/hooks/use-cutout-history";
import { useUserCredits } from "@/hooks/use-user-credits";
import { useAuth } from "@/contexts/auth-context";

const nav = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Header() {
  const { history } = useCutoutHistory();
  const { plan: localPlan, creditsRemaining: localCredits } = useUserCredits();
  const { user, profile, signOut } = useAuth();

  const activePlan = profile?.plan || localPlan;
  const activeCredits = profile?.credits_remaining ?? localCredits;

  const openHistory = () => {
    window.dispatchEvent(new CustomEvent("snapkut_open_tab", { detail: "history" }));
    document.getElementById("upload-zone")?.scrollIntoView({ behavior: "smooth" });
  };

  const openWorkspace = () => {
    window.dispatchEvent(new CustomEvent("snapkut_open_tab", { detail: "workspace" }));
    document.getElementById("upload-zone")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src={logo.url}
            alt="Sn_apKut AI logo"
            className="h-9 w-9 rounded-lg object-contain bg-white/95 p-1 shadow-sm ring-1 ring-white/10"
          />
          <span className="text-base font-bold tracking-tight">
            Sn_apKut <span className="text-gradient">AI</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
          <button
            type="button"
            onClick={openHistory}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            <Clock className="size-3.5" />
            History
            {history.length > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-bold">
                {history.length}
              </Badge>
            )}
          </button>
          <Link
            to={user ? "/dashboard" : "/auth"}
            search={user ? {} : { redirect: "/dashboard" }}
            className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <LayoutDashboard className="size-3.5 text-primary" />
            Dashboard
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/30 px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Sparkles className="size-3 text-primary" />
              <span>
                {activePlan === "pro" ? "Pro (∞)" : `${activeCredits} cr`}
              </span>
            </Link>
          ) : (
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="hidden sm:inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <Sparkles className="size-3" />
              <span>5 Free Credits</span>
            </Link>
          )}

          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={openHistory}
              className="gap-1.5 font-medium sm:hidden"
            >
              <Clock className="size-3.5" />
              <span>{history.length}</span>
            </Button>
          )}

          {user ? (
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex gap-1.5 text-xs">
                <Link to="/dashboard">
                  <UserIcon className="size-3.5" />
                  <span className="max-w-[100px] truncate">{profile?.full_name || user.email?.split("@")[0]}</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-xs text-muted-foreground hover:text-destructive gap-1 px-2"
                title="Sign Out"
              >
                <LogOut className="size-3.5" />
                <span className="hidden md:inline">Sign out</span>
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/auth" search={{ mode: "signin" }}>Sign in</Link>
            </Button>
          )}

          <Button
            size="sm"
            className="bg-gradient-cta glow border-0 font-semibold"
            onClick={openWorkspace}
          >
            Remove a background
          </Button>
        </div>
      </div>
    </header>
  );
}
