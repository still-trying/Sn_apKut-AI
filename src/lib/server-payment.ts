import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

export interface CreateOrderInput {
  accessToken: string;
  planName: "Pro" | "Credit packs";
  amountInRupees: number;
}

export interface CreateOrderResult {
  success: boolean;
  orderId?: string | undefined;
  amount?: number | undefined;
  currency?: string | undefined;
  keyId?: string | undefined;
  error?: string | undefined;
}

export interface VerifyPaymentInput {
  accessToken: string;
  razorpayPaymentId: string;
  razorpayOrderId?: string | undefined;
  razorpaySignature?: string | undefined;
  planName: "Pro" | "Credit packs";
  amountInRupees: number;
}

export interface VerifyPaymentResult {
  success: boolean;
  error?: string | undefined;
  plan?: "free" | "pro" | undefined;
  creditsRemaining?: number | undefined;
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

// 1. Create a server-side verified Razorpay Order
export const createRazorpayOrderServerFn = createServerFn({ method: "POST" })
  .validator((data: CreateOrderInput) => data)
  .handler(async ({ data }): Promise<CreateOrderResult> => {
    try {
      if (!data.accessToken) {
        return { success: false, error: "Unauthorized: Missing authentication token." };
      }

      const adminClient = getAdminClient();
      const { data: authData, error: authError } = await adminClient.auth.getUser(data.accessToken);
      if (authError || !authData?.user) {
        return { success: false, error: "Unauthorized: Invalid or expired session." };
      }

      const keyId =
        process.env["RAZORPAY_KEY_ID"] ||
        process.env["VITE_RAZORPAY_KEY_ID"] ||
        "";

      const keySecret =
        process.env["RAZORPAY_KEY_SECRET"] ||
        "";

      if (!keyId || !keySecret) {
        return { success: false, error: "Razorpay credentials are not configured on server." };
      }

      const expectedAmount = data.planName === "Pro" ? 799 : 299;
      const amountInPaise = Math.round(expectedAmount * 100);

      const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");

      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt: `rcpt_${authData.user.id.slice(0, 8)}_${Date.now().toString().slice(-6)}`,
          notes: {
            userId: authData.user.id,
            planName: data.planName,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, error: `Failed to create Razorpay order: ${errText}` };
      }

      const orderData = (await response.json()) as { id: string; amount: number; currency: string };
      return {
        success: true,
        orderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

// 2. Cryptographically verify payment and apply plan / credits
export const verifyAndApplyPaymentServerFn = createServerFn({ method: "POST" })
  .validator((data: VerifyPaymentInput) => data)
  .handler(async ({ data }): Promise<VerifyPaymentResult> => {
    try {
      if (!data.accessToken) {
        return { success: false, error: "Unauthorized: Missing authentication token." };
      }

      const adminClient = getAdminClient();
      const { data: authData, error: authError } = await adminClient.auth.getUser(data.accessToken);
      if (authError || !authData?.user) {
        return { success: false, error: "Unauthorized: Invalid or expired session." };
      }

      const userId = authData.user.id;

      // Anti-Replay Protection: check if payment ID was already used
      const { data: existingPayment } = await adminClient
        .from("payment_records")
        .select("id")
        .eq("razorpay_payment_id", data.razorpayPaymentId)
        .maybeSingle();

      if (existingPayment) {
        return {
          success: false,
          error: "Payment replay detected: This payment has already been credited.",
        };
      }

      const keyId =
        process.env["RAZORPAY_KEY_ID"] ||
        process.env["VITE_RAZORPAY_KEY_ID"] ||
        "";

      const keySecret =
        process.env["RAZORPAY_KEY_SECRET"] ||
        "";

      if (!keySecret) {
        return { success: false, error: "RAZORPAY_KEY_SECRET is not configured on server." };
      }

      let isVerified = false;

      // Method A: HMAC-SHA256 signature verification (when order_id is present)
      if (data.razorpayOrderId && data.razorpaySignature) {
        try {
          const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
            .digest("hex");

          if (
            expectedSignature.length === data.razorpaySignature.length &&
            crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(data.razorpaySignature))
          ) {
            isVerified = true;
          }
        } catch (sigErr) {
          console.warn("HMAC verification error:", sigErr);
        }
      }

      // Method B: Direct Razorpay API status check (fallback if signature verification is bypassed or not using orders)
      if (!isVerified && keyId) {
        try {
          const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
          const apiRes = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(data.razorpayPaymentId)}`, {
            headers: { Authorization: authHeader },
          });

          if (apiRes.ok) {
            const paymentInfo = (await apiRes.json()) as {
              status?: string;
              amount?: number;
              currency?: string;
            };

            const expectedPaise = Math.round(data.amountInRupees * 100);
            if (
              (paymentInfo.status === "captured" || paymentInfo.status === "authorized") &&
              typeof paymentInfo.amount === "number" &&
              paymentInfo.amount >= expectedPaise
            ) {
              isVerified = true;
            }
          }
        } catch (fetchErr) {
          console.warn("Razorpay API status check error:", fetchErr);
        }
      }

      if (!isVerified) {
        return {
          success: false,
          error: "Payment signature verification failed. Untrusted transaction.",
        };
      }

      // Payment verified! Securely update database using Service Role
      let resultingPlan: "free" | "pro" = "free";
      let resultingCredits = 5;

      if (data.planName === "Pro") {
        const { data: updatedProf, error: updateErr } = await adminClient
          .from("profiles")
          .update({
            plan: "pro",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId)
          .select("plan, credits_remaining")
          .single();

        if (updateErr) {
          return { success: false, error: "Database error updating profile: " + updateErr.message };
        }
        resultingPlan = (updatedProf?.plan as "free" | "pro") || "pro";
        resultingCredits = updatedProf?.credits_remaining ?? 999999;
      } else if (data.planName === "Credit packs") {
        const { data: currentProf } = await adminClient
          .from("profiles")
          .select("credits_remaining, plan")
          .eq("id", userId)
          .single();

        const currentCredits = currentProf?.credits_remaining ?? 0;
        const newCredits = currentCredits + 250;

        const { error: updateErr } = await adminClient
          .from("profiles")
          .update({
            credits_remaining: newCredits,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (updateErr) {
          return { success: false, error: "Database error adding credits: " + updateErr.message };
        }
        resultingPlan = (currentProf?.plan as "free" | "pro") || "free";
        resultingCredits = newCredits;
      }

      // Record verified transaction in payment_records
      await adminClient.from("payment_records").insert({
        user_id: userId,
        razorpay_payment_id: data.razorpayPaymentId,
        razorpay_order_id: data.razorpayOrderId ?? null,
        razorpay_signature: data.razorpaySignature ?? null,
        plan_name: data.planName,
        amount_in_rupees: data.amountInRupees,
        currency: "INR",
        status: "captured",
      });

      return {
        success: true,
        plan: resultingPlan,
        creditsRemaining: resultingCredits,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

