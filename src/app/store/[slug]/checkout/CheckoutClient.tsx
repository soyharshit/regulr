'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Tag, Sparkles, MessageSquare, Gift, User } from 'lucide-react';
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

const TIP_PRESETS = [0, 10, 20, 50];

function formatRupee(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    paise / 100
  );
}

export default function CheckoutClient({ cafe, gstRate }: { cafe: Cafe; gstRate: number }) {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [couponCode, setCouponCode] = useState('');
  const [availablePoints, setAvailablePoints] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [tipAmount, setTipAmount] = useState(0);
  const [tipPreset, setTipPreset] = useState<number | 'custom'>(0);
  const [customTip, setCustomTip] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const [giftItems, setGiftItems] = useState<Record<string, { recipientName: string; message: string }>>({});

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

  const preview = calculateOrderTotal({
    subtotal,
    loyaltyTierPointsApplied: pointsToRedeem,
    gstRate,
  });
  const tipInPaise = tipAmount * 100;
  const grandTotal = preview.grandTotal + tipInPaise;

  const handleTipPreset = (value: number | 'custom') => {
    setTipPreset(value);
    if (value === 'custom') {
      setCustomTip('');
      setTipAmount(0);
    } else {
      setTipAmount(value as number);
      setCustomTip('');
    }
  };

  const handleCustomTip = (val: string) => {
    const num = parseInt(val) || 0;
    setCustomTip(val);
    setTipAmount(num);
  };

  const toggleGift = (menuItemId: string) => {
    setGiftItems((prev) => {
      const copy = { ...prev };
      if (copy[menuItemId]) {
        delete copy[menuItemId];
      } else {
        copy[menuItemId] = { recipientName: '', message: '' };
      }
      return copy;
    });
  };

  const updateGift = (menuItemId: string, field: 'recipientName' | 'message', value: string) => {
    setGiftItems((prev) => ({
      ...prev,
      [menuItemId]: { ...prev[menuItemId], [field]: value },
    }));
  };

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
          tipAmount: tipInPaise || undefined,
          specialInstructions: specialInstructions.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Checkout failed');
        setLoading(false);
        return;
      }

      const giftEntries = Object.entries(giftItems).filter(
        ([, v]) => v.recipientName.trim().length > 0
      );

      if (giftEntries.length > 0) {
        try {
          await fetch('/api/gifts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: data.id,
              gifts: giftEntries.map(([menuItemId, g]) => ({
                menuItemId,
                recipientName: g.recipientName.trim(),
                message: g.message.trim() || undefined,
                quantity: cart.find((c) => c.menuItem.id === menuItemId)?.quantity || 1,
              })),
            }),
          });
        } catch { /* gift creation is best-effort */ }
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
    <div className="min-h-screen bg-bg-subtle flex flex-col items-center p-4 pb-24">
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

        {/* Order summary */}
        <div className="bg-white rounded-card shadow-card p-4 mb-4">
          <h2 className="font-semibold text-ink mb-3">Order summary</h2>
          <div className="space-y-3 mb-3">
            {cart.map((line) => {
              const isGift = !!giftItems[line.menuItem.id];
              return (
                <div key={line.menuItem.id} className={isGift ? 'rounded-control bg-primary-soft/40 -mx-1 px-2 py-2' : ''}>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-ink">
                      <span className="font-medium">{line.quantity}×</span> {line.menuItem.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {isGift && <Gift size={14} className="text-primary" />}
                      <span className="text-ink-2">{formatRupee(line.menuItem.price * line.quantity)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleGift(line.menuItem.id)}
                    className={`mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors rounded-pill px-2.5 py-1 ${
                      isGift
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-bg-subtle text-ink-3 border border-border hover:border-primary/40 hover:text-primary'
                    }`}
                  >
                    <Gift size={11} />
                    {isGift ? 'Make regular' : 'Send as gift'}
                  </button>
                  {isGift && (
                    <div className="mt-2.5 space-y-2">
                      <div className="flex items-center gap-2">
                        <User size={13} className="text-primary shrink-0" />
                        <input
                          type="text"
                          value={giftItems[line.menuItem.id].recipientName}
                          onChange={(e) => updateGift(line.menuItem.id, 'recipientName', e.target.value)}
                          placeholder="Recipient name *"
                          className="flex-1 text-xs px-2.5 py-1.5 rounded-control border border-primary/20 bg-white placeholder:text-ink-3"
                        />
                      </div>
                      <div className="flex items-start gap-2">
                        <MessageSquare size={13} className="text-ink-3 shrink-0 mt-1" />
                        <input
                          type="text"
                          value={giftItems[line.menuItem.id].message}
                          onChange={(e) => updateGift(line.menuItem.id, 'message', e.target.value)}
                          placeholder="Add a message (optional)"
                          className="flex-1 text-xs px-2.5 py-1.5 rounded-control border border-border bg-white placeholder:text-ink-3"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="border-t border-border pt-2.5 space-y-1.5 text-sm">
            <div className="flex justify-between text-ink-3">
              <span>Subtotal</span>
              <span>{formatRupee(preview.subtotal)}</span>
            </div>
            {Object.keys(giftItems).length > 0 && (
              <div className="flex justify-between text-primary text-xs font-medium">
                <span className="flex items-center gap-1"><Gift size={11} /> Gift items</span>
                <span>{Object.keys(giftItems).length} item{Object.keys(giftItems).length > 1 ? 's' : ''}</span>
              </div>
            )}
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
            {tipAmount > 0 && (
              <div className="flex justify-between text-primary font-medium">
                <span>Tip</span>
                <span>+{formatRupee(tipInPaise)}</span>
              </div>
            )}
          </div>
          <div className="border-t border-border mt-2.5 pt-2.5 flex justify-between items-center font-bold text-lg text-ink">
            <span>Total</span>
            <span>{formatRupee(grandTotal)}</span>
          </div>
        </div>

        {/* Tip */}
        <div className="bg-white rounded-card shadow-card p-4 mb-4">
          <h2 className="font-semibold text-ink mb-3">Add a tip</h2>
          <div className="flex gap-2 mb-2">
            {TIP_PRESETS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleTipPreset(amt)}
                className={`flex-1 py-2 rounded-control text-sm font-semibold transition-colors ${
                  tipPreset === amt
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-bg-hover text-ink-2 hover:bg-primary-soft hover:text-primary'
                }`}
              >
                {amt === 0 ? 'No tip' : `₹${amt}`}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleTipPreset('custom')}
              className={`flex-1 py-2 rounded-control text-sm font-semibold transition-colors ${
                tipPreset === 'custom'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-bg-hover text-ink-2 hover:bg-primary-soft hover:text-primary'
              }`}
            >
              Custom
            </button>
          </div>
          {tipPreset === 'custom' && (
            <input
              type="number"
              min="1"
              value={customTip}
              onChange={(e) => handleCustomTip(e.target.value)}
              placeholder="Enter amount (₹)"
              className="w-full px-3 py-2 rounded-control border border-border text-sm"
            />
          )}
        </div>

        {/* Special instructions */}
        <div className="bg-white rounded-card shadow-card p-4 mb-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-ink mb-2">
            <MessageSquare size={14} /> Special instructions
          </label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Any special requests? (e.g. extra napkins, no onions...)"
            rows={2}
            className="w-full px-3 py-2 rounded-control border border-border text-sm resize-none"
          />
        </div>

        {/* Points redemption */}
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

        {/* Coupon */}
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

        {/* Payment method */}
        <div className="bg-white rounded-card shadow-card p-4 mb-6">
          <h2 className="font-semibold text-ink mb-3">Payment method</h2>
          <div className="space-y-2">
            {[
              { value: 'CASH', label: 'Pay at counter (cash)' },
              { value: 'UPI', label: 'UPI' },
              { value: 'RAZORPAY', label: 'Credit/debit card' },
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
          {loading ? <Loader2 className="animate-spin" size={20} /> : `Place order • ${formatRupee(grandTotal)}`}
        </button>
      </div>
    </div>
  );
}
