import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Badge } from "@/components/ui/badge";
import { Lock, ArrowLeft, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Sn_apKut AI" },
      {
        name: "description",
        content:
          "Privacy Policy of Sn_apKut AI. Learn how we handle your image data with our 24-hour auto-deletion guarantee and secure Razorpay payment processing.",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
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
            <Lock className="size-3.5 text-primary" /> Data Privacy & Security
          </Badge>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Privacy <span className="text-gradient">Policy</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Effective date: {lastUpdated} · Compliant with the Digital Personal Data Protection Act (DPDP), 2023.
          </p>
        </div>

        <div className="prose prose-invert mt-10 max-w-none space-y-8 text-foreground/90 leading-relaxed text-sm sm:text-base">
          <section className="glass-card p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <ShieldCheck className="size-5" />
              <span>Our Core Privacy Pledge</span>
            </div>
            <p className="text-base sm:text-lg text-foreground font-medium">
              Sn_apKut AI is designed from the ground up to protect your creative and personal imagery. Your uploaded photos are processed strictly in ephemeral memory and permanently deleted within 24 hours. We never sell your data or use your personal images to train AI models.
            </p>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">1. Information We Collect</h2>
            <p>We collect only the minimal data necessary to deliver our background removal services:</p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>
                <strong>Uploaded Image Data:</strong> Image files (JPG, PNG, WEBP) submitted for background removal.
              </li>
              <li>
                <strong>Account & Contact Data:</strong> Name, email address, and phone number when you subscribe, purchase credit bundles, or contact customer support.
              </li>
              <li>
                <strong>Transaction Data:</strong> Payment order ID, transaction amount, and timestamp issued by Razorpay. We do NOT collect or store your raw card numbers, expiry dates, CVVs, or bank net-banking passwords.
              </li>
              <li>
                <strong>Technical Telemetry:</strong> Anonymized browser type, operating system, and IP address for rate-limiting, bot prevention, and system health monitoring.
              </li>
            </ul>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">2. Image Processing & 24-Hour Auto-Delete Policy</h2>
            <p>
              When you upload an image to Sn_apKut AI:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>The image is sent via encrypted TLS 1.3 connection to our high-performance inference servers.</li>
              <li>The alpha segmentation mask is generated in under 5 seconds.</li>
              <li>The processed output is made available for your download.</li>
              <li><strong>Auto-purge:</strong> All temporary image assets and cutouts are permanently deleted from server storage within 24 hours.</li>
              <li><strong>Zero Training:</strong> Your uploaded images are NEVER used to train, fine-tune, or retrain machine learning models.</li>
            </ul>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">3. Browser Local Storage</h2>
            <p>
              Sn_apKut AI features a local <strong>History</strong> tab for your convenience. This history is stored strictly on your own device inside your browser&apos;s <code>localStorage</code>. It allows you to access your previous cutouts even after refreshing the page. You can wipe your entire local history at any moment by clicking the &quot;Clear history&quot; button.
            </p>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">4. Payment Security & Third-Party Processors</h2>
            <p>
              All online payments on our website are facilitated through <strong>Razorpay Software Private Limited</strong>, an RBI-regulated and PCI-DSS Level 1 certified payment gateway.
            </p>
            <p>
              Your payment credentials are encrypted using industry-standard 256-bit SSL encryption and routed directly to Razorpay. Sn_apKut AI only receives verification confirmation of payment success or failure.
            </p>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">5. Your Data Protection Rights</h2>
            <p>Under applicable Indian and international data protection regulations, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Request access to personal information we hold about you.</li>
              <li>Request correction or deletion of your personal account records.</li>
              <li>Withdraw consent for marketing communications at any time.</li>
            </ul>
            <p>To exercise any of these rights, email us at <code>privacy@snapkut.ai</code> or <code>support@snapkut.ai</code>.</p>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">6. Grievance Redressal Officer</h2>
            <p>
              In accordance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, the details of our Grievance Officer are:
            </p>
            <div className="rounded-lg bg-card/60 p-4 border border-border text-sm">
              <p><strong>Name:</strong> Grievance Officer, Sn_apKut AI</p>
              <p><strong>Operating Entity:</strong> Sn_apKut AI Technologies</p>
              <p><strong>Email:</strong> grievance@snapkut.ai (or support@snapkut.ai)</p>
              <p><strong>Phone:</strong> +91 98765 43210</p>
              <p><strong>Address:</strong> Plot No. 42, Hitech City Main Road, Madhapur, Hyderabad, Telangana 500081, India</p>
              <p className="mt-2 text-xs text-muted-foreground">
                We acknowledge grievances within 24 hours and resolve inquiries within 15 business days.
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

