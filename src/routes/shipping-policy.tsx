import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, Zap, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/shipping-policy")({
  head: () => ({
    meta: [
      { title: "Shipping & Delivery Policy — Sn_apKut AI" },
      {
        name: "description",
        content:
          "Shipping and Delivery Policy for Sn_apKut AI. Learn about our instantaneous electronic digital delivery model for AI background removal credits and subscriptions.",
      },
    ],
  }),
  component: ShippingPolicyPage,
});

function ShippingPolicyPage() {
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
            <Send className="size-3.5 text-primary" /> Digital Fulfillment
          </Badge>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Shipping & <span className="text-gradient">Delivery Policy</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: {lastUpdated} · Electronic Software Delivery (SaaS)
          </p>
        </div>

        <div className="prose prose-invert mt-10 max-w-none space-y-8 text-foreground/90 leading-relaxed text-sm sm:text-base">
          <section className="glass-card p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Zap className="size-5" />
              <span>100% Digital Delivery Model</span>
            </div>
            <p className="text-base sm:text-lg text-foreground font-medium">
              Sn_apKut AI operates solely as an online Software-as-a-Service (SaaS) and artificial intelligence platform. We do not manufacture, package, ship, or deliver any physical goods or tangible merchandise.
            </p>
            <p>
              All purchases — including Pro monthly subscriptions, API access, and Credit bundles — are delivered <strong>electronically and instantaneously</strong> upon completion of payment via our payment gateway partner, Razorpay.
            </p>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">1. Delivery Timeframe & Fulfillment Process</h2>
            <p>
              Because our platform is automated, fulfillment occurs in real time:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>
                <strong>Instant Credit / Pro Activation:</strong> Once your payment is successfully authorized by Razorpay, your account is upgraded immediately or credits are added to your balance within <strong>1 to 60 seconds</strong>.
              </li>
              <li>
                <strong>Electronic Invoice & Receipt:</strong> A detailed tax invoice and Razorpay payment confirmation receipt containing your unique Transaction ID are sent automatically to your provided email address within 2 minutes.
              </li>
              <li>
                <strong>Cutout Delivery:</strong> When you submit photos for background removal, individual cutouts are rendered and delivered directly to your browser for immediate download in under <strong>5 seconds per image</strong>.
              </li>
            </ul>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">2. Shipping Charges & Customs Fees</h2>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-1 size-5 shrink-0 text-primary" />
              <p>
                <strong>Zero Shipping Fees:</strong> Since all services and cutouts are provided digitally via cloud servers, there are absolutely <strong>no shipping, postal, courier, or packaging fees</strong> associated with any transaction on Sn_apKut AI.
              </p>
            </div>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">3. What to Do in Case of Delivery Delays</h2>
            <p>
              In rare instances where a bank gateway delay or intermittent network interruption prevents automatic real-time crediting of your plan:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
              <li>Refresh your browser tab or log back into Sn_apKut AI.</li>
              <li>Check your email inbox (including spam/promotions folder) for the Razorpay confirmation receipt.</li>
              <li>
                If your credits or Pro features do not reflect within 15 minutes, please send your <strong>Razorpay Payment ID</strong> to our 24/7 technical team at <code>support@snapkut.ai</code> or call our helpline at <code>+91 98765 43210</code>.
              </li>
            </ol>
            <p>Our engineering support team will manually verify the payment record with Razorpay and credit your account within 1 hour.</p>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">4. Merchant Contact Details</h2>
            <div className="rounded-lg bg-card/60 p-4 border border-border text-sm">
              <p><strong>Trade Name:</strong> Sn_apKut AI</p>
              <p><strong>Legal Entity:</strong> Sn_apKut AI Technologies</p>
              <p><strong>Support Email:</strong> support@snapkut.ai</p>
              <p><strong>Contact Phone:</strong> +91 98765 43210</p>
              <p><strong>Operating Address:</strong> Plot No. 42, Hitech City Main Road, Madhapur, Hyderabad, Telangana 500081, India</p>
              <p><strong>Operating Hours:</strong> Monday – Friday, 9:00 AM – 6:00 PM IST</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
