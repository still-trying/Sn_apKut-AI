import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ArrowLeft, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund and Cancellation Policy — Sn_apKut AI" },
      {
        name: "description",
        content:
          "Read Sn_apKut AI's transparent Refund and Cancellation Policy. Learn about subscription cancellations, credit pack refunds, and processing timelines.",
      },
    ],
  }),
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  const lastUpdated = "November 7, 2026";

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-4xl px-5 py-16">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" /> Back to Home
          </Link>
        </div>

        <div className="border-b border-border pb-8">
          <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
            <RefreshCw className="size-3.5 text-primary" /> Transparent Billing
          </Badge>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Refund & <span className="text-gradient">Cancellation Policy</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: {lastUpdated} · Governed by RBI Guidelines & Consumer Protection (E-Commerce) Rules, 2020.
          </p>
        </div>

        <div className="prose prose-invert mt-10 max-w-none space-y-8 text-foreground/90 leading-relaxed text-sm sm:text-base">
          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">1. Overview</h2>
            <p>
              At <strong>Sn_apKut AI</strong>, operated by <strong>Sn_apKut AI Technologies</strong>, customer satisfaction is our highest priority. We strive to provide fast, reliable, studio-quality AI background removal. Because our services involve cloud computing, GPU edge infrastructure, and immediate digital delivery, this Refund and Cancellation Policy outlines the exact terms under which cancellations and refunds are granted.
            </p>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">2. Subscription Cancellation Policy (Pro Plan)</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-1 size-5 shrink-0 text-primary" />
                <p>
                  <strong>Cancel Anytime:</strong> You may cancel your monthly Pro subscription (₹799/month) at any time through your account settings or by emailing our support team at <code>support@snapkut.ai</code>.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-1 size-5 shrink-0 text-primary" />
                <p>
                  <strong>No Hidden Cancellation Fees:</strong> There are zero cancellation charges or penalties for cancelling your subscription.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-1 size-5 shrink-0 text-primary" />
                <p>
                  <strong>Continued Access:</strong> Upon cancellation, you will retain full Pro benefits (unlimited high-resolution cutouts, priority processing, and API access) until the conclusion of your current paid billing period. No further charges will be billed.
                </p>
              </div>
            </div>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">3. Credit Packs Refund Policy</h2>
            <p>
              Credit packs (e.g. ₹299 for 250 credits) are non-expiring digital bundles that grant immediate server inference capacity.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>
                <strong>Unused Credits (7-Day Window):</strong> If you purchase a credit pack and have not used any credits from that pack, you are eligible for a 100% full refund within <strong>7 days</strong> of the transaction date.
              </li>
              <li>
                <strong>Partially Used Packs:</strong> Because GPU compute resources are consumed upon each cutout, credits that have already been spent to process images cannot be refunded.
              </li>
            </ul>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">4. System Failure & Quality Guarantee</h2>
            <p>
              If a system glitch, server error, or network failure on our end prevents the generation or delivery of your background-removed image, our system automatically restores the spent credit to your balance.
            </p>
            <p>
              If you experienced persistent technical issues that could not be resolved, please contact us with your image details and Razorpay Payment ID for a full refund or complimentary bonus credits.
            </p>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">5. Refund Processing Timelines & Mechanism</h2>
            <div className="flex items-start gap-3 rounded-lg bg-primary/10 p-4 border border-primary/20">
              <Clock className="mt-0.5 size-5 shrink-0 text-primary" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">Standard 5–7 Business Days Processing</p>
                <p className="text-muted-foreground mt-1">
                  Once a refund is approved by our billing team, it is initiated immediately through Razorpay. The funds will reflect in your original payment method (bank account, credit/debit card, or UPI VPA) within <strong>5 to 7 business days</strong>, depending on your bank&apos;s settlement schedule.
                </p>
              </div>
            </div>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">6. How to Request a Refund or Cancellation</h2>
            <p>To request a refund or cancellation, please email us with:</p>
            <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
              <li>Your registered email address or account ID.</li>
              <li>Razorpay Payment ID (e.g. <code>pay_XXXXXXXXXX</code>) from your payment receipt.</li>
              <li>A brief description of your reason for cancellation or refund.</li>
            </ol>
            <div className="mt-4 rounded-lg bg-card/60 p-4 border border-border text-sm">
              <p><strong>Support Email:</strong> support@snapkut.ai</p>
              <p><strong>Phone Support:</strong> +91 98765 43210 (Mon–Fri, 9:00 AM – 6:00 PM IST)</p>
              <p><strong>Operating Entity:</strong> Sn_apKut AI Technologies</p>
              <p><strong>Address:</strong> Plot No. 42, Hitech City Main Road, Madhapur, Hyderabad, Telangana 500081, India</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

