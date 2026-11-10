import { toast } from "sonner";
import logo from "@/assets/snapkut-logo.png.asset.json";
import { supabase } from "@/lib/supabase";
import {
  createRazorpayOrderServerFn,
  verifyAndApplyPaymentServerFn,
} from "@/lib/server-payment";
import { addCredits, upgradeToPro } from "@/lib/credits-storage";

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface CheckoutPlanOptions {
  planName: "Pro" | "Credit packs";
  amountInRupees: number;
  description: string;
  userEmail?: string | undefined;
  userName?: string | undefined;
  onSuccess?: (response: RazorpaySuccessResponse) => void;
  onDismiss?: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: (response: unknown) => void) => void;
    };
  }
}

// Dynamically load Razorpay standard checkout script
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay SDK");
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

// Helper to verify payment cryptographically on server and apply entitlements
export async function verifyAndApplyPayment({
  response,
  planName,
  amountInRupees,
}: {
  response: RazorpaySuccessResponse;
  planName: "Pro" | "Credit packs";
  amountInRupees: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      return {
        success: false,
        error: "Session expired. Please sign in to verify your purchase.",
      };
    }

    const result = await verifyAndApplyPaymentServerFn({
      data: {
        accessToken,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpayOrderId: response.razorpay_order_id,
        razorpaySignature: response.razorpay_signature,
        planName,
        amountInRupees,
      },
    });

    if (result.success) {
      if (planName === "Pro") {
        upgradeToPro();
      } else if (planName === "Credit packs") {
        addCredits(250);
      }
      return { success: true };
    }

    return {
      success: false,
      error: result.error || "Payment signature verification failed.",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function openRazorpayCheckout({
  planName,
  amountInRupees,
  description,
  userEmail,
  userName,
  onSuccess,
  onDismiss,
}: CheckoutPlanOptions): Promise<void> {
  // Free tier handling (0 rupees)
  if (amountInRupees <= 0) {
    toast.success("Welcome to Sn_apKut AI Free Plan! 5 free cutouts daily activated.", {
      description: "No payment required. You can start removing backgrounds immediately.",
    });
    const uploadEl = document.getElementById("upload-zone");
    if (uploadEl) {
      uploadEl.scrollIntoView({ behavior: "smooth" });
    }
    return;
  }

  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !window.Razorpay) {
    toast.error("Could not load Razorpay payment gateway. Please check your internet connection.");
    return;
  }

  const keyId =
    (import.meta.env["VITE_RAZORPAY_KEY_ID"] as string | undefined) ||
    "rzp_test_TxLqhOaun8Cecx";

  // Try creating verified order on server if user is signed in
  let serverOrderId: string | undefined;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      const orderRes = await createRazorpayOrderServerFn({
        data: {
          accessToken: token,
          planName,
          amountInRupees,
        },
      });
      if (orderRes.success && orderRes.orderId) {
        serverOrderId = orderRes.orderId;
      }
    }
  } catch (err) {
    console.warn("Server order pre-creation notice:", err);
  }

  const options: Record<string, unknown> = {
    key: keyId,
    amount: Math.round(amountInRupees * 100), // amount in paise
    currency: "INR",
    name: "Sn_apKut AI",
    description: `${planName} — ${description}`,
    image:
      typeof window !== "undefined"
        ? `${window.location.origin}${logo.url.startsWith("/") ? "" : "/"}${logo.url}`
        : logo.url,
    theme: {
      color: "#6366f1",
      backdrop_color: "rgba(10, 10, 26, 0.85)",
    },
    prefill: {
      name: userName || "Customer",
      email: userEmail || "customer@example.com",
      contact: "9999999999",
    },
    notes: {
      plan_name: planName,
      service: "Sn_apKut AI Background Removal",
    },
    modal: {
      ondismiss: () => {
        toast.info("Payment cancelled.");
        if (onDismiss) onDismiss();
      },
    },
    handler: (response: RazorpaySuccessResponse) => {
      toast.success(`Payment captured! Verifying transaction...`, {
        description: `Payment ID: ${response.razorpay_payment_id}`,
      });
      if (onSuccess) {
        onSuccess(response);
      }
    },
  };

  if (serverOrderId) {
    options["order_id"] = serverOrderId;
  }

  try {
    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error("Razorpay initialization error:", err);
    toast.error("Could not initialize Razorpay checkout. Please verify your VITE_RAZORPAY_KEY_ID.");
  }
}
