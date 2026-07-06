"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  LogIn,
  Utensils,
  Receipt,
  Clock,
  RotateCcw,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StreakCalendar } from "@/components/StreakCalendar";
import { WhatsAppShare } from "@/components/store/WhatsAppShare";
import { BottomNav } from "@/components/store/BottomNav";
import { CartSlideover } from "@/components/store/CartSlideover";
import { MenuView } from "@/components/store/MenuView";
import { LoyaltyHub } from "@/components/store/LoyaltyHub";
import { AccountTab } from "@/components/store/AccountTab";
import { MenuCardSkeleton, OrderCardSkeleton } from "@/components/store/Skeletons";
import { getBrandStyles, getCoverStyle } from "@/lib/branding";

interface Cafe {
  id: string;
  name: string;
  slug: string;
  brandColor: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  zomatoPrice: number | null;
  category: string;
  isAvailable: boolean;
  imageUrl?: string | null;
}

interface CartLine {
  menuItem: MenuItem;
  quantity: number;
}

interface Loyalty {
  isGuest: boolean;
  points: number;
  tier: string;
  streakCount: number;
  streakCalendar: string;
  rewardsAvailable: number;
  progressPercent: number;
  pointsToNextTier: number;
  nextTier: string;
  milestones: number[];
}

interface ReferralSummary {
  referralCode: string | null;
  referredCount: number;
  pointsEarnedFromReferrals: number;
}

interface CustomerOrder {
  id: string;
  status: string;
  totalAmount: number;
  pointsEarned: number;
  tableNumber: number | null;
  createdAt: string;
  items: { menuItemId: string; name: string; price: number; quantity: number; available: boolean }[];
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-soft text-amber",
  PREPARING: "bg-amber-soft text-amber",
  READY: "bg-info-soft text-info",
  COMPLETED: "bg-success-soft text-success",
  CANCELLED: "bg-error-soft text-error",
};

function formatRupee(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export default function StorefrontClient({
  cafe,
  menuItems,
  loyalty,
  referral,
  isSignedIn,
  referrerBonus,
  referredBonus,
  tableNumber,
  gstRate,
}: {
  cafe: Cafe;
  menuItems: MenuItem[];
  loyalty: Loyalty;
  referral: ReferralSummary;
  isSignedIn: boolean;
  referrerBonus: number;
  referredBonus: number;
  tableNumber: number | null;
  gstRate: number;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"menu" | "orders" | "rewards" | "account">("menu");
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`cart_${cafe.id}`);
        return saved ? JSON.parse(saved) : [];
      } catch { return []; }
    }
    return [];
  });
  const [copied, setCopied] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemMessage, setRedeemMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [orders, setOrders] = useState<CustomerOrder[] | null>(null);
  const [menuLoading, setMenuLoading] = useState(true);

  const brandStyles = getBrandStyles(cafe.brandColor);
  const coverStyle = getCoverStyle(cafe.coverImageUrl, cafe.brandColor);

  useEffect(() => {
    if (tableNumber != null) {
      localStorage.setItem(`table_${cafe.id}`, String(tableNumber));
    }
  }, [tableNumber, cafe.id]);

  // Simulate menu loading for proper skeleton display
  useEffect(() => {
    const t = setTimeout(() => setMenuLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem(`cart_${cafe.id}`, JSON.stringify(cart));
  }, [cart, cafe.id]);

  // Fetch orders when tab changes to orders
  useEffect(() => {
    if (activeTab === "orders" && isSignedIn && orders === null) {
      fetch(`/api/customer/orders?slug=${encodeURIComponent(cafe.slug)}`)
        .then((r) => (r.ok ? r.json() : { orders: [] }))
        .then((d) => setOrders(d.orders || []))
        .catch(() => setOrders([]));
    }
  }, [activeTab, isSignedIn, cafe.slug, orders]);

  const addToCart = useCallback((menuItem: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((line) => line.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((line) =>
          line.menuItem.id === menuItem.id
            ? { ...line, quantity: line.quantity + 1 }
            : line
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  }, []);

  const changeQuantity = useCallback((menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((line) =>
          line.menuItem.id === menuItemId
            ? { ...line, quantity: line.quantity + delta }
            : line
        )
        .filter((line) => line.quantity > 0)
    );
  }, []);

  const cartTotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.menuItem.price * line.quantity, 0),
    [cart]
  );
  const cartCount = useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart]);
  const quantityFor = useCallback(
    (id: string) => cart.find((line) => line.menuItem.id === id)?.quantity || 0,
    [cart]
  );

  const copyCode = () => {
    if (!referral.referralCode) return;
    navigator.clipboard?.writeText(referral.referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const redeemReferral = async () => {
    if (!redeemCode.trim()) return;
    setRedeeming(true);
    setRedeemMessage(null);
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: cafe.slug, code: redeemCode }),
      });
      const data = await res.json();
      setRedeemMessage({
        text: data.message || data.error || "Something went wrong",
        ok: res.ok,
      });
      if (res.ok) setRedeemCode("");
    } catch {
      setRedeemMessage({ text: "Network error, try again.", ok: false });
    } finally {
      setRedeeming(false);
    }
  };

  const goToCheckout = () => {
    setCartOpen(false);
    router.push(`/store/${cafe.slug}/checkout?gstRate=${gstRate}`);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const res = await fetch("/api/auth/csrf");
      const { csrfToken } = await res.json();
      await fetch("/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `csrfToken=${encodeURIComponent(csrfToken)}`,
      });
    } catch { /* best effort */ }
    window.location.href = `/auth/signin?next=${encodeURIComponent(`/store/${cafe.slug}`)}`;
  };

  const reorder = (order: CustomerOrder) => {
    const cartItems: CartLine[] = order.items
      .filter((it) => it.available)
      .map((it) => {
        const full = menuItems.find((m) => m.id === it.menuItemId);
        return {
          menuItem: full ?? { id: it.menuItemId, name: it.name, description: null, price: it.price, zomatoPrice: null, category: "", isAvailable: true },
          quantity: it.quantity,
        };
      });
    if (cartItems.length === 0) return;
    localStorage.setItem(`cart_${cafe.id}`, JSON.stringify(cartItems));
    setCart(cartItems);
    setActiveTab("menu");
  };

  return (
    <div className="min-h-screen bg-bg-subtle flex flex-col" style={brandStyles}>
      {/* Cover */}
      <div className="relative w-full h-[140px] overflow-hidden shrink-0">
        <div className="absolute inset-0" style={coverStyle} />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 40%, rgba(255,180,100,0.25) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(200,120,60,0.15) 0%, transparent 50%)",
          }}
        />
        {/* Desktop-only sign out — removed per request */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-bg-subtle to-transparent" />
      </div>

      {/* Cafe identity bar */}
      <div className="max-w-md w-full mx-auto px-4 -mt-8 relative z-10 shrink-0">
        <div className="bg-white rounded-card shadow-card p-4 flex items-center gap-3">
          <div
            className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-display font-bold text-base"
            style={{ background: "linear-gradient(135deg, #4A2C23 0%, #6B4535 100%)" }}
          >
            {cafe.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h1 className="font-display font-bold text-lg text-ink leading-tight truncate">
                {cafe.name}
              </h1>
              <ThemeToggle />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_6px_rgba(0,200,117,0.5)]" />
              <span className="text-xs text-ink-2">Open now</span>
              <span className="text-[10px] text-ink-3 bg-bg-subtle px-2 py-0.5 rounded-pill">
                Direct prices
              </span>
              {tableNumber != null && (
                <span className="text-[10px] text-primary bg-primary-soft px-2 py-0.5 rounded-pill flex items-center gap-0.5">
                  <Utensils size={10} /> Table {tableNumber}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 max-w-md w-full mx-auto px-4 mt-3 overflow-hidden flex flex-col">
        {/* Menu tab */}
        {activeTab === "menu" && (
          <>
            {menuLoading ? (
              <MenuCardSkeleton />
            ) : (
              <MenuView
                menuItems={menuItems}
                quantityFor={quantityFor}
                onAdd={addToCart}
                onChangeQuantity={changeQuantity}
              />
            )}

            {/* Streak calendar (collapsed below menu when signed in) */}
            {isSignedIn && loyalty.streakCount > 0 && (
              <div className="mt-4 mb-4">
                <div className="rounded-card bg-white border border-border p-4">
                  <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide mb-2">
                    Visit streak
                  </p>
                  <StreakCalendar
                    streakCalendar={JSON.parse(loyalty.streakCalendar || "[]")}
                    streakCount={loyalty.streakCount}
                    milestones={loyalty.milestones}
                    compact
                  />
                </div>
              </div>
            )}

            {/* WhatsApp Share */}
            <div className="pb-4">
              <WhatsAppShare slug={cafe.slug} cafeName={cafe.name} variant="button" />
            </div>
          </>
        )}

        {/* Orders tab */}
        {activeTab === "orders" && (
          <div className="flex-1 overflow-y-auto pb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-lg text-ink">My orders</h2>
              {!isSignedIn && (
                <a
                  href={`/auth/signin?next=${encodeURIComponent(`/store/${cafe.slug}`)}`}
                  className="text-xs font-semibold text-primary"
                >
                  Sign in to view
                </a>
              )}
            </div>

            {!isSignedIn && (
              <div className="rounded-card bg-white border border-border p-6 text-center">
                <p className="text-sm text-ink-2">Sign in to view your orders.</p>
              </div>
            )}

            {isSignedIn && orders === null && <OrderCardSkeleton />}

            {isSignedIn && orders !== null && orders.length === 0 && (
              <div className="rounded-card bg-white border border-border p-6 text-center">
                <Receipt size={28} className="mx-auto text-ink-3 mb-2" />
                <p className="text-sm text-ink-2">No orders yet.</p>
                <a
                  href={`/store/${cafe.slug}`}
                  className="text-sm text-primary font-medium mt-1 inline-block"
                >
                  Browse the menu →
                </a>
              </div>
            )}

            {isSignedIn &&
              orders !== null &&
              orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-card bg-white border border-border p-4 mb-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink">
                      #{order.id.slice(0, 8)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-pill text-[11px] font-semibold ${
                        STATUS_STYLES[order.status] || "bg-bg-subtle text-ink-3"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-ink-3 mt-1 flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(order.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {order.tableNumber != null && <span>· Table {order.tableNumber}</span>}
                  </p>
                  <p className="text-sm text-ink mt-2 line-clamp-1">
                    {order.items.map((it) => `${it.quantity}× ${it.name}`).join(", ")}
                  </p>
                  <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-border">
                    <span className="text-sm font-bold text-ink">
                      {formatRupee(order.totalAmount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => reorder(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-primary-soft text-primary text-xs font-semibold hover:bg-primary hover:text-white transition-colors"
                    >
                      <RotateCcw size={13} /> Reorder
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Rewards tab */}
        {activeTab === "rewards" && (
          <div className="flex-1 overflow-y-auto pb-4">
            <LoyaltyHub
              loyalty={loyalty}
              referral={referral}
              isSignedIn={isSignedIn}
              referrerBonus={referrerBonus}
              referredBonus={referredBonus}
              cafeSlug={cafe.slug}
              onCopyCode={copyCode}
              copied={copied}
              redeemCode={redeemCode}
              onRedeemCodeChange={setRedeemCode}
              onRedeem={redeemReferral}
              redeeming={redeeming}
              redeemMessage={redeemMessage}
            />
          </div>
        )}

        {/* Account tab */}
        {activeTab === "account" && (
          <div className="flex-1 overflow-y-auto pb-4">
            {isSignedIn ? (
              <AccountTab
                cafeName={cafe.name}
                cafeSlug={cafe.slug}
                userName={null}
                userEmail=""
                signingOut={signingOut}
                onSignOut={handleSignOut}
              />
            ) : (
              <div className="rounded-card bg-white border border-border p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center mx-auto">
                  <LogIn size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-ink">Join to earn rewards</p>
                  <p className="text-xs text-ink-3 mt-0.5">
                    Points, streaks & referral bonuses
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <a
                    href={`/auth/signup?next=${encodeURIComponent(`/store/${cafe.slug}`)}`}
                    className="px-4 py-2 rounded-control bg-primary text-white text-xs font-semibold"
                  >
                    Sign up
                  </a>
                  <a
                    href={`/auth/signin?next=${encodeURIComponent(`/store/${cafe.slug}`)}`}
                    className="px-4 py-2 rounded-control border border-border text-ink-2 text-xs font-semibold"
                  >
                    Log in
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Checkout bar above bottom nav */}
      {cartCount > 0 && (
        <div className="fixed bottom-14 left-0 right-0 z-40">
          <div className="max-w-md mx-auto px-4 pb-2">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="w-full flex items-center justify-between bg-ink text-white rounded-card px-4 py-3 shadow-pop press-scale"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <ShoppingCart size={16} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">{cartCount} item{cartCount > 1 ? 's' : ''}</p>
                  <p className="text-xs text-white/70">{formatRupee(cartTotal)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                Proceed to checkout
                <span className="text-lg leading-none">→</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Cart slideover */}
      <CartSlideover
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        cartTotal={cartTotal}
        cartCount={cartCount}
        onChangeQuantity={changeQuantity}
        onCheckout={goToCheckout}
        gstRate={gstRate}
      />

      {/* Bottom navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cartCount={cartCount}
      />

      {/* Bottom spacer for nav bar */}
      <div className="h-14" />
    </div>
  );
}
