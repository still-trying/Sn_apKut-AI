import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  ArrowLeft,
  Building,
  Send,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { submitContactInquiry } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Sn_apKut AI" },
      {
        name: "description",
        content:
          "Get in touch with Sn_apKut AI customer support, technical assistance, business inquiries, and billing help. Phone, email, and office address.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "billing",
    message: "",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await submitContactInquiry(formData);
      if (res.success && res.ticketId) {
        setTicketId(res.ticketId);
        setSubmitted(true);
        toast.success(`Support Ticket #${res.ticketId} created!`, {
          description: "Our engineering support team will respond within 24 business hours.",
        });
      } else {
        toast.error(res.error || "Failed to submit inquiry. Please try again or email support@snapkut.ai.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("An unexpected error occurred. Please contact support@snapkut.ai.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTicket = () => {
    if (ticketId) {
      navigator.clipboard.writeText(ticketId);
      setCopiedTicket(true);
      toast.success("Ticket ID copied to clipboard!");
      setTimeout(() => setCopiedTicket(false), 2000);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-5xl px-5 py-16">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" /> Back to Home
          </Link>
        </div>

        <div className="border-b border-border pb-8 text-center sm:text-left">
          <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
            <HelpCircle className="size-3.5 text-primary" /> Customer Support & Corporate Office
          </Badge>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Contact <span className="text-gradient">Sn_apKut AI</span>
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-2xl">
            Have questions about your subscription, API integration, billing, or enterprise custom volumes? We are here to help.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          {/* Left Column: Official Contact & Entity Details */}
          <div className="space-y-6 lg:col-span-2">
            <div className="glass-card p-6 space-y-6">
              <h2 className="text-lg font-bold text-foreground">Official Business Details</h2>

              <div className="flex items-start gap-3">
                <Building className="mt-1 size-5 text-primary shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-foreground">Trade Name</p>
                  <p className="text-muted-foreground">Sn_apKut AI</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Operated by Sn_apKut AI Technologies</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-1 size-5 text-primary shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-foreground">Operating & Registered Address</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Plot No. 42, Hitech City Main Road, Madhapur, Hyderabad, Telangana 500081, India
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-1 size-5 text-primary shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-foreground">Customer Support Phone</p>
                  <a
                    href="tel:+919876543210"
                    className="text-primary hover:underline font-medium"
                  >
                    +91 98765 43210
                  </a>
                  <p className="text-xs text-muted-foreground mt-0.5">Toll-free / WhatsApp available</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-1 size-5 text-primary shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-foreground">Official Email Support</p>
                  <a
                    href="mailto:support@snapkut.ai"
                    className="text-primary hover:underline font-medium"
                  >
                    support@snapkut.ai
                  </a>
                  <p className="text-xs text-muted-foreground mt-0.5">Response SLA within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-1 size-5 text-primary shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-foreground">Operational Hours</p>
                  <p className="text-muted-foreground">Monday – Friday: 9:00 AM – 6:00 PM IST</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Emergency API monitors 24/7</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-5 text-xs text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground text-sm">Razorpay Payment Queries?</p>
              <p>
                If your query pertains to an existing Razorpay transaction, please include your 14-digit <strong>Razorpay Payment ID</strong> (e.g. <code>pay_XXXXXXXXXX</code>) found on your email receipt for instant lookup.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Contact Form */}
          <div className="lg:col-span-3">
            <div className="glass-card p-6 sm:p-8">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="size-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Inquiry Ticket Created!</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Thank you for contacting Sn_apKut AI. Your message has been securely recorded in our support vault. A representative will follow up at <strong>{formData.email}</strong> within 24 business hours.
                  </p>

                  {ticketId && (
                    <div className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-mono font-semibold text-primary mt-2">
                      <span>Ticket Reference: #{ticketId}</span>
                      <button
                        type="button"
                        onClick={handleCopyTicket}
                        className="p-1 text-primary hover:text-foreground transition-colors cursor-pointer"
                        title="Copy ticket reference ID"
                      >
                        {copiedTicket ? (
                          <Check className="size-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSubmitted(false);
                        setTicketId(null);
                        setFormData({
                          name: "",
                          email: "",
                          phone: "",
                          subject: "billing",
                          message: "",
                        });
                      }}
                      className="mt-2 text-xs"
                    >
                      Send another inquiry
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-xl font-bold text-foreground">Send Us a Direct Message</h2>
                  <p className="text-xs text-muted-foreground">
                    Fill out the form below and our team will get back to you promptly.
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-xs font-semibold text-foreground">
                        Your Full Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-xs font-semibold text-foreground">
                        Email Address <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        placeholder="you@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor="phone" className="text-xs font-semibold text-foreground">
                        Phone Number (Optional)
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="subject" className="text-xs font-semibold text-foreground">
                        Subject / Inquiry Category
                      </label>
                      <select
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="billing">Billing & Razorpay Payments</option>
                        <option value="api">Developer API & High Volume</option>
                        <option value="technical">Technical Support & Quality</option>
                        <option value="refund">Refund / Cancellation Request</option>
                        <option value="other">General Inquiry</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="message" className="text-xs font-semibold text-foreground">
                      Message / Transaction Details <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={4}
                      placeholder="Please share details of your query, including Razorpay Payment ID if applicable..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="bg-gradient-cta glow w-full border-0 font-semibold text-primary-foreground cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="size-4 animate-spin" /> Submitting ticket...
                      </span>
                    ) : (
                      <>
                        <Send className="size-4" /> Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

