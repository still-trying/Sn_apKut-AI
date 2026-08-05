import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { UploadZone } from "@/components/site/UploadZone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Zap, ShieldCheck, Layers, Code2, Timer, Wand2, Check } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sn_apKut AI — AI Background Remover in One Click" },
      {
        name: "description",
        content:
          "Remove image backgrounds in under 5 seconds with Sn_apKut AI. Studio-quality transparent PNGs, a developer API, and 5 free cutouts every day.",
      },
      { property: "og:title", content: "Sn_apKut AI — AI Background Remover in One Click" },
      {
        property: "og:description",
        content:
          "Studio-quality transparent PNGs in seconds. Free daily credits, Pro unlimited plans, and a B2B API.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Zap,
    title: "Sub-5-second cutouts",
    body: "Edge-accelerated inference returns a clean alpha channel before you finish blinking.",
  },
  {
    icon: Wand2,
    title: "Hair & edge precision",
    body: "Fine strands, glass and soft shadows stay intact — no halos, no manual masking.",
  },
  {
    icon: Layers,
    title: "Batch-ready workspace",
    body: "Queue multiple product shots, review previews, and export transparent PNGs together.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    body: "Temporary storage only. Every upload and result is auto-deleted after 24 hours.",
  },
  {
    icon: Code2,
    title: "Developer API",
    body: "One REST endpoint, scoped API keys, usage metering and per-key rate limiting.",
  },
  {
    icon: Timer,
    title: "Usage you can see",
    body: "Live credit balance, quota, download history and invoices in one dashboard.",
  },
];

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    desc: "For trying it out.",
    items: ["5 images per day", "Standard resolution", "24h auto-delete", "Web workspace"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "₹799",
    period: "/month",
    desc: "For creators and stores.",
    items: [
      "Unlimited images",
      "Full resolution up to 5000×5000",
      "Priority processing queue",
      "Download history",
      "Email support",
    ],
    cta: "Go Pro",
    highlight: true,
  },
  {
    name: "Credit packs",
    price: "₹299",
    period: "/ 250 credits",
    desc: "Pay only when you need it.",
    items: ["Credits never expire", "Stackable with Free", "API access included", "Volume pricing"],
    cta: "Buy credits",
    highlight: false,
  },
];

const steps = [
  { n: "01", t: "Upload", d: "Drag in a JPG, PNG or WEBP up to 10 MB." },
  { n: "02", t: "Cut", d: "The model isolates the subject and builds a pixel-accurate alpha mask." },
  { n: "03", t: "Download", d: "Grab a transparent PNG, ready for any store or deck." },
];

const faqs = [
  {
    q: "How long are my images stored?",
    a: "Uploads and results live in temporary storage and are permanently deleted 24 hours after processing. Nothing is kept for training.",
  },
  {
    q: "What are the file limits?",
    a: "JPG, PNG and WEBP up to 10 MB and 5000×5000 pixels. Larger files are rejected in the browser before upload.",
  },
  {
    q: "Do credits roll over?",
    a: "Free plan credits reset daily. Purchased credit packs never expire, and Pro subscriptions are unlimited.",
  },
  {
    q: "Is there an API?",
    a: "Yes. Pro and credit-pack customers get scoped API keys with usage tracking and rate limiting for server-side batch jobs.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <Header />

      <main>
        <section className="aurora relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-5 pt-16 pb-20 text-center sm:pt-24">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
              <Sparkle /> One click. No background. Perfect.
            </Badge>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
              Erase any background in <span className="text-gradient">under five seconds</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Sn_apKut AI turns product shots, portraits and screenshots into studio-clean
              transparent PNGs — no editor, no masking, no waiting.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="bg-gradient-cta glow border-0 font-semibold">
                Remove a background free
              </Button>
              <Button size="lg" variant="outline">
                View API docs
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              5 free images daily · no credit card · auto-deleted in 24h
            </p>

            <div className="mt-14">
              <UploadZone />
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for volume, tuned for edges
          </h2>
          <p className="mt-3 max-w-lg text-muted-foreground">
            Everything a catalogue team needs, without a photo editor in sight.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="glass-card group p-6 transition-shadow hover:shadow-[var(--glow-primary)]"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/12 text-primary transition-colors group-hover:bg-primary/20">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="border-y border-border/60 bg-card/30">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Three steps, no skills</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n} className="relative pl-14">
                  <span className="text-gradient absolute top-0 left-0 text-3xl font-extrabold">
                    {s.n}
                  </span>
                  <h3 className="font-semibold">{s.t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-5 py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple pricing</h2>
            <p className="mt-3 text-muted-foreground">
              Start free. Upgrade when your catalogue grows.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={
                  p.highlight
                    ? "glass-card glow relative p-7 ring-1 ring-primary/40"
                    : "glass-card p-7"
                }
              >
                {p.highlight && (
                  <Badge className="bg-gradient-cta absolute -top-3 left-7 border-0 text-primary-foreground">
                    Most popular
                  </Badge>
                )}
                <h3 className="font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                <p className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.period}</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {p.items.map((i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{i}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={
                    p.highlight
                      ? "bg-gradient-cta glow mt-7 w-full border-0 font-semibold"
                      : "mt-7 w-full"
                  }
                  variant={p.highlight ? "default" : "secondary"}
                >
                  {p.cta}
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl px-5 pb-24">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Questions</h2>
          <Accordion type="single" collapsible className="mt-6">
            {faqs.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Sparkle() {
  return <Wand2 className="size-3.5 text-accent" />;
}
