import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, fetchUserProfile, ensureUserProfile, type UserProfile } from "@/lib/supabase";
import { registerUserServerFn } from "@/lib/server-auth";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithPassword: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: Error | null; needsEmailConfirmation: boolean }>;
  signInWithOAuth: (
    provider: "github" | "facebook",
    redirectPath?: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      return;
    }
    const prof = await ensureUserProfile(currentUser);
    setProfile(prof);
  };

  useEffect(() => {
    // Check initial active session
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      setSession(initSession);
      setUser(initSession?.user ?? null);
      if (initSession?.user) {
        loadProfile(initSession.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);

      if (newUser) {
        await loadProfile(newUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await loadProfile(data.user);
      }

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signUpWithPassword = async (email: string, password: string, fullName?: string) => {
    try {
      // 1. Try server-side auto-confirmed registration.
      // This bypasses GoTrue's default SMTP mailer so it NEVER triggers the 3-4 emails/hour rate limit.
      try {
        const res = await registerUserServerFn({
          data: {
            email,
            password,
            ...(fullName ? { fullName } : {}),
          },
        });

        if (res && res.success) {
          // User created and auto-confirmed. Immediately authenticate them.
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (!signInError && signInData.user) {
            setUser(signInData.user);
            setSession(signInData.session);
            await loadProfile(signInData.user);
            return { error: null, needsEmailConfirmation: false };
          }
        } else if (res && res.error) {
          // If the error is a user conflict (already registered) or password rule, propagate immediately
          const lower = res.error.toLowerCase();
          if (
            lower.includes("already registered") ||
            lower.includes("already exists") ||
            lower.includes("password") ||
            lower.includes("invalid")
          ) {
            return { error: new Error(res.error), needsEmailConfirmation: false };
          }
        }
      } catch (serverFnErr) {
        console.warn("Server-side registration fallback:", serverFnErr);
      }

      // 2. Client-side fallback to standard supabase.auth.signUp()
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : "";
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split("@")[0],
          },
          ...(redirectUrl ? { emailRedirectTo: redirectUrl } : {}),
        },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("rate limit") ||
          error.message.toLowerCase().includes("over_email_send_rate_limit")
        ) {
          return {
            error: new Error(
              "Email rate limit exceeded by Supabase test mailer. Please try logging in directly, or disable 'Confirm email' in Supabase Auth settings."
            ),
            needsEmailConfirmation: false,
          };
        }
        return { error, needsEmailConfirmation: false };
      }

      // If user is returned without session, email confirmation is required
      const needsEmailConfirmation = !data.session;
      if (data.user && data.session) {
        setUser(data.user);
        setSession(data.session);
        await loadProfile(data.user);
      }

      return { error: null, needsEmailConfirmation };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)), needsEmailConfirmation: false };
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : "";
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        ...(redirectUrl ? { options: { emailRedirectTo: redirectUrl } } : {}),
      });
      return { error };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectUrl = `${origin}/auth?mode=reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });
      return { error };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signInWithOAuth = async (provider: "github" | "facebook", redirectPath?: string) => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const destination = redirectPath || "/dashboard";
      const redirectTo = `${origin}${destination.startsWith("/") ? destination : `/${destination}`}`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (error) {
        return { error };
      }

      if (data?.url && typeof window !== "undefined") {
        window.location.href = data.url;
      }

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      toast.info("Signed out successfully.");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const updated = await fetchUserProfile(user.id);
      if (updated) {
        setProfile(updated);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signInWithPassword,
        signUpWithPassword,
        signInWithOAuth,
        signOut,
        resendVerificationEmail,
        sendPasswordResetEmail,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
