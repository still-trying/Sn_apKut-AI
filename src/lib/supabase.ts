import { createClient } from "@supabase/supabase-js";
import { deleteAccountServerFn, deleteCutoutServerFn } from "@/lib/server-auth";
import { getUserPaymentsServerFn, type PaymentRecordItem } from "@/lib/server-payment";
import {
  submitContactInquiryServerFn,
  type SubmitContactInquiryInput,
  type SubmitContactInquiryResult,
} from "@/lib/server-contact";

export type { PaymentRecordItem, SubmitContactInquiryInput, SubmitContactInquiryResult };

const supabaseUrl =
  (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ||
  (import.meta.env["SUPABASE_URL"] as string | undefined) ||
  "";

const supabaseAnonKey =
  (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined) ||
  (import.meta.env["SUPABASE_ANON_KEY"] as string | undefined) ||
  "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Sn_apKut Security] Missing Supabase environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Please ensure they are configured in your environment."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: "free" | "pro";
  credits_remaining: number;
  total_processed: number;
  month_processed: number;
  last_credit_reset_date: string;
  api_key: string;
  created_at: string;
  updated_at: string;
}

export interface CutoutHistoryRow {
  id: string;
  user_id: string;
  image_name: string;
  image_size: number;
  result_url: string;
  raw_response?: Record<string, unknown> | undefined;
  created_at: string;
}

export interface PaymentRecordRow {
  id: string;
  user_id: string;
  razorpay_payment_id: string;
  razorpay_order_id?: string | undefined;
  razorpay_signature?: string | undefined;
  plan_name: string;
  amount_in_rupees: number;
  currency: string;
  status: string;
  created_at: string;
}

// Fetch user profile from Supabase profiles table
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    // First trigger daily reset function if needed (for free tier reset to 5)
    try {
      await supabase.rpc("reset_daily_credits_if_needed", { target_user_id: userId });
    } catch {
      // Ignore if RPC has not been created yet
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile from Supabase:", error.message);
      return null;
    }

    return (data as UserProfile | null) ?? null;
  } catch (err) {
    console.error("fetchUserProfile failed:", err);
    return null;
  }
}

// Ensure profile row exists (fallback in case DB trigger had not fired yet)
export async function ensureUserProfile(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }): Promise<UserProfile | null> {
  const existing = await fetchUserProfile(user.id);
  if (existing) return existing;

  const email = user.email || "";
  const fullName =
    typeof user.user_metadata?.["full_name"] === "string"
      ? (user.user_metadata["full_name"] as string)
      : typeof user.user_metadata?.["name"] === "string"
        ? (user.user_metadata["name"] as string)
        : typeof user.user_metadata?.["user_name"] === "string"
          ? (user.user_metadata["user_name"] as string)
          : email.split("@")[0] || "User";

  const avatarUrl =
    typeof user.user_metadata?.["avatar_url"] === "string"
      ? (user.user_metadata["avatar_url"] as string)
      : typeof user.user_metadata?.["picture"] === "string"
        ? (user.user_metadata["picture"] as string)
        : null;

  const defaultApiKey = "sk_live_" + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

  const newProfile: Partial<UserProfile> = {
    id: user.id,
    email,
    full_name: fullName,
    avatar_url: avatarUrl,
    plan: "free",
    credits_remaining: 5,
    total_processed: 0,
    month_processed: 0,
    last_credit_reset_date: new Date().toISOString().slice(0, 10),
    api_key: defaultApiKey,
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(newProfile)
    .select("*")
    .single();

  if (error) {
    console.warn("Could not upsert profile:", error.message);
    return null;
  }

  return data as UserProfile;
}

// Deduct 1 credit upon background removal success
export async function deductUserCredit(userId: string): Promise<{ success: boolean; remaining: number; plan: "free" | "pro" }> {
  const profile = await fetchUserProfile(userId);
  if (!profile) return { success: true, remaining: 5, plan: "free" };

  if (profile.plan === "pro") {
    await supabase
      .from("profiles")
      .update({
        total_processed: profile.total_processed + 1,
        month_processed: profile.month_processed + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    return { success: true, remaining: Infinity, plan: "pro" };
  }

  const remaining = Math.max(0, profile.credits_remaining - 1);
  await supabase
    .from("profiles")
    .update({
      credits_remaining: remaining,
      total_processed: profile.total_processed + 1,
      month_processed: profile.month_processed + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return { success: true, remaining, plan: "free" };
}

// Add credits (e.g. 250 credits bundle from Razorpay)
export async function addCreditsToProfile(userId: string, amount: number): Promise<number> {
  const profile = await fetchUserProfile(userId);
  const current = profile?.credits_remaining ?? 0;
  const updated = current + amount;

  await supabase
    .from("profiles")
    .update({
      credits_remaining: updated,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return updated;
}

// Upgrade profile to Pro plan (unlimited cutouts)
export async function upgradeProfileToPro(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .update({
      plan: "pro",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return !error;
}

// Save cutout record into Supabase
export async function saveCutoutRecord(
  userId: string,
  item: {
    imageName: string;
    imageSize: number;
    resultUrl: string;
    rawResponse?: Record<string, unknown> | undefined;
  }
): Promise<void> {
  try {
    await supabase.from("cutout_history").insert({
      user_id: userId,
      image_name: item.imageName,
      image_size: item.imageSize,
      result_url: item.resultUrl,
      raw_response: item.rawResponse ?? null,
    });
  } catch (err) {
    console.error("Failed to save cutout record in Supabase:", err);
  }
}

// Fetch cutout records for a specific user from Supabase
export async function fetchUserCutouts(userId: string): Promise<CutoutHistoryRow[]> {
  try {
    const { data, error } = await supabase
      .from("cutout_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.warn("fetchUserCutouts error:", error.message);
      return [];
    }

    return (data as CutoutHistoryRow[]) || [];
  } catch (err) {
    console.error("fetchUserCutouts failed:", err);
    return [];
  }
}

// Update cutout image name in Supabase
export async function updateCutoutRecordName(
  userId: string,
  idOrUrl: string,
  newName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let query = supabase
      .from("cutout_history")
      .update({ image_name: newName.trim() })
      .eq("user_id", userId);

    if (idOrUrl.startsWith("http")) {
      query = query.eq("result_url", idOrUrl);
    } else {
      query = query.eq("id", idOrUrl);
    }

    const { error } = await query;
    if (error) {
      console.warn("updateCutoutRecordName error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("updateCutoutRecordName failed:", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// Delete a specific cutout record for a user from Supabase cloud database
export async function deleteCutoutRecord(
  userId: string,
  id: string,
  resultUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Try server function with verified user access token
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      try {
        const serverRes = await deleteCutoutServerFn({
          data: {
            userId,
            cutoutId: id,
            resultUrl,
            accessToken: token,
          },
        });
        if (serverRes?.success) {
          return { success: true };
        }
      } catch (srvErr) {
        console.warn("deleteCutoutServerFn error, trying direct query:", srvErr);
      }
    }

    // 2. Direct Supabase query with client session
    let query = supabase.from("cutout_history").delete().eq("user_id", userId);

    if (id && !id.startsWith("http") && !id.startsWith("local_")) {
      const { error } = await query.eq("id", id);
      if (!error) {
        return { success: true };
      }
    }

    const targetUrl = resultUrl || (id.startsWith("http") ? id : undefined);
    if (targetUrl) {
      const { error } = await supabase
        .from("cutout_history")
        .delete()
        .eq("user_id", userId)
        .eq("result_url", targetUrl);

      if (error) {
        console.warn("deleteCutoutRecord error:", error.message);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (err) {
    console.error("deleteCutoutRecord failed:", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// Clear all cutout records for a specific user from Supabase
export async function clearUserCutoutHistory(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("cutout_history")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.warn("clearUserCutoutHistory error:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error("clearUserCutoutHistory failed:", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// Update user display name in both auth metadata and profiles table
export async function updateUserProfileName(
  userId: string,
  newName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Update Supabase Auth metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: newName },
    });
    if (authError) {
      console.warn("Auth updateUser error:", authError.message);
    }

    // 2. Update public.profiles row
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: newName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// Update user password
export async function updateUserPassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// Send password reset email
export async function sendPasswordResetEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const redirectTo = `${origin}/auth?mode=reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// Verify recovery OTP code if received via email
export async function verifyPasswordResetOtp(
  email: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: "recovery",
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// Save Razorpay transaction record
export async function savePaymentRecord(
  userId: string,
  record: {
    razorpayPaymentId: string;
    razorpayOrderId?: string | undefined;
    razorpaySignature?: string | undefined;
    planName: string;
    amountInRupees: number;
  }
): Promise<void> {
  try {
    await supabase.from("payment_records").insert({
      user_id: userId,
      razorpay_payment_id: record.razorpayPaymentId,
      razorpay_order_id: record.razorpayOrderId ?? null,
      razorpay_signature: record.razorpaySignature ?? null,
      plan_name: record.planName,
      amount_in_rupees: record.amountInRupees,
      currency: "INR",
      status: "captured",
    });
  } catch (err) {
    console.error("Failed to save payment record in Supabase:", err);
  }
}

// Fetch authenticated user payment history
export async function fetchUserPaymentRecords(userId: string): Promise<PaymentRecordItem[]> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      const serverRes = await getUserPaymentsServerFn({ data: { accessToken: token } });
      if (serverRes?.success && Array.isArray(serverRes.records)) {
        return serverRes.records;
      }
    }

    // Direct fallback if session token server fn had an issue
    const { data, error } = await supabase
      .from("payment_records")
      .select(
        "id, user_id, razorpay_payment_id, razorpay_order_id, razorpay_signature, plan_name, amount_in_rupees, currency, status, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("fetchUserPaymentRecords error:", error.message);
      return [];
    }
    return (data as PaymentRecordItem[]) || [];
  } catch (err) {
    console.error("Failed to fetch user payments:", err);
    return [];
  }
}

// Generate a secure API key
export function generateApiKey(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    return "sk_live_" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return "sk_live_" + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12);
}

// Rotate API key in profiles table
export async function rotateUserApiKey(
  userId: string
): Promise<{ success: boolean; newApiKey?: string; error?: string }> {
  try {
    const newApiKey = generateApiKey();

    const { error } = await supabase
      .from("profiles")
      .update({
        api_key: newApiKey,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.warn("rotateUserApiKey error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, newApiKey };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// Permanently delete user account and all personal data
export async function deleteUserAccount(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Retrieve the caller's active auth session token
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      return {
        success: false,
        error: "Authentication required. Please sign in again to verify your account deletion.",
      };
    }

    // 2. Call the server function with verified access token
    const serverRes = await deleteAccountServerFn({
      data: { userId, accessToken },
    });

    if (serverRes?.success) {
      await supabase.auth.signOut();
      return { success: true };
    }

    if (serverRes?.error) {
      return { success: false, error: serverRes.error };
    }

    await supabase.auth.signOut();
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// Submit a customer support or business contact inquiry
export async function submitContactInquiry(inquiry: {
  name: string;
  email: string;
  phone?: string | undefined;
  subject: string;
  message: string;
}): Promise<SubmitContactInquiryResult> {
  try {
    // 1. Try server function using Service Role
    const serverRes = await submitContactInquiryServerFn({
      data: inquiry,
    });
    if (serverRes?.success) {
      return serverRes;
    }
    if (serverRes?.error) {
      return { success: false, error: serverRes.error };
    }
  } catch (err) {
    console.warn("submitContactInquiryServerFn failed, attempting direct insert:", err);
  }

  // 2. Fallback: direct insert using public client via RLS policy
  try {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const ticketId = `TKT-${dateStr}-${randomSuffix}`;

    const { error } = await supabase.from("contact_inquiries").insert({
      ticket_id: ticketId,
      name: inquiry.name.trim(),
      email: inquiry.email.trim().toLowerCase(),
      phone: inquiry.phone?.trim() || null,
      subject: inquiry.subject,
      message: inquiry.message.trim(),
      status: "open",
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, ticketId };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
