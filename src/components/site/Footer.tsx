import { Link } from "@tanstack/react-router";
import logo from "@/assets/snapkut-logo.png.asset.json";
import { ShieldCheck, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/20">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand & Mission */}
        <div>
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src={logo.url}
              alt="Sn_apKut AI logo"
              className="h-8 w-8 rounded-lg object-contain bg-white/95 p-1 shadow-sm ring-1 ring-white/10"
            />
            <span className="font-bold tracking-tight text-base">
              Sn_apKut <span className="text-gradient">AI</span>
            </span>
          </Link>
          <p className="mt-3 max-w-xs text-xs text-muted-foreground leading-relaxed">
            Studio-quality automated AI background removal in under five seconds. Ephemeral cloud processing with 24-hour auto-purge.
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            <span>Secured via Razorpay Payment Gateway</span>
          </div>
        </div>

        {/* Product Navigation */}
        <div>
          <h3 className="text-sm font-semibold text-foreground">Product</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href="/#features" className="text-muted-foreground transition-colors hover:text-foreground">
                Features
              </a>
            </li>
            <li>
              <a href="/#how" className="text-muted-foreground transition-colors hover:text-foreground">
                How It Works
              </a>
            </li>
            <li>
              <a href="/#pricing" className="text-muted-foreground transition-colors hover:text-foreground">
                Pricing Plans
              </a>
            </li>
            <li>
              <a href="/#faq" className="text-muted-foreground transition-colors hover:text-foreground">
                FAQ
              </a>
            </li>
          </ul>
        </div>

        {/* Legal & Razorpay Compliance Policies */}
        <div>
          <h3 className="text-sm font-semibold text-foreground">Policies & Compliance</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/privacy-policy" className="text-muted-foreground transition-colors hover:text-foreground">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="text-muted-foreground transition-colors hover:text-foreground">
                Terms and Conditions
              </Link>
            </li>
            <li>
              <Link to="/refund-policy" className="text-muted-foreground transition-colors hover:text-foreground">
                Refund & Cancellation
              </Link>
            </li>
            <li>
              <Link to="/shipping-policy" className="text-muted-foreground transition-colors hover:text-foreground">
                Shipping & Delivery
              </Link>
            </li>
          </ul>
        </div>

        {/* Corporate & Support Contact */}
        <div>
          <h3 className="text-sm font-semibold text-foreground">Support & Contact</h3>
          <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
            <li>
              <Link to="/contact" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Contact Us & Support Form ➔
              </Link>
            </li>
            <li className="pt-1">
              <span className="font-semibold text-foreground">Trade Name:</span> Sn_apKut AI
            </li>
            <li>
              <span className="font-semibold text-foreground">Email:</span>{" "}
              <a href="mailto:support@snapkut.ai" className="hover:underline">
                support@snapkut.ai
              </a>
            </li>
            <li>
              <span className="font-semibold text-foreground">Phone:</span>{" "}
              <a href="tel:+919876543210" className="hover:underline">
                +91 98765 43210
              </a>
            </li>
            <li className="leading-relaxed">
              <span className="font-semibold text-foreground">Address:</span> Plot No. 42, Hitech City, Madhapur, Hyderabad, TS 500081, India
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Legal Copyright Bar */}
      <div className="border-t border-border/60 py-6 px-5 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Sn_apKut AI Technologies. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Lock className="size-3 text-muted-foreground" /> 256-Bit SSL Encrypted
            </span>
            <span>·</span>
            <span>PCI-DSS Level 1 Compliant via Razorpay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
