import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import logo from "@/assets/snapkut-logo.png.asset.json";
import { Mail, Lock, User, ArrowLeft, CheckCircle2, RefreshCw, Eye, EyeOff, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface AuthSearchParams {
  redirect?: string | undefined;
  mode?: "signin" | "signup" | undefined;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearchParams => {
    return {
      redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
      mode: search["mode"] === "signup" ? "signup" : "signin",
    };
  },
  head: () => ({
    meta: [
      { title: "Sign In & Register — Sn_apKut AI" },
      {
        name: "description",
        content: "Access your Sn_apKut AI account to remove backgrounds and manage credits.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const { user, signInWithPassword, signUpWithPassword, resendVerificationEmail, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"signin" | "signup">(search.mode === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [resending, setResending] = useState(false);

  const destination = search.redirect || "/dashboard";

  // If already logged in, redirect immediately
  useEffect(() => {
    if (!authLoading && user) {
      navigate({ to: destination });
    }
  }, [user, authLoading, navigate, destination]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);
    const { error } = await signInWithPassword(email.trim(), password);
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        toast.error("Email not verified yet", {
          description: "Please check your inbox and verify your email before logging in.",
        });
        setEmailVerificationSent(true);
      } else if (error.message.toLowerCase().includes("invalid login credentials")) {
        toast.error("Invalid email or password", {
          description: "Please double-check your credentials and try again.",
        });
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success("Welcome back to Sn_apKut AI!");
    navigate({ to: destination });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    const { error, needsEmailConfirmation } = await signUpWithPassword(
      email.trim(),
      password,
      fullName.trim() || undefined
    );
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (needsEmailConfirmation) {
      setEmailVerificationSent(true);
      toast.success("Verification link sent!", {
        description: `Check your inbox at ${email} to verify your account.`,
      });
    } else {
      toast.success("Account created successfully!");
      navigate({ to: destination });
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    const { error } = await resendVerificationEmail(email.trim());
    setResending(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Verification link re-sent! Please check your spam folder too.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-primary/10 blur-[130px]" />

      {/* Top Back Link */}
      <div className="w-full max-w-md mb-6 flex justify-between items-center z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to Home
        </Link>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Sparkles className="size-3 text-primary" /> 5 Free Daily Credits
        </span>
      </div>

      {/* Auth Card Container */}
      <div className="glass-card w-full max-w-md p-6 sm:p-8 z-10 shadow-2xl relative border-border/80">
        {/* Logo and Brand Title */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-2">
            <img
              src={logo.url}
              alt="Sn_apKut AI Logo"
              className="size-9 rounded-lg object-contain bg-white/95 p-1 shadow-sm ring-1 ring-white/10"
            />
            <span className="text-xl font-bold tracking-tight text-foreground">
              Sn_apKut <span className="text-gradient">AI</span>
            </span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">
            Studio-quality automated background removal for creator teams.
          </p>
        </div>

        {emailVerificationSent ? (
          /* Email Verification Notification Card */
          <div className="space-y-5 text-center py-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Mail className="size-7 animate-bounce" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground">Check your email</h2>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                We&apos;ve sent a verification link to <strong className="text-foreground">{email}</strong>. Click the
                link to activate your account and start removing backgrounds.
              </p>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-[11px] text-muted-foreground">
              Tip: If you do not see the email within a couple minutes, please check your Spam or Promotions folder.
            </div>

            <div className="space-y-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={handleResend}
                disabled={resending}
              >
                <RefreshCw className={`size-3.5 ${resending ? "animate-spin" : ""}`} />
                {resending ? "Sending link..." : "Resend verification email"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={() => {
                  setEmailVerificationSent(false);
                  setActiveTab("signin");
                }}
              >
                Back to Sign In
              </Button>
            </div>
          </div>
        ) : (
          /* Sign In & Sign Up Form */
          <div>
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as "signin" | "signup")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Email Address</label>
                    <div className="relative">
                      <Mail className="size-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-md border border-input bg-background/60 pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground">Password</label>
                    </div>
                    <div className="relative">
                      <Lock className="size-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-md border border-input bg-background/60 pl-9 pr-10 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-cta glow w-full border-0 font-semibold text-primary-foreground h-10 mt-2"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="size-4 animate-spin" /> Signing in...
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Create Account Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Full Name (optional)</label>
                    <div className="relative">
                      <User className="size-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="w-full rounded-md border border-input bg-background/60 pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Email Address</label>
                    <div className="relative">
                      <Mail className="size-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-md border border-input bg-background/60 pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Password (min 6 characters)</label>
                    <div className="relative">
                      <Lock className="size-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-md border border-input bg-background/60 pl-9 pr-10 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-[11px] text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>Includes 5 free background removal credits daily upon email confirmation.</span>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-cta glow w-full border-0 font-semibold text-primary-foreground h-10 mt-2"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="size-4 animate-spin" /> Creating account...
                      </span>
                    ) : (
                      "Create Account & Get 5 Credits"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
