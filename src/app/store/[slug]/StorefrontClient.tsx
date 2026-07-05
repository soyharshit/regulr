'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Flame, Gift, Copy, Check, Minus, Plus, LogIn } from 'lucide-react';

interface Cafe {
  id: string;
  name: string;
  slug: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  isAvailable: boolean;
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
  rewardsAvailable: number;
  progressPercent: number;
  pointsToNextTier: number;
  nextTier: string;
}

interface ReferralSummary {
  referralCode: string | null;
  referredCount: number;
  pointsEarnedFromReferrals: number;
}

const TIER_STYLES: Record<string, string> = {
  BRONZE: 'bg-tier-bronze/10 text-tier-bronze',
  SILVER: 'bg-tier-silver/10 text-tier-silver',
  GOLD: 'bg-tier-gold/10 text-tier-gold',
  PLATINUM: 'bg-violet/10 text-violet',
};

function formatRupee(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    paise / 100
  );
}

export default function StorefrontClient({
  cafe,
  menuItems,
  loyalty,
  referral,
  isSignedIn,
  referrerBonus,
  referredBonus,
}: {
  cafe: Cafe;
  menuItems: MenuItem[];
  loyalty: Loyalty;
  referral: ReferralSummary;
  isSignedIn: boolean;
  referrerBonus: number;
  referredBonus: number;
}) {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(menuItems[0]?.category || '');
  const [copied, setCopied] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemMessage, setRedeemMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  const categories = useMemo(() => Array.from(new Set(menuItems.map((m) => m.category))), [menuItems]);

  const addToCart = (menuItem: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((line) => line.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((line) =>
          line.menuItem.id === menuItem.id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  };

  const changeQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((line) => (line.menuItem.id === menuItemId ? { ...line, quantity: line.quantity + delta } : line))
        .filter((line) => line.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((sum, line) => sum + line.menuItem.price * line.quantity, 0);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const quantityFor = (id: string) => cart.find((line) => line.menuItem.id === id)?.quantity || 0;

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
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: cafe.slug, code: redeemCode }),
      });
      const data = await res.json();
      setRedeemMessage({ text: data.message || data.error || 'Something went wrong', ok: res.ok });
      if (res.ok) setRedeemCode('');
    } catch {
      setRedeemMessage({ text: 'Network error, try again.', ok: false });
    } finally {
      setRedeeming(false);
    }
  };

  const goToCheckout = () => {
    localStorage.setItem(`cart_${cafe.id}`, JSON.stringify(cart));
    router.push(`/store/${cafe.slug}/checkout`);
  };

  return (
    <div className="min-h-screen bg-bg-subtle flex flex-col">
      {/* Cover */}
      <div className="relative w-full h-[160px] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(145deg, #2D1810 0%, #4A2C23 25%, #3E2118 50%, #5C3A2E 75%, #2D1810 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 30% 40%, rgba(255,180,100,0.25) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(200,120,60,0.15) 0%, transparent 50%)',
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-bg-subtle to-transparent" />
      </div>

      <div className="max-w-md w-full mx-auto px-4 -mt-14 relative z-10 pb-32">
        {/* Cafe identity card */}
        <div className="bg-white rounded-card shadow-card p-5">
          <div className="flex items-start gap-4">
            <div
              className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-white font-display font-bold text-lg"
              style={{ background: 'linear-gradient(135deg, #4A2C23 0%, #6B4535 100%)' }}
            >
              {cafe.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-bold text-xl text-ink leading-tight truncate">{cafe.name}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="status-dot status-dot--open" />
                <span className="text-sm text-ink-2">Open now</span>
              </div>
              <div className="pill bg-teal-soft text-teal text-xs !py-1 !px-2.5 font-semibold mt-2 inline-flex">
                Direct prices — no commission markup
              </div>
            </div>
          </div>
        </div>

        {/* Loyalty */}
        <div className="rounded-card bg-white shadow-card p-4 mt-3">
          {loyalty.isGuest ? (
            <a
              href={`/auth/signin?next=${encodeURIComponent(`/store/${cafe.slug}`)}`}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-control bg-primary-soft flex items-center justify-center">
                  <LogIn size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Sign in to earn rewards</p>
                  <p className="text-xs text-ink-3">Points, streaks, and referral bonuses</p>
                </div>
              </div>
            </a>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-amber" />
                  <span className="text-sm font-medium text-ink">{loyalty.streakCount} day streak</span>
                </div>
                <span className={`px-2 py-0.5 rounded-pill text-[11px] font-semibold ${TIER_STYLES[loyalty.tier] || TIER_STYLES.BRONZE}`}>
                  {loyalty.tier}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-bg-hover overflow-hidden">
                <div
                  className="h-full rounded-full gradient-coral transition-all duration-500"
                  style={{ width: `${loyalty.progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-ink-3">
                <span>{loyalty.points} pts · {loyalty.rewardsAvailable} rewards available</span>
                {loyalty.pointsToNextTier > 0 && <span>{loyalty.pointsToNextTier} pts to {loyalty.nextTier}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Referral */}
        {isSignedIn && (
          <div className="rounded-card bg-white shadow-card p-4 mt-3 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-control bg-violet/10 flex items-center justify-center">
                <Gift size={16} className="text-violet" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Refer & earn</p>
                <p className="text-xs text-ink-3">
                  You get {referrerBonus} pts, your friend gets {referredBonus} pts
                </p>
              </div>
            </div>
            {referral.referralCode && (
              <button
                type="button"
                onClick={copyCode}
                className="w-full flex items-center justify-between px-3 py-2 rounded-control bg-bg-subtle border border-border font-mono text-sm text-ink"
              >
                {referral.referralCode}
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} className="text-ink-3" />}
              </button>
            )}
            <p className="text-xs text-ink-3">
              {referral.referredCount} friends referred · {referral.pointsEarnedFromReferrals} pts earned
            </p>
            <div className="flex items-center gap-2 pt-1 border-t border-border">
              <input
                type="text"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value)}
                placeholder="Have a friend's code?"
                className="flex-1 min-w-0 px-3 py-2 rounded-control border border-border text-sm font-mono uppercase"
              />
              <button
                type="button"
                onClick={redeemReferral}
                disabled={redeeming}
                className="px-3 py-2 rounded-control bg-ink text-white text-sm font-semibold disabled:opacity-50"
              >
                Apply
              </button>
            </div>
            {redeemMessage && (
              <p className={`text-xs font-medium ${redeemMessage.ok ? 'text-success' : 'text-error'}`}>
                {redeemMessage.text}
              </p>
            )}
          </div>
        )}

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto mt-5 mb-3 pb-1 -mx-1 px-1">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-pill text-sm font-medium whitespace-nowrap transition-colors capitalize ${
                activeCategory === category ? 'bg-ink text-white' : 'bg-white text-ink-2 border border-border'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu items */}
        <div className="space-y-3">
          {menuItems
            .filter((item) => item.category === activeCategory)
            .map((item) => {
              const qty = quantityFor(item.id);
              return (
                <div key={item.id} className="bg-white rounded-card shadow-card p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-ink text-sm">{item.name}</h3>
                    {item.description && (
                      <p className="text-ink-3 text-xs mt-0.5 line-clamp-2">{item.description}</p>
                    )}
                    <p className="text-ink font-semibold text-sm mt-1.5">{formatRupee(item.price)}</p>
                  </div>
                  {qty === 0 ? (
                    <button
                      type="button"
                      onClick={() => addToCart(item)}
                      disabled={!item.isAvailable}
                      className="shrink-0 px-4 py-2 rounded-control bg-primary-soft text-primary font-semibold text-sm hover:bg-primary hover:text-white transition-colors disabled:opacity-40"
                    >
                      {item.isAvailable ? 'Add' : 'Sold out'}
                    </button>
                  ) : (
                    <div className="shrink-0 flex items-center gap-1 bg-primary rounded-control px-1">
                      <button
                        type="button"
                        onClick={() => changeQuantity(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center text-white"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-white text-sm font-semibold w-4 text-center">{qty}</span>
                      <button
                        type="button"
                        onClick={() => addToCart(item)}
                        className="w-8 h-8 flex items-center justify-center text-white"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Sticky cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border shadow-pop flex justify-center z-50">
          <div className="max-w-md w-full flex justify-between items-center">
            <div>
              <p className="text-xs text-ink-3">{cartCount} items</p>
              <p className="font-bold text-lg text-ink">{formatRupee(cartTotal)}</p>
            </div>
            <button
              type="button"
              onClick={goToCheckout}
              className="gradient-coral text-white font-semibold py-3 px-6 rounded-control flex items-center gap-2 press-scale"
            >
              <ShoppingCart size={18} />
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
