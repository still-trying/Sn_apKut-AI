export interface UserCreditsData {
  plan: "free" | "pro";
  creditsRemaining: number;
  totalProcessed: number;
  monthProcessed: number;
  lastResetDate: string;
  apiKey: string;
}

const STORAGE_KEY = "snapkut_user_credits_v1";
export const CREDITS_EVENT = "snapkut_credits_changed";

const DEFAULT_CREDITS: UserCreditsData = {
  plan: "free",
  creditsRemaining: 5,
  totalProcessed: 0,
  monthProcessed: 0,
  lastResetDate: new Date().toISOString().slice(0, 10),
  apiKey: "sk_live_" + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 10),
};

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getUserCredits(): UserCreditsData {
  if (typeof window === "undefined" || !window.localStorage) {
    return DEFAULT_CREDITS;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CREDITS));
      return DEFAULT_CREDITS;
    }
    const data: UserCreditsData = JSON.parse(raw);

    // If on Free tier and a new day has arrived, reset daily 5 credits
    const today = getTodayString();
    if (data.plan === "free" && data.lastResetDate !== today) {
      data.creditsRemaining = 5;
      data.lastResetDate = today;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    if (!data.apiKey) {
      data.apiKey = "sk_live_" + Math.random().toString(36).slice(2, 12);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    return data;
  } catch (err) {
    console.error("Failed to read user credits:", err);
    return DEFAULT_CREDITS;
  }
}

export function saveUserCredits(data: UserCreditsData): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(CREDITS_EVENT, { detail: data }));
  } catch (err) {
    console.error("Failed to save user credits:", err);
  }
}

// Check if user has sufficient credits or is on Pro
export function canProcessImage(): boolean {
  const current = getUserCredits();
  if (current.plan === "pro") return true;
  return current.creditsRemaining > 0;
}

// Deduct 1 credit upon successful background removal
export function deductCreditOnSuccess(): { success: boolean; remaining: number; plan: "free" | "pro" } {
  const current = getUserCredits();

  // Increment total stats
  current.totalProcessed += 1;
  current.monthProcessed += 1;

  if (current.plan === "pro") {
    saveUserCredits(current);
    return { success: true, remaining: Infinity, plan: "pro" };
  }

  if (current.creditsRemaining <= 0) {
    return { success: false, remaining: 0, plan: "free" };
  }

  current.creditsRemaining = Math.max(0, current.creditsRemaining - 1);
  saveUserCredits(current);
  return { success: true, remaining: current.creditsRemaining, plan: "free" };
}

// Add credits (e.g. from Razorpay Credit Pack purchase of 250 credits)
export function addCredits(amount: number): UserCreditsData {
  const current = getUserCredits();
  current.creditsRemaining += amount;
  saveUserCredits(current);
  return current;
}

// Upgrade to Pro (e.g. from Razorpay Pro subscription purchase)
export function upgradeToPro(): UserCreditsData {
  const current = getUserCredits();
  current.plan = "pro";
  saveUserCredits(current);
  return current;
}

