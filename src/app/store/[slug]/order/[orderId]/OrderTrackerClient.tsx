'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Check, Download } from 'lucide-react';
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

  useEffect(() => {
    // Stop polling on any terminal state.
    if (status === 'COMPLETED' || status === 'CANCELLED') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/status`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status);
          if (data.pointsEarned) setPointsEarned(data.pointsEarned);
          if (data.status === 'COMPLETED') {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
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
    <div className="min-h-screen bg-bg-subtle flex flex-col items-center p-4 pt-10">
      <div className="w-full max-w-md space-y-4">
        <h1 className="font-display text-center font-bold text-xl text-ink">{cafe.name}</h1>

        <div className="bg-white rounded-card shadow-card p-6">
          {isCancelled ? (
            <p className="text-center text-error font-semibold">This order was cancelled.</p>
          ) : status === 'COMPLETED' ? (
            <div className="text-center py-4">
              <h2 className="text-2xl font-bold mb-1 text-ink">🎉 Order complete</h2>
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
            <div className="space-y-6">
              {STATUS_STEPS.slice(0, 3).map((step, index) => {
                const isActive = index === currentStep;
                const isPast = index < currentStep;
                return (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-transform ${
                        isActive
                          ? 'bg-primary text-white shadow-glow scale-110'
                          : isPast
                            ? 'bg-success text-white'
                            : 'bg-bg-hover text-ink-3'
                      }`}
                    >
                      {isPast ? <Check size={16} /> : index + 1}
                    </div>
                    <span
                      className={`ml-3 text-sm ${isActive ? 'font-bold text-ink' : isPast ? 'text-ink-2' : 'text-ink-3'}`}
                    >
                      {STATUS_LABELS[step]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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

        <a
          href={`/api/orders/${order.id}/invoice`}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-control border border-border bg-white text-ink font-semibold text-sm hover:bg-bg-subtle transition-colors"
        >
          <Download size={16} /> Download invoice
        </a>

        <a
          href={`/store/${cafe.slug}`}
          className="block text-center text-sm font-medium text-primary py-2"
        >
          Back to menu
        </a>
      </div>
    </div>
  );
}
