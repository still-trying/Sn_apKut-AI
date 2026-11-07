import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions — Sn_apKut AI" },
      {
        name: "description",
        content:
          "Terms and Conditions governing the use of Sn_apKut AI image background removal services, API, and subscriptions.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
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
            <Shield className="size-3.5 text-primary" /> Legal & Governance
          </Badge>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Terms and <span className="text-gradient">Conditions</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: {lastUpdated} · Operates under Indian Information Technology and Consumer Protection Laws.
          </p>
        </div>

        <div className="prose prose-invert mt-10 max-w-none space-y-8 text-foreground/90 leading-relaxed text-sm sm:text-base">
          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">1. Introduction & Acceptance of Terms</h2>
            <p>
              Welcome to <strong>Sn_apKut AI</strong> (&quot;Platform&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), operated by <strong>Sn_apKut AI Technologies</strong>. By accessing or using our website, web application, software tools, developer APIs, and related background removal services, you agree to be bound by these Terms and Conditions (&quot;Terms&quot;).
            </p>
            <p>
              If you do not agree with any part of these Terms, you must discontinue use of the Platform immediately. These Terms constitute a legally binding electronic agreement between you (&quot;User&quot; or &quot;Customer&quot;) and Sn_apKut AI Technologies.
            </p>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">2. Description of Services</h2>
            <p>
              Sn_apKut AI provides an artificial intelligence-driven automated image background removal platform. Our services include:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Web-based single and batch image background removal.</li>
              <li>High-resolution transparent PNG and formatted cutout generation.</li>
              <li>Developer REST API access for automated programmatic processing.</li>
              <li>Subscription plans (Pro) and pay-as-you-go credit bundles.</li>
            </ul>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">3. User Eligibility & Account Registration</h2>
            <p>
              You must be at least 18 years of age or possess legal parental/guardian consent to use the Platform. When registering an account or making payments, you agree to provide true, accurate, and current information. You are solely responsible for maintaining the confidentiality of your API keys and credentials.
            </p>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">4. Acceptable Use Policy</h2>
            <p>You agree NOT to use Sn_apKut AI to upload, process, or distribute:</p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Any content that infringes upon third-party intellectual property, trademarks, or copyrights.</li>
              <li>Pornographic, explicit, defamatory, violent, or unlawful imagery.</li>
              <li>Materials that violate Indian or international cyber laws, including malware or malicious payloads.</li>
              <li>Any automated scraping or reverse engineering of our machine learning models.</li>
            </ul>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">5. Intellectual Property & Ownership of Uploads</h2>
            <p>
              <strong>You retain 100% ownership</strong> of all original images you upload and all background-removed results generated through the Platform. Sn_apKut AI does NOT claim any copyright or proprietary interest in your content.
            </p>
            <p>
              All software, algorithms, user interfaces, branding, trademarks, logos, and website assets of Sn_apKut AI remain the exclusive intellectual property of Sn_apKut AI Technologies.
            </p>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">6. Pricing, Payments & Razorpay Integration</h2>
            <p>
              All fees for Pro subscriptions and Credit packs are displayed in Indian Rupees (INR / ₹) and are inclusive/exclusive of applicable taxes as indicated at checkout.
            </p>
            <p>
              Payments on Sn_apKut AI are processed securely through <strong>Razorpay</strong>, an RBI-authorized payment aggregator. We do not store your credit card, debit card, or UPI PIN credentials on our servers. By completing a transaction, you agree to Razorpay&apos;s terms and privacy policy.
            </p>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">7. Disclaimers & Limitation of Liability</h2>
            <p>
              The platform is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. While we strive for 99.9% uptime and state-of-the-art edge detection, Sn_apKut AI does not warrant that results will be entirely error-free or uninterrupted. In no event shall Sn_apKut AI Technologies be liable for any indirect, incidental, or consequential damages arising from the use of our services.
            </p>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">8. Governing Law & Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any legal disputes arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the competent courts in Hyderabad, Telangana, India.
            </p>
          </section>

          <section className="glass-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">9. Contact Information</h2>
            <p>For questions or notices regarding these Terms, contact us at:</p>
            <div className="rounded-lg bg-card/60 p-4 border border-border text-sm">
              <p><strong>Trade Name:</strong> Sn_apKut AI</p>
              <p><strong>Operating Entity:</strong> Sn_apKut AI Technologies</p>
              <p><strong>Email:</strong> support@snapkut.ai</p>
              <p><strong>Phone:</strong> +91 98765 43210</p>
              <p><strong>Address:</strong> Plot No. 42, Hitech City Main Road, Madhapur, Hyderabad, Telangana 500081, India</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

