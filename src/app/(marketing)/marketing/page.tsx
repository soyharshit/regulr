"use client";

import { useEffect, useRef } from "react";
import {
  ShoppingBag,
  Trophy,
  BarChart3,
  ArrowRight,
  Star,
  Coffee,
  Zap,
  Shield,
  ChevronRight,
  Sparkles,
  Store,
  Heart,
} from "lucide-react";

/* ─── Intersection Observer hook for scroll animations ─── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    const targets = el.querySelectorAll(".reveal");
    targets.forEach((t) => observer.observe(t));

    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ─── Data ─── */
const features = [
  {
    icon: ShoppingBag,
    title: "Direct Orders",
    description:
      "Your own branded ordering page. Customers order straight from you — no middlemen, no commissions, no data leakage.",
    color: "bg-primary-soft text-primary",
    accent: "group-hover:shadow-glow",
  },
  {
    icon: Trophy,
    title: "Gamified Loyalty",
    description:
      "Bronze → Silver → Gold tiers with XP, streaks, and milestones. Turn one-time visitors into regulars who keep coming back.",
    color: "bg-violet-soft text-violet",
    accent: "group-hover:shadow-[0_0_24px_rgba(108,92,231,0.25)]",
  },
  {
    icon: BarChart3,
    title: "Smart Dashboard",
    description:
      "Real-time revenue, popular items, peak hours, and customer insights. Make data-driven decisions without a data team.",
    color: "bg-teal-soft text-teal",
    accent: "group-hover:shadow-[0_0_24px_rgba(0,196,167,0.25)]",
  },
];

const testimonials = [
  {
    name: "Priya Sharma",
    cafe: "Brew & Bloom, Koramangala",
    quote:
      "We ditched Swiggy and saved ₹47,000 in commissions last month alone. Our regulars love the loyalty points — repeat orders are up 3x.",
    avatar: "PS",
    rating: 5,
  },
  {
    name: "Arjun Mehta",
    cafe: "Third Wave Coffee, Indiranagar",
    quote:
      "Setup took 8 minutes. Not kidding. We had our first direct order within the hour. The dashboard is so clean my staff actually uses it.",
    avatar: "AM",
    rating: 5,
  },
  {
    name: "Sneha Iyer",
    cafe: "The Filter House, HSR Layout",
    quote:
      "The gamified loyalty is pure genius. Customers compete for Gold tier and bring their friends. Our community has never been stronger.",
    avatar: "SI",
    rating: 5,
  },
];

const stats = [
  { label: "₹0 commission", icon: Shield },
  { label: "3x repeat orders", icon: Heart },
  { label: "10-min setup", icon: Zap },
];

/* ─── Phone Mockup Component ─── */
function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[320px]">
      {/* Glow behind phone */}
      <div className="absolute -inset-8 rounded-full bg-primary/10 blur-3xl" />

      {/* Phone frame */}
      <div className="relative rounded-[32px] border-[3px] border-ink/10 bg-white p-2 shadow-pop">
        {/* Notch */}
        <div className="absolute left-1/2 top-2 h-[22px] w-[100px] -translate-x-1/2 rounded-b-2xl bg-ink/5" />

        {/* Screen */}
        <div className="overflow-hidden rounded-[26px] bg-gradient-to-br from-primary via-[#FF8566] to-amber">
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pb-1 pt-8">
            <span className="text-xs font-medium text-white/80">9:41</span>
            <div className="flex gap-1">
              <div className="h-2 w-2 rounded-full bg-white/60" />
              <div className="h-2 w-2 rounded-full bg-white/60" />
              <div className="h-2 w-2 rounded-full bg-white/60" />
            </div>
          </div>

          {/* App header */}
          <div className="px-5 pb-4 pt-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <Coffee className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Brew & Bloom</p>
                <div className="flex items-center gap-1">
                  <div className="status-dot status-dot--open !w-[6px] !h-[6px]" />
                  <p className="text-[10px] text-white/70">Open now</p>
                </div>
              </div>
            </div>
          </div>

          {/* Menu card */}
          <div className="mx-3 mb-3 rounded-2xl bg-white/95 p-4 backdrop-blur-sm shadow-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-ink/60 uppercase tracking-wider">
                Popular
              </p>
              <Sparkles className="h-3.5 w-3.5 text-amber" />
            </div>

            {/* Menu items */}
            {[
              { name: "Cortado", price: "₹180", tag: "Best seller" },
              { name: "Matcha Latte", price: "₹220", tag: null },
              { name: "Avocado Toast", price: "₹350", tag: "New" },
            ].map((item, i) => (
              <div
                key={i}
                className={`flex items-center justify-between py-2.5 ${
                  i < 2 ? "border-b border-ink/5" : ""
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-soft to-amber-soft" />
                  <div>
                    <p className="text-sm font-medium text-ink">{item.name}</p>
                    {item.tag && (
                      <span className="text-[9px] font-medium text-primary bg-primary-soft px-1.5 py-0.5 rounded-full">
                        {item.tag}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink tabular-nums">
                    {item.price}
                  </span>
                  <button className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-white text-xs font-bold">
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Loyalty badge */}
          <div className="mx-3 mb-4 rounded-2xl bg-white/95 p-3 backdrop-blur-sm shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber to-tier-gold">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-ink">
                  Gold Tier · 1,240 XP
                </p>
                <div className="tier-progress mt-1.5 !h-[5px]">
                  <div
                    className="tier-progress__fill bg-gradient-to-r from-amber to-tier-gold"
                    style={{ width: "78%" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom padding */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function MarketingPage() {
  const scrollRef = useScrollReveal();

  return (
    <div ref={scrollRef} className="min-h-screen overflow-hidden">
      {/* ─── Inline animation styles ─── */}
      <style jsx global>{`
        .reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }
        .reveal-delay-1 {
          transition-delay: 100ms;
        }
        .reveal-delay-2 {
          transition-delay: 200ms;
        }
        .reveal-delay-3 {
          transition-delay: 300ms;
        }
        .reveal-delay-4 {
          transition-delay: 400ms;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .float-animation {
          animation: float 5s ease-in-out infinite;
        }

        @keyframes gradient-shift {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .gradient-animate {
          background-size: 200% 200%;
          animation: gradient-shift 6s ease infinite;
        }
      `}</style>

      {/* ─── Navigation ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-control bg-primary">
              <Store className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-ink">
              Regulr
            </span>
          </div>
          <a
            href="/auth/signin"
            className="press-scale inline-flex h-10 items-center gap-1.5 rounded-pill bg-ink px-5 text-sm font-semibold text-white transition-all duration-150 hover:bg-ink/90 hover:shadow-pop"
          >
            Login
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </nav>

      // 哈什特·什里瓦斯塔夫
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
        {/* Background decorations */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-violet/[0.04] blur-3xl" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              {/* Pill badge */}
              <div className="reveal inline-flex items-center gap-2 rounded-pill border border-border bg-bg-subtle px-4 py-1.5 mb-6">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium text-ink-2">
                  Trusted by 200+ cafes across India
                </span>
              </div>

              {/* Headline */}
              <h1 className="reveal reveal-delay-1 font-display text-[40px] sm:text-[52px] lg:text-[60px] font-extrabold leading-[1.05] tracking-tight text-ink text-balance">
                Skip the middleman.{" "}
                <span className="bg-gradient-to-r from-primary to-[#E85D3A] bg-clip-text text-transparent">
                  Own your customers.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="reveal reveal-delay-2 mt-5 text-lg sm:text-xl text-ink-2 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Stop paying 25–30% commission to aggregators. Regulr gives your
                cafe its own ordering page with built-in loyalty — so your
                customers keep coming back to{" "}
                <span className="font-semibold text-ink">you</span>.
              </p>

              {/* CTA */}
              <div className="reveal reveal-delay-3 mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <a
                  href="/auth/signin"
                  className="press-scale inline-flex h-14 items-center justify-center gap-2 rounded-pill gradient-coral px-8 text-base font-bold text-white shadow-glow transition-all duration-150 hover:shadow-[0_0_32px_rgba(255,107,74,0.35)] hover:brightness-105"
                >
                  Get Regulr for your cafe
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#features"
                  className="press-scale inline-flex h-14 items-center justify-center gap-2 rounded-pill border-2 border-border px-6 text-base font-semibold text-ink transition-all duration-150 hover:border-ink/20 hover:bg-bg-subtle"
                >
                  See how it works
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>

              {/* Trust signal */}
              <div className="reveal reveal-delay-4 mt-8 flex items-center gap-3 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {["PS", "AM", "SI", "RK"].map((initials, i) => (
                    <div
                      key={i}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-primary-soft to-violet-soft text-[10px] font-bold text-ink/70"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-amber text-amber"
                    />
                  ))}
                </div>
                <span className="text-sm text-ink-2">
                  Loved by cafe owners
                </span>
              </div>
            </div>

            {/* Right: Phone Mockup */}
            <div className="reveal reveal-delay-2 flex justify-center lg:justify-end">
              <div className="float-animation">
                <PhoneMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="relative border-y border-border bg-bg-subtle">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
            {stats.map((stat, i) => (
              <div
                key={i}
                className={`reveal reveal-delay-${i + 1} flex items-center justify-center gap-3 py-6 sm:py-8`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-ink tracking-tight">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="reveal text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-primary-soft px-3.5 py-1 text-sm font-semibold text-primary mb-4">
              <Zap className="h-3.5 w-3.5" />
              Features
            </span>
            <h2 className="font-display text-3xl sm:text-[40px] font-extrabold tracking-tight text-ink leading-tight">
              Everything your cafe needs.{" "}
              <span className="text-ink-2">Nothing it doesn&apos;t.</span>
            </h2>
            <p className="mt-4 text-lg text-ink-2">
              Three powerful tools that work together to grow your direct
              business.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={i}
                className={`reveal reveal-delay-${i + 1} group relative overflow-hidden rounded-card border border-border bg-white p-6 sm:p-8 transition-all duration-300 hover:border-transparent hover:shadow-pop ${feature.accent}`}
              >
                {/* Subtle gradient top border on hover */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/0 to-transparent transition-all duration-300 group-hover:via-primary/60" />

                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} mb-5 transition-transform duration-300 group-hover:scale-110`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>

                <h3 className="font-display text-xl font-bold text-ink mb-2">
                  {feature.title}
                </h3>
                <p className="text-base text-ink-2 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Social Proof ─── */}
      <section className="py-20 sm:py-28 bg-bg-subtle">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="reveal text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-success-soft px-3.5 py-1 text-sm font-semibold text-success mb-4">
              <Heart className="h-3.5 w-3.5" />
              Loved by Cafes
            </span>
            <h2 className="font-display text-3xl sm:text-[40px] font-extrabold tracking-tight text-ink leading-tight">
              Don&apos;t just take our word for it.
            </h2>
            <p className="mt-4 text-lg text-ink-2">
              Hear from cafe owners who switched to Regulr and never looked
              back.
            </p>
          </div>

          {/* Testimonial cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={`reveal reveal-delay-${i + 1} relative rounded-card border border-border bg-white p-6 sm:p-8 transition-all duration-300 hover:shadow-pop hover:border-transparent`}
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star
                      key={j}
                      className="h-4 w-4 fill-amber text-amber"
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-base text-ink leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#E85D3A] text-sm font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{t.name}</p>
                    <p className="text-xs text-ink-2">{t.cafe}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Footer ─── */}
      <section
        id="get-started"
        className="relative py-20 sm:py-28 overflow-hidden"
      >
        {/* Background decorations */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-primary/[0.03] blur-3xl" />

        <div className="reveal mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-coral shadow-glow mb-6">
            <Coffee className="h-7 w-7 text-white" />
          </div>

          <h2 className="font-display text-3xl sm:text-[44px] font-extrabold tracking-tight text-ink leading-tight text-balance">
            Ready to go direct?
          </h2>
          <p className="mt-4 text-lg text-ink-2 max-w-lg mx-auto">
            Join 200+ cafes already saving on commissions and building loyal
            customer bases with Regulr.
          </p>

          {/* Login CTA */}
          <div className="mt-8 flex justify-center">
            <a
              href="/auth/signin"
              className="press-scale inline-flex h-14 items-center justify-center gap-2 rounded-pill gradient-coral px-8 text-base font-bold text-white shadow-glow transition-all duration-150 hover:shadow-[0_0_32px_rgba(255,107,74,0.35)] hover:brightness-105 whitespace-nowrap"
            >
              Get Started Free
            </a>
          </div>

          <p className="mt-4 text-sm text-ink-2/60">
            Free for your first 100 orders. No credit card required.
          </p>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary">
              <Store className="h-3 w-3 text-white" />
            </div>
            <span className="font-display text-base font-bold text-ink">
              Regulr
            </span>
          </div>
          <p className="text-sm text-ink-2">
            © 2026 Regulr. Built with{" "}
            <Heart className="inline h-3.5 w-3.5 text-primary fill-primary -mt-0.5" />{" "}
            for Indian cafes.
          </p>
        </div>
      </footer>
    </div>
  );
}
