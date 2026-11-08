import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, fetchUserProfile, ensureUserProfile, type UserProfile } from "@/lib/supabase";
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
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>;
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
        signOut,
        resendVerificationEmail,
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
