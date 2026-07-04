import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regulr — Skip the Middleman. Own Your Customers.",
  description:
    "Regulr is the direct-ordering platform for cafes. Zero commissions, gamified loyalty, smart dashboard. Set up in 10 minutes and start owning your customer relationships.",
  keywords: [
    "cafe ordering system",
    "direct ordering platform",
    "cafe SaaS",
    "online ordering for cafes",
    "zero commission ordering",
    "cafe loyalty program",
    "restaurant ordering system",
    "cafe digital menu",
    "Regulr",
  ],
  authors: [{ name: "Regulr" }],
  openGraph: {
    title: "Regulr — Skip the Middleman. Own Your Customers.",
    description:
      "Zero commissions. Gamified loyalty. Smart dashboard. The direct-ordering platform built for modern cafes.",
    type: "website",
    siteName: "Regulr",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Regulr — Skip the Middleman. Own Your Customers.",
    description:
      "Zero commissions. Gamified loyalty. Smart dashboard. The direct-ordering platform built for modern cafes.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
