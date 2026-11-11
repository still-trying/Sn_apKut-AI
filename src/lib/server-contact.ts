import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export interface SubmitContactInquiryInput {
  name: string;
  email: string;
  phone?: string | undefined;
  subject: string;
  message: string;
}

export interface SubmitContactInquiryResult {
  success: boolean;
  ticketId?: string | undefined;
  error?: string | undefined;
}

function getAdminClient() {
  const supabaseUrl =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    "https://ugagaidwiadaluisxexo.supabase.co";

  const serviceRoleKey =
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
    process.env["VITE_SUPABASE_SERVICE_ROLE_KEY"] ||
    "";

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured on server.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function generateTicketId(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `TKT-${dateStr}-${randomSuffix}`;
}

export const submitContactInquiryServerFn = createServerFn({ method: "POST" })
  .validator((data: SubmitContactInquiryInput) => data)
  .handler(async ({ data }): Promise<SubmitContactInquiryResult> => {
    try {
      const name = (data.name || "").trim();
      const email = (data.email || "").trim().toLowerCase();
      const phone = (data.phone || "").trim() || null;
      const subject = (data.subject || "general").trim();
      const message = (data.message || "").trim();

      if (!name) {
        return { success: false, error: "Please provide your name." };
      }

      if (!email || !email.includes("@")) {
        return { success: false, error: "Please provide a valid email address." };
      }

      if (!message || message.length < 5) {
        return { success: false, error: "Message must be at least 5 characters long." };
      }

      const ticketId = generateTicketId();
      const adminClient = getAdminClient();

      const { error: insertError } = await adminClient
        .from("contact_inquiries")
        .insert({
          ticket_id: ticketId,
          name,
          email,
          phone,
          subject,
          message,
          status: "open",
        });

      if (insertError) {
        console.error("Failed to insert contact inquiry:", insertError);
        return { success: false, error: insertError.message };
      }

      return {
        success: true,
        ticketId,
      };
    } catch (err) {
      console.error("submitContactInquiryServerFn error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });
