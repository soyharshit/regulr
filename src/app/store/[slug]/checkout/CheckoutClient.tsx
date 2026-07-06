'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Tag, Sparkles } from 'lucide-react';
import { calculateOrderTotal } from '@/lib/pricing/pricingEngine';

interface Cafe {
  id: string;
  name: string;
  slug: string;
}

interface CartLine {
  menuItem: { id: string; name: string; price: number };
  quantity: number;
}

const GST_RATE = 0.05;

function formatRupee(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    paise / 100
  );
}

export default function CheckoutClient({ cafe }: { cafe: Cafe }) {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [couponCode, setCouponCode] = useState('');
  const [availablePoints, setAvailablePoints] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tableNumber, setTableNumber] = useState<number | null>(null);

  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${cafe.id}`);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      router.push(`/store/${cafe.slug}`);
    }
    const savedTable = localStorage.getItem(`table_${cafe.id}`);
    if (savedTable && /^\d+$/.test(savedTable)) setTableNumber(Number(savedTable));
  }, [cafe.id, cafe.slug, router]);

  useEffect(() => {
    fetch(`/api/customer/loyalty?slug=${encodeURIComponent(cafe.slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && !d.isGuest) setAvailablePoints(d.points);
      })
      .catch(() => {});
  }, [cafe.slug]);

  const subtotal = cart.reduce((sum, line) => sum + line.menuItem.price * line.quantity, 0);
  const pointsToRedeem = redeemPoints ? availablePoints : 0;

  // Local preview — the server recomputes authoritatively; coupon discount
  // isn't known until the server validates the code, so it previews as 0 here.
  const preview = calculateOrderTotal({
    subtotal,
    loyaltyTierPointsApplied: pointsToRedeem,
    gstRate: GST_RATE,
  });

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafeId: cafe.id,
          items: cart.map((line) => ({ menuItemId: line.menuItem.id, quantity: line.quantity })),
          paymentMethod,
          couponCode: couponCode.trim() || undefined,
          pointsToRedeem: pointsToRedeem || undefined,
          tableNumber: tableNumber ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Checkout failed');
        setLoading(false);
        return;
      }

      localStorage.removeItem(`cart_${cafe.id}`);
      localStorage.removeItem(`table_${cafe.id}`);
      router.push(`/store/${cafe.slug}/order/${data.id}`);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return <div className="min-h-screen flex items-center justify-center text-ink-3 text-sm">Loading cart…</div>;
  }

  return (
    <div className="min-h-screen bg-bg-subtle flex flex-col items-center p-4">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center text-ink-2 mb-6 mt-2 text-sm font-medium"
        >
          <ArrowLeft size={18} className="mr-1" /> Back to menu
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-ink">Checkout</h1>
          {tableNumber != null && (
            <span className="pill bg-primary-soft text-primary text-xs !py-1 !px-2.5 font-semibold">
              Table {tableNumber}
            </span>
          )}
        </div>

        <div className="bg-white rounded-card shadow-card p-4 mb-4">
          <h2 className="font-semibold text-ink mb-3">Order summary</h2>
          <div className="space-y-2 mb-3">
            {cart.map((line) => (
              <div key={line.menuItem.id} className="flex justify-between items-center text-sm">
                <span className="text-ink">
                  <span className="font-medium">{line.quantity}×</span> {line.menuItem.name}
                </span>
                <span className="text-ink-2">{formatRupee(line.menuItem.price * line.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-2.5 space-y-1.5 text-sm">
            <div className="flex justify-between text-ink-3">
              <span>Subtotal</span>
              <span>{formatRupee(preview.subtotal)}</span>
            </div>
            {preview.tierDiscount > 0 && (
              <div className="flex justify-between text-success">
                <span>Points redeemed</span>
                <span>-{formatRupee(preview.tierDiscount)}</span>
              </div>
            )}
            {couponCode && (
              <div className="flex justify-between text-ink-3">
                <span>Coupon "{couponCode.toUpperCase()}"</span>
                <span>applied at checkout</span>
              </div>
            )}
            <div className="flex justify-between text-ink-3">
              <span>Includes GST</span>
              <span>{formatRupee(preview.gstAmount)}</span>
            </div>
          </div>
          <div className="border-t border-border mt-2.5 pt-2.5 flex justify-between items-center font-bold text-lg text-ink">
            <span>Total</span>
            <span>{formatRupee(preview.grandTotal)}</span>
          </div>
        </div>

        {availablePoints > 0 && (
          <label className="flex items-center gap-3 bg-white rounded-card shadow-card p-4 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={redeemPoints}
              onChange={(e) => setRedeemPoints(e.target.checked)}
            />
            <Sparkles size={16} className="text-primary" />
            <span className="text-sm text-ink">
              Redeem {availablePoints} points (₹{(availablePoints * 10) / 100} off)
            </span>
          </label>
        )}

        <div className="bg-white rounded-card shadow-card p-4 mb-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-ink mb-2">
            <Tag size={14} /> Coupon code
          </label>
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="e.g. WELCOME10"
            className="w-full px-3 py-2 rounded-control border border-border text-sm font-mono uppercase"
          />
        </div>

        <div className="bg-white rounded-card shadow-card p-4 mb-6">
          <h2 className="font-semibold text-ink mb-3">Payment method</h2>
          <div className="space-y-2">
            {[
              { value: 'CASH', label: 'Pay at counter (cash)' },
              { value: 'UPI', label: 'UPI direct (mock)' },
              { value: 'RAZORPAY', label: 'Credit/debit card (mock)' },
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center p-3 rounded-control border border-border cursor-pointer hover:bg-bg-subtle text-sm text-ink"
              >
                <input
                  type="radio"
                  name="payment"
                  value={option.value}
                  checked={paymentMethod === option.value}
                  onChange={() => setPaymentMethod(option.value)}
                  className="mr-3"
                  data-testid={option.value === 'UPI' ? 'payment-upi' : undefined}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-error font-medium mb-3 text-center">{error}</p>}

        <button
          type="button"
          onClick={handleCheckout}
          disabled={loading}
          data-testid="submit-checkout"
          className="w-full gradient-coral text-white font-bold py-4 px-6 rounded-control transition flex justify-center items-center press-scale disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : `Place order • ${formatRupee(preview.grandTotal)}`}
        </button>
      </div>
    </div>
  );
}
