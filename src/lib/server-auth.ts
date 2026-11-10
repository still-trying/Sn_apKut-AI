import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export interface RegisterInput {
  email: string;
  password: string;
  fullName?: string | undefined;
}

export interface RegisterResult {
  success: boolean;
  error?: string | undefined;
  userId?: string | undefined;
}

// In-memory sliding-window rate limiter for registration attempts (Max 5 attempts per 5 minutes)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const registrationRateLimitMap = new Map<string, RateLimitEntry>();

function checkRegistrationRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 5 * 60 * 1000
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = registrationRateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    registrationRateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true };
}

export const registerUserServerFn = createServerFn({ method: "POST" })
  .validator((data: RegisterInput) => data)
  .handler(async ({ data }): Promise<RegisterResult> => {
    try {
      const normalizedEmail = (data.email || "").toLowerCase().trim();
      if (!normalizedEmail || !data.password) {
        return { success: false, error: "Email and password are required." };
      }

      // Rate limit check
      const rateLimit = checkRegistrationRateLimit(normalizedEmail);
      if (!rateLimit.allowed) {
        return {
          success: false,
          error: `Too many sign-up attempts. Please wait ${rateLimit.retryAfter} seconds before trying again.`,
        };
      }

      const supabaseUrl =
        process.env["SUPABASE_URL"] ||
        process.env["VITE_SUPABASE_URL"] ||
        "";

      const serviceRoleKey =
        process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
        process.env["VITE_SUPABASE_SERVICE_ROLE_KEY"] ||
        "";

      if (!supabaseUrl) {
        return {
          success: false,
          error: "SUPABASE_URL is not configured on server.",
        };
      }

      if (!serviceRoleKey) {
        return {
          success: false,
          error: "SUPABASE_SERVICE_ROLE_KEY is not configured on server.",
        };
      }

      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      // Admin createUser with email_confirm: true creates and immediately confirms the user,
      // which completely avoids triggering the Supabase SMTP email quota / rate limit.
      const { data: userData, error } = await adminClient.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          full_name: data.fullName || data.email.split("@")[0],
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        userId: userData.user?.id,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

export interface DeleteAccountInput {
  userId: string;
  accessToken: string;
}

export interface DeleteAccountResult {
  success: boolean;
  error?: string | undefined;
}

export const deleteAccountServerFn = createServerFn({ method: "POST" })
  .validator((data: DeleteAccountInput) => data)
  .handler(async ({ data }): Promise<DeleteAccountResult> => {
    try {
      if (!data.accessToken) {
        return {
          success: false,
          error: "Unauthorized: Missing authentication token.",
        };
      }

      const supabaseUrl =
        process.env["SUPABASE_URL"] ||
        process.env["VITE_SUPABASE_URL"] ||
        "";

      const serviceRoleKey =
        process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
        process.env["VITE_SUPABASE_SERVICE_ROLE_KEY"] ||
        "";

      if (!supabaseUrl) {
        return {
          success: false,
          error: "SUPABASE_URL is not configured on server.",
        };
      }

      if (!serviceRoleKey) {
        return {
          success: false,
          error: "SUPABASE_SERVICE_ROLE_KEY is not configured on server.",
        };
      }

      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      // Strict BOLA / IDOR Verification: Verify caller's JWT token
      const { data: authData, error: authError } = await adminClient.auth.getUser(data.accessToken);
      if (authError || !authData?.user) {
        return {
          success: false,
          error: "Unauthorized: Session is invalid or expired. Please sign in again.",
        };
      }

      if (authData.user.id !== data.userId) {
        return {
          success: false,
          error: "Forbidden: You are not authorized to delete another user's account.",
        };
      }

      // 1. Delete user data across tables
      await adminClient.from("cutout_history").delete().eq("user_id", data.userId);
      await adminClient.from("payment_records").delete().eq("user_id", data.userId);
      await adminClient.from("profiles").delete().eq("id", data.userId);

      // 2. Delete user auth account
      const { error } = await adminClient.auth.admin.deleteUser(data.userId);
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });
