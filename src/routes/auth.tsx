import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import {
  supabase,
  sendPasswordResetEmail,
  verifyPasswordResetOtp,
  updateUserPassword,
} from "@/lib/supabase";
import logo from "@/assets/snapkut-logo.png.asset.json";
import {
  Mail,
  Lock,
  User,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

interface AuthSearchParams {
  redirect?: string | undefined;
  mode?: "signin" | "signup" | "forgot-password" | "reset-password" | undefined;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearchParams => {
    const rawMode = typeof search["mode"] === "string" ? search["mode"].toLowerCase() : undefined;
    let mode: AuthSearchParams["mode"] = "signin";
    if (rawMode === "signup") mode = "signup";
    else if (rawMode === "forgot-password" || rawMode === "forgot") mode = "forgot-password";
    else if (rawMode === "reset-password" || rawMode === "reset") mode = "reset-password";

    return {
      redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
      mode,
    };
  },
  head: () => ({
    meta: [
      { title: "Sign In & Security — Sn_apKut AI" },
      {
        name: "description",
        content: "Access your Sn_apKut AI account or reset your password securely.",
      },
    ],
  }),
  component: AuthPage,
});

type AuthView = "signin" | "signup" | "forgot-password" | "reset-password";

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const {
    user,
    signInWithPassword,
    signUpWithPassword,
    signInWithOAuth,
    resendVerificationEmail,
    loading: authLoading,
  } = useAuth();

  const [activeView, setActiveView] = useState<AuthView>(() => {
    if (search.mode === "signup") return "signup";
    if (search.mode === "forgot-password") return "forgot-password";
    if (search.mode === "reset-password") return "reset-password";
    return "signin";
  });
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(
    search.mode === "signup" ? "signup" : "signin"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"github" | "facebook" | null>(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [resending, setResending] = useState(false);

  // Forgot password flow states
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Set new password states
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetUpdating, setResetUpdating] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const destination = search.redirect || "/dashboard";

  // Listen for Supabase password recovery event or URL hash
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash.includes("type=recovery") || search.mode === "reset-password") {
        setIsRecoveryMode(true);
        setActiveView("reset-password");
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
        setActiveView("reset-password");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [search.mode]);

  // If already logged in, redirect immediately UNLESS in password recovery mode
  useEffect(() => {
    if (!authLoading && user && !isRecoveryMode && activeView !== "reset-password") {
      navigate({ to: destination });
    }
  }, [user, authLoading, navigate, destination, isRecoveryMode, activeView]);

  const handleOAuth = async (provider: "github" | "facebook") => {
    setOauthLoading(provider);
    const { error } = await signInWithOAuth(provider, destination);
    if (error) {
      setOauthLoading(null);
      const msg = error.message.toLowerCase();
      if (
        msg.includes("not enabled") ||
        msg.includes("unsupported provider") ||
        msg.includes("disabled")
      ) {
        toast.error(`${provider === "github" ? "GitHub" : "Facebook"} sign-in is not enabled yet`, {
          description: `To enable ${provider === "github" ? "GitHub" : "Facebook"} login, turn on the ${provider === "github" ? "GitHub" : "Facebook"} provider in your Supabase Dashboard under Authentication > Providers.`,
          duration: 9000,
        });
      } else {
        toast.error(error.message);
      }
    }
  };

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
          description: "Please double-check your credentials, or click 'Forgot password?' to reset.",
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
      if (
        error.message.toLowerCase().includes("rate limit") ||
        error.message.toLowerCase().includes("over_email_send_rate_limit")
      ) {
        toast.error("Email Rate Limit Exceeded", {
          description:
            "Supabase built-in mailer limit reached. If this account was already created, click 'Sign In' below. To disable email limits completely, turn off 'Confirm email' in your Supabase Auth settings.",
          duration: 8000,
        });
      } else {
        toast.error(error.message);
      }
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
      if (
        error.message.toLowerCase().includes("rate limit") ||
        error.message.toLowerCase().includes("over_email_send_rate_limit")
      ) {
        toast.error("Email Rate Limit Exceeded", {
          description:
            "Supabase built-in mailer has a strict hourly quota. You can disable 'Confirm email' under Supabase Dashboard -> Auth -> Providers -> Email for instant logins without email limits.",
          duration: 8000,
        });
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Verification link re-sent! Please check your spam folder too.");
    }
  };

  // Send password reset email
  const handleSendResetEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Please enter your registered email address.");
      return;
    }

    setResetSending(true);
    const res = await sendPasswordResetEmail(trimmed);
    setResetSending(false);

    if (res.success) {
      setResetEmailSent(true);
      toast.success("Password reset email sent!", {
        description: `Check your inbox at ${trimmed} for your reset link.`,
      });
    } else {
      const msg = res.error || "Failed to send reset email";
      if (
        msg.toLowerCase().includes("rate limit") ||
        msg.toLowerCase().includes("over_email_send_rate_limit")
      ) {
        toast.error("Email Rate Limit Exceeded", {
          description:
            "Supabase email rate limit reached. Please wait a few minutes, or if you already received a recovery code, enter it below.",
          duration: 8000,
        });
      } else {
        toast.error(msg);
      }
    }
  };

  // Verify OTP recovery code
  const handleVerifyOtpAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedOtp = otpCode.trim();

    if (!trimmedEmail) {
      toast.error("Please enter your email address.");
      return;
    }
    if (trimmedOtp.length < 6) {
      toast.error("Please enter the complete 6-digit recovery code.");
      return;
    }

    setVerifyingOtp(true);
    const res = await verifyPasswordResetOtp(trimmedEmail, trimmedOtp);
    setVerifyingOtp(false);

    if (res.success) {
      toast.success("Security code verified!");
      setIsRecoveryMode(true);
      setActiveView("reset-password");
    } else {
      toast.error(res.error || "Invalid or expired recovery code. Please try again.");
    }
  };

  // Set new password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetNewPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setResetUpdating(true);
    const res = await updateUserPassword(resetNewPassword);
    setResetUpdating(false);

    if (res.success) {
      toast.success("Password reset successfully!", {
        description: "Your new password is now active. Welcome back!",
      });
      setIsRecoveryMode(false);
      setResetNewPassword("");
      setResetConfirmPassword("");
      navigate({ to: destination });
    } else {
      toast.error(res.error || "Failed to update password. Please request a new reset link.");
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
                  setActiveView("signin");
                }}
              >
                Back to Sign In
              </Button>
            </div>
          </div>
        ) : activeView === "forgot-password" ? (
          /* Forgot Password View */
          <div className="space-y-5">
            {resetEmailSent ? (
              /* Reset Link Sent Confirmation */
              <div className="space-y-5 text-center py-2">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Mail className="size-7 animate-pulse" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-foreground">Check your inbox</h2>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    We&apos;ve sent a password reset link to <strong className="text-foreground">{email}</strong>.
                    Click the link in the email to set your new password.
                  </p>
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-[11px] text-muted-foreground text-left leading-relaxed">
                  💡 <strong>Tip:</strong> If you don&apos;t see the email within 1–2 minutes, please check your <strong>Spam</strong> or <strong>Promotions</strong> folder.
                </div>

                {/* Optional 6-digit recovery code input */}
                <div className="rounded-lg border border-border/60 bg-background/40 p-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Received a 6-digit code?</span>
                    <button
                      type="button"
                      onClick={() => setShowOtpInput(!showOtpInput)}
                      className="text-[11px] text-primary hover:underline cursor-pointer font-medium"
                    >
                      {showOtpInput ? "Hide code input" : "Enter code here"}
                    </button>
                  </div>

                  {showOtpInput && (
                    <form onSubmit={handleVerifyOtpAndProceed} className="space-y-3 mt-3 pt-3 border-t border-border/50">
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-muted-foreground font-medium">6-Digit Recovery Code</label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="123456"
                          className="w-full tracking-widest text-center font-mono rounded-md border border-input bg-background/60 py-2 text-base text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={verifyingOtp || otpCode.trim().length < 6}
                        className="bg-gradient-cta glow w-full border-0 text-xs font-semibold text-primary-foreground h-9"
                      >
                        {verifyingOtp ? (
                          <span className="flex items-center gap-1.5">
                            <RefreshCw className="size-3.5 animate-spin" /> Verifying...
                          </span>
                        ) : (
                          "Verify Code & Continue"
                        )}
                      </Button>
                    </form>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-1.5 h-9"
                    onClick={() => handleSendResetEmail()}
                    disabled={resetSending}
                  >
                    <RefreshCw className={`size-3.5 ${resetSending ? "animate-spin" : ""}`} />
                    {resetSending ? "Sending link..." : "Resend reset link"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground h-9"
                    onClick={() => {
                      setResetEmailSent(false);
                      setActiveView("signin");
                    }}
                  >
                    Back to Sign In
                  </Button>
                </div>
              </div>
            ) : (
              /* Request Reset Link Form */
              <div>
                <div className="text-center mb-5">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary mb-3">
                    <KeyRound className="size-6" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Forgot your password?</h2>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    No problem. Enter your account&apos;s email address and we&apos;ll send you a secure link to create a new password.
                  </p>
                </div>

                <form onSubmit={handleSendResetEmail} className="space-y-4">
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

                  <Button
                    type="submit"
                    disabled={resetSending || !email}
                    className="bg-gradient-cta glow w-full border-0 font-semibold text-primary-foreground h-10 mt-1"
                  >
                    {resetSending ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="size-4 animate-spin" /> Sending reset link...
                      </span>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setActiveView("signin")}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="size-3.5" /> Back to Sign In
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : activeView === "reset-password" ? (
          /* Set New Password View */
          <div className="space-y-5">
            <div className="text-center mb-5">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary mb-3">
                <ShieldCheck className="size-6" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Create New Password</h2>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Choose a strong new password for your Sn_apKut AI account.
              </p>
            </div>

            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">New Password</label>
                <div className="relative">
                  <Lock className="size-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                  <input
                    type={showResetNewPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-md border border-input bg-background/60 pl-9 pr-10 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showResetNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Confirm New Password</label>
                <div className="relative">
                  <Lock className="size-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                  <input
                    type={showResetConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-md border border-input bg-background/60 pl-9 pr-10 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showResetConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {resetNewPassword && resetConfirmPassword && resetNewPassword !== resetConfirmPassword && (
                <p className="text-xs text-destructive font-medium">
                  Passwords do not match.
                </p>
              )}

              <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 text-[11px] text-muted-foreground leading-relaxed">
                Must be at least 6 characters long. For security, combine letters and numbers.
              </div>

              <Button
                type="submit"
                disabled={
                  resetUpdating ||
                  !resetNewPassword ||
                  resetNewPassword.length < 6 ||
                  resetNewPassword !== resetConfirmPassword
                }
                className="bg-gradient-cta glow w-full border-0 font-semibold text-primary-foreground h-10 mt-1"
              >
                {resetUpdating ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="size-4 animate-spin" /> Updating password...
                  </span>
                ) : (
                  "Update Password & Sign In"
                )}
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecoveryMode(false);
                    setActiveView("signin");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <ArrowLeft className="size-3.5" /> Back to Sign In
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Sign In & Sign Up Form */
          <div>
            {/* Social OAuth Sign In (GitHub & Facebook) */}
            <div className="space-y-3 mb-5">
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading || !!oauthLoading}
                  onClick={() => handleOAuth("github")}
                  className="h-10 border-border/80 bg-background/60 hover:bg-muted/50 hover:text-foreground transition-all flex items-center justify-center gap-2 text-xs font-semibold"
                >
                  {oauthLoading === "github" ? (
                    <RefreshCw className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                    <svg className="size-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  )}
                  <span>GitHub</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={loading || !!oauthLoading}
                  onClick={() => handleOAuth("facebook")}
                  className="h-10 border-border/80 bg-background/60 hover:bg-muted/50 hover:text-foreground transition-all flex items-center justify-center gap-2 text-xs font-semibold"
                >
                  {oauthLoading === "facebook" ? (
                    <RefreshCw className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                    <svg className="size-4 fill-[#1877F2] shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  )}
                  <span>Facebook</span>
                </Button>
              </div>

              {/* Or continue with divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/70" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                  <span className="bg-card px-2.5 text-muted-foreground font-medium">or continue with email</span>
                </div>
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(val) => {
                setActiveTab(val as "signin" | "signup");
                setActiveView(val as "signin" | "signup");
              }}
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
                      <button
                        type="button"
                        onClick={() => {
                          setActiveView("forgot-password");
                          setResetEmailSent(false);
                        }}
                        className="text-xs text-primary hover:underline hover:text-primary/90 transition-colors cursor-pointer font-medium"
                      >
                        Forgot password?
                      </button>
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
