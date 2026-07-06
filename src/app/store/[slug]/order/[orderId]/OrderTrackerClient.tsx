'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Check, Download, ArrowLeft, Clock, ChefHat, UtensilsCrossed, Gift, Share2 } from 'lucide-react';
import { SpinWheel } from '@/components/store/SpinWheel';
import { RedPacketRain } from '@/components/store/RedPacketRain';
import { WhatsAppShare } from '@/components/store/WhatsAppShare';

const STATUS_STEPS = ['PENDING', 'PREPARING', 'READY', 'COMPLETED'];
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Order placed',
  PREPARING: 'Preparing',
  READY: 'Ready for pickup',
  COMPLETED: 'Completed',
};
const STATUS_ICONS: Record<string, typeof Clock> = {
  PENDING: Clock,
  PREPARING: ChefHat,
  READY: UtensilsCrossed,
  COMPLETED: Check,
};

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem: { name: string };
}

interface Order {
  id: string;
  status: string;
  customerId: string | null;
  subtotalAmount: number;
  discountAmount: number;
  couponCode: string | null;
  totalAmount: number;
  pointsEarned: number;
  bonusPoints: number;
  scratchedAt: string | Date | null;
  orderItems: OrderItem[];
}

function ScratchCard({ orderId, initialBonus, initialScratched }: { orderId: string; initialBonus: number; initialScratched: boolean }) {
  const [revealed, setRevealed] = useState(initialScratched);
  const [bonus, setBonus] = useState(initialScratched ? initialBonus : 0);
  const [loading, setLoading] = useState(false);

  const reveal = async () => {
    if (revealed || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/scratch`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setBonus(data.bonus);
        setRevealed(true);
        confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 rounded-card border-2 border-dashed border-primary/40 bg-primary-soft p-4 text-center">
      <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Surprise scratch card 🎁</p>
      {revealed ? (
        <div className="animate-in zoom-in-95">
          <p className="text-3xl font-bold text-primary">+{bonus}</p>
          <p className="text-xs text-ink-2 mt-0.5">bonus points added — see you next time!</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={reveal}
          disabled={loading}
          className="w-full py-3 rounded-control gradient-coral text-white font-bold text-sm press-scale disabled:opacity-60"
        >
          {loading ? 'Revealing…' : 'Tap to scratch & win bonus points'}
        </button>
      )}
    </div>
  );
}

function formatRupee(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    paise / 100
  );
}

export default function OrderTrackerClient({ cafe, order }: { cafe: { name: string; slug: string }; order: Order }) {
  const [status, setStatus] = useState(order.status);
  const [pointsEarned, setPointsEarned] = useState(order.pointsEarned);
  const [rewardMode] = useState<"scratch" | "spin" | "redpacket">(() => {
    const r = Math.random();
    if (r < 0.34) return "scratch";
    if (r < 0.67) return "spin";
    return "redpacket";
  });
  const [bonusClaimed, setBonusClaimed] = useState(!!order.scratchedAt);
  const [claimedBonus, setClaimedBonus] = useState(order.bonusPoints);
  const [gifts, setGifts] = useState<{ claimCode: string; menuItemName: string; quantity: number; recipientName: string }[]>([]);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch(`/api/gifts?orderId=${order.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.gifts) setGifts(d.gifts);
      })
      .catch(() => {});
  }, [order.id]);

  useEffect(() => {
    if (status === 'COMPLETED' || status === 'CANCELLED') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/status`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status);
          if (data.pointsEarned) setPointsEarned(data.pointsEarned);
          if (data.status === 'COMPLETED') {
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
          }
        }
      } catch (e) {
        console.error('Polling error', e);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [order.id, status]);

  const currentStep = STATUS_STEPS.indexOf(status);
  const isCancelled = status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-bg-subtle flex flex-col items-center p-4 pt-6">
      <div className="w-full max-w-md space-y-4">
        <a
          href={`/store/${cafe.slug}`}
          className="inline-flex items-center text-ink-2 text-sm font-medium"
        >
          <ArrowLeft size={18} className="mr-1" /> {cafe.name}
        </a>

        {isCancelled ? (
          <div className="bg-white rounded-card shadow-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-error-soft flex items-center justify-center mx-auto mb-3">
              <Check size={28} className="text-error" />
            </div>
            <h2 className="text-xl font-bold text-ink mb-1">Order cancelled</h2>
            <p className="text-sm text-ink-2">This order has been cancelled.</p>
            <a
              href={`/store/${cafe.slug}`}
              className="mt-4 inline-block px-5 py-2.5 rounded-control bg-primary text-white font-semibold text-sm"
            >
              Order again
            </a>
          </div>
        ) : status === 'COMPLETED' ? (
          <div className="bg-white rounded-card shadow-card p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-success-soft flex items-center justify-center mx-auto mb-4">
              <Check size={36} className="text-success" />
            </div>
            <h2 className="text-2xl font-bold text-ink mb-1">Order complete!</h2>
            <p className="text-ink-2 mb-5 text-sm">Enjoy! Thanks for ordering direct.</p>
            <div className="gradient-coral text-white rounded-card p-6 shadow-glow inline-block">
              <p className="text-xs opacity-90">You earned</p>
              <p className="text-4xl font-bold my-1">{pointsEarned}</p>
              <p className="text-xs font-semibold uppercase tracking-wider">Loyalty points</p>
            </div>
            {order.customerId && !bonusClaimed && (
              rewardMode === "spin" ? (
                <div className="mt-4">
                  <SpinWheel
                    orderId={order.id}
                    cafeId=""
                    onClaimed={(bonus) => {
                      setBonusClaimed(true);
                      setClaimedBonus(bonus);
                    }}
                  />
                </div>
              ) : rewardMode === "redpacket" ? (
                <div className="mt-4">
                  <RedPacketRain
                    orderId={order.id}
                    cafeId=""
                    onComplete={(pts) => {
                      setBonusClaimed(true);
                      setClaimedBonus(pts);
                    }}
                  />
                </div>
              ) : (
                <ScratchCard
                  orderId={order.id}
                  initialBonus={order.bonusPoints}
                  initialScratched={!!order.scratchedAt}
                />
              )
            )}
            {bonusClaimed && rewardMode !== "scratch" && (
              <div className="mt-4 rounded-card border-2 border-dashed border-primary/40 bg-primary-soft p-4 text-center animate-in zoom-in-95">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Surprise reward 🎁</p>
                <p className="text-3xl font-bold text-primary">+{claimedBonus}</p>
                <p className="text-xs text-ink-2 mt-0.5">bonus points added — see you next time!</p>
              </div>
            )}
            <div className="mt-4 flex flex-col gap-3 items-center">
              <WhatsAppShare slug={cafe.slug} cafeName={cafe.name} variant="button" />
              <a href={`/store/${cafe.slug}/rewards`} className="text-sm font-semibold text-primary">
                Redeem points for rewards →
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-card shadow-card p-6">
            {/* Order info */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-ink-3 font-medium uppercase tracking-wide">Order</p>
                <p className="font-bold text-ink text-lg">#{order.id.slice(0, 8)}</p>
              </div>
              <span className="px-3 py-1 rounded-pill bg-amber-soft text-amber text-xs font-semibold animate-pulse-soft">
                {status}
              </span>
            </div>

            {/* Animated timeline */}
            <div className="relative">
              {STATUS_STEPS.slice(0, 3).map((step, index) => {
                const isActive = index === currentStep;
                const isPast = index < currentStep;
                const isLast = index === STATUS_STEPS.slice(0, 3).length - 1;
                const Icon = STATUS_ICONS[step];

                return (
                  <div key={step} className="flex items-start relative pb-6 last:pb-0">
                    {/* Connecting line */}
                    {!isLast && (
                      <div
                        className={`absolute left-[15px] top-8 w-[2px] h-[calc(100%-12px)] ${
                          isPast ? 'bg-success' : 'bg-bg-hover'
                        }`}
                      />
                    )}
                    {/* Step circle */}
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                        isActive
                          ? 'bg-primary text-white shadow-glow scale-110'
                          : isPast
                            ? 'bg-success text-white'
                            : 'bg-bg-hover text-ink-3'
                      }`}
                    >
                      {isPast ? <Check size={14} /> : <Icon size={14} />}
                    </div>
                    {/* Step label */}
                    <div className="ml-3 flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          isActive ? 'font-bold text-ink' : isPast ? 'font-medium text-ink-2' : 'text-ink-3'
                        }`}
                      >
                        {STATUS_LABELS[step]}
                      </p>
                      {isActive && (
                        <p className="text-xs text-primary font-medium mt-0.5">In progress</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Receipt */}
        <div className="bg-white rounded-card shadow-card p-4">
          <h2 className="font-semibold text-ink mb-3 text-sm">Receipt</h2>
          <div className="space-y-1.5 mb-2.5">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-ink-2">
                  {item.quantity}× {item.menuItem.name}
                </span>
                <span className="text-ink-2">{formatRupee(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-2 space-y-1 text-sm">
            <div className="flex justify-between text-ink-3">
              <span>Subtotal</span>
              <span>{formatRupee(order.subtotalAmount)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                <span>-{formatRupee(order.discountAmount)}</span>
              </div>
            )}
          </div>
          <div className="border-t border-border mt-2 pt-2 flex justify-between font-bold text-ink">
            <span>Total paid</span>
            <span>{formatRupee(order.totalAmount)}</span>
          </div>
        </div>

        {status === 'COMPLETED' && gifts.length > 0 && (
          <div className="bg-white rounded-card shadow-card p-4 space-y-3">
            <h2 className="font-semibold text-ink text-sm flex items-center gap-1.5">
              <Gift size={15} className="text-primary" /> Your gifts
            </h2>
            {gifts.map((g, i) => (
              <div key={i} className="border border-border rounded-control p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-ink text-sm">{g.menuItemName} × {g.quantity}</p>
                  <span className="text-xs font-mono font-bold text-primary bg-primary-soft px-2 py-0.5 rounded-pill">
                    {g.claimCode}
                  </span>
                </div>
                <p className="text-xs text-ink-3 mb-2">For: {g.recipientName}</p>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`I sent you a gift from ${cafe.name}! 🎁 Claim it here: ${origin}/store/${cafe.slug}/gift/${g.claimCode}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary-soft px-3 py-1.5 rounded-control hover:bg-primary hover:text-white transition-colors"
                >
                  <Share2 size={12} /> Share on WhatsApp
                </a>
              </div>
            ))}
          </div>
        )}

        <a
          href={`/api/orders/${order.id}/invoice`}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-control border border-border bg-white text-ink font-semibold text-sm hover:bg-bg-subtle transition-colors"
        >
          <Download size={16} /> Download invoice
        </a>
      </div>
    </div>
  );
}
