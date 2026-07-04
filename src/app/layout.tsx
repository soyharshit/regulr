import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Regulr — Direct Ordering for Cafes",
  description: "Skip the marketplace. Order direct from your favourite cafe. Earn rewards, save money, support local.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FF6B4A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-ink bg-bg">
        {children}
      </body>
    </html>
  );
}
