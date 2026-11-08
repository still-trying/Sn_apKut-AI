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

export const registerUserServerFn = createServerFn({ method: "POST" })
  .validator((data: RegisterInput) => data)
  .handler(async ({ data }): Promise<RegisterResult> => {
    try {
      const supabaseUrl =
        process.env["SUPABASE_URL"] ||
        process.env["VITE_SUPABASE_URL"] ||
        "https://ugagaidwiadaluisxexo.supabase.co";

      const serviceRoleKey =
        process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
        process.env["VITE_SUPABASE_SERVICE_ROLE_KEY"] ||
        "";

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
