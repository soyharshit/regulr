"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StoreSkeleton } from "@/components/store/StoreSkeleton";
import { OrderTracker } from "@/components/store/OrderTracker";
import { RewardScreen } from "@/components/store/RewardScreen";

function formatPaise(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(amount / 100));
}

function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function fallbackGradient(id: string): string {
  const gradients = [
    "linear-gradient(135deg, #D4A574 0%, #8B6F4E 50%, #C4956A 100%)",
    "linear-gradient(135deg, #2C1810 0%, #4A2C1A 50%, #1A0E08 100%)",
    "linear-gradient(135deg, #7DB87A 0%, #4A7A47 50%, #9BC89A 100%)",
    "linear-gradient(135deg, #E8A530 0%, #C4872A 50%, #F0C060 100%)",
    "linear-gradient(135deg, #6B5B95 0%, #4A3D6E 50%, #9B8EC4 100%)",
  ];

  const hash = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

interface Cafe {
  id: string;
  slug: string;
  name: string;
}

interface ApiMenuItem {
  id: string;
  cafeId: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
  description: string | null;
  imageUrl: string | null;
}

interface MenuItem extends ApiMenuItem {
  categoryLabel: string;
  marketplacePrice: number;
  isVeg: boolean;
  gradient: string;
}

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

function VegMark({ isVeg }: { isVeg: boolean }) {
  return <div className={isVeg ? "veg-mark" : "nonveg-mark"} />;
}

interface LoyaltyData {
  streakCount: number;
  points: number;
  tier: string;
  rewardsAvailable: number;
  progressPercent: number;
  pointsToNextTier: number;
  nextTier: string;
}

function tierClass(tier: string): string {
  const map: Record<string, string> = {
    BRONZE: "text-tier-bronze",
    SILVER: "text-tier-silver",
    GOLD: "text-tier-gold",
    PLATINUM: "text-tier-platinum",
  };
  return map[tier] ?? "text-tier-bronze";
}

function LoyaltyStrip({ slug }: { slug: string }) {
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);

  useEffect(() => {
    fetch(`/api/customer/loyalty?slug=${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setLoyalty(data))
      .catch(() => undefined);
  }, [slug]);

  if (!loyalty) {
    return (
      <div className="px-4 mt-4">
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton flex-shrink-0 h-[72px] w-[140px] rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 mt-4" data-testid="loyalty-strip">
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        <div className="flex-shrink-0 bg-white rounded-card shadow-card px-4 py-3 flex items-center gap-2.5 min-w-[120px]">
          <div className="w-8 h-8 rounded-full bg-amber-soft text-amber flex items-center justify-center text-sm font-bold">
            {loyalty.streakCount}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink tabular-nums">{loyalty.streakCount} days</p>
            <p className="text-xs text-ink-3">Streak</p>
          </div>
        </div>

        <div className="flex-shrink-0 bg-white rounded-card shadow-card px-4 py-3 min-w-[180px]">
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-semibold ${tierClass(loyalty.tier)}`}>
              {titleCase(loyalty.tier)}
            </span>
            <span className="text-xs text-ink-3 tabular-nums">
              {loyalty.pointsToNextTier} pts to {titleCase(loyalty.nextTier)}
            </span>
          </div>
          <div className="tier-progress">
            <div
              className="tier-progress__fill"
              style={{
                width: `${loyalty.progressPercent}%`,
                background: "linear-gradient(90deg, #8E9BAE 0%, #E6A817 100%)",
              }}
            />
          </div>
        </div>

        <div className="flex-shrink-0 bg-white rounded-card shadow-card px-4 py-3 flex items-center gap-2.5 min-w-[130px]">
          <div className="w-8 h-8 rounded-full bg-violet-soft text-violet flex items-center justify-center text-sm font-bold">
            {loyalty.rewardsAvailable}
          </div>
          <div>
            <p className="text-sm font-semibold text-violet tabular-nums">
              {loyalty.rewardsAvailable} rewards
            </p>
            <p className="text-xs text-ink-3">{loyalty.points} pts total</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlashOfferBanner() {
  const [timeLeft, setTimeLeft] = useState({ h: 1, m: 42, s: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { h, m, s } = prev;
        s -= 1;
        if (s < 0) {
          s = 59;
          m -= 1;
        }
        if (m < 0) {
          m = 59;
          h -= 1;
        }
        if (h < 0) return { h: 0, m: 0, s: 0 };
        return { h, m, s };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="px-4 mt-4">
      <div
        className="rounded-card p-4 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #FFB020 0%, #FF9500 50%, #FFB020 100%)",
        }}
      >
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-2 w-16 h-16 rounded-full bg-white/10" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-sm font-bold text-white/90 uppercase tracking-wide">Happy Hour</p>
            </div>
            <p className="text-lg font-display font-bold text-white">15% off everything</p>
          </div>

          <div className="flex items-center gap-1 tabular-nums">
            {[
              { val: pad(timeLeft.h), label: "h" },
              { val: pad(timeLeft.m), label: "m" },
              { val: pad(timeLeft.s), label: "s" },
            ].map((unit, i) => (
              <div key={unit.label} className="flex items-center gap-1">
                {i > 0 && <span className="text-white/60 font-bold text-sm">:</span>}
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1.5 min-w-[36px] text-center">
                  <p className="text-white font-bold text-sm leading-none">{unit.val}</p>
                  <p className="text-white/60 text-[9px] uppercase mt-0.5">{unit.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryPills({
  categories,
  activeCategory,
  onSelect,
}: {
  categories: string[];
  activeCategory: string;
  onSelect: (cat: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="sticky top-0 z-30 bg-bg-subtle/95 backdrop-blur-sm border-b border-border/50">
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide py-3 px-4">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className={`
                flex-shrink-0 px-4 py-2 rounded-pill text-sm font-medium
                transition-all duration-150 ease-out min-h-[36px]
                ${
                  isActive
                    ? "bg-ink text-white shadow-sm"
                    : "bg-white text-ink-2 border border-border hover:border-ink/20"
                }
              `}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MenuItemCard({
  item,
  cartQty,
  onAdd,
  onRemove,
}: {
  item: MenuItem;
  cartQty: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const savings = item.marketplacePrice - item.price;

  return (
    <div className="bg-white rounded-card shadow-card p-4 flex gap-3 animate-fade-in" data-testid="menu-item">
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-1.5 mb-1.5">
          <VegMark isVeg={item.isVeg} />
          <span className="text-[10px] font-bold text-amber bg-amber-soft px-1.5 py-0.5 rounded uppercase tracking-wider">
            Direct price
          </span>
        </div>

        <h3 className="text-base font-semibold text-ink leading-snug">{item.name}</h3>
        <p className="text-xs text-ink-3 mt-0.5 line-clamp-2 leading-relaxed">
          {item.description || "Freshly prepared by the cafe."}
        </p>

        <div className="mt-auto pt-2.5 flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
          <span className="text-base font-bold text-ink tabular-nums">{formatPaise(item.price)}</span>
          <span className="text-xs text-ink-3 line-through tabular-nums">
            {formatPaise(item.marketplacePrice)} on apps
          </span>
        </div>
        <div className="mt-1">
          <span className="inline-flex items-center text-[11px] font-semibold text-teal bg-teal-soft px-2 py-0.5 rounded-pill">
            Save {formatPaise(savings)}
          </span>
        </div>
      </div>

      <div className="flex-shrink-0 flex flex-col items-center w-[88px]">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-[88px] h-[88px] rounded-control object-cover"
          />
        ) : (
          <div className="w-[88px] h-[88px] rounded-control overflow-hidden" style={{ background: item.gradient }}>
            <div className="w-full h-full bg-gradient-to-t from-black/10 to-transparent" />
          </div>
        )}

        <div className="-mt-4 relative z-10">
          {cartQty === 0 ? (
            <button
              onClick={onAdd}
              className="
                bg-white border-2 border-primary text-primary font-bold text-sm
                px-5 py-1.5 rounded-control shadow-sm
                hover:bg-primary hover:text-white active:scale-95
                transition-all duration-150 ease-out min-h-[36px] min-w-[80px]
              "
              data-testid="add-item-btn"
            >
              ADD
            </button>
          ) : (
            <div className="flex items-center bg-primary rounded-control shadow-sm overflow-hidden min-h-[36px]">
              <button
                onClick={onRemove}
                className="text-white font-bold px-3 py-1.5 hover:bg-primary-hover active:scale-95 transition-all duration-100 min-w-[36px]"
                aria-label={`Remove ${item.name}`}
              >
                -
              </button>
              <span className="text-white font-bold text-sm px-1 min-w-[24px] text-center tabular-nums">
                {cartQty}
              </span>
              <button
                onClick={onAdd}
                className="text-white font-bold px-3 py-1.5 hover:bg-primary-hover active:scale-95 transition-all duration-100 min-w-[36px]"
                aria-label={`Add another ${item.name}`}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckoutPanel({
  isOpen,
  totalItems,
  totalPrice,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  totalItems: number;
  totalPrice: number;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (paymentMethod: string) => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/35" role="dialog" aria-modal="true">
      <div className="w-full rounded-t-card bg-white p-5 shadow-pop">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-lg text-ink">Checkout</h2>
            <p className="text-sm text-ink-3 mt-1">
              {totalItems} {totalItems === 1 ? "item" : "items"} ready for direct ordering.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-control bg-bg-subtle text-ink-2 hover:bg-bg-hover"
            aria-label="Close checkout"
          >
            x
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {["UPI", "CASH", "RAZORPAY"].map((method) => (
            <label
              key={method}
              className={`flex items-center justify-between rounded-control border px-4 py-3 text-sm font-semibold ${
                paymentMethod === method ? "border-primary bg-primary-soft text-primary" : "border-border text-ink"
              }`}
            >
              <span>
                {method === "UPI"
                  ? "Pay by UPI at counter"
                  : method === "RAZORPAY"
                    ? "Pay online (Razorpay mock)"
                    : "Pay cash at counter"}
              </span>
              <input
                type="radio"
                name="paymentMethod"
                value={method}
                checked={paymentMethod === method}
                onChange={() => setPaymentMethod(method)}
                data-testid={`payment-${method.toLowerCase()}`}
              />
            </label>
          ))}
        </div>

        {error && <p className="mt-4 text-sm font-medium text-error">{error}</p>}

        <button
          type="button"
          onClick={() => onSubmit(paymentMethod)}
          disabled={isSubmitting}
          className="mt-5 w-full gradient-coral rounded-card shadow-pop px-5 py-4 flex items-center justify-between min-h-[56px] disabled:opacity-70"
          data-testid="submit-checkout"
        >
          <span className="text-white font-semibold">{isSubmitting ? "Placing order..." : "Place order"}</span>
          <span className="text-white font-bold text-base tabular-nums">{formatPaise(totalPrice)}</span>
        </button>
      </div>
    </div>
  );
}

function CartBar({
  totalItems,
  totalPrice,
  onOpenCheckout,
}: {
  totalItems: number;
  totalPrice: number;
  onOpenCheckout: () => void;
}) {
  if (totalItems === 0) return null;

  return (
    <div className="sticky-bottom-bar animate-slide-up" data-testid="sticky-cart-bar">
      <div className="mx-4 mb-4">
        <button
          onClick={onOpenCheckout}
          className="w-full gradient-coral rounded-card shadow-pop px-5 py-4 flex items-center justify-between press-scale min-h-[56px]"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-lg px-2.5 py-1">
              <span className="text-white font-bold text-sm tabular-nums" data-testid="cart-item-count">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </span>
            </div>
            <span className="text-white font-medium text-sm">Checkout</span>
          </div>
          <span className="text-white font-bold text-base tabular-nums">{formatPaise(totalPrice)}</span>
        </button>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mx-4 mt-6 rounded-card bg-white p-6 text-center shadow-card">
      <p className="text-sm font-semibold text-ink">{message}</p>
      <p className="mt-1 text-xs text-ink-3">Try another cafe link or check back shortly.</p>
    </div>
  );
}

export default function StorefrontPage({ params }: PageProps) {
  const { slug } = React.use(params);
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [cart, setCart] = useState<Map<string, number>>(() => new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [showReward, setShowReward] = useState(false);

  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    let isMounted = true;

    async function loadStorefront() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [cafeResponse, menuResponse] = await Promise.all([
          fetch(`/api/cafe?slug=${encodeURIComponent(slug)}`),
          fetch(`/api/menu?slug=${encodeURIComponent(slug)}`),
        ]);

        if (!cafeResponse.ok) {
          throw new Error("Cafe not found");
        }
        if (!menuResponse.ok) {
          throw new Error("Menu could not be loaded");
        }

        const cafeData = (await cafeResponse.json()) as Cafe;
        const menuData = (await menuResponse.json()) as ApiMenuItem[];
        const availableItems = menuData
          .filter((item) => item.isAvailable)
          .map((item) => ({
            ...item,
            categoryLabel: titleCase(item.category || "menu"),
            marketplacePrice: Math.round(item.price * 1.25),
            isVeg: !/chicken|fish|egg|mutton|prawn|meat/i.test(item.name),
            gradient: fallbackGradient(item.id),
          }));

        if (!isMounted) return;

        setCafe(cafeData);
        setMenuItems(availableItems);
        setActiveCategory(availableItems[0]?.categoryLabel || "");
      } catch (error) {
        if (!isMounted) return;
        setLoadError(error instanceof Error ? error.message : "Storefront could not be loaded");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadStorefront();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const categories = useMemo(
    () => Array.from(new Set(menuItems.map((item) => item.categoryLabel))),
    [menuItems]
  );

  const grouped = useMemo(
    () =>
      categories.reduce<Record<string, MenuItem[]>>((acc, cat) => {
        acc[cat] = menuItems.filter((item) => item.categoryLabel === cat);
        return acc;
      }, {}),
    [categories, menuItems]
  );

  const setSectionRef = useCallback(
    (category: string) => (el: HTMLDivElement | null) => {
      if (el) {
        sectionRefs.current.set(category, el);
      }
    },
    []
  );

  const handleCategorySelect = (cat: string) => {
    setActiveCategory(cat);
    const section = sectionRefs.current.get(cat);
    if (section) {
      const offset = 60;
      const y = section.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    categories.forEach((cat) => {
      const section = sectionRefs.current.get(cat);
      if (!section) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveCategory(cat);
            }
          });
        },
        { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
      );

      observer.observe(section);
      observers.push(observer);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, [categories]);

  const addToCart = (id: string) => {
    setCart((prev) => {
      const next = new Map(prev);
      next.set(id, (next.get(id) || 0) + 1);
      return next;
    });
    setConfirmedOrderId(null);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const next = new Map(prev);
      const qty = next.get(id) || 0;
      if (qty <= 1) {
        next.delete(id);
      } else {
        next.set(id, qty - 1);
      }
      return next;
    });
  };

  const totalItems = Array.from(cart.values()).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = Array.from(cart.entries()).reduce((sum, [id, qty]) => {
    const item = menuItems.find((menuItem) => menuItem.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const submitOrder = async (paymentMethod: string) => {
    if (!cafe || cart.size === 0) return;

    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cafeId: cafe.id,
          paymentMethod,
          items: Array.from(cart.entries()).map(([menuItemId, quantity]) => ({
            menuItemId,
            quantity,
          })),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Order could not be placed");
      }

      setConfirmedOrderId(result.id);
      setShowReward(true);
      setCart(new Map());
      setIsCheckoutOpen(false);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Order could not be placed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <StoreSkeleton />;
  }

  if (loadError) {
    return <EmptyState message={loadError} />;
  }

  if (!cafe || menuItems.length === 0) {
    return <EmptyState message="This cafe has not published a menu yet." />;
  }

  return (
    <>
      <LoyaltyStrip slug={slug} />
      <FlashOfferBanner />

      {confirmedOrderId && (
        <>
          <div className="mx-4 mt-4 rounded-card bg-success-soft p-4 text-success shadow-card">
            <p className="text-sm font-bold">Order placed</p>
            <p className="mt-1 text-xs font-medium">Show order #{confirmedOrderId.slice(0, 8)} at the counter.</p>
          </div>
          <OrderTracker orderId={confirmedOrderId} />
        </>
      )}

      {showReward && confirmedOrderId && cafe && (
        <RewardScreen
          orderId={confirmedOrderId}
          cafeId={cafe.id}
          onClose={() => setShowReward(false)}
        />
      )}

      <div className="mt-4">
        <CategoryPills categories={categories} activeCategory={activeCategory} onSelect={handleCategorySelect} />
      </div>

      <div className="px-4 pb-6">
        {categories.map((cat) => (
          <div key={cat} ref={setSectionRef(cat)} className="mt-5 first:mt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-lg text-ink">{cat}</h2>
              <span className="text-xs text-ink-3">{grouped[cat].length} items</span>
            </div>

            <div className="flex flex-col gap-3">
              {grouped[cat].map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  cartQty={cart.get(item.id) || 0}
                  onAdd={() => addToCart(item.id)}
                  onRemove={() => removeFromCart(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <CheckoutPanel
        isOpen={isCheckoutOpen}
        totalItems={totalItems}
        totalPrice={totalPrice}
        isSubmitting={isSubmitting}
        error={checkoutError}
        onClose={() => setIsCheckoutOpen(false)}
        onSubmit={submitOrder}
      />
      {!isCheckoutOpen && (
        <CartBar totalItems={totalItems} totalPrice={totalPrice} onOpenCheckout={() => setIsCheckoutOpen(true)} />
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
